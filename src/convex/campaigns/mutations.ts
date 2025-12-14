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
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("experiments", {
      businessId: args.businessId,
      name: args.name,
      hypothesis: args.description || "",
      goal: "conversions",
      status: (args.status === "active" ? "running" : args.status === "draft" ? "draft" : args.status === "paused" ? "paused" : "completed") as "draft" | "running" | "paused" | "completed" | "archived",
      createdBy: args.userId,
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
      .filter((q) => q.eq(q.field("campaignId"), args.campaignId as any))
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