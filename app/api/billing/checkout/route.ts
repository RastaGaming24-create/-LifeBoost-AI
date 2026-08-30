import { NextResponse } from "next/server";
import Stripe from "stripe";
import { verifyBearerToken } from "../../../../lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const decoded = await verifyBearerToken(request);
  if (!decoded?.uid) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  const secret = process.env.STRIPE_SECRET_KEY;
  const price = process.env.STRIPE_PRICE_PRO_MONTHLY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!secret || !price || !appUrl) return NextResponse.json({ error: "La monetización todavía no está configurada en producción." }, { status: 503 });

  try {
    const stripe = new Stripe(secret);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      success_url: `${appUrl}/account?billing=success`,
      cancel_url: `${appUrl}/account?billing=cancelled`,
      customer_email: decoded.email || undefined,
      client_reference_id: decoded.uid,
      metadata: { firebaseUid: decoded.uid },
      subscription_data: { metadata: { firebaseUid: decoded.uid } },
      allow_promotion_codes: true,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error", error);
    return NextResponse.json({ error: "No se pudo iniciar el pago." }, { status: 500 });
  }
}
