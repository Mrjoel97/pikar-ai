import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const enableAll = mutation({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    const flags = [
      "branding_portal",
      "scim_provisioning",
      "sso_configuration",
      "kms_encryption",
      "api_webhooks",
      "white_label",
      "global_social_command",
      "crm_integration",
      "ab_testing",
      "roi_dashboard",
      "compliance_reports",
      "risk_analytics",
      "governance_automation",
      "department_dashboards",
      "sme_insights",
      "solopreneur_exec_assistant",
      "enterprise_governance"
    ];

    const results = [];

    for (const flag of flags) {
      // Check for existing flag (global or business-specific)
      const existing = await ctx.db
        .query("featureFlags")
        .filter((q) => 
          q.and(
            q.eq(q.field("flagName"), flag),
            args.businessId 
              ? q.eq(q.field("businessId"), args.businessId)
              : q.eq(q.field("businessId"), undefined)
          )
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          isEnabled: true,
          rolloutPercentage: 100,
          updatedAt: Date.now(),
        });
        results.push(`Updated ${flag}`);
      } else {
        await ctx.db.insert("featureFlags", {
          name: flag,
          flagName: flag,
          isEnabled: true,
          rolloutPercentage: 100,
          businessId: args.businessId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        results.push(`Created ${flag}`);
      }
    }
    
    return {
      status: "success",
      message: "All features enabled",
      details: results,
      openaiKeyPresent: !!process.env.OPENAI_API_KEY
    };
  },
});