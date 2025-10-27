import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Emergency cleanup utility for auth refresh tokens.
 * This mutation deletes old refresh tokens in batches to prevent
 * the "too many reads" error during sign-in.
 * 
 * Run this manually via: npx convex run authCleanup:cleanupOldTokens
 */
export const cleanupOldTokens = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
    olderThanDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 500;
    const olderThanDays = args.olderThanDays ?? 30;
    
    // Calculate cutoff timestamp (30 days ago by default)
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    
    try {
      // Query the authRefreshTokens table (managed by Convex Auth)
      const oldTokens = await ctx.db
        .query("authRefreshTokens")
        .filter((q) => q.lt(q.field("expirationTime"), cutoffTime))
        .take(batchSize);
      
      // Delete tokens in batch
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
