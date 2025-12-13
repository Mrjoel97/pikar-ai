import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Advanced audit log search with filters
 */
export const searchAuditLogs = query({
  args: {
    businessId: v.id("businesses"),
    action: v.optional(v.string()),
    entityType: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    searchTerm: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    
    let logs = await ctx.db
      .query("audit_logs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .take(limit);

    // Apply filters
    if (args.action) {
      logs = logs.filter((log) => log.action === args.action);
    }

    if (args.entityType) {
      logs = logs.filter((log) => log.entityType === args.entityType);
    }

    if (args.userId) {
      logs = logs.filter((log) => log.userId === args.userId);
    }

    if (args.startDate) {
      logs = logs.filter((log) => log.timestamp >= args.startDate!);
    }

    if (args.endDate) {
      logs = logs.filter((log) => log.timestamp <= args.endDate!);
    }

    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();
      logs = logs.filter((log) =>
        log.action.toLowerCase().includes(term) ||
        log.entityType.toLowerCase().includes(term) ||
        JSON.stringify(log.details).toLowerCase().includes(term)
      );
    }

    return logs;
  },
});

/**
 * Get audit log statistics with enhanced analytics
 */
export const getAuditStats = query({
  args: {
    businessId: v.id("businesses"),
    timeRange: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const cutoff = args.timeRange ? Date.now() - args.timeRange : 0;

    const logs = await ctx.db
      .query("audit_logs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("createdAt"), cutoff))
      .collect();

    const total = logs.length;
    const byAction = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byEntityType = logs.reduce((acc, log) => {
      acc[log.entityType] = (acc[log.entityType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byUser = logs.reduce((acc, log) => {
      const userId = log.userId || "system";
      acc[userId] = (acc[userId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      byAction: Object.entries(byAction)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      byEntityType: Object.entries(byEntityType)
        .map(([entityType, count]) => ({ entityType, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      byUser: Object.entries(byUser)
        .map(([userId, count]) => ({ userId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };
  },
});

/**
 * Get audit activity timeline (hourly breakdown)
 */
export const getAuditTimeline = query({
  args: {
    businessId: v.id("businesses"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysBack = args.days || 7;
    const cutoff = Date.now() - daysBack * 24 * 60 * 60 * 1000;

    const logs = await ctx.db
      .query("audit_logs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("createdAt"), cutoff))
      .collect();

    // Group by hour
    const timeline: Record<string, number> = {};
    logs.forEach((log) => {
      const hour = new Date(log.createdAt).toISOString().slice(0, 13);
      timeline[hour] = (timeline[hour] || 0) + 1;
    });

    return Object.entries(timeline)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  },
});

/**
 * Detect anomalies in audit patterns
 */
export const detectAnomalies = query({
  args: {
    businessId: v.id("businesses"),
    threshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const threshold = args.threshold || 2; // Standard deviations
    const last7Days = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const logs = await ctx.db
      .query("audit_logs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("createdAt"), last7Days))
      .collect();

    // Calculate daily activity
    const dailyActivity: Record<string, number> = {};
    logs.forEach((log) => {
      const day = new Date(log.createdAt).toISOString().slice(0, 10);
      dailyActivity[day] = (dailyActivity[day] || 0) + 1;
    });

    const counts = Object.values(dailyActivity);
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / counts.length;
    const stdDev = Math.sqrt(variance);

    const anomalies = Object.entries(dailyActivity)
      .filter(([, count]) => Math.abs(count - mean) > threshold * stdDev)
      .map(([date, count]) => ({
        date,
        count,
        deviation: ((count - mean) / stdDev).toFixed(2),
        type: count > mean ? "spike" : "drop",
      }));

    return {
      anomalies,
      baseline: { mean: Math.round(mean), stdDev: Math.round(stdDev) },
    };
  },
});

/**
 * Get entity audit trail
 */
export const getEntityAuditTrail = query({
  args: {
    businessId: v.id("businesses"),
    entityType: v.string(),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("audit_logs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.eq(q.field("entityType"), args.entityType))
      .filter((q) => q.eq(q.field("entityId"), args.entityId))
      .order("desc")
      .take(100);

    return logs;
  },
});
