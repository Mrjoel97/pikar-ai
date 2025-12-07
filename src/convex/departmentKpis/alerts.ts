import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const createAlert = mutation({
  args: {
    businessId: v.id("businesses"),
    targetId: v.id("kpiTargets"),
    department: v.string(),
    kpiName: v.string(),
    alertType: v.union(
      v.literal("threshold_breach"),
      v.literal("trend_warning"),
      v.literal("target_missed")
    ),
    severity: v.union(
      v.literal("info"),
      v.literal("warning"),
      v.literal("critical")
    ),
    message: v.string(),
    currentValue: v.number(),
    targetValue: v.number(),
  },
  handler: async (ctx, args) => {
    const alertId = await ctx.db.insert("kpiAlerts", {
      businessId: args.businessId,
      targetId: args.targetId,
      department: args.department,
      kpiName: args.kpiName,
      alertType: args.alertType,
      severity: args.severity,
      message: args.message,
      currentValue: args.currentValue,
      targetValue: args.targetValue,
      status: "active",
      createdAt: Date.now(),
    });
    return alertId;
  },
});

export const checkAlerts = mutation({
  args: {
    businessId: v.id("businesses"),
    department: v.string(),
    kpiName: v.string(),
    currentValue: v.number(),
  },
  handler: async (ctx, args) => {
    const target = await ctx.db
      .query("kpiTargets")
      .withIndex("by_department", (q) =>
        q.eq("businessId", args.businessId).eq("department", args.department)
      )
      .filter((q) => q.eq(q.field("kpiName"), args.kpiName))
      .first();

    if (!target) return [];

    const triggeredAlerts = [];
    const threshold = target.alertThreshold;

    // Check if threshold is breached
    if (Math.abs(args.currentValue - target.targetValue) > threshold) {
      const alertId = await ctx.db.insert("kpiAlerts", {
        businessId: args.businessId,
        targetId: target._id,
        department: args.department,
        kpiName: args.kpiName,
        alertType: "threshold_breach",
        severity: args.currentValue < target.targetValue ? "warning" : "info",
        message: `KPI ${args.kpiName} is ${args.currentValue < target.targetValue ? "below" : "above"} target`,
        currentValue: args.currentValue,
        targetValue: target.targetValue,
        status: "active",
        createdAt: Date.now(),
      });

      const alert = await ctx.db.get(alertId);
      if (alert) triggeredAlerts.push(alert);
    }

    return triggeredAlerts;
  },
});

export const getAlerts = query({
  args: {
    businessId: v.id("businesses"),
    department: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let alerts = await ctx.db
      .query("kpiAlerts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .collect();

    if (args.department) {
      alerts = alerts.filter(a => a.department === args.department);
    }

    if (args.status) {
      alerts = alerts.filter(a => a.status === args.status);
    }

    return alerts;
  },
});

export const acknowledgeAlert = mutation({
  args: {
    alertId: v.id("kpiAlerts"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, {
      status: "acknowledged",
    });
  },
});

export const resolveAlert = mutation({
  args: {
    alertId: v.id("kpiAlerts"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, {
      status: "resolved",
    });
  },
});