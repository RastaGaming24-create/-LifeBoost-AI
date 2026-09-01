import { NextResponse } from "next/server";
import { plaidClient } from "../../../../lib/plaid";
import { verifyBearerToken } from "../../../../lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const decoded = await verifyBearerToken(request);
  if (!decoded) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  try {
    const origin = new URL(request.url).origin;
    const response = await plaidClient().linkTokenCreate({
      user: { client_user_id: decoded.uid },
      client_name: "LifeBoost AI",
      products: ["transactions"],
      country_codes: ["US"],
      language: "es",
      transactions: { days_requested: 90 },
      webhook: `${origin}/api/plaid/webhook`,
    } as any);

    return NextResponse.json({ link_token: response.data.link_token, environment: process.env.PLAID_ENV === "production" ? "production" : "sandbox" });
  } catch (error) {
    console.error("Plaid link token error:", error);
    return NextResponse.json({ error: "No se pudo iniciar la conexión bancaria. Configura Plaid en Vercel y vuelve a intentarlo." }, { status: 503 });
  }
}
