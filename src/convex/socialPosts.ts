import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Create a new social post
 */
export const createSocialPost = mutation({
  args: {
    businessId: v.id("businesses"),
    platforms: v.array(v.union(v.literal("twitter"), v.literal("linkedin"), v.literal("facebook"))),
    content: v.string(),
    mediaUrls: v.optional(v.array(v.id("_storage"))),
    scheduledAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("[ERR_NOT_AUTHENTICATED] You must be signed in.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) {
      throw new Error("[ERR_USER_NOT_FOUND] User not found.");
    }

    const business = await ctx.db.get(args.businessId);
    if (!business) {
      throw new Error("[ERR_BUSINESS_NOT_FOUND] Business not found.");
    }
    if (business.ownerId !== user._id && !business.teamMembers.includes(user._id)) {
      throw new Error("[ERR_FORBIDDEN] Not authorized.");
    }

    // Check entitlements (social post limits)
    // TODO: Add specific social post entitlement check
    // For now, we'll add this to the entitlements module

    const characterCount = args.content.length;
    const status = args.scheduledAt ? "scheduled" : "draft";

    const postId = await ctx.db.insert("socialPosts", {
      businessId: args.businessId,
      createdBy: user._id,
      platforms: args.platforms,
      content: args.content,
      mediaUrls: args.mediaUrls,
      characterCount,
      scheduledAt: args.scheduledAt,
      status,
    });

    await ctx.runMutation(internal.audit.write, {
      businessId: args.businessId,
      action: "social_post_created",
      entityType: "social_post",
      entityId: postId,
      details: {
        platforms: args.platforms,
        status,
        scheduledAt: args.scheduledAt,
      },
    });

    return postId;
  },
});

/**
 * Update an existing social post
 */
export const updateSocialPost = mutation({
  args: {
    postId: v.id("socialPosts"),
    content: v.optional(v.string()),
    platforms: v.optional(v.array(v.union(v.literal("twitter"), v.literal("linkedin"), v.literal("facebook")))),
    mediaUrls: v.optional(v.array(v.id("_storage"))),
    scheduledAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("[ERR_NOT_AUTHENTICATED] You must be signed in.");
    }

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("[ERR_POST_NOT_FOUND] Post not found.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) {
      throw new Error("[ERR_USER_NOT_FOUND] User not found.");
    }

    const business = await ctx.db.get(post.businessId);
    if (!business) {
      throw new Error("[ERR_BUSINESS_NOT_FOUND] Business not found.");
    }
    if (business.ownerId !== user._id && !business.teamMembers.includes(user._id)) {
      throw new Error("[ERR_FORBIDDEN] Not authorized.");
    }

    // Can't edit posted or posting posts
    if (post.status === "posted" || post.status === "posting") {
      throw new Error("[ERR_INVALID_STATUS] Cannot edit posted or posting posts.");
    }

    const updates: any = {};
    if (args.content !== undefined) {
      updates.content = args.content;
      updates.characterCount = args.content.length;
    }
    if (args.platforms !== undefined) updates.platforms = args.platforms;
    if (args.mediaUrls !== undefined) updates.mediaUrls = args.mediaUrls;
    if (args.scheduledAt !== undefined) {
      updates.scheduledAt = args.scheduledAt;
      updates.status = args.scheduledAt ? "scheduled" : "draft";
    }

    await ctx.db.patch(args.postId, updates);

    await ctx.runMutation(internal.audit.write, {
      businessId: post.businessId,
      action: "social_post_updated",
      entityType: "social_post",
      entityId: args.postId,
      details: updates,
    });

    return true;
  },
});

/**
 * Delete a social post
 */
export const deleteSocialPost = mutation({
  args: {
    postId: v.id("socialPosts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("[ERR_NOT_AUTHENTICATED] You must be signed in.");
    }

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("[ERR_POST_NOT_FOUND] Post not found.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) {
      throw new Error("[ERR_USER_NOT_FOUND] User not found.");
    }

    const business = await ctx.db.get(post.businessId);
    if (!business) {
      throw new Error("[ERR_BUSINESS_NOT_FOUND] Business not found.");
    }
    if (business.ownerId !== user._id && !business.teamMembers.includes(user._id)) {
      throw new Error("[ERR_FORBIDDEN] Not authorized.");
    }

    await ctx.db.delete(args.postId);

    await ctx.runMutation(internal.audit.write, {
      businessId: post.businessId,
      action: "social_post_deleted",
      entityType: "social_post",
      entityId: args.postId,
      details: { platforms: post.platforms },
    });

    return true;
  },
});

/**
 * Update post status (internal use for cron job)
 */
export const updatePostStatus = mutation({
  args: {
    postId: v.id("socialPosts"),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("posting"),
      v.literal("posted"),
      v.literal("failed")
    ),
    postedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    postIds: v.optional(v.object({
      twitter: v.optional(v.string()),
      linkedin: v.optional(v.string()),
      facebook: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("[ERR_POST_NOT_FOUND] Post not found.");
    }

    await ctx.db.patch(args.postId, {
      status: args.status,
      postedAt: args.postedAt,
      errorMessage: args.errorMessage,
      postIds: args.postIds,
    });

    return true;
  },
});

/**
 * List scheduled posts with filters
 */
export const listScheduledPosts = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    platform: v.optional(v.union(v.literal("twitter"), v.literal("linkedin"), v.literal("facebook"))),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("posting"),
      v.literal("posted"),
      v.literal("failed")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Guest-safe: return empty array if no businessId
    if (!args.businessId) {
      return [];
    }

    const limit = Math.min(args.limit ?? 50, 200);

    let posts = await ctx.db
      .query("socialPosts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .order("desc")
      .take(limit * 2); // Take more for filtering

    // Filter by status if provided
    if (args.status) {
      posts = posts.filter((p) => p.status === args.status);
    }

    // Filter by platform if provided
    if (args.platform) {
      posts = posts.filter((p) => p.platforms.includes(args.platform!));
    }

    return posts.slice(0, limit);
  },
});

/**
 * Get upcoming posts (next N posts)
 */
export const getUpcomingPosts = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Guest-safe: return empty array if no businessId
    if (!args.businessId) {
      return [];
    }

    const limit = Math.min(args.limit ?? 10, 50);
    const now = Date.now();

    const posts = await ctx.db
      .query("socialPosts")
      .withIndex("by_business_and_status", (q) =>
        q.eq("businessId", args.businessId!).eq("status", "scheduled")
      )
      .collect();

    // Filter for future posts and sort by scheduledAt
    const upcoming = posts
      .filter((p) => p.scheduledAt && p.scheduledAt > now)
      .sort((a, b) => (a.scheduledAt ?? 0) - (b.scheduledAt ?? 0))
      .slice(0, limit);

    return upcoming;
  },
});

/**
 * Get post by ID
 */
export const getPostById = query({
  args: {
    postId: v.id("socialPosts"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    return post;
  },
});

/**
 * List due posts for cron processing (internal)
 */
export const listDuePosts = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const posts = await ctx.db
      .query("socialPosts")
      .withIndex("by_status_and_scheduled", (q) =>
        q.eq("status", "scheduled")
      )
      .collect();

    // Filter for posts due now
    const duePosts = posts.filter((p) => p.scheduledAt && p.scheduledAt <= now);

    return duePosts;
  },
});
