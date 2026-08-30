import { NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb, verifyBearerToken } from "../../../../lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const decoded = await verifyBearerToken(request);
  if (!decoded?.uid) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  const secret = process.env.STRIPE_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!secret || !appUrl) return NextResponse.json({ error: "La monetización todavía no está configurada." }, { status: 503 });
  try {
    const profile = await adminDb().collection("users").doc(decoded.uid).get();
    const customerId = profile.data()?.stripeCustomerId;
    if (!customerId) return NextResponse.json({ error: "No encontramos una suscripción activa." }, { status: 404 });
    const stripe = new Stripe(secret);
    const session = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: `${appUrl}/account` });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe portal error", error);
    return NextResponse.json({ error: "No se pudo abrir el portal de facturación." }, { status: 500 });
  }
}
