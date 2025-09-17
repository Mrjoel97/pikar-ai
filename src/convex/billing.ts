"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Phase 1 stub: return a URL to redirect the user after starting checkout.
 * In Phase 2, integrate Stripe SDK here to create a Checkout Session.
 */
export const startCheckout = action({
  args: {
    tier: v.union(
      v.literal("solopreneur"),
      v.literal("startup"),
      v.literal("sme"),
      v.literal("enterprise")
    ),
    // Optional: pass-through for future (businessId)
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    const successBase =
      process.env.VITE_PUBLIC_BASE_URL ||
      process.env.PUBLIC_BASE_URL ||
      "http://localhost:5173";
    // Stubbed checkout URL; in Phase 2 replace with Stripe Checkout Session URL
    const url = `${successBase}/onboarding?checkout=started&tier=${encodeURIComponent(
      args.tier
    )}`;
    return { checkoutUrl: url };
  },
});
