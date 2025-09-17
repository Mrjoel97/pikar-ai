import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Persist Stripe checkout result into the business settings.
 */
export const applyCheckoutResult = internalMutation({
  args: {
    businessId: v.id("businesses"),
    tier: v.union(
      v.literal("solopreneur"),
      v.literal("startup"),
      v.literal("sme"),
      v.literal("enterprise")
    ),
    stripeCustomerId: v.union(v.string(), v.null()),
    stripeSubscriptionId: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const biz = await ctx.db.get(args.businessId);
    if (!biz) throw new Error("Business not found");

    const existingSettings = (biz as any).settings ?? {
      aiAgentsEnabled: [],
      complianceLevel: "standard",
      dataIntegrations: [],
    };

    const newSettings = {
      ...existingSettings,
      plan: args.tier,
      status: "active",
      stripeCustomerId: args.stripeCustomerId ?? undefined,
      stripeSubscriptionId: args.stripeSubscriptionId ?? undefined,
    };

    await ctx.db.patch(args.businessId, { settings: newSettings } as any);
    return { ok: true as const };
  },
});

/**
 * Update subscription status or plan on an existing business.
 * Allows updating status only or along with plan and Stripe IDs.
 */
export const updateSubscriptionStatus = internalMutation({
  args: {
    businessId: v.id("businesses"),
    status: v.string(),
    plan: v.optional(
      v.union(
        v.literal("solopreneur"),
        v.literal("startup"),
        v.literal("sme"),
        v.literal("enterprise")
      )
    ),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const biz = await ctx.db.get(args.businessId);
    if (!biz) throw new Error("Business not found");

    const existingSettings = (biz as any).settings ?? {
      aiAgentsEnabled: [],
      complianceLevel: "standard",
      dataIntegrations: [],
    };

    const newSettings = {
      ...existingSettings,
      status: args.status,
      // Only patch plan if provided
      ...(args.plan ? { plan: args.plan } : {}),
      ...(args.stripeCustomerId ? { stripeCustomerId: args.stripeCustomerId } : {}),
      ...(args.stripeSubscriptionId ? { stripeSubscriptionId: args.stripeSubscriptionId } : {}),
    };

    await ctx.db.patch(args.businessId, { settings: newSettings } as any);
    return { ok: true as const };
  },
});