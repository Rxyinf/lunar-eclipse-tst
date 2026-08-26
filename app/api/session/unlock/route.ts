import { NextResponse } from "next/server";
import { accessCookie, isStripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST() {
  if (isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is configured. Use Checkout — TEST unlock is disabled." },
      { status: 403 },
    );
  }

  const res = NextResponse.json({ unlocked: true, testMode: true });
  res.cookies.set(accessCookie());
  return res;
}
