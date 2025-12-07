import { v } from "convex/values";
import { query, mutation } from "../_generated/server";

/**
 * Get active KPI alerts for a department
 */
export const getDepartmentAlerts = query({
  args: {
    businessId: v.id("businesses"),
    department: v.string(),
  },
  handler: async (ctx, args) => {
    const allNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.eq(q.field("type"), "system_alert"))
      .collect();

    const kpiAlerts = allNotifications.filter(
      (n) => n.data?.department === args.department && n.data?.kpiName
    );

    return kpiAlerts.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Acknowledge KPI alert
 */
export const acknowledgeAlert = mutation({
  args: {
    alertId: v.id("notifications"),
    userId: v.id("users"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, {
      isRead: true,
      readAt: Date.now(),
    });

    const alert = await ctx.db.get(args.alertId);
    if (alert) {
      await ctx.db.insert("audit_logs", {
        businessId: alert.businessId,
        userId: args.userId,
        action: "kpi_alert_acknowledged",
        entityType: "notification",
        entityId: args.alertId,
        details: {
          kpiName: alert.data?.kpiName,
          department: alert.data?.department,
          notes: args.notes,
        },
        createdAt: Date.now(),
      });
    }

    return args.alertId;
  },
});

/**
 * Get alert summary for all departments
 */
export const getAlertSummary = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const allNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.eq(q.field("type"), "system_alert"))
      .collect();

    const kpiAlerts = allNotifications.filter((n) => n.data?.kpiName);

    const byDepartment: Record<string, { total: number; unread: number; high: number }> = {};

    kpiAlerts.forEach((alert) => {
      const dept = alert.data?.department || "Unknown";
      if (!byDepartment[dept]) {
        byDepartment[dept] = { total: 0, unread: 0, high: 0 };
      }
      byDepartment[dept].total++;
      if (!alert.isRead) byDepartment[dept].unread++;
      if (alert.priority === "high") byDepartment[dept].high++;
    });

    return {
      totalAlerts: kpiAlerts.length,
      unreadAlerts: kpiAlerts.filter((a) => !a.isRead).length,
      highPriorityAlerts: kpiAlerts.filter((a) => a.priority === "high").length,
      byDepartment,
    };
  },
});
