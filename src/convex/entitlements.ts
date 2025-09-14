import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const checkEntitlement = internalQuery({
  args: {
    businessId: v.id("businesses"),
    action: v.string(),
    context: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const biz = await ctx.db.get(args.businessId);
    const tier = String((biz?.tier || "solopreneur")).toLowerCase();

    // Per-campaign recipient limits by tier
    const perCampaignLimits: Record<string, number> = {
      solopreneur: 500,
      startup: 2000,
      sme: 10000,
      enterprise: 1_000_000,
    };
    const limitDefault = perCampaignLimits["solopreneur"];
    const tierLimit = perCampaignLimits[tier] ?? limitDefault;

    if (args.action === "emails.createCampaign" || args.action === "emails.sendCampaign") {
      const recipientsCount = Number((args.context as any)?.recipientsCount ?? 0);
      if (recipientsCount > tierLimit) {
        return {
          allowed: false,
          reason: `Plan limit exceeded: ${recipientsCount} recipients > ${tierLimit} for ${tier}`,
          tier,
          limit: tierLimit,
          action: args.action,
        };
      }
      return { allowed: true, tier, limit: tierLimit, action: args.action };
    }

    if (args.action === "featureFlags.toggle") {
      const allowed = tier === "enterprise";
      return allowed
        ? { allowed: true, tier, action: args.action }
        : { allowed: false, reason: "Feature flags are available on Enterprise plan only", tier, action: args.action };
    }

    return { allowed: true, tier, action: args.action };
  },
});
