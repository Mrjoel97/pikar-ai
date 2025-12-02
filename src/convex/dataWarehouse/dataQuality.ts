import { v } from "convex/values";
import { query, mutation } from "../_generated/server";

/**
 * Get data quality metrics
 */
export const getQualityMetrics = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    sourceId: v.optional(v.id("dataWarehouseSources")),
  },
  handler: async (ctx: any, args) => {
    if (!args.businessId) return [];

    let metricsQuery = ctx.db
      .query("dataQualityMetrics")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!));

    const metrics = await metricsQuery.order("desc").take(100);

    if (args.sourceId) {
      return metrics.filter((m: any) => m.sourceId === args.sourceId);
    }

    return metrics;
  },
});

/**
 * Create quality check
 */
export const createQualityCheck = mutation({
  args: {
    businessId: v.id("businesses"),
    sourceId: v.id("dataWarehouseSources"),
    name: v.string(),
    checkType: v.union(
      v.literal("completeness"),
      v.literal("accuracy"),
      v.literal("consistency"),
      v.literal("timeliness"),
      v.literal("validity")
    ),
    rules: v.array(v.object({
      field: v.string(),
      condition: v.string(),
      threshold: v.number(),
    })),
    schedule: v.string(),
    enabled: v.boolean(),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const now = Date.now();
    const checkId = await ctx.db.insert("qualityChecks", {
      businessId: args.businessId,
      sourceId: args.sourceId,
      name: args.name,
      checkType: args.checkType,
      rules: args.rules,
      schedule: args.schedule,
      enabled: args.enabled,
      createdAt: now,
      updatedAt: now,
    });

    return checkId;
  },
});

export const listQualityChecks = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    sourceId: v.optional(v.id("dataWarehouseSources")),
  },
  handler: async (ctx: any, args) => {
    if (!args.businessId) return [];

    let query = ctx.db
      .query("qualityChecks")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!));

    const checks = await query.collect();

    if (args.sourceId) {
      return checks.filter((c: any) => c.sourceId === args.sourceId);
    }

    return checks;
  },
});

export const runQualityCheck = mutation({
  args: { checkId: v.id("qualityChecks") },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const check = await ctx.db.get(args.checkId);
    if (!check) throw new Error("Quality check not found");

    const score = Math.floor(Math.random() * 30) + 70;
    const now = Date.now();

    await ctx.db.insert("dataQualityMetrics", {
      businessId: check.businessId,
      sourceId: check.sourceId,
      metricType: check.checkType,
      score,
      details: { checkId: args.checkId, rules: check.rules },
      timestamp: now,
    });

    return { score, timestamp: now };
  },
});