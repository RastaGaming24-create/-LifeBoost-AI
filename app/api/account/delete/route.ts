import { NextResponse } from "next/server";
import { adminAuth, adminDb, verifyBearerToken } from "../../../../lib/firebase-admin";
import { plaidClient } from "../../../../lib/plaid";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const decoded = await verifyBearerToken(request);
  if (!decoded?.uid) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });

  try {
    const db = adminDb();

    // Plaid items live in a top-level server-only collection. Revoke every
    // linked item and delete every local token before removing the user.
    let plaidItems = await db.collection("plaidItems").where("uid", "==", decoded.uid).limit(400).get();
    while (!plaidItems.empty) {
      for (const item of plaidItems.docs) {
        const accessToken = item.data().accessToken;
        if (typeof accessToken === "string" && accessToken) {
          try {
            await plaidClient().itemRemove({ access_token: accessToken });
          } catch (error) {
            // Continue local cleanup if Plaid already removed the item.
            console.warn("Plaid item removal warning:", error);
          }
        }
      }
      const batch = db.batch();
      for (const item of plaidItems.docs) batch.delete(item.ref);
      await batch.commit();
      if (plaidItems.size < 400) break;
      plaidItems = await db.collection("plaidItems").where("uid", "==", decoded.uid).limit(400).get();
    }

    // Remove the complete Firestore tree for this user before deleting Auth.
    await db.recursiveDelete(db.collection("users").doc(decoded.uid));
    await adminAuth().deleteUser(decoded.uid);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Account deletion error", error);
    return NextResponse.json({ error: "No se pudo eliminar la cuenta. Contacta con soporte." }, { status: 500 });
  }
}
