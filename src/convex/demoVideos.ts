import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getDemoVideos = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("docsVideos").collect();
  },
});

export const addDemoVideo = mutation({
  args: {
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.optional(v.string()),
    url: v.string(),
    thumbnailUrl: v.optional(v.string()),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("docsVideos", {
      businessId: args.businessId,
      title: args.title,
      description: args.description,
      url: args.url,
      thumbnailUrl: args.thumbnailUrl,
      duration: args.duration,
      isPublished: true,
      createdAt: Date.now(),
      // category: args.category, // Removed
    });
  },
});

export const incrementViews = mutation({
  args: { videoId: v.id("docsVideos") },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoId);
    if (video) {
      // await ctx.db.patch(args.videoId, {
      //   views: (video.views || 0) + 1, // Removed
      // });
    }
  },
});