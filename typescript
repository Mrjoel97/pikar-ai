import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const videos = await ctx.db.query("docsVideos").collect();
    // Filter for videos that have a tier assigned (landing page demos)
    return videos.filter((v: any) => v.tier);
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
    const videos = await ctx.db.query("docsVideos").collect();
    const existing = videos.find((v: any) => v.tier === args.tier);
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        videoUrl: args.videoUrl,
        thumbnail: args.thumbnail,
        duration: args.duration,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("docsVideos", {
        tier: args.tier,
        videoUrl: args.videoUrl,
        thumbnail: args.thumbnail,
        duration: args.duration,
        isPublished: true,
        createdAt: now,
        updatedAt: now,
        title: `Demo Video - ${args.tier}`,
        category: "landing_demo",
      });
    }
  },
});

export const remove = mutation({
  args: { id: v.id("docsVideos") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});