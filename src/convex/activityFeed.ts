import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Unified recent activity feed with comprehensive aggregation
export const getRecent = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    limit: v.optional(v.number()),
    userId: v.optional(v.id("users")),
    searchTerm: v.optional(v.string()),
    activityTypes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user) throw new Error("User not found");

    // If businessId is provided, verify access
    let businessId = args.businessId;
    if (businessId) {
      const business = await ctx.db.get(businessId);
      if (!business) throw new Error("Business not found");
      if (business.ownerId !== user._id && !business.teamMembers?.includes(user._id)) {
        throw new Error("Unauthorized access to business feed");
      }
    } else {
      // Default to user's business if not provided
      businessId = user.businessId;
    }

    // For now, return notifications as activity feed
    // When activityFeed table is added to schema, use that instead
    if (!businessId) return [];

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .order("desc")
      .take(args.limit || 20);

    return notifications.map((n) => ({
      _id: n._id,
      businessId: n.businessId,
      userId: n.userId,
      activityType: n.type || "notification",
      entityType: "notification",
      entityId: String(n._id),
      metadata: { title: n.title, message: n.message },
      timestamp: n.createdAt,
    }));
  },
});

/**
 * Get team activity metrics for collaboration feed
 */
export const getTeamActivity = query({
  args: {
    businessId: v.id("businesses"),
    timeRange: v.optional(v.number()), // days
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { activities: [], metrics: {} };

    const timeRange = args.timeRange ?? 7;
    const startTime = Date.now() - timeRange * 24 * 60 * 60 * 1000;

    // Use notifications as proxy for activity until activityFeed table exists
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("createdAt"), startTime))
      .order("desc")
      .take(100);

    const activities = notifications.map((n) => ({
      _id: n._id,
      businessId: n.businessId,
      userId: n.userId,
      activityType: n.type || "notification",
      entityType: "notification",
      entityId: String(n._id),
      metadata: { title: n.title, message: n.message },
      timestamp: n.createdAt,
    }));

    // Calculate metrics
    const metrics = {
      totalActivities: activities.length,
      mentions: 0,
      replies: 0,
      reactions: 0,
      shares: 0,
    };

    // Enrich with user info
    const enrichedActivities = await Promise.all(
      activities.map(async (activity) => {
        const user = await ctx.db.get(activity.userId);
        return {
          ...activity,
          userName: user?.name || user?.email || "Unknown",
        };
      })
    );

    return { activities: enrichedActivities, metrics };
  },
});

/**
 * Get mentions for a specific user
 */
export const getMentions = query({
  args: {
    businessId: v.id("businesses"),
    userId: v.id("users"),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    // Return empty for now - mentions require activityFeed table
    return [];
  },
});

// Query to get activity types for filtering
export const getActivityTypes = query({
  args: {},
  handler: async () => {
    return [
      { value: "notification", label: "Notifications" },
      { value: "workflow_run", label: "Workflow Runs" },
      { value: "team_message", label: "Team Messages" },
      { value: "goal_update", label: "Goal Updates" },
      { value: "approval", label: "Approvals" },
      { value: "social_post", label: "Social Posts" },
    ];
  },
});

// Query to get team members for filtering
export const getTeamMembers = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const business = await ctx.db.get(args.businessId);
    if (!business) return [];

    const members = [];
    
    // Add owner
    const owner = await ctx.db.get(business.ownerId);
    if (owner) {
      members.push({
        id: owner._id,
        name: owner.name ?? owner.email ?? "Unknown",
        email: owner.email,
      });
    }

    // Add team members - handle undefined teamMembers array
    if (business.teamMembers && Array.isArray(business.teamMembers)) {
      for (const memberId of business.teamMembers) {
        const member = await ctx.db.get(memberId);
        if (member) {
          members.push({
            id: member._id,
            name: member.name ?? member.email ?? "Unknown",
            email: member.email,
          });
        }
      }
    }

    return members;
  },
});