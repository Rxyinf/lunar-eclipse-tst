import { NextResponse } from "next/server";
import { appUrl, getStripe, isStripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured", testMode: true },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  const origin = appUrl(req);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID as string, quantity: 1 }],
    success_url: origin + "/success?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: origin + "/cancel",
  });

  return NextResponse.json({ url: session.url });
}
