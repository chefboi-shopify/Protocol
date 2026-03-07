import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
    });
  }
  return stripeInstance;
}

export const EXTENSION_FEE = parseInt(process.env.EXTENSION_FEE_CENTS || "300", 10);
export const SEASON_PASS_FEE = parseInt(process.env.SEASON_PASS_CENTS || "9000", 10);
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
