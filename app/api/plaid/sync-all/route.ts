import { NextResponse } from "next/server";
import { adminDb, verifyBearerToken } from "../../../../lib/firebase-admin";
import { syncPlaidItem } from "../../../../lib/plaid-sync";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const decoded = await verifyBearerToken(request);
  if (!decoded) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  try {
    const snapshot = await adminDb().collection("plaidItems").where("uid", "==", decoded.uid).get();
    const results = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!data.accessToken) continue;
      try {
        const result = await syncPlaidItem(decoded.uid, doc.id, String(data.accessToken));
        results.push({ itemId: doc.id, ...result });
      } catch (error) {
        console.error("Plaid sync-all item error:", { itemId: doc.id, error });
        results.push({ itemId: doc.id, error: "sync_failed" });
      }
    }

    return NextResponse.json({ ok: true, accounts: results.length, results });
  } catch (error) {
    console.error("Plaid sync-all error:", error);
    return NextResponse.json({ error: "No se pudieron actualizar las cuentas bancarias." }, { status: 502 });
  }
}
