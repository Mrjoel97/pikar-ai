import { v } from "convex/values";
import { query, mutation, internalAction } from "./_generated/server";

export const getRegionalMetrics = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    region: v.optional(v.string()),
    unit: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Guest/public: no business context → return defaults
    if (!args.businessId) {
      return {
        revenue: 0,
        efficiency: 0,
        complianceScore: 94,
        riskScore: 12,
      };
    }
    
    
    const bizId = args.businessId!;
    const kpi = await ctx.db
      .query("dashboardKpis")
      .withIndex("by_business_and_date", (q) => q.eq("businessId", bizId))
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
    const efficiency = 76; // tiny nudge to force fresh push; guest-safe defaults remain unchanged
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
    businessId: v.optional(v.id("businesses")),
    region: v.optional(v.string()),
    unit: v.optional(v.string()),
    metric: v.optional(v.string()),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Guest/public: no business context → return empty trend
    if (!args.businessId) {
      return [];
    }

    const bizId = args.businessId!;
    const metric = args.metric;
    // Default days to 12 if not provided or invalid
    const d = typeof args.days === "number" && !Number.isNaN(args.days) ? args.days : 12;

    const snapshots = await ctx.db
      .query("dashboardKpis")
      .withIndex("by_business_and_date", (q) => q.eq("businessId", bizId))
      .order("desc")
      .take(d);

    const values = snapshots.map((snap) => {
      switch (metric) {
        case "revenue":
          return Math.min(100, ((snap.revenue || 0) / 1000) % 100);
        case "efficiency":
          return 76;
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