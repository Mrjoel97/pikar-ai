import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("demoVideos").collect();
  },
});

export const getByTier = query({
  args: { tier: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("demoVideos")
      .filter((q) => q.eq(q.field("tier"), args.tier))
      .first();
  },
});

export const upsert = mutation({
  args: {
    tier: v.string(),
    videoUrl: v.string(),
    thumbnail: v.optional(v.string()),
    duration: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("demoVideos")
      .filter((q) => q.eq(q.field("tier"), args.tier))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        videoUrl: args.videoUrl,
        thumbnail: args.thumbnail,
        duration: args.duration,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("demoVideos", {
        tier: args.tier,
        videoUrl: args.videoUrl,
        thumbnail: args.thumbnail,
        duration: args.duration,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

export const remove = mutation({
  args: { id: v.id("demoVideos") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
