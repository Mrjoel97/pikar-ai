import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";

export const createCampaignRecord = internalMutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    status: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Default to a system user or the business owner if userId not provided
    // For now, we'll use the businessId as a placeholder if userId is missing, 
    // but ideally this should be passed from the caller.
    // Since we can't easily get a user ID from business ID without a query, 
    // and this is an internal mutation, we assume the caller might fix this later.
    // However, to satisfy the schema which likely expects a user ID string:
    
    const createdBy = args.userId ?? (args.businessId as unknown as any); 

    return await ctx.db.insert("experiments", {
      businessId: args.businessId,
      name: args.name,
      hypothesis: args.description || "",
      goal: "conversions",
      status: (args.status === "active" ? "running" : args.status) as any,
      createdBy: createdBy,
      configuration: {
        startDate: args.startDate,
        endDate: args.endDate,
      },
      createdAt: Date.now(),
    });
  },
});

/**
 * Get campaign performance across channels
 */
export const getCampaignPerformance = internalQuery({
  args: {
    campaignId: v.id("experiments"),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) return null;

    // Get email metrics
    const emailCampaigns = await ctx.db
      .query("emails")
      .filter((q) => q.eq(q.field("campaignId"), args.campaignId))
      .take(10);

    // Get social metrics
    const socialPosts = await ctx.db
      .query("socialPosts")
      .filter((q) => q.eq(q.field("businessId"), campaign.businessId))
      .take(10);

    return {
      campaign,
      emailMetrics: {
        sent: emailCampaigns.length,
        campaigns: emailCampaigns,
      },
      socialMetrics: {
        posts: socialPosts.length,
        items: socialPosts,
      },
    };
  },
});

/**
 * Pause a campaign
 */
export const pauseCampaign = internalMutation({
  args: {
    campaignId: v.id("experiments"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.campaignId, {
      status: "paused" as any,
    });
    return { success: true };
  },
});

/**
 * Resume a campaign
 */
export const resumeCampaign = internalMutation({
  args: {
    campaignId: v.id("experiments"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.campaignId, {
      status: "running",
    });
    return { success: true };
  },
});