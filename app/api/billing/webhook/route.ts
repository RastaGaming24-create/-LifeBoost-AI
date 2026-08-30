import { NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "../../../../lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!secret || !key) return new NextResponse("Webhook no configurado", { status: 503 });
  const stripe = new Stripe(key);
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new NextResponse("Missing signature", { status: 400 });
  try {
    const raw = await request.text();
    const event = stripe.webhooks.constructEvent(raw, signature, secret);
    const obj = event.data.object as Stripe.Subscription | Stripe.Checkout.Session;
    const uid = obj.metadata?.firebaseUid || ("client_reference_id" in obj ? obj.client_reference_id : null);
    if (uid) {
      const update: Record<string, unknown> = { updatedAt: new Date() };
      if (event.type === "checkout.session.completed") {
        const session = obj as Stripe.Checkout.Session;
        update.subscriptionStatus = "active";
        update.stripeCustomerId = typeof session.customer === "string" ? session.customer : null;
        update.stripeSubscriptionId = typeof session.subscription === "string" ? session.subscription : null;
      } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
        const subscription = obj as Stripe.Subscription;
        update.subscriptionStatus = subscription.status;
        update.stripeSubscriptionId = subscription.id;
        update.stripeCustomerId = typeof subscription.customer === "string" ? subscription.customer : null;
      } else if (event.type === "customer.subscription.deleted") {
        update.subscriptionStatus = "canceled";
      }
      await adminDb().collection("users").doc(uid).set(update, { merge: true });
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error", error);
    return new NextResponse("Invalid webhook", { status: 400 });
  }
}
