import { NextResponse } from "next/server";
import { adminAuth, adminDb, verifyBearerToken } from "../../../../lib/firebase-admin";
import { plaidClient } from "../../../../lib/plaid";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const decoded = await verifyBearerToken(request);
  if (!decoded?.uid) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });

  try {
    const db = adminDb();

    // Plaid items live in a top-level server-only collection, so deleting
    // users/{uid} alone would leave encrypted-at-rest bank access tokens behind.
    const plaidItems = await db.collection("plaidItems").where("uid", "==", decoded.uid).limit(400).get();
    for (const item of plaidItems.docs) {
      const accessToken = item.data().accessToken;
      if (typeof accessToken === "string" && accessToken) {
        try {
          await plaidClient().itemRemove({ access_token: accessToken });
        } catch (error) {
          // Continue local deletion even if Plaid has already revoked/removed the item.
          console.warn("Plaid item removal warning:", error);
        }
      }
    }
    const plaidBatch = db.batch();
    for (const item of plaidItems.docs) plaidBatch.delete(item.ref);
    await plaidBatch.commit();

    // Remove the complete Firestore tree for this user before deleting Auth.
    await db.recursiveDelete(db.collection("users").doc(decoded.uid));
    await adminAuth().deleteUser(decoded.uid);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Account deletion error", error);
    return NextResponse.json({ error: "No se pudo eliminar la cuenta. Contacta con soporte." }, { status: 500 });
  }
}
