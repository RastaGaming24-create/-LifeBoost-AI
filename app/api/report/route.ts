import { NextResponse } from "next/server";
import { adminDb, verifyBearerToken } from "../../../lib/firebase-admin";

const MAX_TITLE = 120;
const MAX_DESCRIPTION = 4000;

export async function POST(request: Request) {
  const decoded = await verifyBearerToken(request);
  if (!decoded?.uid) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });

  try {
    const body = await request.json();
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const description = typeof body?.description === "string" ? body.description.trim() : "";
    const severity = body?.severity === "critical" || body?.severity === "high" || body?.severity === "low" ? body.severity : "medium";
    if (!title || !description) return NextResponse.json({ error: "Completa el título y la descripción." }, { status: 400 });
    if (title.length > MAX_TITLE || description.length > MAX_DESCRIPTION) return NextResponse.json({ error: "El reporte es demasiado largo." }, { status: 400 });

    await adminDb().collection("bugReports").add({
      userId: decoded.uid,
      email: decoded.email || null,
      title,
      description,
      severity,
      status: "open",
      createdAt: new Date(),
      userAgent: request.headers.get("user-agent")?.slice(0, 500) || null,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Bug report error", error);
    return NextResponse.json({ error: "No se pudo enviar el reporte." }, { status: 500 });
  }
}
