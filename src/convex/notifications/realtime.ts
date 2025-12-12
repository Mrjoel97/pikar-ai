import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Real-time activity feed subscription with cursor pagination
 */
export const subscribeToActivityFeed = query({
  args: {
    businessId: v.id("businesses"),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
    activityTypes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const limit = args.limit || 50;
    
    // Use notifications as activity feed
    let query = ctx.db
      .query("notifications")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc");

    const activities = await query.take(limit + 1);
    
    const hasMore = activities.length > limit;
    const items = hasMore ? activities.slice(0, limit) : activities;
    
    // Enrich with user info
    const enriched = await Promise.all(
      items.map(async (activity) => {
        const user = await ctx.db.get(activity.userId);
        return {
          _id: activity._id,
          businessId: activity.businessId,
          userId: activity.userId,
          userName: user?.name || user?.email || "Unknown",
          activityType: activity.type || "notification",
          title: activity.title,
          message: activity.message,
          timestamp: activity.createdAt,
          read: activity.read || false,
        };
      })
    );

    return {
      activities: enriched,
      hasMore,
      nextCursor: hasMore ? items[items.length - 1]._id : null,
    };
  },
});

/**
 * Mark activities as read
 */
export const markActivitiesAsRead = mutation({
  args: {
    activityIds: v.array(v.id("notifications")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    for (const id of args.activityIds) {
      await ctx.db.patch(id, { read: true });
    }

    return { success: true, count: args.activityIds.length };
  },
});

/**
 * Get unread activity count
 */
export const getUnreadCount = query({
  args: {
    businessId: v.id("businesses"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("read"), false)
        )
      )
      .take(100);

    return notifications.length;
  },
});
