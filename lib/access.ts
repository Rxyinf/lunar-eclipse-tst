import { cookies } from "next/headers";
import { ACCESS_COOKIE, CUSTOMER_COOKIE, isStripeConfigured } from "./stripe";

export async function getAccess() {
  const jar = await cookies();
  const unlocked = jar.get(ACCESS_COOKIE)?.value === "1";
  const customerId = jar.get(CUSTOMER_COOKIE)?.value ?? null;
  return {
    unlocked,
    customerId,
    stripeConfigured: isStripeConfigured(),
  };
}
