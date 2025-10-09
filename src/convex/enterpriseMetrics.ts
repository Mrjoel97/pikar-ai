"use node";

import { v } from "convex/values";
import { query, mutation, internalAction } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const getRegionalMetrics = query({
  args: {
    businessId: v.id("businesses"),
    region: v.string(),
    unit: v.string(),
  },
  handler: async (ctx, args) => {
    const { businessId, region, unit } = args;

    const kpi = await ctx.db
      .query("dashboardKpis")
      .withIndex("by_business_and_date", (q) => q.eq("businessId", businessId))
      .order("desc")
      .first();

    if (!kpi) {
      return {
        revenue: 0,
        efficiency: 0,
        complianceScore: 94,
        riskScore: 12,
      };
    }

    const revenue = kpi.revenue || 0;
    const efficiency = 75;
    const complianceScore = 94;
    const riskScore = 12;

    return {
      revenue,
      efficiency,
      complianceScore,
      riskScore,
    };
  },
});

export const getMetricsTrend = query({
  args: {
    businessId: v.id("businesses"),
    region: v.string(),
    unit: v.string(),
    metric: v.string(),
    days: v.number(),
  },
  handler: async (ctx, args) => {
    const { businessId, metric, days } = args;

    const snapshots = await ctx.db
      .query("dashboardKpis")
      .withIndex("by_business_and_date", (q) => q.eq("businessId", businessId))
      .order("desc")
      .take(days);

    const values = snapshots.map((snap) => {
      switch (metric) {
        case "revenue":
          return Math.min(100, ((snap.revenue || 0) / 1000) % 100);
        case "efficiency":
          return 75;
        case "compliance":
          return 94;
        case "risk":
          return 12;
        default:
          return 50;
      }
    });

    return values.reverse();
  },
});

export const recordMetricSnapshot = mutation({
  args: {
    businessId: v.id("businesses"),
    region: v.string(),
    unit: v.string(),
    revenue: v.number(),
    efficiency: v.number(),
    complianceScore: v.number(),
    riskScore: v.number(),
  },
  handler: async (ctx, args) => {
    const { businessId, region, unit, revenue } = args;

    const date = new Date().toISOString().split("T")[0];

    const existing = await ctx.db
      .query("dashboardKpis")
      .withIndex("by_business_and_date", (q) => q.eq("businessId", businessId))
      .filter((q) => q.eq(q.field("date"), date))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        revenue,
      });
      return existing._id;
    } else {
      const id = await ctx.db.insert("dashboardKpis", {
        businessId,
        date,
        revenue,
        visitors: 0,
        subscribers: 0,
        engagement: 0,
      });
      return id;
    }
  },
});

/**
 * Internal Action: Collect metrics for all businesses (scheduled via cron)
 */
export const collectAllBusinessMetrics = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get all active businesses
    const businesses = await ctx.runQuery("businesses:listAllBusinesses" as any, {});
    
    let totalCollected = 0;
    for (const business of businesses) {
      try {
        // Collect metrics for each region
        const regions = ["global", "na", "eu", "apac"];
        for (const region of regions) {
          const metrics = await ctx.runQuery("enterpriseMetrics:getRegionalMetrics" as any, {
            businessId: business._id,
            region,
            unit: "all",
          });
          
          if (metrics) {
            await ctx.runMutation("enterpriseMetrics:recordMetricSnapshot" as any, {
              businessId: business._id,
              region,
              unit: "all",
              revenue: metrics.revenue,
              efficiency: metrics.efficiency,
              complianceScore: metrics.complianceScore,
              riskScore: metrics.riskScore,
            });
            totalCollected++;
          }
        }
      } catch (error) {
        console.error(`Failed to collect metrics for business ${business._id}:`, error);
      }
    }
    
    return { success: true, totalCollected };
  },
});