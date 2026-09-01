import { NextResponse } from "next/server";
import { plaidClient } from "../../../../lib/plaid";
import { adminDb, verifyBearerToken } from "../../../../lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const decoded = await verifyBearerToken(request);
  if (!decoded) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const publicToken = typeof body?.public_token === "string" ? body.public_token : "";
  if (!publicToken) return NextResponse.json({ error: "Falta public_token." }, { status: 400 });

  try {
    const exchanged = await plaidClient().itemPublicTokenExchange({ public_token: publicToken });
    const { access_token: accessToken, item_id: itemId } = exchanged.data;
    const item = await plaidClient().itemGet({ access_token: accessToken });

    // Server-only collection: Firestore rules deny client access to plaidItems.
    await adminDb().collection("plaidItems").doc(itemId).set({
      uid: decoded.uid,
      itemId,
      accessToken,
      institutionId: item.data.item.institution_id ?? null,
      createdAt: new Date().toISOString(),
      environment: process.env.PLAID_ENV === "production" ? "production" : "sandbox",
    }, { merge: true });

    return NextResponse.json({ ok: true, itemId });
  } catch (error) {
    console.error("Plaid token exchange error:", error);
    return NextResponse.json({ error: "No se pudo completar la conexión con el banco." }, { status: 400 });
  }
}
