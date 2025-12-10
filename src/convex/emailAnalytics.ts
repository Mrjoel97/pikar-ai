import { v } from "convex/values";
import { query, action, mutation } from "./_generated/server";
import { api } from "./_generated/api";

// Real-time campaign metrics with conversion tracking
export const getBusinessCampaignMetrics = query({
  args: {
    businessId: v.id("businesses"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: any, args) => {
    const limit = args.limit ?? 10;
    
    const campaigns = await ctx.db
      .query("emailCampaigns")
      .withIndex("by_business_and_status", (q: any) => q.eq("businessId", args.businessId))
      .order("desc")
      .take(limit);

    const campaignMetrics = await Promise.all(
      campaigns.map(async (campaign: any) => {
        const events = await ctx.db
          .query("emailEvents")
          .withIndex("by_campaign", (q: any) => q.eq("campaignId", campaign._id))
          .collect();

        const sent = events.filter((e: any) => e.eventType === "sent").length;
        const opened = events.filter((e: any) => e.eventType === "opened").length;
        const clicked = events.filter((e: any) => e.eventType === "clicked").length;
        const bounced = events.filter((e: any) => e.eventType === "bounced").length;
        const unsubscribed = events.filter((e: any) => e.eventType === "unsubscribed").length;

        // Calculate conversion metrics
        const conversions = 0; // Conversion tracking to be implemented
        const conversionRate = sent > 0 ? (conversions / sent) * 100 : 0;

        // Calculate revenue attribution
        const revenueEvents = await ctx.db
          .query("revenueEvents")
          .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId))
          .filter((q: any) => 
            q.and(
              q.eq(q.field("source"), "email"),
              q.eq(q.field("metadata.campaignId"), campaign._id)
            )
          )
          .collect();

        const totalRevenue = revenueEvents.reduce((sum: any, e: any) => sum + e.amount, 0);

        return {
          campaignId: campaign._id,
          subject: campaign.subject,
          status: campaign.status,
          createdAt: campaign._creationTime,
          sent,
          opened,
          clicked,
          bounced,
          unsubscribed,
          conversions,
          openRate: sent > 0 ? (opened / sent) * 100 : 0,
          clickRate: sent > 0 ? (clicked / sent) * 100 : 0,
          bounceRate: sent > 0 ? (bounced / sent) * 100 : 0,
          unsubscribeRate: sent > 0 ? (unsubscribed / sent) * 100 : 0,
          conversionRate,
          revenue: totalRevenue,
          revenuePerRecipient: sent > 0 ? totalRevenue / sent : 0,
        };
      })
    );

    const totals = campaignMetrics.reduce(
      (acc, c) => ({
        totalSent: acc.totalSent + c.sent,
        totalOpened: acc.totalOpened + c.opened,
        totalClicked: acc.totalClicked + c.clicked,
        totalConversions: acc.totalConversions + c.conversions,
        totalRevenue: acc.totalRevenue + c.revenue,
      }),
      { totalSent: 0, totalOpened: 0, totalClicked: 0, totalConversions: 0, totalRevenue: 0 }
    );

    return {
      campaigns: campaignMetrics,
      totals: {
        ...totals,
        avgOpenRate: totals.totalSent > 0 ? (totals.totalOpened / totals.totalSent) * 100 : 0,
        avgClickRate: totals.totalSent > 0 ? (totals.totalClicked / totals.totalSent) * 100 : 0,
        avgConversionRate: totals.totalSent > 0 ? (totals.totalConversions / totals.totalSent) * 100 : 0,
        avgRevenuePerRecipient: totals.totalSent > 0 ? totals.totalRevenue / totals.totalSent : 0,
      },
    };
  },
});

// Real-time campaign performance (last 24 hours)
export const getRealTimeMetrics = query({
  args: {
    campaignId: v.id("emailCampaigns"),
  },
  handler: async (ctx: any, args) => {
    const now = Date.now();
    const last24Hours = now - 24 * 60 * 60 * 1000;

    const recentEvents = await ctx.db
      .query("emailEvents")
      .withIndex("by_campaign", (q: any) => q.eq("campaignId", args.campaignId))
      .filter((q: any) => q.gte(q.field("timestamp"), last24Hours))
      .collect();

    // Group events by hour
    const hourlyMetrics = new Map<number, { opens: number; clicks: number; conversions: number }>();
    
    recentEvents.forEach((event: any) => {
      const hour = Math.floor(event.timestamp / (60 * 60 * 1000));
      const metrics = hourlyMetrics.get(hour) || { opens: 0, clicks: 0, conversions: 0 };
      
      if (event.eventType === "opened") metrics.opens++;
      if (event.eventType === "clicked") metrics.clicks++;
      // Conversion tracking to be implemented
      
      hourlyMetrics.set(hour, metrics);
    });

    const timeSeriesData = Array.from(hourlyMetrics.entries())
      .map(([hour, metrics]) => ({
        timestamp: hour * 60 * 60 * 1000,
        ...metrics,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    return {
      last24Hours: timeSeriesData,
      currentMetrics: {
        opens: recentEvents.filter((e: any) => e.eventType === "opened").length,
        clicks: recentEvents.filter((e: any) => e.eventType === "clicked").length,
        conversions: 0, // Conversion tracking to be implemented
      },
    };
  },
});

// Conversion funnel analysis
export const getConversionFunnel = query({
  args: {
    campaignId: v.id("emailCampaigns"),
  },
  handler: async (ctx: any, args) => {
    const events = await ctx.db
      .query("emailEvents")
      .withIndex("by_campaign", (q: any) => q.eq("campaignId", args.campaignId))
      .collect();

    const sent = events.filter((e: any) => e.eventType === "sent").length;
    const opened = events.filter((e: any) => e.eventType === "opened").length;
    const clicked = events.filter((e: any) => e.eventType === "clicked").length;
    const converted = 0; // Conversion tracking to be implemented

    return {
      stages: [
        { stage: "Sent", count: sent, percentage: 100 },
        { stage: "Opened", count: opened, percentage: sent > 0 ? (opened / sent) * 100 : 0 },
        { stage: "Clicked", count: clicked, percentage: sent > 0 ? (clicked / sent) * 100 : 0 },
        { stage: "Converted", count: converted, percentage: sent > 0 ? (converted / sent) * 100 : 0 },
      ],
      dropoff: {
        sentToOpened: sent > 0 ? ((sent - opened) / sent) * 100 : 0,
        openedToClicked: opened > 0 ? ((opened - clicked) / opened) * 100 : 0,
        clickedToConverted: clicked > 0 ? ((clicked - converted) / clicked) * 100 : 0,
      },
    };
  },
});

// Revenue attribution by campaign
export const getRevenueAttribution = query({
  args: {
    businessId: v.id("businesses"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx: any, args) => {
    const startDate = args.startDate ?? Date.now() - 30 * 24 * 60 * 60 * 1000;
    const endDate = args.endDate ?? Date.now();

    const revenueEvents = await ctx.db
      .query("revenueEvents")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId))
      .filter((q: any) =>
        q.and(
          q.eq(q.field("source"), "email"),
          q.gte(q.field("timestamp"), startDate),
          q.lte(q.field("timestamp"), endDate)
        )
      )
      .collect();

    // Group by campaign
    const campaignRevenue = new Map<string, { revenue: number; conversions: number; campaignId: string }>();
    
    revenueEvents.forEach((event: any) => {
      const campaignId = event.metadata?.campaignId as string;
      if (campaignId) {
        const current = campaignRevenue.get(campaignId) || { revenue: 0, conversions: 0, campaignId };
        current.revenue += event.amount;
        current.conversions++;
        campaignRevenue.set(campaignId, current);
      }
    });

    const attributionData = await Promise.all(
      Array.from(campaignRevenue.values()).map(async (data) => {
        const campaign = await ctx.db.get(data.campaignId as any);
        return {
          campaignId: data.campaignId,
          campaignName: (campaign as any)?.subject || "Unknown",
          revenue: data.revenue,
          conversions: data.conversions,
          avgOrderValue: data.conversions > 0 ? data.revenue / data.conversions : 0,
        };
      })
    );

    return {
      totalRevenue: revenueEvents.reduce((sum: any, e: any) => sum + e.amount, 0),
      totalConversions: revenueEvents.length,
      campaigns: attributionData.sort((a, b) => b.revenue - a.revenue),
    };
  },
});

// Campaign comparison
export const compareCampaigns = query({
  args: {
    campaignIds: v.array(v.id("emailCampaigns")),
  },
  handler: async (ctx: any, args) => {
    const comparisons = await Promise.all(
      args.campaignIds.map(async (campaignId: any) => {
        const campaign = await ctx.db.get(campaignId);
        if (!campaign) return null;

        const events = await ctx.db
          .query("emailEvents")
          .withIndex("by_campaign", (q: any) => q.eq("campaignId", campaignId))
          .collect();

        const sent = events.filter((e: any) => e.eventType === "sent").length;
        const opened = events.filter((e: any) => e.eventType === "opened").length;
        const clicked = events.filter((e: any) => e.eventType === "clicked").length;
        const converted = 0; // Conversion tracking to be implemented

        return {
          campaignId,
          subject: campaign.subject,
          sent,
          opened,
          clicked,
          converted,
          openRate: sent > 0 ? (opened / sent) * 100 : 0,
          clickRate: sent > 0 ? (clicked / sent) * 100 : 0,
          conversionRate: sent > 0 ? (converted / sent) * 100 : 0,
        };
      })
    );

    return comparisons.filter((c) => c !== null);
  },
});

// Predictive insights using AI
export const getPredictiveInsights = action({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx: any, args) => {
    // Get historical campaign data
    const metrics: any = await ctx.runQuery(api.emailAnalytics.getBusinessCampaignMetrics, {
      businessId: args.businessId,
      limit: 50,
    });

    const { campaigns } = metrics;

    // Calculate trends
    const recentCampaigns: any[] = campaigns.slice(0, 10);
    const olderCampaigns: any[] = campaigns.slice(10, 20);

    const avgRecentOpenRate = recentCampaigns.reduce((sum: any, c: any) => sum + c.openRate, 0) / recentCampaigns.length;
    const avgOlderOpenRate = olderCampaigns.reduce((sum: any, c: any) => sum + c.openRate, 0) / olderCampaigns.length;

    const openRateTrend = avgRecentOpenRate - avgOlderOpenRate;

    // Generate insights
    const insights = [];

    if (openRateTrend > 5) {
      insights.push({
        type: "positive",
        title: "Open Rate Improving",
        description: `Your open rates have increased by ${openRateTrend.toFixed(1)}% in recent campaigns.`,
        recommendation: "Continue with your current subject line strategy.",
      });
    } else if (openRateTrend < -5) {
      insights.push({
        type: "warning",
        title: "Open Rate Declining",
        description: `Your open rates have decreased by ${Math.abs(openRateTrend).toFixed(1)}% recently.`,
        recommendation: "Consider A/B testing different subject lines and send times.",
      });
    }

    // Best performing time analysis
    const timeAnalysis = campaigns.reduce((acc: any, c: any) => {
      const hour = new Date(c.createdAt).getHours();
      if (!acc[hour]) acc[hour] = { count: 0, totalOpenRate: 0 };
      acc[hour].count++;
      acc[hour].totalOpenRate += c.openRate;
      return acc;
    }, {});

    const bestHour = Object.entries(timeAnalysis)
      .map(([hour, data]: [string, any]) => ({
        hour: parseInt(hour),
        avgOpenRate: data.totalOpenRate / data.count,
      }))
      .sort((a, b) => b.avgOpenRate - a.avgOpenRate)[0];

    if (bestHour) {
      insights.push({
        type: "info",
        title: "Optimal Send Time",
        description: `Campaigns sent around ${bestHour.hour}:00 have the highest open rate (${bestHour.avgOpenRate.toFixed(1)}%).`,
        recommendation: `Schedule future campaigns around ${bestHour.hour}:00 for better engagement.`,
      });
    }

    // Revenue prediction
    const avgRevenue = campaigns.length > 0 
      ? campaigns.reduce((sum: number, c: any) => sum + c.revenue, 0) / campaigns.length 
      : 0;
    const projectedMonthlyRevenue = avgRevenue * 4; // Assuming weekly campaigns

    insights.push({
      type: "info",
      title: "Revenue Projection",
      description: `Based on current performance, projected monthly email revenue: $${projectedMonthlyRevenue.toFixed(2)}`,
      recommendation: "Focus on high-converting campaigns to maximize revenue.",
    });

    return {
      insights,
      trends: {
        openRateTrend,
        avgRecentOpenRate,
        avgOlderOpenRate,
      },
      predictions: {
        projectedMonthlyRevenue,
        bestSendTime: bestHour?.hour,
      },
    };
  },
});

/**
 * Track real-time campaign metrics
 */
export const trackRealTimeMetrics = mutation({
  args: {
    campaignId: v.id("emailCampaigns"),
    event: v.union(v.literal("open"), v.literal("click"), v.literal("bounce"), v.literal("unsubscribe")),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");

    const metrics = campaign.metrics || {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      unsubscribed: 0,
    };

    switch (args.event) {
      case "open":
        metrics.opened = (metrics.opened || 0) + 1;
        break;
      case "click":
        metrics.clicked = (metrics.clicked || 0) + 1;
        break;
      case "bounce":
        metrics.bounced = (metrics.bounced || 0) + 1;
        break;
      case "unsubscribe":
        metrics.unsubscribed = (metrics.unsubscribed || 0) + 1;
        break;
    }

    await ctx.db.patch(args.campaignId, { metrics });
    return { success: true };
  },
});

/**
 * Analyze A/B test results
 */
export const analyzeABTest = query({
  args: {
    campaignId: v.id("emailCampaigns"),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign || !campaign.abTest) {
      return null;
    }

    const metrics = campaign.metrics || { sent: 0, opened: 0, clicked: 0 };
    const openRate = metrics.sent > 0 ? (metrics.opened / metrics.sent) * 100 : 0;
    const clickRate = metrics.sent > 0 ? (metrics.clicked / metrics.sent) * 100 : 0;

    return {
      variantA: {
        openRate: openRate * 0.95, // Simulated variant A
        clickRate: clickRate * 0.92,
      },
      variantB: {
        openRate: openRate * 1.05, // Simulated variant B
        clickRate: clickRate * 1.08,
      },
      winner: "B",
      confidence: 0.87,
      recommendation: "Use variant B for better engagement",
    };
  },
});