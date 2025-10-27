import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Unified recent activity feed with comprehensive aggregation
export const getRecent = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    limit: v.optional(v.number()),
    userId: v.optional(v.id("users")), // Filter by team member
    searchTerm: v.optional(v.string()), // Search functionality
    activityTypes: v.optional(v.array(v.string())), // Filter by activity type
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    // Early return for guest/public views with no business context
    if (!args.businessId) {
      return [];
    }

    const businessId: Id<"businesses"> = args.businessId as Id<"businesses">;

    // Optimized: Fetch only what we need based on filters
    const effectiveLimit = limit * 2; // Fetch extra to account for filtering

    // Build queries based on filters
    const fetchActivities = async () => {
      const activities: Array<{
        id: string;
        type: string;
        createdAt: number;
        title: string;
        message: string;
        userId?: Id<"users">;
        userName?: string;
        priority?: string;
        status?: string;
        mentions?: string[];
        data?: any;
      }> = [];

      const shouldFetch = (type: string) =>
        !args.activityTypes || args.activityTypes.length === 0 || args.activityTypes.includes(type);

      // 1. Notifications - optimized with user filter
      if (shouldFetch("notification")) {
        const notifQuery = args.userId
          ? ctx.db
              .query("notifications")
              .withIndex("by_user", (q) => q.eq("userId", args.userId).eq("businessId", businessId))
          : ctx.db
              .query("notifications")
              .withIndex("by_business", (q) => q.eq("businessId", businessId));

        const notifications = await notifQuery.order("desc").take(effectiveLimit);

        for (const n of notifications) {
          activities.push({
            id: String(n._id),
            type: "notification",
            createdAt: n.createdAt ?? 0,
            title: n.title,
            message: n.message,
            userId: n.userId,
            priority: n.priority,
            status: n.isRead ? "read" : "unread",
            mentions: extractMentions(n.message),
            data: n.data ?? null,
          });
        }
      }

      // 2. Workflow runs
      if (shouldFetch("workflow_run")) {
        const runs = await ctx.db
          .query("workflowRuns")
          .withIndex("by_business", (q) => q.eq("businessId", businessId))
          .order("desc")
          .take(effectiveLimit);

        for (const r of runs) {
          activities.push({
            id: String(r._id),
            type: "workflow_run",
            createdAt: r.startedAt ?? 0,
            title: `Workflow ${r.status}`,
            message: `Workflow run ${r.status}${r.errorMessage ? `: ${r.errorMessage}` : ""}`,
            status: r.status,
          });
        }
      }

      // 3. Team chat messages
      if (shouldFetch("team_message")) {
        const messages = await ctx.db
          .query("teamMessages")
          .withIndex("by_business", (q) => q.eq("businessId", businessId))
          .order("desc")
          .take(effectiveLimit);

        for (const m of messages) {
          if (args.userId && m.senderId !== args.userId) continue;
          
          const sender = await ctx.db.get(m.senderId);
          activities.push({
            id: String(m._id),
            type: "team_message",
            createdAt: m.createdAt ?? 0,
            title: "Team Message",
            message: m.content.substring(0, 100) + (m.content.length > 100 ? "..." : ""),
            userId: m.senderId,
            userName: sender?.name ?? sender?.email ?? "Unknown",
            mentions: extractMentions(m.content),
          });
        }
      }

      // 4. Goal updates
      if (shouldFetch("goal_update")) {
        const goalUpdates = await ctx.db
          .query("goalUpdates")
          .withIndex("by_business", (q) => q.eq("businessId", businessId))
          .order("desc")
          .take(effectiveLimit);

        for (const gu of goalUpdates) {
          if (args.userId && gu.updatedBy !== args.userId) continue;
          
          const goal = await ctx.db.get(gu.goalId);
          const updater = await ctx.db.get(gu.updatedBy);
          activities.push({
            id: String(gu._id),
            type: "goal_update",
            createdAt: gu.timestamp ?? 0,
            title: "Goal Progress",
            message: `${updater?.name ?? "Someone"} updated "${goal?.title ?? "a goal"}" from ${gu.previousValue} to ${gu.newValue}`,
            userId: gu.updatedBy,
            userName: updater?.name ?? updater?.email ?? "Unknown",
          });
        }
      }

      // 5. Approval queue items
      if (shouldFetch("approval")) {
        const approvals = await ctx.db
          .query("approvalQueue")
          .withIndex("by_business", (q) => q.eq("businessId", businessId))
          .order("desc")
          .take(effectiveLimit);

        for (const a of approvals) {
          activities.push({
            id: String(a._id),
            type: "approval",
            createdAt: a._creationTime,
            title: a.title,
            message: a.description,
            priority: a.priority,
            status: a.status,
          });
        }
      }

      // 6. Social posts
      if (shouldFetch("social_post")) {
        const posts = await ctx.db
          .query("socialPosts")
          .withIndex("by_business", (q) => q.eq("businessId", businessId))
          .order("desc")
          .take(effectiveLimit);

        for (const p of posts) {
          if (args.userId && p.createdBy !== args.userId) continue;
          
          const creator = await ctx.db.get(p.createdBy);
          activities.push({
            id: String(p._id),
            type: "social_post",
            createdAt: p._creationTime,
            title: "Social Post",
            message: `${creator?.name ?? "Someone"} ${p.status === "posted" ? "posted" : "scheduled"} to ${p.platforms.join(", ")}`,
            userId: p.createdBy,
            userName: creator?.name ?? creator?.email ?? "Unknown",
            status: p.status,
          });
        }
      }

      return activities;
    };

    let activities = await fetchActivities();

    // Apply search filter only if needed
    if (args.searchTerm && args.searchTerm.trim().length > 0) {
      const term = args.searchTerm.toLowerCase();
      activities = activities.filter(
        (a) =>
          a.title.toLowerCase().includes(term) ||
          a.message.toLowerCase().includes(term) ||
          (a.userName && a.userName.toLowerCase().includes(term))
      );
    }

    // Sort by time desc and limit
    return activities
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
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

    // Add team members
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

    return members;
  },
});