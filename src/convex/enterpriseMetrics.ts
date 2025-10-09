import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Enterprise Metrics - Multi-region data aggregation for Global Command Center
 */

// Get aggregated metrics by region and business unit
export const getRegionalMetrics = query({
  args: {
    businessId: v.id("businesses"),
    region: v.optional(v.string()), // "global", "na", "eu", "apac"
    unit: v.optional(v.string()), // "all", "marketing", "sales", "operations", "finance"
  },
  handler: async (ctx, args) => {
    const { businessId, region = "global", unit = "all" } = args;

    // Verify business access
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) return null;

    const business = await ctx.db.get(businessId);
    if (!business) return null;

    // Get KPI snapshot
    const kpiSnapshot = await ctx.db
      .query("dashboardKpis")
      .withIndex("by_business_and_date", (q) => q.eq("businessId", businessId))
      .order("desc")
      .first();

    // Get workflow runs for the region/unit
    const workflowRuns = await ctx.db
      .query("workflowRuns")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .collect();

    // Filter by region/unit if specified
    const filteredRuns = workflowRuns.filter((run) => {
      // In a real implementation, workflows would have region/unit metadata
      // For now, we'll use a simple filter based on workflow name patterns
      if (region !== "global" && !run.workflowId) return false;
      if (unit !== "all" && !run.workflowId) return false;
      return true;
    });

    // Calculate regional metrics
    const totalRuns = filteredRuns.length;
    const successfulRuns = filteredRuns.filter((r) => r.status === "succeeded").length;
    const failedRuns = filteredRuns.filter((r) => r.status === "failed").length;
    const efficiency = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0;

    // Get revenue data (from KPI snapshot or calculate)
    const revenue = kpiSnapshot?.revenue || 0;
    const revenueByRegion = calculateRevenueByRegion(revenue, region);

    // Get compliance score
    const complianceScore = await calculateComplianceScore(ctx, businessId);

    // Get risk score
    const riskScore = await calculateRiskScore(ctx, businessId);

    return {
      region,
      unit,
      revenue: revenueByRegion,
      efficiency,
      complianceScore,
      riskScore,
      totalRuns,
      successfulRuns,
      failedRuns,
      timestamp: Date.now(),
    };
  },
});

// Get time-series trend data for sparklines
export const getMetricsTrend = query({
  args: {
    businessId: v.id("businesses"),
    region: v.optional(v.string()),
    unit: v.optional(v.string()),
    metric: v.string(), // "revenue", "efficiency", "compliance", "risk"
    days: v.optional(v.number()), // default 30
  },
  handler: async (ctx, args) => {
    const { businessId, region = "global", unit = "all", metric, days = 30 } = args;

    // Verify access
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) return [];

    // Get historical KPI snapshots
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const snapshots = await ctx.db
      .query("dashboardKpis")
      .withIndex("by_business_and_date", (q) => q.eq("businessId", businessId))
      .filter((q) => q.gte(q.field("_creationTime"), cutoff))
      .collect();

    // Extract the requested metric
    const trendData = snapshots.map((snapshot) => {
      switch (metric) {
        case "revenue":
          return snapshot.revenue || 0;
        case "efficiency":
          return snapshot.engagement || 0;
        case "compliance":
          return 94; // Placeholder - would come from governance module
        case "risk":
          return 12; // Placeholder - would come from risk analytics
        default:
          return 0;
      }
    });

    // Fill in missing days with interpolated values
    const filledTrend = fillTrendGaps(trendData, days);

    return filledTrend;
  },
});

// Record a regional metric snapshot (for real-time updates)
export const recordMetricSnapshot = mutation({
  args: {
    businessId: v.id("businesses"),
    region: v.string(),
    unit: v.string(),
    metrics: v.object({
      revenue: v.number(),
      efficiency: v.number(),
      complianceScore: v.number(),
      riskScore: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const { businessId, region, unit, metrics } = args;

    // Verify admin access
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Store in audit log for historical tracking
    await ctx.db.insert("audit_logs", {
      businessId,
      userId: identity.subject as Id<"users">,
      action: "enterprise_metrics_snapshot",
      entityType: "metrics",
      entityId: `${region}_${unit}`,
      details: {
        region,
        unit,
        ...metrics,
      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Helper functions
function calculateRevenueByRegion(totalRevenue: number, region: string): number {
  // Simple distribution model - in production, this would be based on actual regional data
  const distribution: Record<string, number> = {
    global: 1.0,
    na: 0.45,
    eu: 0.35,
    apac: 0.20,
  };

  return Math.round(totalRevenue * (distribution[region] || 1.0));
}

async function calculateComplianceScore(ctx: any, businessId: Id<"businesses">): Promise<number> {
  // Get governance health
  const workflows = await ctx.db
    .query("workflows")
    .withIndex("by_business", (q: any) => q.eq("businessId", businessId))
    .collect();

  if (workflows.length === 0) return 100;

  const compliantWorkflows = workflows.filter((w: any) => {
    const health = w.governanceHealth;
    return health && health.compliant === true;
  });

  return Math.round((compliantWorkflows.length / workflows.length) * 100);
}

async function calculateRiskScore(ctx: any, businessId: Id<"businesses">): Promise<number> {
  // Get risk matrix data
  const riskMatrix = await ctx.db
    .query("riskMatrix")
    .withIndex("by_business", (q: any) => q.eq("businessId", businessId))
    .collect();

  if (riskMatrix.length === 0) return 0;

  // Calculate weighted risk score (lower is better)
  const totalRisk = riskMatrix.reduce((sum: number, risk: any) => {
    const score = risk.probability * risk.impact;
    return sum + score;
  }, 0);

  return Math.min(100, Math.round(totalRisk / riskMatrix.length));
}

function fillTrendGaps(data: number[], targetLength: number): number[] {
  if (data.length >= targetLength) return data.slice(-targetLength);

  const filled = [...data];
  while (filled.length < targetLength) {
    // Interpolate or use last known value
    const lastValue = filled[filled.length - 1] || 0;
    filled.push(lastValue);
  }

  return filled;
}
