import { v } from "convex/values";
import { query, mutation, internalQuery, internalMutation } from "./_generated/server";

export const createPost = mutation({
  args: {
    businessId: v.id("businesses"),
    content: v.string(),
    platforms: v.array(v.union(v.literal("twitter"), v.literal("linkedin"), v.literal("facebook"), v.literal("instagram"))),
    scheduledAt: v.optional(v.number()),
    mediaUrls: v.optional(v.array(v.id("_storage"))),
    campaignId: v.optional(v.id("experiments")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();
    
    if (!user) {
      throw new Error("User not found");
    }

    const postId = await ctx.db.insert("socialPosts", {
      businessId: args.businessId,
      content: args.content,
      platform: args.platforms[0], // Use first platform as primary
      platforms: args.platforms,
      status: args.scheduledAt ? "scheduled" : "draft",
      scheduledAt: args.scheduledAt,
      mediaUrls: args.mediaUrls?.map(id => id.toString()) || [],
      characterCount: args.content.length,
      createdBy: user._id,
      createdAt: Date.now(),
      campaignId: args.campaignId as any,
    });

    return postId;
  },
});

export const listScheduledPosts = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) return [];

    let query = ctx.db
      .query("socialPosts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const posts = await query
      .order("desc")
      .take(args.limit || 20);

    return posts;
  },
});

export const getUpcomingPosts = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) return [];

    const now = Date.now();
    const posts = await ctx.db
      .query("socialPosts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .filter((q) => 
        q.and(
          q.eq(q.field("status"), "scheduled"),
          q.gte(q.field("scheduledAt"), now)
        )
      )
      .order("asc")
      .take(args.limit || 10);

    return posts;
  },
});

export const getPostById = internalQuery({
  args: { postId: v.id("socialPosts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.postId);
  },
});

export const updatePostStatus = internalMutation({
  args: {
    postId: v.id("socialPosts"),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("posting"),
      v.literal("posted"),
      v.literal("failed")
    ),
    publishedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      status: args.status,
    };
    
    if (args.publishedAt !== undefined) {
      updates.publishedAt = args.publishedAt;
    }
    
    await ctx.db.patch(args.postId, updates);
  },
});