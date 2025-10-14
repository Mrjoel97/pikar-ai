import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/**
 * Track email campaign events (opens, clicks, conversions)
 */
export const trackEmailEvent = mutation({
  args: {
    campaignId: v.id("emailCampaigns"),
    recipientEmail: v.string(),
    eventType: v.union(
      v.literal("sent"),
      v.literal("opened"),
      v.literal("clicked"),
      v.literal("bounced"),
      v.literal("unsubscribed")
    ),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("emailEvents", {
      campaignId: args.campaignId,
      recipientEmail: args.recipientEmail,
      eventType: args.eventType,
      metadata: args.metadata,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get campaign performance metrics for a specific campaign
 */
export const getCampaignMetrics = query({
  args: {
    campaignId: v.id("emailCampaigns"),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) return null;

    const events = await ctx.db
      .query("emailEvents")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    const sent = events.filter((e) => e.eventType === "sent").length;
    const opened = events.filter((e) => e.eventType === "opened").length;
    const clicked = events.filter((e) => e.eventType === "clicked").length;
    const bounced = events.filter((e) => e.eventType === "bounced").length;
    const unsubscribed = events.filter((e) => e.eventType === "unsubscribed").length;

    const openRate = sent > 0 ? (opened / sent) * 100 : 0;
    const clickRate = sent > 0 ? (clicked / sent) * 100 : 0;
    const clickToOpenRate = opened > 0 ? (clicked / opened) * 100 : 0;
    const bounceRate = sent > 0 ? (bounced / sent) * 100 : 0;

    return {
      campaignId: args.campaignId,
      campaignSubject: campaign.subject,
      sent,
      opened,
      clicked,
      bounced,
      unsubscribed,
      openRate,
      clickRate,
      clickToOpenRate,
      bounceRate,
      createdAt: campaign._creationTime,
    };
  },
});

/**
 * Get aggregated campaign performance for a business (solopreneur-focused)
 */
export const getBusinessCampaignMetrics = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Guest-safe: return empty if no businessId
    if (!args.businessId) {
      return {
        campaigns: [],
        totals: {
          totalSent: 0,
          totalOpened: 0,
          totalClicked: 0,
          avgOpenRate: 0,
          avgClickRate: 0,
        },
      };
    }

    const businessId = args.businessId;
    const takeLimit = Math.min(args.limit ?? 20, 50);

    const campaigns = await ctx.db
      .query("emailCampaigns")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .order("desc")
      .take(takeLimit);

    const campaignMetrics = await Promise.all(
      campaigns.map(async (campaign) => {
        const events = await ctx.db
          .query("emailEvents")
          .withIndex("by_campaign", (q) => q.eq("campaignId", campaign._id))
          .collect();

        const sent = events.filter((e) => e.eventType === "sent").length;
        const opened = events.filter((e) => e.eventType === "opened").length;
        const clicked = events.filter((e) => e.eventType === "clicked").length;

        const openRate = sent > 0 ? (opened / sent) * 100 : 0;
        const clickRate = sent > 0 ? (clicked / sent) * 100 : 0;

        return {
          campaignId: campaign._id,
          subject: campaign.subject,
          sent,
          opened,
          clicked,
          openRate,
          clickRate,
          createdAt: campaign._creationTime,
          status: campaign.status,
        };
      })
    );

    // Calculate totals
    const totalSent = campaignMetrics.reduce((sum, c) => sum + c.sent, 0);
    const totalOpened = campaignMetrics.reduce((sum, c) => sum + c.opened, 0);
    const totalClicked = campaignMetrics.reduce((sum, c) => sum + c.clicked, 0);
    const avgOpenRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const avgClickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;

    return {
      campaigns: campaignMetrics,
      totals: {
        totalSent,
        totalOpened,
        totalClicked,
        avgOpenRate,
        avgClickRate,
      },
    };
  },
});

/**
 * Compare multiple campaigns side-by-side
 */
export const compareCampaigns = query({
  args: {
    campaignIds: v.array(v.id("emailCampaigns")),
  },
  handler: async (ctx, args) => {
    const comparisons = await Promise.all(
      args.campaignIds.map(async (campaignId) => {
        const campaign = await ctx.db.get(campaignId);
        if (!campaign) return null;

        const events = await ctx.db
          .query("emailEvents")
          .withIndex("by_campaign", (q) => q.eq("campaignId", campaignId))
          .collect();

        const sent = events.filter((e) => e.eventType === "sent").length;
        const opened = events.filter((e) => e.eventType === "opened").length;
        const clicked = events.filter((e) => e.eventType === "clicked").length;

        return {
          campaignId,
          subject: campaign.subject,
          sent,
          opened,
          clicked,
          openRate: sent > 0 ? (opened / sent) * 100 : 0,
          clickRate: sent > 0 ? (clicked / sent) * 100 : 0,
          createdAt: campaign._creationTime,
        };
      })
    );

    return comparisons.filter((c) => c !== null);
  },
});
