import { NextResponse } from "next/server";
import { adminDb, verifyBearerToken } from "../../../../lib/firebase-admin";
import { runRuntimeSecurityAudit } from "../../../../lib/security-audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const decoded = await verifyBearerToken(request);
  if (!decoded?.uid) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  try {
    const profile = await adminDb().collection("users").doc(decoded.uid).get();
    if (!profile.exists || profile.data()?.role !== "admin") {
      return NextResponse.json({ error: "No tienes permisos de administrador." }, { status: 403 });
    }

    const checks = runRuntimeSecurityAudit();
    const failed = checks.filter((check) => check.status === "fail").length;
    const warnings = checks.filter((check) => check.status === "warning").length;

    return NextResponse.json({
      ok: failed === 0,
      checkedAt: new Date().toISOString(),
      summary: { total: checks.length, failed, warnings },
      checks,
      scope: "runtime-configuration-only",
      note: "No se leen ni se devuelven movimientos bancarios, saldos, access tokens ni valores de secretos.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Security audit error:", error);
    return NextResponse.json({ error: "No se pudo ejecutar la auditoría de seguridad." }, { status: 500 });
  }
}
