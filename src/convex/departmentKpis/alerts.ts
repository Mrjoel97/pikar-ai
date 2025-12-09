import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Get active alerts for a department
 */
export const getAlerts = query({
  args: {
    businessId: v.id("businesses"),
    department: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("acknowledged"), v.literal("resolved"))),
    severity: v.optional(v.union(v.literal("info"), v.literal("warning"), v.literal("critical"))),
  },
  handler: async (ctx, args) => {
    let alerts = await ctx.db
      .query("kpiAlerts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .take(100);

    if (args.department) {
      alerts = alerts.filter((a) => a.department === args.department);
    }

    if (args.status) {
      alerts = alerts.filter((a) => a.status === args.status);
    }

    if (args.severity) {
      alerts = alerts.filter((a) => a.severity === args.severity);
    }

    return alerts;
  },
});

/**
 * Acknowledge an alert
 */
export const acknowledgeAlert = mutation({
  args: {
    alertId: v.id("kpiAlerts"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, {
      status: "acknowledged",
      acknowledgedBy: args.userId,
      acknowledgedAt: Date.now(),
    });
    return args.alertId;
  },
});

/**
 * Resolve an alert
 */
export const resolveAlert = mutation({
  args: {
    alertId: v.id("kpiAlerts"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, {
      status: "resolved",
      resolvedAt: Date.now(),
    });
    return args.alertId;
  },
});

/**
 * Get alert statistics
 */
export const getAlertStats = query({
  args: {
    businessId: v.id("businesses"),
    department: v.optional(v.string()),
    timeRange: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const cutoff = args.timeRange ? Date.now() - args.timeRange : 0;

    let alerts = await ctx.db
      .query("kpiAlerts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("createdAt"), cutoff))
      .collect();

    if (args.department) {
      alerts = alerts.filter((a) => a.department === args.department);
    }

    const total = alerts.length;
    const active = alerts.filter((a) => a.status === "active").length;
    const acknowledged = alerts.filter((a) => a.status === "acknowledged").length;
    const resolved = alerts.filter((a) => a.status === "resolved").length;
    const critical = alerts.filter((a) => a.severity === "critical").length;
    const warning = alerts.filter((a) => a.severity === "warning").length;

    return {
      total,
      active,
      acknowledged,
      resolved,
      critical,
      warning,
      byDepartment: alerts.reduce((acc, a) => {
        acc[a.department] = (acc[a.department] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  },
});