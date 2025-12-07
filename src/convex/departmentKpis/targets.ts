import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Set KPI target
 */
export const setKpiTarget = mutation({
  args: {
    businessId: v.id("businesses"),
    department: v.string(),
    kpiName: v.string(),
    targetValue: v.number(),
    unit: v.string(),
    timeframe: v.string(), // "monthly", "quarterly", "yearly"
    ownerId: v.id("users"),
    alertThreshold: v.optional(v.number()), // Percentage variance to trigger alert
  },
  handler: async (ctx, args) => {
    // Check if target already exists
    const existing = await ctx.db
      .query("kpiTargets")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const existingTarget = existing.find(
      (t: any) => t.department === args.department && t.kpiName === args.kpiName
    );

    if (existingTarget) {
      // Update existing target
      await ctx.db.patch(existingTarget._id, {
        targetValue: args.targetValue,
        unit: args.unit,
        timeframe: args.timeframe,
        ownerId: args.ownerId,
        alertThreshold: args.alertThreshold || 10,
        updatedAt: Date.now(),
      } as any);
      return existingTarget._id;
    } else {
      // Create new target
      const targetId = await ctx.db.insert("kpiTargets", {
        businessId: args.businessId,
        department: args.department,
        kpiName: args.kpiName,
        targetValue: args.targetValue,
        unit: args.unit,
        timeframe: args.timeframe,
        ownerId: args.ownerId,
        alertThreshold: args.alertThreshold || 10,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as any);
      return targetId;
    }
  },
});

/**
 * Get all targets for a department
 */
export const getDepartmentTargets = query({
  args: {
    businessId: v.id("businesses"),
    department: v.string(),
  },
  handler: async (ctx, args) => {
    const allTargets = await ctx.db
      .query("kpiTargets")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    return allTargets.filter((t: any) => t.department === args.department);
  },
});

/**
 * Get target vs actual comparison
 */
export const getTargetComparison = query({
  args: {
    businessId: v.id("businesses"),
    department: v.string(),
  },
  handler: async (ctx, args) => {
    const targets = await ctx.db
      .query("kpiTargets")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const deptTargets = targets.filter((t: any) => t.department === args.department);

    const allKpis = await ctx.db
      .query("departmentKpis")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const comparisons = deptTargets.map((target: any) => {
      const kpiValues = allKpis
        .filter((k: any) => k.department === args.department && k.name === target.kpiName)
        .sort((a: any, b: any) => b.recordedAt - a.recordedAt);

      const latestValue = kpiValues[0];
      const actualValue = latestValue ? (latestValue as any).value : 0;
      const variance = ((actualValue - target.targetValue) / target.targetValue) * 100;

      return {
        kpiName: target.kpiName,
        targetValue: target.targetValue,
        actualValue,
        variance,
        unit: target.unit,
        status: variance >= 0 ? "on-track" : variance > -10 ? "at-risk" : "off-track",
        lastUpdated: latestValue ? (latestValue as any).recordedAt : null,
      };
    });

    return comparisons;
  },
});
