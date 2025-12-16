import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("docsVideos").collect();
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
      .query("docsVideos")
      .filter((q) => q.eq(q.field("category"), args.tier))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        videoUrl: args.videoUrl,
        thumbnail: args.thumbnail,
        duration: args.duration,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("docsVideos", {
        businessId: undefined as any,
        title: `${args.tier} Demo`,
        videoUrl: args.videoUrl,
        thumbnail: args.thumbnail,
        duration: args.duration,
        category: args.tier,
        order: 0,
        isPublished: true,
        createdAt: now,
        updatedAt: now,
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

// Legacy functions kept for backward compatibility
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
    category: v.string(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("docsVideos", {
      businessId: args.businessId,
      title: args.title,
      description: args.description,
      videoUrl: args.url,
      thumbnail: args.thumbnailUrl,
      duration: args.duration?.toString(),
      category: args.category,
      order: args.order,
      isPublished: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const incrementViews = mutation({
  args: { videoId: v.id("docsVideos") },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoId);
    if (video) {
      // Views tracking removed from schema
      return;
    }
  },
});