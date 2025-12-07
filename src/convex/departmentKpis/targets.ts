import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const setTarget = mutation({
  args: {
    businessId: v.id("businesses"),
    department: v.string(),
    kpiName: v.string(),
    targetValue: v.number(),
    unit: v.string(),
    timeframe: v.string(),
    ownerId: v.id("users"),
    alertThreshold: v.number(),
  },
  handler: async (ctx, args) => {
    const targetId = await ctx.db.insert("kpiTargets", {
      businessId: args.businessId,
      department: args.department,
      kpiName: args.kpiName,
      targetValue: args.targetValue,
      unit: args.unit,
      timeframe: args.timeframe,
      ownerId: args.ownerId,
      alertThreshold: args.alertThreshold,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return targetId;
  },
});

export const getTargets = query({
  args: {
    businessId: v.id("businesses"),
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let targets = await ctx.db
      .query("kpiTargets")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    if (args.department) {
      targets = targets.filter(t => t.department === args.department);
    }

    return targets;
  },
});

export const updateTarget = mutation({
  args: {
    targetId: v.id("kpiTargets"),
    targetValue: v.optional(v.number()),
    alertThreshold: v.optional(v.number()),
    timeframe: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      updatedAt: Date.now(),
    };
    
    if (args.targetValue !== undefined) updates.targetValue = args.targetValue;
    if (args.alertThreshold !== undefined) updates.alertThreshold = args.alertThreshold;
    if (args.timeframe) updates.timeframe = args.timeframe;
    
    await ctx.db.patch(args.targetId, updates);
  },
});

export const getTargetProgress = query({
  args: {
    businessId: v.id("businesses"),
    department: v.string(),
    kpiName: v.string(),
  },
  handler: async (ctx, args) => {
    const target = await ctx.db
      .query("kpiTargets")
      .withIndex("by_department", (q) =>
        q.eq("businessId", args.businessId).eq("department", args.department)
      )
      .filter((q) => q.eq(q.field("kpiName"), args.kpiName))
      .first();

    if (!target) return null;

    const latestKpi = await ctx.db
      .query("departmentKpis")
      .withIndex("by_department", (q) =>
        q.eq("businessId", args.businessId).eq("department", args.department)
      )
      .filter((q) => q.eq(q.field("name"), args.kpiName))
      .order("desc")
      .first();

    if (!latestKpi) return { target, currentValue: 0, progress: 0 };

    const progress = (latestKpi.value / target.targetValue) * 100;

    return {
      target,
      currentValue: latestKpi.value,
      progress: Math.min(progress, 100),
    };
  },
});