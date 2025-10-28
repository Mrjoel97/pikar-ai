import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Optimized cleanup utility for auth refresh tokens.
 * Uses indexed queries to efficiently delete only tokens older than 7 days.
 * Processes in batches of 500 to stay under read limits.
 * Automatically schedules itself to continue if more tokens need deletion.
 */
export const cleanupOldRefreshTokens = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoffTime = Date.now() - SEVEN_DAYS_MS;
    
    try {
      // Query only tokens older than 7 days using the index
      const oldTokens = await ctx.db
        .query("authRefreshTokens")
        .withIndex("by_creation_time", (q) =>
          q.lt("_creationTime", cutoffTime)
        )
        .take(500); // Process 500 at a time
      
      // Delete the old tokens
      await Promise.all(
        oldTokens.map((token) => ctx.db.delete(token._id))
      );
      
      const deletedCount = oldTokens.length;
      
      // If we deleted 500, there might be more - schedule another run
      if (deletedCount === 500) {
        await ctx.scheduler.runAfter(0, internal.authCleanup.cleanupOldRefreshTokens, {});
      }
      
      return {
        success: true,
        deletedCount,
        message: `Deleted ${deletedCount} expired refresh tokens older than 7 days`,
        hasMore: deletedCount === 500,
      };
    } catch (error) {
      return {
        success: false,
        deletedCount: 0,
        message: `Error during cleanup: ${error}`,
        hasMore: false,
      };
    }
  },
});

/**
 * Legacy cleanup with configurable parameters (kept for backward compatibility)
 */
export const cleanupOldTokens = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
    olderThanDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 500;
    const olderThanDays = args.olderThanDays ?? 7;
    
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    
    try {
      const oldTokens = await ctx.db
        .query("authRefreshTokens")
        .withIndex("by_creation_time", (q) =>
          q.lt("_creationTime", cutoffTime)
        )
        .take(batchSize);
      
      let deletedCount = 0;
      for (const token of oldTokens) {
        await ctx.db.delete(token._id);
        deletedCount++;
      }
      
      return {
        success: true,
        deletedCount,
        message: `Deleted ${deletedCount} expired refresh tokens older than ${olderThanDays} days`,
        hasMore: oldTokens.length === batchSize,
      };
    } catch (error) {
      return {
        success: false,
        deletedCount: 0,
        message: `Error during cleanup: ${error}`,
        hasMore: false,
      };
    }
  },
});

/**
 * Aggressive cleanup - deletes ALL refresh tokens.
 * WARNING: This will log out all users.
 * Only use in emergency situations.
 */
export const cleanupAllTokens = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 1000;
    
    try {
      const tokens = await ctx.db
        .query("authRefreshTokens")
        .take(batchSize);
      
      let deletedCount = 0;
      for (const token of tokens) {
        await ctx.db.delete(token._id);
        deletedCount++;
      }
      
      return {
        success: true,
        deletedCount,
        message: `Deleted ${deletedCount} refresh tokens (all users will need to re-authenticate)`,
        hasMore: tokens.length === batchSize,
      };
    } catch (error) {
      return {
        success: false,
        deletedCount: 0,
        message: `Error during cleanup: ${error}`,
        hasMore: false,
      };
    }
  },
});