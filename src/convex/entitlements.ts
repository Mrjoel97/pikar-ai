import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Tier caps configuration
const CAPS = {
  solopreneur: {
    workflows: 5,
    runsPerDay: 25,
    contactsPerList: 1000,
    agents: 3,
    emailsPerDay: 1000,
    perCampaignRecipients: 500,
    socialPostsPerMonth: 30,
    socialPlatforms: 3,
  },
  startup: {
    workflows: 15,
    runsPerDay: 100,
    contactsPerList: 5000,
    agents: 10,
    emailsPerDay: 5000,
    perCampaignRecipients: 2000,
    socialPostsPerMonth: 100,
    socialPlatforms: 5,
  },
  sme: {
    workflows: 50,
    runsPerDay: 500,
    contactsPerList: 25000,
    agents: 25,
    emailsPerDay: 25000,
    perCampaignRecipients: 10000,
    socialPostsPerMonth: 500,
    socialPlatforms: 999,
  },
  enterprise: {
    workflows: 200,
    runsPerDay: 2000,
    contactsPerList: 100000,
    agents: 100,
    emailsPerDay: 100000,
    perCampaignRecipients: 50000,
    socialPostsPerMonth: 9999,
    socialPlatforms: 999,
  },
} as const;

type TierType = keyof typeof CAPS;

function resolveTier(tier: string | undefined): TierType {
  if (tier === "startup" || tier === "sme" || tier === "enterprise") {
    return tier;
  }
  return "solopreneur";
}

export const getUsageLimits = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    let tier: TierType = "solopreneur";
    
    if (args.businessId) {
      const business = await ctx.db.get(args.businessId);
      tier = resolveTier(business?.tier);
    }
    
    return {
      tier,
      caps: CAPS[tier],
    };
  },
});

export const checkEntitlement = mutation({
  args: {
    businessId: v.id("businesses"),
    action: v.string(),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const business = await ctx.db.get(args.businessId);
    const tier = resolveTier(business?.tier);
    const caps = CAPS[tier];
    
    // Compute current usage
    const workflowsCount = await ctx.db
      .query("workflows")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect()
      .then(r => r.length);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    
    const runsToday = await ctx.db
      .query("workflowRuns")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gt(q.field("_creationTime"), todayMs))
      .collect()
      .then((r) => r.length);
    
    const agentsCount = await ctx.db
      .query("aiAgents")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect()
      .then(r => r.length);
    
    const emailsToday = await ctx.db
      .query("emails")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gt(q.field("_creationTime"), todayMs))
      .collect()
      .then((r) => r.length);
    
    const usageSnapshot = {
      workflowsCount,
      runsToday,
      agentsCount,
      emailsToday,
    };
    
    // Check specific action
    let allowed = true;
    let reason = "";
    
    switch (args.action) {
      case "create_workflow":
        if (workflowsCount >= caps.workflows) {
          allowed = false;
          reason = `Workflow limit reached (${caps.workflows} for ${tier})`;
        }
        break;
      case "run_workflow":
        if (runsToday >= caps.runsPerDay) {
          allowed = false;
          reason = `Daily runs limit reached (${caps.runsPerDay} for ${tier})`;
        }
        break;
      case "create_agent":
        if (agentsCount >= caps.agents) {
          allowed = false;
          reason = `Agent limit reached (${caps.agents} for ${tier})`;
        }
        break;
      case "send_email":
        if (emailsToday >= caps.emailsPerDay) {
          allowed = false;
          reason = `Daily email limit reached (${caps.emailsPerDay} for ${tier})`;
        }
        break;
      case "campaign_recipients":
        const amount = args.amount || 0;
        if (amount > caps.perCampaignRecipients) {
          allowed = false;
          reason = `Campaign recipient limit exceeded (${caps.perCampaignRecipients} for ${tier})`;
        }
        break;
    }
    
    // Audit on deny
    if (!allowed) {
      await ctx.runMutation(internal.audit.write, {
        businessId: args.businessId,
        action: "entitlement_denied",
        entityType: "entitlement",
        entityId: args.action,
        details: {
          tier,
          limit: caps,
          usage: usageSnapshot,
          reason,
          businessId: args.businessId,
        },
      });
    }
    
    return {
      allowed,
      reason,
      caps,
      usageSnapshot,
    };
  },
});