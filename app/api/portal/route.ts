import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  CUSTOMER_COOKIE,
  appUrl,
  getStripe,
  isStripeConfigured,
} from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured. TEST unlock cannot be billed or canceled via Stripe." },
      { status: 400 },
    );
  }

  const jar = await cookies();
  const customer = jar.get(CUSTOMER_COOKIE)?.value;
  if (!customer) {
    return NextResponse.json(
      { error: "No Stripe customer on this session. Subscribe first." },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer,
    return_url: appUrl(req),
  });

  return NextResponse.json({ url: session.url });
}
