import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Record KPI value
 */
export const recordKpiValue = mutation({
  args: {
    businessId: v.id("businesses"),
    department: v.string(),
    kpiName: v.string(),
    value: v.number(),
    unit: v.string(),
    period: v.string(), // "daily", "weekly", "monthly", "quarterly"
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const metricId = await ctx.db.insert("departmentKpis", {
      businessId: args.businessId,
      department: args.department,
      name: args.kpiName,
      value: args.value,
      unit: args.unit,
      period: args.period,
      recordedAt: Date.now(),
      createdAt: Date.now(),
    });

    // Check if there's a target and create alert if needed
    const targets = await ctx.db
      .query("kpiTargets")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const target = targets.find(
      (t: any) => t.department === args.department && t.kpiName === args.kpiName
    );

    if (target) {
      const variance = ((args.value - (target as any).targetValue) / (target as any).targetValue) * 100;
      
      // Create alert if variance exceeds threshold
      if (Math.abs(variance) > ((target as any).alertThreshold || 10)) {
        await ctx.db.insert("notifications", {
          businessId: args.businessId,
          userId: (target as any).ownerId,
          type: "system_alert",
          title: `KPI Alert: ${args.kpiName}`,
          message: `${args.department} KPI "${args.kpiName}" is ${variance > 0 ? "above" : "below"} target by ${Math.abs(variance).toFixed(1)}%`,
          data: {
            department: args.department,
            kpiName: args.kpiName,
            value: args.value,
            target: (target as any).targetValue,
            variance,
          },
          isRead: false,
          priority: Math.abs(variance) > 20 ? "high" : "medium",
          createdAt: Date.now(),
        });
      }
    }

    return metricId;
  },
});

/**
 * Get KPI history for a department
 */
export const getKpiHistory = query({
  args: {
    businessId: v.id("businesses"),
    department: v.string(),
    kpiName: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const allKpis = await ctx.db
      .query("departmentKpis")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    let filtered = allKpis.filter((k: any) => k.department === args.department);

    if (args.kpiName) {
      filtered = filtered.filter((k: any) => k.name === args.kpiName);
    }

    if (args.startDate) {
      filtered = filtered.filter((k: any) => k.recordedAt >= args.startDate!);
    }

    if (args.endDate) {
      filtered = filtered.filter((k: any) => k.recordedAt <= args.endDate!);
    }

    return filtered.sort((a: any, b: any) => a.recordedAt - b.recordedAt);
  },
});

/**
 * Get department KPI dashboard data
 */
export const getDepartmentDashboard = query({
  args: {
    businessId: v.id("businesses"),
    department: v.string(),
  },
  handler: async (ctx, args) => {
    const allKpis = await ctx.db
      .query("departmentKpis")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const deptKpis = allKpis.filter((k: any) => k.department === args.department);

    // Get unique KPI names
    const kpiNames = [...new Set(deptKpis.map((k: any) => k.name))];

    // Get latest value for each KPI
    const latestKpis = kpiNames.map((name) => {
      const kpiValues = deptKpis
        .filter((k: any) => k.name === name)
        .sort((a: any, b: any) => b.recordedAt - a.recordedAt);

      const latest = kpiValues[0];
      const previous = kpiValues[1];

      let trend = 0;
      if (previous) {
        trend = (((latest as any).value - (previous as any).value) / (previous as any).value) * 100;
      }

      return {
        name,
        value: (latest as any).value,
        unit: (latest as any).unit,
        trend,
        recordedAt: (latest as any).recordedAt,
      };
    });

    return {
      department: args.department,
      kpis: latestKpis,
      totalKpis: kpiNames.length,
      lastUpdated: Math.max(...deptKpis.map((k: any) => k.recordedAt)),
    };
  },
});
