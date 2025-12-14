import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

/**
 * Attribution models for revenue tracking
 */
const ATTRIBUTION_MODELS = {
  FIRST_TOUCH: "first_touch",
  LAST_TOUCH: "last_touch",
  LINEAR: "linear",
  TIME_DECAY: "time_decay",
  POSITION_BASED: "position_based",
} as const;

// Add default cost estimates per channel for ROI calculations
const DEFAULT_CHANNEL_COSTS: Record<string, number> = {
  email: 0.05,
  social: 0.1,
  paid: 2,
  referral: 0.02,
  organic: 0,
  direct: 0.01,
};

/**
 * Track a touchpoint in the customer journey
 */
export const trackTouchpoint = mutation({
  args: {
    businessId: v.id("businesses"),
    contactId: v.id("contacts"),
    channel: v.union(
      v.literal("email"),
      v.literal("social"),
      v.literal("paid"),
      v.literal("referral"),
      v.literal("organic"),
      v.literal("direct")
    ),
    campaignId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const touchpointId = await ctx.db.insert("revenueTouchpoints", {
      businessId: args.businessId,
      contactId: args.contactId,
      channel: args.channel,
      campaignId: args.campaignId, // Changed from campaign
      timestamp: Date.now(),
      value: 0,
    });

    return touchpointId;
  },
});

/**
 * Record a conversion with revenue
 */
export const recordConversion = mutation({
  args: {
    businessId: v.id("businesses"),
    contactId: v.id("contacts"),
    revenue: v.number(),
    conversionType: v.string(),
    metadata: v.optional(v.any()),
    amount: v.optional(v.number()),
    convertedAt: v.optional(v.number()),
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();

    // Get touchpoints for this contact & business via composite index (no filter scans)
    const touchpoints = await ctx.db
      .query("revenueTouchpoints")
      .withIndex("by_contact_and_business", (q) =>
        q.eq("contactId", args.contactId).eq("businessId", args.businessId)
      )
      .collect();

    if (touchpoints.length === 0) {
      throw new Error("No touchpoints found for this contact");
    }

    // Sort touchpoints by timestamp
    touchpoints.sort((a, b) => a.timestamp - b.timestamp);

    // Calculate attribution for each model
    const attributions = calculateAttributions(touchpoints, args.revenue);

    // Record conversion
    const conversionId = await ctx.db.insert("revenueConversions", {
      businessId: args.businessId,
      contactId: args.contactId,
      amount: args.amount ?? args.revenue,
      revenue: args.revenue,
      convertedAt: args.convertedAt ?? now,
      timestamp: args.timestamp ?? now,
      conversionType: args.conversionType,
      currency: "USD", // Added default
      source: "unknown", // Added default
      attributions, // Added missing field
    });

    return conversionId;
  },
});

/**
 * Calculate attribution across different models
 */
function calculateAttributions(
  touchpoints: Array<{ _id: Id<"revenueTouchpoints">; channel: string; timestamp: number }>,
  revenue: number
) {
  const attributions: Record<string, Record<string, number>> = {
    first_touch: {},
    last_touch: {},
    linear: {},
    time_decay: {},
    position_based: {},
  };

  // First Touch: 100% to first touchpoint
  attributions.first_touch[touchpoints[0].channel] = revenue;

  // Last Touch: 100% to last touchpoint
  attributions.last_touch[touchpoints[touchpoints.length - 1].channel] = revenue;

  // Linear: Equal distribution
  const linearShare = revenue / touchpoints.length;
  touchpoints.forEach((tp) => {
    attributions.linear[tp.channel] = (attributions.linear[tp.channel] || 0) + linearShare;
  });

  // Time Decay: More recent touchpoints get more credit
  const decayFactor = 0.5;
  let totalWeight = 0;
  const weights = touchpoints.map((tp, idx) => {
    const weight = Math.pow(decayFactor, touchpoints.length - idx - 1);
    totalWeight += weight;
    return weight;
  });

  touchpoints.forEach((tp, idx) => {
    const share = (weights[idx] / totalWeight) * revenue;
    attributions.time_decay[tp.channel] = (attributions.time_decay[tp.channel] || 0) + share;
  });

  // Position-Based: 40% first, 40% last, 20% distributed to middle
  if (touchpoints.length === 1) {
    attributions.position_based[touchpoints[0].channel] = revenue;
  } else if (touchpoints.length === 2) {
    attributions.position_based[touchpoints[0].channel] = revenue * 0.5;
    attributions.position_based[touchpoints[1].channel] = revenue * 0.5;
  } else {
    attributions.position_based[touchpoints[0].channel] = revenue * 0.4;
    attributions.position_based[touchpoints[touchpoints.length - 1].channel] = revenue * 0.4;
    const middleShare = (revenue * 0.2) / (touchpoints.length - 2);
    for (let i = 1; i < touchpoints.length - 1; i++) {
      attributions.position_based[touchpoints[i].channel] =
        (attributions.position_based[touchpoints[i].channel] || 0) + middleShare;
    }
  }

  return attributions;
}

/**
 * Get attribution report for a business
 */
export const getAttributionReport = query({
  args: {
    businessId: v.id("businesses"),
    model: v.optional(
      v.union(
        v.literal("first_touch"),
        v.literal("last_touch"),
        v.literal("linear"),
        v.literal("time_decay"),
        v.literal("position_based")
      )
    ),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const model = args.model || "linear";
    const days = args.days || 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    // Use composite index to filter by business and range on timestamp
    const conversions = await ctx.db
      .query("revenueConversions")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("convertedAt"), cutoff))
      .collect();

    // Aggregate attribution by channel
    const channelAttribution: Record<string, { revenue: number; conversions: number }> = {};

    conversions.forEach((conversion) => {
      const modelAttribution = conversion.attributions[model] || {};
      Object.entries(modelAttribution).forEach(([channel, revenue]) => {
        if (!channelAttribution[channel]) {
          channelAttribution[channel] = { revenue: 0, conversions: 0 };
        }
        channelAttribution[channel].revenue += revenue as number;
        channelAttribution[channel].conversions += 1;
      });
    });

    // Calculate totals
    const totalRevenue = conversions.reduce((sum, c) => sum + (c.revenue || c.amount), 0);
    const totalConversions = conversions.length;

    // Format channel data
    const channels = Object.entries(channelAttribution).map(([channel, data]) => ({
      channel,
      revenue: Math.round(data.revenue * 100) / 100,
      conversions: data.conversions,
      percentage: totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 100) : 0,
      avgRevenuePerConversion:
        data.conversions > 0 ? Math.round((data.revenue / data.conversions) * 100) / 100 : 0,
    }));

    // Sort by revenue descending
    channels.sort((a, b) => b.revenue - a.revenue);

    return {
      model,
      period: { days, cutoff },
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalConversions,
      channels,
    };
  },
});

/**
 * Get channel ROI breakdown
 */
export const getChannelROI = query({
  args: {
    businessId: v.id("businesses"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    // Conversions in window (linear attribution as baseline)
    const conversions = await ctx.db
      .query("revenueConversions")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("convertedAt"), cutoff))
      .collect();

    // Aggregate revenue and conversion counts by channel using linear model
    const channelData: Record<
      string,
      { revenue: number; conversions: number; cost: number }
    > = {};

    for (const conversion of conversions) {
      const linear = (conversion.attributions?.linear ?? {}) as Record<string, number>;
      const channels = Object.keys(linear);

      for (const channel of channels) {
        if (!channelData[channel]) {
          channelData[channel] = { revenue: 0, conversions: 0, cost: 0 };
        }
        channelData[channel].revenue += linear[channel] || 0;

        // Count a conversion for a channel if it received any attribution for this conversion
        channelData[channel].conversions += 1;
      }
    }

    // Estimate costs per channel using default rates
    for (const [channel, data] of Object.entries(channelData)) {
      const unitCost = DEFAULT_CHANNEL_COSTS[channel] ?? 0;
      data.cost = Math.round(data.conversions * unitCost * 100) / 100;
    }

    // Build ROI result
    const channels = Object.entries(channelData).map(([channel, data]) => {
      const profit = data.revenue - data.cost;
      const roiPct = data.cost > 0 ? (profit / data.cost) * 100 : 0;
      const cpa = data.conversions > 0 ? data.cost / data.conversions : 0;
      return {
        channel,
        revenue: Math.round(data.revenue * 100) / 100,
        cost: Math.round(data.cost * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        roi: Math.round(roiPct * 100) / 100,
        conversions: data.conversions,
        cpa: Math.round(cpa * 100) / 100,
      };
    });

    channels.sort((a, b) => b.roi - a.roi);

    const totalRevenue = channels.reduce((s, c) => s + c.revenue, 0);
    const totalCost = channels.reduce((s, c) => s + c.cost, 0);
    const totalProfit = totalRevenue - totalCost;
    const overallROI = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    return {
      period: { days, cutoff },
      overall: {
        revenue: Math.round(totalRevenue * 100) / 100,
        cost: Math.round(totalCost * 100) / 100,
        profit: Math.round(totalProfit * 100) / 100,
        roi: Math.round(overallROI * 100) / 100,
      },
      channels,
    };
  },
});

/**
 * Get multi-touch attribution comparison
 */
export const getMultiTouchComparison = query({
  args: {
    businessId: v.id("businesses"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const conversions = await ctx.db
      .query("revenueConversions")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("convertedAt"), cutoff))
      .collect();

    const models = ["first_touch", "last_touch", "linear", "time_decay", "position_based"];
    const comparison: Record<string, Record<string, number>> = {};

    models.forEach((model) => {
      comparison[model] = {};
      conversions.forEach((conversion) => {
        const modelAttribution = conversion.attributions[model] || {};
        Object.entries(modelAttribution).forEach(([channel, revenue]) => {
          comparison[model][channel] = (comparison[model][channel] || 0) + (revenue as number);
        });
      });
    });

    return {
      period: { days, cutoff },
      totalConversions: conversions.length,
      models: comparison,
    };
  },
});

/**
 * Get customer journey paths
 */
export const getCustomerJourneys = query({
  args: {
    businessId: v.id("businesses"),
    days: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const limit = args.limit || 50;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const conversions = await ctx.db
      .query("revenueConversions")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("convertedAt"), cutoff))
      .take(limit);

    const journeys = [];
    for (const conversion of conversions) {
      const touchpoints = await ctx.db
        .query("revenueTouchpoints")
        .withIndex("by_contact_and_business", (q) =>
          q.eq("contactId", conversion.contactId).eq("businessId", args.businessId)
        )
        .collect();

      touchpoints.sort((a, b) => a.timestamp - b.timestamp);

      const path = touchpoints.map((tp) => tp.channel);
      const pathKey = path.join(" → ");

      journeys.push({
        contactId: conversion.contactId,
        path: pathKey,
        channels: path,
        touchpointCount: touchpoints.length,
        revenue: conversion.revenue || conversion.amount,
        conversionType: conversion.conversionType || "unknown",
        duration: touchpoints.length > 0 
          ? (conversion.timestamp || conversion.convertedAt) - touchpoints[0].timestamp 
          : 0,
      });
    }

    // Aggregate by path
    const pathStats: Record<string, { count: number; revenue: number; avgDuration: number }> = {};
    journeys.forEach((j) => {
      if (!pathStats[j.path]) {
        pathStats[j.path] = { count: 0, revenue: 0, avgDuration: 0 };
      }
      pathStats[j.path].count++;
      pathStats[j.path].revenue += j.revenue;
      pathStats[j.path].avgDuration += j.duration;
    });

    const topPaths = Object.entries(pathStats)
      .map(([path, stats]) => ({
        path,
        count: stats.count,
        revenue: Math.round(stats.revenue * 100) / 100,
        avgRevenue: Math.round((stats.revenue / stats.count) * 100) / 100,
        avgDurationDays: Math.round((stats.avgDuration / stats.count) / (1000 * 60 * 60 * 24) * 10) / 10,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      period: { days, cutoff },
      totalJourneys: journeys.length,
      topPaths,
      avgTouchpoints: journeys.length > 0 
        ? Math.round((journeys.reduce((sum, j) => sum + j.touchpointCount, 0) / journeys.length) * 10) / 10 
        : 0,
    };
  },
});

/**
 * Get channel performance trends over time
 */
export const getChannelTrends = query({
  args: {
    businessId: v.id("businesses"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const conversions = await ctx.db
      .query("revenueConversions")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("convertedAt"), cutoff))
      .collect();

    // Group by date and channel
    const dailyStats: Record<string, Record<string, { revenue: number; conversions: number }>> = {};

    conversions.forEach((conversion) => {
      const date = new Date(conversion.timestamp || conversion.convertedAt).toISOString().split("T")[0];
      const linear = (conversion.attributions?.linear ?? {}) as Record<string, number>;

      if (!dailyStats[date]) {
        dailyStats[date] = {};
      }

      Object.entries(linear).forEach(([channel, revenue]) => {
        if (!dailyStats[date][channel]) {
          dailyStats[date][channel] = { revenue: 0, conversions: 0 };
        }
        dailyStats[date][channel].revenue += revenue;
        dailyStats[date][channel].conversions += 1;
      });
    });

    // Format for charting
    const trends = Object.entries(dailyStats)
      .map(([date, channels]) => {
        const entry: any = { date };
        Object.entries(channels).forEach(([channel, stats]) => {
          entry[channel] = Math.round(stats.revenue * 100) / 100;
          entry[`${channel}_conversions`] = stats.conversions;
        });
        return entry;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      period: { days, cutoff },
      trends,
    };
  },
});

/**
 * Predictive revenue forecasting
 */
export const getRevenueForecast = query({
  args: {
    businessId: v.id("businesses"),
    forecastDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const forecastDays = args.forecastDays || 30;
    const historicalDays = 90;
    const cutoff = Date.now() - historicalDays * 24 * 60 * 60 * 1000;

    const conversions = await ctx.db
      .query("revenueConversions")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("convertedAt"), cutoff))
      .collect();

    // Group by date
    const dailyRevenue: Record<string, number> = {};
    conversions.forEach((c) => {
      const date = new Date(c.timestamp || c.convertedAt).toISOString().split("T")[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + (c.revenue || c.amount);
    });

    const historicalData = Object.entries(dailyRevenue)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Simple linear regression for forecasting
    const n = historicalData.length;
    if (n < 7) {
      return {
        forecast: [],
        confidence: 0,
        trend: "insufficient_data",
      };
    }

    const avgRevenue = historicalData.reduce((sum, d) => sum + d.revenue, 0) / n;
    const recentAvg = historicalData.slice(-7).reduce((sum, d) => sum + d.revenue, 0) / 7;
    const trend = recentAvg > avgRevenue ? "increasing" : recentAvg < avgRevenue ? "decreasing" : "stable";

    // Generate forecast
    const forecast = [];
    const today = new Date();
    for (let i = 1; i <= forecastDays; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(today.getDate() + i);
      const dateStr = forecastDate.toISOString().split("T")[0];

      // Simple moving average with trend adjustment
      const trendMultiplier = trend === "increasing" ? 1.02 : trend === "decreasing" ? 0.98 : 1;
      const predictedRevenue = Math.round(recentAvg * Math.pow(trendMultiplier, i) * 100) / 100;

      forecast.push({
        date: dateStr,
        predicted: predictedRevenue,
        lower: Math.round(predictedRevenue * 0.8 * 100) / 100,
        upper: Math.round(predictedRevenue * 1.2 * 100) / 100,
      });
    }

    return {
      forecast,
      confidence: Math.min(95, n * 2), // Confidence increases with more data
      trend,
      avgDailyRevenue: Math.round(avgRevenue * 100) / 100,
      recentAvgRevenue: Math.round(recentAvg * 100) / 100,
    };
  },
});

/**
 * Get advanced channel performance metrics
 */
export const getChannelPerformanceMetrics = query({
  args: {
    businessId: v.id("businesses"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const conversions = await ctx.db
      .query("revenueConversions")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("timestamp"), cutoff))
      .collect();

    const touchpoints = await ctx.db
      .query("revenueTouchpoints")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gt(q.field("timestamp"), cutoff))
      .collect();

    // Calculate metrics per channel
    const channelMetrics: Record<string, {
      touchpoints: number;
      conversions: number;
      revenue: number;
      avgTimeToConversion: number;
      conversionRate: number;
    }> = {};

    // Count touchpoints
    touchpoints.forEach((tp) => {
      if (!channelMetrics[tp.channel]) {
        channelMetrics[tp.channel] = {
          touchpoints: 0,
          conversions: 0,
          revenue: 0,
          avgTimeToConversion: 0,
          conversionRate: 0,
        };
      }
      channelMetrics[tp.channel].touchpoints++;
    });

    // Add conversion data
    for (const conversion of conversions) {
      const linear = (conversion.attributions?.linear ?? {}) as Record<string, number>;
      const contactTouchpoints = await ctx.db
        .query("revenueTouchpoints")
        .withIndex("by_contact_and_business", (q) =>
          q.eq("contactId", conversion.contactId).eq("businessId", args.businessId)
        )
        .collect();

      contactTouchpoints.sort((a, b) => a.timestamp - b.timestamp);
      const timeToConversion = contactTouchpoints.length > 0 
        ? (conversion.timestamp || conversion.convertedAt) - contactTouchpoints[0].timestamp 
        : 0;

      Object.entries(linear).forEach(([channel, revenue]) => {
        if (channelMetrics[channel]) {
          channelMetrics[channel].conversions++;
          channelMetrics[channel].revenue += revenue;
          channelMetrics[channel].avgTimeToConversion += timeToConversion;
        }
      });
    }

    // Calculate final metrics
    const metrics = Object.entries(channelMetrics).map(([channel, data]) => ({
      channel,
      touchpoints: data.touchpoints,
      conversions: data.conversions,
      revenue: Math.round(data.revenue * 100) / 100,
      conversionRate: data.touchpoints > 0 
        ? Math.round((data.conversions / data.touchpoints) * 100 * 100) / 100 
        : 0,
      avgTimeToConversionDays: data.conversions > 0 
        ? Math.round((data.avgTimeToConversion / data.conversions) / (1000 * 60 * 60 * 24) * 10) / 10 
        : 0,
      avgRevenuePerConversion: data.conversions > 0 
        ? Math.round((data.revenue / data.conversions) * 100) / 100 
        : 0,
    }));

    return {
      period: { days, cutoff },
      channels: metrics.sort((a, b) => b.revenue - a.revenue),
    };
  },
});