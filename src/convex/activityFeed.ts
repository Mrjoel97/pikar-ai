import { query } from "./_generated/server";
import { v } from "convex/values";

// Unified recent activity feed: notifications + workflow runs
export const getRecent = query({
  args: {
    businessId: v.id("businesses"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    // Fetch notifications by business
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .take(limit);

    const notificationItems = notifications.map((n) => ({
      id: String(n._id),
      type: "notification" as const,
      createdAt: n.createdAt ?? 0,
      title: n.title,
      message: n.message,
      priority: n.priority,
      status: n.isRead ? "read" : "unread",
      data: n.data ?? null,
    }));

    // Fetch workflow runs by business
    const runs = await ctx.db
      .query("workflowRuns")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .take(limit);

    const runItems = runs.map((r) => ({
      id: String(r._id),
      type: "workflow_run" as const,
      createdAt: r.startedAt ?? 0,
      title: "Workflow run",
      message: `Workflow ${String(r.workflowId)} ${r.status}`,
      status: r.status,
      mode: r.mode,
    }));

    // Merge, sort, and limit
    const merged = [...notificationItems, ...runItems]
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      .slice(0, limit);

    return merged;
  },
});