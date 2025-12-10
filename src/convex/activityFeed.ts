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

    // Return empty array if activityFeed table doesn't exist yet
    try {
      let activitiesQuery;

      if (businessId) {
        activitiesQuery = ctx.db
          .query("activityFeed")
          .withIndex("by_business", (q) => q.eq("businessId", businessId));
      } else if (args.userId) {
        activitiesQuery = ctx.db
          .query("activityFeed")
          .withIndex("by_user", (q) => q.eq("userId", args.userId as Id<"users">));
      } else {
        activitiesQuery = ctx.db.query("activityFeed");
      }

      const activities = await activitiesQuery
        .order("desc")
        .take(args.limit || 20);

      return activities;
    } catch (error) {
      // Table might not exist yet
      return [];
    }
  },
});

/**
 * Track collaboration activity (mentions, replies, reactions)
 */
export const trackCollaboration = mutation({
  args: {
    businessId: v.id("businesses"),
    userId: v.id("users"),
    activityType: v.union(
      v.literal("mention"),
      v.literal("reply"),
      v.literal("reaction"),
      v.literal("share")
    ),
    entityType: v.string(),
    entityId: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const activityId = await ctx.db.insert("activityFeed", {
      businessId: args.businessId,
      userId: args.userId,
      activityType: args.activityType,
      entityType: args.entityType,
      entityId: args.entityId,
      metadata: args.metadata,
      timestamp: Date.now(),
    });

    return activityId;
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

    const activities = await ctx.db
      .query("activityFeed")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("timestamp"), startTime))
      .order("desc")
      .take(100);

    // Calculate metrics
    const metrics = {
      totalActivities: activities.length,
      mentions: activities.filter((a) => a.activityType === "mention").length,
      replies: activities.filter((a) => a.activityType === "reply").length,
      reactions: activities.filter((a) => a.activityType === "reaction").length,
      shares: activities.filter((a) => a.activityType === "share").length,
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

    let mentions = await ctx.db
      .query("activityFeed")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.eq(q.field("activityType"), "mention"))
      .order("desc")
      .take(50);

    // Filter by mentioned user in metadata
    mentions = mentions.filter(
      (m) => m.metadata?.mentionedUserId === args.userId
    );

    if (args.unreadOnly) {
      mentions = mentions.filter((m) => !m.metadata?.read);
    }

    return mentions;
  },
});

// Helper function to extract @mentions from text
function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  return mentions;
}

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