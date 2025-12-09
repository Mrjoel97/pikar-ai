import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Set a KPI target for a department
 */
export const setTarget = mutation({
  args: {
    businessId: v.id("businesses"),
    department: v.string(),
    name: v.string(),
    targetValue: v.number(),
    unit: v.string(),
    timeframe: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("yearly")),
    ownerId: v.id("users"),
    alertThreshold: v.number(),
  },
  handler: async (ctx, args) => {
    const targetId = await ctx.db.insert("kpiTargets", {
      businessId: args.businessId,
      department: args.department,
      name: args.name,
      targetValue: args.targetValue,
      unit: args.unit,
      timeframe: args.timeframe,
      ownerId: args.ownerId,
      alertThreshold: args.alertThreshold,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return targetId;
  },
});

/**
 * Update a KPI target
 */
export const updateTarget = mutation({
  args: {
    targetId: v.id("kpiTargets"),
    targetValue: v.optional(v.number()),
    alertThreshold: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("archived"))),
  },
  handler: async (ctx, args) => {
    const updates: any = { updatedAt: Date.now() };
    
    if (args.targetValue !== undefined) updates.targetValue = args.targetValue;
    if (args.alertThreshold !== undefined) updates.alertThreshold = args.alertThreshold;
    if (args.status !== undefined) updates.status = args.status;

    await ctx.db.patch(args.targetId, updates);
    return args.targetId;
  },
});

/**
 * Get targets for a department
 */
export const getTargets = query({
  args: {
    businessId: v.id("businesses"),
    department: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("archived"))),
  },
  handler: async (ctx, args) => {
    let targets = await ctx.db
      .query("kpiTargets")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    if (args.department) {
      targets = targets.filter((t) => t.department === args.department);
    }

    if (args.status) {
      targets = targets.filter((t) => t.status === args.status);
    }

    return targets;
  },
});

/**
 * Get target progress
 */
export const getTargetProgress = query({
  args: {
    targetId: v.id("kpiTargets"),
  },
  handler: async (ctx, args) => {
    const target = await ctx.db.get(args.targetId);
    if (!target) return null;

    // Get latest KPI value
    const latestKpi = await ctx.db
      .query("departmentKpis")
      .withIndex("by_department", (q) =>
        q.eq("businessId", target.businessId).eq("department", target.department)
      )
      .filter((q) => q.eq(q.field("name"), target.name))
      .order("desc")
      .first();

    if (!latestKpi) {
      return {
        target,
        currentValue: 0,
        progress: 0,
        status: "no_data" as const,
      };
    }

    const progress = (latestKpi.value / target.targetValue) * 100;
    const status = progress >= 100 ? "achieved" : progress >= 80 ? "on_track" : progress >= 50 ? "at_risk" : "behind";

    return {
      target,
      currentValue: latestKpi.value,
      progress,
      status,
      lastUpdated: latestKpi.timestamp,
    };
  },
});

/**
 * Archive a target
 */
export const archiveTarget = mutation({
  args: {
    targetId: v.id("kpiTargets"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.targetId, {
      status: "archived",
      updatedAt: Date.now(),
    });
    return args.targetId;
  },
});