import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const stripePricePro = process.env.STRIPE_PRO_PRICE_ID || process.env.STRIPE_PRICE_PRO || process.env.STRIPE_PRICE_ID || "";
const stripePricePremium = process.env.STRIPE_PREMIUM_PRICE_ID || process.env.STRIPE_PRICE_PREMIUM || "";

const hasStripeSecret = stripeSecretKey.length > 0;
const hasAnyPriceConfig = stripePricePro.length > 0 || stripePricePremium.length > 0;

if (process.env.NODE_ENV === "production" && !hasStripeSecret) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

if (process.env.NODE_ENV !== "production" && (!hasStripeSecret || !hasAnyPriceConfig)) {
  console.warn("Stripe disabled in development: missing STRIPE_SECRET_KEY or Stripe price configuration");
}

export const stripeEnabled = hasStripeSecret && hasAnyPriceConfig;
export const STRIPE_PRICE_PRO = stripePricePro;
export const STRIPE_PRICE_PREMIUM = stripePricePremium;

export const stripe = hasStripeSecret
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-06-30.basil"
    })
  : null;

export function resolvePlanFromPriceId(priceId: string | null | undefined): "free" | "pro" | "premium" {
  if (!priceId) return "free";
  if (priceId === STRIPE_PRICE_PRO) return "pro";
  if (priceId === STRIPE_PRICE_PREMIUM) return "premium";
  return "free";
}
