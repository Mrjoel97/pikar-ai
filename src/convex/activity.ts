import { query } from "./_generated/server";
import { v } from "convex/values";

type ActivityItem = {
  kind: "notification" | "workflow_run";
  id: string;
  title: string;
  message: string;
  time: number;
  priority?: "low" | "medium" | "high";
};

export const getRecent = query({
  args: {
    businessId: v.id("businesses"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const limit = Math.max(1, Math.min(25, args.limit ?? 10));

    // Recent notifications for the business
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .take(limit);

    const notificationItems: ActivityItem[] = notifications.map((n) => ({
      kind: "notification",
      id: String(n._id), // cast Id to string
      title: n.title,
      message: n.message,
      time: n.createdAt,
      priority: n.priority,
    }));

    // Recent workflow runs for the business
    const runs = await ctx.db
      .query("workflowRuns")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .take(limit);

    const runItems: ActivityItem[] = runs.map((r) => {
      const statusLabel =
        r.status === "succeeded"
          ? "Succeeded"
          : r.status === "failed"
          ? "Failed"
          : r.status === "running"
          ? "Running"
          : r.status;
      return {
        kind: "workflow_run",
        id: String(r._id), // cast Id to string
        title: `Workflow Run ${statusLabel}`,
        message: `Mode: ${r.mode}${r.errorMessage ? ` • Error: ${r.errorMessage}` : ""}`,
        time: r.completedAt ?? r.startedAt ?? 0,
      };
    });

    // Merge, sort by time desc, and cap to limit
    const merged = [...notificationItems, ...runItems]
      .filter((i) => typeof i.time === "number" && i.time > 0)
      .sort((a, b) => b.time - a.time)
      .slice(0, limit);

    return merged;
  },
});