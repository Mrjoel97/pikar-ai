import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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
    socialPlatforms: 2,
    scheduledPostsLimit: 10,
    aiGenerationsPerMonth: 20,
  },
  startup: {
    workflows: 15,
    runsPerDay: 100,
    contactsPerList: 5000,
    agents: 10,
    emailsPerDay: 5000,
    perCampaignRecipients: 2000,
    socialPostsPerMonth: 100,
    socialPlatforms: 3,
    scheduledPostsLimit: 50,
    aiGenerationsPerMonth: 100,
  },
  sme: {
    workflows: 50,
    runsPerDay: 500,
    contactsPerList: 25000,
    agents: 25,
    emailsPerDay: 25000,
    perCampaignRecipients: 10000,
    socialPostsPerMonth: 500,
    socialPlatforms: 5,
    scheduledPostsLimit: 200,
    aiGenerationsPerMonth: 500,
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
    scheduledPostsLimit: 9999,
    aiGenerationsPerMonth: 9999,
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

export const canCreateSocialPost = mutation({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const business = await ctx.db.get(args.businessId);
    const tier = resolveTier(business?.tier);
    const caps = CAPS[tier];
    
    // Count posts created this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    
    const postsThisMonth = await ctx.db
      .query("socialPosts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("_creationTime"), monthStart))
      .collect()
      .then((r) => r.length);
    
    const allowed = postsThisMonth < caps.socialPostsPerMonth;
    const reason = allowed ? "" : `Monthly post limit reached (${caps.socialPostsPerMonth} for ${tier})`;
    
    return {
      allowed,
      reason,
      current: postsThisMonth,
      limit: caps.socialPostsPerMonth,
      tier,
    };
  },
});

export const canConnectPlatform = mutation({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const business = await ctx.db.get(args.businessId);
    const tier = resolveTier(business?.tier);
    const caps = CAPS[tier];
    
    // Count currently connected platforms
    const connectedPlatforms = await ctx.db
      .query("socialAccounts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect()
      .then((r) => r.length);
    
    const allowed = connectedPlatforms < caps.socialPlatforms;
    const reason = allowed ? "" : `Platform connection limit reached (${caps.socialPlatforms} for ${tier})`;
    
    return {
      allowed,
      reason,
      current: connectedPlatforms,
      limit: caps.socialPlatforms,
      tier,
    };
  },
});

export const canSchedulePost = mutation({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const business = await ctx.db.get(args.businessId);
    const tier = resolveTier(business?.tier);
    const caps = CAPS[tier];
    
    // Count currently scheduled posts (not yet posted)
    const scheduledPosts = await ctx.db
      .query("socialPosts")
      .withIndex("by_business_and_status", (q) => 
        q.eq("businessId", args.businessId).eq("status", "scheduled")
      )
      .collect()
      .then((r) => r.length);
    
    const allowed = scheduledPosts < caps.scheduledPostsLimit;
    const reason = allowed ? "" : `Scheduled posts limit reached (${caps.scheduledPostsLimit} for ${tier})`;
    
    return {
      allowed,
      reason,
      current: scheduledPosts,
      limit: caps.scheduledPostsLimit,
      tier,
    };
  },
});

export const canUseAIGeneration = mutation({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const business = await ctx.db.get(args.businessId);
    const tier = resolveTier(business?.tier);
    const caps = CAPS[tier];
    
    // Count AI generations this month (tracked via telemetry events)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    
    const aiGenerationsThisMonth = await ctx.db
      .query("telemetryEvents")
      .withIndex("by_business_and_event", (q) => 
        q.eq("businessId", args.businessId).eq("eventName", "ai_generation_used")
      )
      .filter((q) => q.gte(q.field("timestamp"), monthStart))
      .collect()
      .then((r) => r.length);
    
    const allowed = aiGenerationsThisMonth < caps.aiGenerationsPerMonth;
    const reason = allowed ? "" : `Monthly AI generation limit reached (${caps.aiGenerationsPerMonth} for ${tier})`;
    
    return {
      allowed,
      reason,
      current: aiGenerationsThisMonth,
      limit: caps.aiGenerationsPerMonth,
      tier,
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
      await ctx.runMutation("audit:write" as any, {
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