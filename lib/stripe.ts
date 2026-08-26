import Stripe from "stripe";

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
      process.env.STRIPE_PRICE_ID,
  );
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(key);
}

export function appUrl(req: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env) return env.endsWith("/") ? env.slice(0, -1) : env;
  const origin = req.headers.get("origin");
  if (origin) return origin;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  return host ? proto + "://" + host : "http://localhost:3000";
}

export const ACCESS_COOKIE = "le_access";
export const CUSTOMER_COOKIE = "le_customer";
export const ACCESS_MAX_AGE = 60 * 60 * 24 * 7;

export function accessCookie(value = "1") {
  return {
    name: ACCESS_COOKIE,
    value,
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: ACCESS_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  };
}

export function customerCookie(value: string) {
  return {
    name: CUSTOMER_COOKIE,
    value,
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: ACCESS_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  };
}
