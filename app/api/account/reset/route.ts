import { NextResponse } from "next/server";
import { adminDb, verifyBearerToken } from "../../../../lib/firebase-admin";

export const runtime = "nodejs";

/**
 * Resets a LifeBoost account without deleting Firebase Authentication.
 * The user can sign in again with the same account, but all LifeBoost data
 * associated with that UID is removed, including bank/Plaid data.
 */
export async function POST(request: Request) {
  const decoded = await verifyBearerToken(request);
  if (!decoded?.uid) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });

  try {
    const db = adminDb();
    const userRef = db.collection("users").doc(decoded.uid);

    // Delete every subcollection below users/{uid}, regardless of its name.
    // This removes transactions and any future user-scoped data too.
    const subcollections = await userRef.listCollections();
    for (const collection of subcollections) {
      await db.recursiveDelete(collection);
    }

    // Remove the user profile document itself. Firebase Authentication remains.
    await userRef.delete();

    // Plaid items are stored in a top-level server-only collection, so remove
    // only the items belonging to this authenticated user.
    let plaidItems = await db.collection("plaidItems").where("uid", "==", decoded.uid).limit(400).get();
    while (!plaidItems.empty) {
      const batch = db.batch();
      for (const doc of plaidItems.docs) batch.delete(doc.ref);
      await batch.commit();
      if (plaidItems.size < 400) break;
      plaidItems = await db.collection("plaidItems").where("uid", "==", decoded.uid).limit(400).get();
    }

    // Remove bug reports submitted by this user as part of the complete reset.
    let reports = await db.collection("bugReports").where("userId", "==", decoded.uid).limit(400).get();
    while (!reports.empty) {
      const batch = db.batch();
      for (const doc of reports.docs) batch.delete(doc.ref);
      await batch.commit();
      if (reports.size < 400) break;
      reports = await db.collection("bugReports").where("userId", "==", decoded.uid).limit(400).get();
    }

    return NextResponse.json({ ok: true, reset: true });
  } catch (error) {
    console.error("Account reset error", error);
    return NextResponse.json({ error: "No se pudieron restablecer todos los datos. Contacta con soporte." }, { status: 500 });
  }
}
