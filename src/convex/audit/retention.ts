import { v } from "convex/values";
import { mutation, query, internalMutation } from "../_generated/server";

/**
 * Set audit log retention policy
 */
export const setRetentionPolicy = mutation({
  args: {
    businessId: v.id("businesses"),
    retentionDays: v.number(),
    archiveEnabled: v.boolean(),
    archiveLocation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Store retention policy (would need a retentionPolicies table in schema)
    return {
      businessId: args.businessId,
      retentionDays: args.retentionDays,
      archiveEnabled: args.archiveEnabled,
      archiveLocation: args.archiveLocation,
      updatedAt: Date.now(),
    };
  },
});

/**
 * Get retention policy
 */
export const getRetentionPolicy = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    // Default retention policy
    return {
      businessId: args.businessId,
      retentionDays: 90,
      archiveEnabled: false,
      archiveLocation: undefined,
    };
  },
});

/**
 * Clean up old audit logs based on retention policy
 */
export const cleanupOldLogs = internalMutation({
  args: {
    businessId: v.id("businesses"),
    retentionDays: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoffDate = Date.now() - args.retentionDays * 24 * 60 * 60 * 1000;

    const oldLogs = await ctx.db
      .query("audit_logs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.lt(q.field("timestamp"), cutoffDate))
      .take(100);

    let deletedCount = 0;
    for (const log of oldLogs) {
      await ctx.db.delete(log._id);
      deletedCount++;
    }

    return {
      deletedCount,
      cutoffDate,
    };
  },
});
