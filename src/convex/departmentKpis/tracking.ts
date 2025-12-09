import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Track a KPI value for a department
 */
export const trackKpi = mutation({
  args: {
    businessId: v.id("businesses"),
    department: v.string(),
    name: v.string(),
    value: v.number(),
    unit: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Get previous value to calculate trend
    const previous = await ctx.db
      .query("departmentKpis")
      .withIndex("by_department", (q) =>
        q.eq("businessId", args.businessId).eq("department", args.department)
      )
      .filter((q) => q.eq(q.field("name"), args.name))
      .order("desc")
      .first();

    const trend = previous ? ((args.value - previous.value) / previous.value) * 100 : 0;

    const kpiId = await ctx.db.insert("departmentKpis", {
      businessId: args.businessId,
      department: args.department,
      name: args.name,
      value: args.value,
      unit: args.unit,
      trend,
      timestamp: Date.now(),
      metadata: args.metadata,
    });

    // Check if this triggers any alerts
    const targets = await ctx.db
      .query("kpiTargets")
      .withIndex("by_department", (q) =>
        q.eq("businessId", args.businessId).eq("department", args.department)
      )
      .filter((q) => q.eq(q.field("name"), args.name))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    for (const target of targets) {
      const deviation = Math.abs((args.value - target.targetValue) / target.targetValue) * 100;
      
      if (deviation >= target.alertThreshold) {
        await ctx.db.insert("kpiAlerts", {
          businessId: args.businessId,
          targetId: target._id,
          department: args.department,
          kpiName: args.name,
          alertType: args.value < target.targetValue ? "target_missed" : "threshold_breach",
          severity: deviation >= 20 ? "critical" : deviation >= 10 ? "warning" : "info",
          message: `${args.name} is ${deviation.toFixed(1)}% ${args.value < target.targetValue ? "below" : "above"} target`,
          currentValue: args.value,
          targetValue: target.targetValue,
          status: "active",
          createdAt: Date.now(),
        });
      }
    }

    return kpiId;
  },
});

/**
 * Get KPI history for a department
 */
export const getKpiHistory = query({
  args: {
    businessId: v.id("businesses"),
    department: v.string(),
    name: v.optional(v.string()),
    timeRange: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const cutoff = args.timeRange ? Date.now() - args.timeRange : 0;

    let kpis = await ctx.db
      .query("departmentKpis")
      .withIndex("by_department", (q) =>
        q.eq("businessId", args.businessId).eq("department", args.department)
      )
      .filter((q) => q.gte(q.field("timestamp"), cutoff))
      .order("desc")
      .take(100);

    if (args.name) {
      kpis = kpis.filter((k) => k.name === args.name);
    }

    return kpis;
  },
});

/**
 * Get current KPI values for a department
 */
export const getCurrentKpis = query({
  args: {
    businessId: v.id("businesses"),
    department: v.string(),
  },
  handler: async (ctx, args) => {
    const allKpis = await ctx.db
      .query("departmentKpis")
      .withIndex("by_department", (q) =>
        q.eq("businessId", args.businessId).eq("department", args.department)
      )
      .order("desc")
      .take(200);

    // Get the latest value for each unique KPI name
    const latestKpis = new Map<string, any>();
    for (const kpi of allKpis) {
      if (!latestKpis.has(kpi.name)) {
        latestKpis.set(kpi.name, kpi);
      }
    }

    return Array.from(latestKpis.values());
  },
});

/**
 * Batch track multiple KPIs
 */
export const batchTrackKpis = mutation({
  args: {
    businessId: v.id("businesses"),
    department: v.string(),
    kpis: v.array(
      v.object({
        name: v.string(),
        value: v.number(),
        unit: v.string(),
        metadata: v.optional(v.any()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids: Id<"departmentKpis">[] = [];

    for (const kpi of args.kpis) {
      const previous = await ctx.db
        .query("departmentKpis")
        .withIndex("by_department", (q) =>
          q.eq("businessId", args.businessId).eq("department", args.department)
        )
        .filter((q) => q.eq(q.field("name"), kpi.name))
        .order("desc")
        .first();

      const trend = previous ? ((kpi.value - previous.value) / previous.value) * 100 : 0;

      const id = await ctx.db.insert("departmentKpis", {
        businessId: args.businessId,
        department: args.department,
        name: kpi.name,
        value: kpi.value,
        unit: kpi.unit,
        trend,
        timestamp: Date.now(),
        metadata: kpi.metadata,
      });

      ids.push(id);
    }

    return ids;
  },
});