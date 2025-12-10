import { query } from "../_generated/server";
import { v } from "convex/values";

export const getDataQualityTrends = query({
  args: {
    businessId: v.id("businesses"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const startTime = Date.now() - days * 24 * 60 * 60 * 1000;

    const qualityChecks = await ctx.db
      .query("dataQualityChecks")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("_creationTime"), startTime))
      .collect();

    const trendData = [];
    for (let i = 0; i < days; i += Math.ceil(days / 10)) {
      const dayStart = startTime + i * 24 * 60 * 60 * 1000;
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      
      const dayChecks = qualityChecks.filter(
        (c) => c._creationTime >= dayStart && c._creationTime < dayEnd
      );

      const avgScore = dayChecks.length > 0
        ? dayChecks.reduce((sum, c) => sum + (c.score || 0), 0) / dayChecks.length
        : 0;

      trendData.push({
        date: new Date(dayStart).toLocaleDateString(),
        score: Math.round(avgScore * 100) / 100,
        checks: dayChecks.length,
      });
    }

    return trendData;
  },
});

export const getDataSourceHealth = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const sources = await ctx.db
      .query("dataWarehouseSources")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const healthMetrics = sources.map((source) => ({
      sourceId: source._id,
      name: source.name,
      type: source.type,
      isActive: source.isActive,
      lastSync: source.lastSyncTime,
      status: source.status,
      health: source.isActive && source.status === "connected" ? "healthy" : "warning",
    }));

    return healthMetrics;
  },
});
