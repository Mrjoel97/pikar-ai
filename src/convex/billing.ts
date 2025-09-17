"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import Stripe from "stripe";
import { api, internal } from "./_generated/api";

/**
 * Helper: Resolve current user's business if not provided.
 */
async function getCurrentUserAndBusiness(ctx: any, businessIdArg?: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.email) throw new Error("Not authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("email", (q: any) => q.eq("email", identity.email.toLowerCase()))
    .unique();

  if (!user?._id) throw new Error("User not found");

  let businessId = businessIdArg;
  if (!businessId) {
    const biz = await ctx.db
      .query("businesses")
      .withIndex("by_owner", (q: any) => q.eq("ownerId", user._id))
      .first();
    if (!biz?._id) throw new Error("Business not found");
    businessId = biz._id;
  }

  return { user, businessId };
}

/**
 * Map tier -> Stripe Price ID from env variables.
 */
function priceIdForTier(tier: "solopreneur" | "startup" | "sme" | "enterprise") {
  const map: Record<typeof tier, string | undefined> = {
    solopreneur: process.env.STRIPE_PRICE_ID_SOLOPRENEUR,
    startup: process.env.STRIPE_PRICE_ID_STARTUP,
    sme: process.env.STRIPE_PRICE_ID_SME,
    enterprise: process.env.STRIPE_PRICE_ID_ENTERPRISE,
  };
  const price = map[tier];
  if (!price) {
    throw new Error(`Missing Stripe price ID for tier "${tier}". Set STRIPE_PRICE_ID_* env vars.`);
  }
  return price;
}

/**
 * Phase 1: Create a real Stripe Checkout Session (subscription).
 */
export const startCheckout = action({
  args: {
    tier: v.union(
      v.literal("solopreneur"),
      v.literal("startup"),
      v.literal("sme"),
      v.literal("enterprise")
    ),
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("Missing STRIPE_SECRET_KEY");
    }
    const stripe = new Stripe(secretKey);

    const { businessId } = await getCurrentUserAndBusiness(ctx, args.businessId);

    const successBase =
      process.env.VITE_PUBLIC_BASE_URL ||
      process.env.PUBLIC_BASE_URL ||
      "http://localhost:5173";

    const price = priceIdForTier(args.tier);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price, quantity: 1 }],
      success_url: `${successBase}/onboarding?session_id={CHECKOUT_SESSION_ID}&tier=${encodeURIComponent(
        args.tier
      )}`,
      cancel_url: `${successBase}/onboarding?canceled=1`,
      metadata: {
        businessId: String(businessId),
        tier: args.tier,
      },
      subscription_data: {
        metadata: {
          businessId: String(businessId),
          tier: args.tier,
        },
      },
    });

    if (!session.url) {
      throw new Error("Failed to create Stripe Checkout Session");
    }

    return { checkoutUrl: session.url };
  },
});

/**
 * Phase 1: Handle success after redirect by fetching the session and persisting plan info.
 * This action is called from the frontend with the session_id in the URL.
 */
export const handleCheckoutSuccess = action({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("Missing STRIPE_SECRET_KEY");
    }
    const stripe = new Stripe(secretKey);

    const { businessId } = await getCurrentUserAndBusiness(ctx);

    const session = await stripe.checkout.sessions.retrieve(args.sessionId, {
      expand: ["subscription"],
    });

    const tier =
      (session.metadata?.tier as
        | "solopreneur"
        | "startup"
        | "sme"
        | "enterprise"
        | undefined) || undefined;

    const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : (session.subscription as any)?.id;

    if (!tier) {
      throw new Error("Missing tier on session metadata");
    }

    await ctx.runMutation(internal.billingInternal.applyCheckoutResult, {
      businessId,
      tier,
      stripeCustomerId: customerId ?? null,
      stripeSubscriptionId: subscriptionId ?? null,
    });

    return { ok: true as const };
  },
});