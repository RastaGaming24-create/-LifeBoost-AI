import { NextResponse } from "next/server";
import { adminDb, verifyBearerToken } from "../../../../lib/firebase-admin";
import { syncPlaidItem } from "../../../../lib/plaid-sync";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const decoded = await verifyBearerToken(request);
  if (!decoded) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const itemId = typeof body?.item_id === "string" ? body.item_id : "";
  if (!itemId) return NextResponse.json({ error: "Falta item_id." }, { status: 400 });

  try {
    const itemSnap = await adminDb().collection("plaidItems").doc(itemId).get();
    if (!itemSnap.exists || itemSnap.data()?.uid !== decoded.uid) return NextResponse.json({ error: "Cuenta bancaria no encontrada." }, { status: 404 });
    const result = await syncPlaidItem(decoded.uid, itemId, String(itemSnap.data()?.accessToken));
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Plaid sync error:", error);
    return NextResponse.json({ error: "No se pudieron sincronizar las transacciones." }, { status: 502 });
  }
}
