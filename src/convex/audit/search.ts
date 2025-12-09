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
 * Get audit log statistics
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
      .filter((q) => q.gte(q.field("timestamp"), cutoff))
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
