import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { jwtDecode, jwtVerify, importJWK } from "jose";
import { plaidClient } from "../../../../lib/plaid";
import { adminDb } from "../../../../lib/firebase-admin";
import { syncItem } from "../sync/route";

export const runtime = "nodejs";

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

async function verifyPlaidWebhook(rawBody: string, token: string) {
  const header = jwtDecode(token, { header: true }) as { alg?: string; kid?: string };
  if (header.alg !== "ES256" || !header.kid) return false;

  const response = await plaidClient().webhookVerificationKeyGet({ key_id: header.kid });
  const key = response.data.key as any;
  if (!key) return false;

  const keyLike = await importJWK(key, "ES256");
  await jwtVerify(token, keyLike, { algorithms: ["ES256"], maxTokenAge: "5 min" });
  const payload = jwtDecode(token) as { request_body_sha256?: string };
  const hash = createHash("sha256").update(rawBody).digest("hex");
  return Boolean(payload.request_body_sha256 && safeEqual(hash, payload.request_body_sha256));
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const verification = request.headers.get("plaid-verification");

  try {
    if (!verification || !(await verifyPlaidWebhook(rawBody, verification))) {
      return NextResponse.json({ error: "Webhook no autorizado." }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const itemId = body?.item_id;
    if (!itemId) return NextResponse.json({ received: true });

    const itemSnap = await adminDb().collection("plaidItems").doc(itemId).get();
    if (!itemSnap.exists) return NextResponse.json({ received: true });
    const item = itemSnap.data()!;

    if (body.webhook_type === "TRANSACTIONS" || body.webhook_code === "SYNC_UPDATES_AVAILABLE" || body.webhook_code === "DEFAULT_UPDATE") {
      await syncItem(String(item.uid), String(itemId), String(item.accessToken));
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Plaid webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
