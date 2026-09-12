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
    let added = 0;
    let modified = 0;
    let removed = 0;
    let failed = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!data.accessToken) continue;
      try {
        const result = await syncPlaidItem(decoded.uid, doc.id, String(data.accessToken));
        added += Number(result.added || 0);
        modified += Number(result.modified || 0);
        removed += Number(result.removed || 0);
        results.push({ itemId: doc.id, ...result });
      } catch (error) {
        failed += 1;
        console.error("Plaid sync-all item error:", { itemId: doc.id, error });
        results.push({ itemId: doc.id, error: "sync_failed" });
      }
    }

    return NextResponse.json({
      ok: true,
      accounts: snapshot.docs.filter((doc) => Boolean(doc.data().accessToken)).length,
      added,
      modified,
      removed,
      failed,
      results,
    });
  } catch (error) {
    console.error("LifeBoost AI sync-all error:", error);
    return NextResponse.json({ error: "No se pudieron actualizar las cuentas bancarias." }, { status: 502 });
  }
}
