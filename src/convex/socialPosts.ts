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
 * Get monthly post count for a business
 */
export const getMonthlyPostCount = query({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    // Guest-safe: return 0 if no businessId
    if (!args.businessId) {
      return 0;
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const posts = await ctx.db
      .query("socialPosts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .filter((q) => q.gte(q.field("_creationTime"), monthStart))
      .collect();

    return posts.length;
  },
});

/**
 * Get connected platforms count for a business
 */
export const getConnectedPlatformsCount = query({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    // Guest-safe: return 0 if no businessId
    if (!args.businessId) {
      return 0;
    }

    const connectedAccounts = await ctx.db
      .query("socialAccounts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return connectedAccounts.length;
  },
});

/**
 * Get scheduled posts count for a business
 */
export const getScheduledPostsCount = query({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    // Guest-safe: return 0 if no businessId
    if (!args.businessId) {
      return 0;
    }

    const scheduledPosts = await ctx.db
      .query("socialPosts")
      .withIndex("by_business_and_status", (q) =>
        q.eq("businessId", args.businessId!).eq("status", "scheduled")
      )
      .collect();

    return scheduledPosts.length;
  },
});

/**
 * Get AI generations count for current month
 */
export const getAIGenerationsCount = query({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    // Guest-safe: return 0 if no businessId
    if (!args.businessId) {
      return 0;
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const aiGenerations = await ctx.db
      .query("telemetryEvents")
      .withIndex("by_business_and_event", (q) =>
        q.eq("businessId", args.businessId!).eq("eventName", "ai_generation_used")
      )
      .filter((q) => q.gte(q.field("timestamp"), monthStart))
      .collect();

    return aiGenerations.length;
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

/**
 * Bulk update post status
 */
export const bulkUpdateStatus = mutation({
  args: {
    postIds: v.array(v.id("socialPosts")),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("posting"),
      v.literal("posted"),
      v.literal("failed")
    ),
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

    // Verify access to all posts
    for (const postId of args.postIds) {
      const post = await ctx.db.get(postId);
      if (!post) continue;

      const business = await ctx.db.get(post.businessId);
      if (!business) continue;
      if (business.ownerId !== user._id && !business.teamMembers.includes(user._id)) {
        throw new Error("[ERR_FORBIDDEN] Not authorized for post: " + postId);
      }

      await ctx.db.patch(postId, { status: args.status });
    }

    return { updated: args.postIds.length };
  },
});

/**
 * Bulk delete posts
 */
export const bulkDeletePosts = mutation({
  args: {
    postIds: v.array(v.id("socialPosts")),
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

    let deleted = 0;
    for (const postId of args.postIds) {
      const post = await ctx.db.get(postId);
      if (!post) continue;

      const business = await ctx.db.get(post.businessId);
      if (!business) continue;
      if (business.ownerId !== user._id && !business.teamMembers.includes(user._id)) {
        continue; // Skip unauthorized posts
      }

      await ctx.db.delete(postId);
      deleted++;
    }

    return { deleted };
  },
});

/**
 * Update performance metrics for a post
 */
export const updatePerformanceMetrics = mutation({
  args: {
    postId: v.id("socialPosts"),
    metrics: v.object({
      impressions: v.number(),
      engagements: v.number(),
      clicks: v.number(),
      shares: v.number(),
      comments: v.number(),
      likes: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("[ERR_POST_NOT_FOUND] Post not found.");
    }

    await ctx.db.patch(args.postId, {
      performanceMetrics: {
        ...args.metrics,
        lastUpdated: Date.now(),
      },
    });

    return true;
  },
});

/**
 * Update approval status
 */
export const updateApprovalStatus = mutation({
  args: {
    postId: v.id("socialPosts"),
    approvalStatus: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("not_required")
    ),
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

    await ctx.db.patch(args.postId, {
      approvalStatus: args.approvalStatus,
    });

    await ctx.runMutation(internal.audit.write, {
      businessId: post.businessId,
      action: "social_post_approval_updated",
      entityType: "social_post",
      entityId: args.postId,
      details: { approvalStatus: args.approvalStatus },
    });

    return true;
  },
});

/**
 * Bulk schedule posts
 */
export const bulkSchedulePosts = mutation({
  args: {
    postIds: v.array(v.id("socialPosts")),
    scheduledAt: v.number(),
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

    let scheduled = 0;
    for (const postId of args.postIds) {
      const post = await ctx.db.get(postId);
      if (!post) continue;

      const business = await ctx.db.get(post.businessId);
      if (!business) continue;
      if (business.ownerId !== user._id && !business.teamMembers.includes(user._id)) {
        continue;
      }

      await ctx.db.patch(postId, {
        scheduledAt: args.scheduledAt,
        status: "scheduled",
      });
      scheduled++;
    }

    return { scheduled };
  },
});