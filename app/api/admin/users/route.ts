import { NextResponse } from "next/server";
import { adminDb, verifyBearerToken } from "../../../../lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const decoded = await verifyBearerToken(request);
  if (!decoded?.uid) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  try {
    const profile = await adminDb().collection("users").doc(decoded.uid).get();
    if (!profile.exists || profile.data()?.role !== "admin") {
      return NextResponse.json({ error: "No tienes permisos de administrador." }, { status: 403 });
    }

    const snapshot = await adminDb().collection("users").limit(500).get();
    const users = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: typeof data.email === "string" ? data.email : undefined,
        name: typeof data.name === "string" ? data.name : undefined,
        role: typeof data.role === "string" ? data.role : "user",
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json({ error: "No se pudieron cargar los usuarios." }, { status: 500 });
  }
}
