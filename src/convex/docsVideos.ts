import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("docsVideos")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .collect();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("docsVideos").order("desc").collect();
  },
});

export const upsert = mutation({
  args: {
    id: v.optional(v.id("docsVideos")),
    title: v.string(),
    description: v.optional(v.string()),
    videoUrl: v.string(),
    thumbnail: v.optional(v.string()),
    duration: v.optional(v.string()),
    category: v.string(),
    order: v.number(),
    isPublished: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (args.id) {
      await ctx.db.patch(args.id, {
        title: args.title,
        description: args.description,
        videoUrl: args.videoUrl,
        thumbnail: args.thumbnail,
        duration: args.duration,
        category: args.category,
        order: args.order,
        isPublished: args.isPublished,
        updatedAt: Date.now(),
      });
      return args.id;
    } else {
      return await ctx.db.insert("docsVideos", {
        title: args.title,
        description: args.description,
        videoUrl: args.videoUrl,
        thumbnail: args.thumbnail,
        duration: args.duration,
        category: args.category,
        order: args.order,
        isPublished: args.isPublished,
        createdAt: Date.now(),
        updatedAt: Date.now(),
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