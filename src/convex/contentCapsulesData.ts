import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Save content capsule to database
 */
export const saveContentCapsule = mutation({
  args: {
    businessId: v.id("businesses"),
    title: v.string(),
    content: v.object({
      weeklyPost: v.string(),
      emailSubject: v.string(),
      emailBody: v.string(),
      tweets: v.array(v.string()),
      linkedinPost: v.string(),
      facebookPost: v.string(),
    }),
    platforms: v.array(v.union(v.literal("twitter"), v.literal("linkedin"), v.literal("facebook"))),
    scheduledAt: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("publishing"),
      v.literal("published"),
      v.literal("failed")
    )),
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

    const capsuleId = await ctx.db.insert("contentCapsules", {
      businessId: args.businessId,
      createdBy: user._id,
      title: args.title,
      content: args.content,
      platforms: args.platforms,
      scheduledAt: args.scheduledAt,
      status: args.status || "draft",
    });

    await ctx.runMutation(internal.audit.write, {
      businessId: args.businessId,
      action: "content_capsule_saved",
      entityType: "content_capsule",
      entityId: capsuleId,
      details: {
        title: args.title,
        platforms: args.platforms,
        status: args.status || "draft",
      },
    });

    return capsuleId;
  },
});

/**
 * Update capsule status
 */
export const updateCapsuleStatus = mutation({
  args: {
    capsuleId: v.id("contentCapsules"),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("publishing"),
      v.literal("published"),
      v.literal("failed")
    ),
    postIds: v.optional(v.record(v.string(), v.string())),
    publishedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      status: args.status,
    };

    if (args.postIds) updates.postIds = args.postIds;
    if (args.publishedAt) updates.publishedAt = args.publishedAt;
    if (args.errorMessage) updates.errorMessage = args.errorMessage;

    await ctx.db.patch(args.capsuleId, updates);

    return true;
  },
});

/**
 * Get capsule by ID
 */
export const getCapsuleById = query({
  args: {
    capsuleId: v.id("contentCapsules"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.capsuleId);
  },
});

/**
 * List content capsules for a business
 */
export const listContentCapsules = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("publishing"),
      v.literal("published"),
      v.literal("failed")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return [];
    }

    const limit = Math.min(args.limit ?? 50, 200);

    let capsules = await ctx.db
      .query("contentCapsules")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .order("desc")
      .take(limit * 2);

    if (args.status) {
      capsules = capsules.filter((c) => c.status === args.status);
    }

    return capsules.slice(0, limit);
  },
});

/**
 * Get capsule analytics
 */
export const getCapsuleAnalytics = query({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return {
        totalCapsules: 0,
        published: 0,
        scheduled: 0,
        drafts: 0,
        avgEngagement: 0,
      };
    }

    const capsules = await ctx.db
      .query("contentCapsules")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .collect();

    const published = capsules.filter((c) => c.status === "published").length;
    const scheduled = capsules.filter((c) => c.status === "scheduled").length;
    const drafts = capsules.filter((c) => c.status === "draft").length;

    return {
      totalCapsules: capsules.length,
      published,
      scheduled,
      drafts,
      avgEngagement: 0,
    };
  },
});

/**
 * Delete content capsule
 */
export const deleteContentCapsule = mutation({
  args: {
    capsuleId: v.id("contentCapsules"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("[ERR_NOT_AUTHENTICATED] You must be signed in.");
    }

    const capsule = await ctx.db.get(args.capsuleId);
    if (!capsule) {
      throw new Error("[ERR_CAPSULE_NOT_FOUND] Content capsule not found.");
    }

    await ctx.db.delete(args.capsuleId);

    await ctx.runMutation(internal.audit.write, {
      businessId: capsule.businessId,
      action: "content_capsule_deleted",
      entityType: "content_capsule",
      entityId: args.capsuleId,
      details: { title: capsule.title },
    });

    return true;
  },
});
