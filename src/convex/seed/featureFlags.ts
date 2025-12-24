import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

export const seedFeatureFlagsForBusiness = internalMutation({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    const flags: Array<{
      businessId?: Id<"businesses">;
      flagName: string;
      isEnabled: boolean;
      rolloutPercentage: number;
      rules?: {
        userTier?: string[];
        businessTier?: string[];
      };
    }> = [
      {
        businessId: args.businessId,
        flagName: "solopreneur_quick_actions",
        isEnabled: true,
        rolloutPercentage: 100,
        rules: { userTier: ["solopreneur"] },
      },
      {
        businessId: args.businessId,
        flagName: "solopreneur_focus_panel",
        isEnabled: true,
        rolloutPercentage: 100,
        rules: { userTier: ["solopreneur"] },
      },
      {
        businessId: args.businessId,
        flagName: "startup_growth_panels",
        isEnabled: true,
        rolloutPercentage: 100,
        rules: { userTier: ["startup"] },
      },
      {
        businessId: args.businessId,
        flagName: "sme_insights",
        isEnabled: true,
        rolloutPercentage: 100,
        rules: { businessTier: ["sme"] },
      },
      {
        businessId: args.businessId,
        flagName: "enterprise_governance",
        isEnabled: true,
        rolloutPercentage: 100,
        rules: { businessTier: ["enterprise"] },
      },
      {
        businessId: args.businessId,
        flagName: "guest_mode_demo",
        isEnabled: true,
        rolloutPercentage: 100,
      },
      {
        businessId: args.businessId,
        flagName: "email_campaigns_basic",
        isEnabled: true,
        rolloutPercentage: 100,
      },
    ];

    let upserted = 0;
    for (const f of flags) {
      const existing = await ctx.db
        .query("featureFlags")
        .withIndex("by_flag_name", (q) => q.eq("flagName", f.flagName))
        .filter((q) => 
          f.businessId 
            ? q.eq(q.field("businessId"), f.businessId)
            : q.eq(q.field("businessId"), undefined)
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          isEnabled: f.isEnabled,
          rolloutPercentage: f.rolloutPercentage,
          rules: f.rules,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("featureFlags", {
          name: f.flagName,
          businessId: f.businessId,
          flagName: f.flagName,
          isEnabled: f.isEnabled,
          rolloutPercentage: f.rolloutPercentage,
          rules: f.rules,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
      upserted += 1;
    }

    return { upserted, businessId: args.businessId };
  },
});
