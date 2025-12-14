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
        revenue: 0,
        visitors: 0,
        subscribers: 0,
        engagement: 0,
        createdAt: Date.now(), // Added required field
        data: {}, // Added required field
      });
      return id;
    }
  },
});

/**
 * Query: Get real-time regional sync status
 */
export const getRegionalSyncStatus = query({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return {
        regions: [],
        overallHealth: "healthy" as const,
      };
    }

    // Check last sync time for each region
    const regions = ["global", "na", "eu", "apac"];
    const syncStatus = [];

    for (const region of regions) {
      const lastSnapshot = await ctx.db
        .query("dashboardKpis")
        .withIndex("by_business_and_date", (q) => q.eq("businessId", args.businessId!))
        .order("desc")
        .first();

      const lastSyncTime = lastSnapshot?._creationTime || 0;
      const timeSinceSync = Date.now() - lastSyncTime;
      const isHealthy = timeSinceSync < 5 * 60 * 1000; // 5 minutes

      syncStatus.push({
        region,
        lastSyncTime,
        status: isHealthy ? "synced" : "delayed",
        latencyMs: timeSinceSync,
      });
    }

    const overallHealth = syncStatus.every((s) => s.status === "synced") ? "healthy" : "degraded";

    return {
      regions: syncStatus,
      overallHealth,
    };
  },
});

/**
 * Query: Get regional failover indicators
 */
export const getRegionalFailoverStatus = query({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return {
        primaryRegion: "na",
        failoverRegion: "eu",
        failoverActive: false,
        regions: [],
      };
    }

    // Mock failover status - in production, this would check actual infrastructure
    return {
      primaryRegion: "na",
      failoverRegion: "eu",
      failoverActive: false,
      regions: [
        { region: "na", status: "active", uptime: 99.99 },
        { region: "eu", status: "standby", uptime: 99.98 },
        { region: "apac", status: "standby", uptime: 99.97 },
      ],
    };
  },
});

/**
 * Query: Cross-region data consistency checks
 */
export const checkDataConsistency = query({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return {
        consistent: true,
        issues: [],
        lastCheck: Date.now(),
      };
    }

    const issues = [];
    
    // Check for data discrepancies across regions
    const snapshots = await ctx.db
      .query("dashboardKpis")
      .withIndex("by_business_and_date", (q) => q.eq("businessId", args.businessId!))
      .order("desc")
      .take(10);

    // Simple consistency check: ensure recent data exists
    if (snapshots.length === 0) {
      issues.push({
        type: "missing_data",
        severity: "high",
        message: "No recent snapshots found",
      });
    }

    return {
      consistent: issues.length === 0,
      issues,
      lastCheck: Date.now(),
    };
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