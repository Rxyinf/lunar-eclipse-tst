import { NextResponse } from "next/server";
import {
  accessCookie,
  customerCookie,
  getStripe,
  isStripeConfigured,
} from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as { session_id?: string };
  const sessionId = body.session_id;
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  const paid =
    session.mode === "subscription" &&
    (session.status === "complete" || session.payment_status === "paid" || session.payment_status === "no_payment_required");

  if (!paid) {
    return NextResponse.json({ unlocked: false }, { status: 402 });
  }

  const res = NextResponse.json({ unlocked: true });
  res.cookies.set(accessCookie());
  if (typeof session.customer === "string") {
    res.cookies.set(customerCookie(session.customer));
  }
  return res;
}
