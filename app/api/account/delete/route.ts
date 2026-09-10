import { NextResponse } from "next/server";
import { adminAuth, adminDb, verifyBearerToken } from "../../../../lib/firebase-admin";

export async function POST(request: Request) {
  const decoded = await verifyBearerToken(request);
  if (!decoded?.uid) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });

  try {
    const db = adminDb();
    const userRef = db.collection("users").doc(decoded.uid);

    // Remove the complete Firestore tree for this user, including nested
    // subcollections such as transactions and Plaid items, before Auth.
    await db.recursiveDelete(userRef);
    await adminAuth().deleteUser(decoded.uid);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Account deletion error", error);
    return NextResponse.json({ error: "No se pudo eliminar la cuenta. Contacta con soporte." }, { status: 500 });
  }
}
