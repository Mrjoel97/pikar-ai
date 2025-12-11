import { query } from "./_generated/server";
import { v } from "convex/values";

type ActivityItem = {
  kind: "notification";
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
      id: String(n._id),
      title: n.title,
      message: n.message,
      time: n.createdAt,
      priority: n.type === "error" ? "high" : n.type === "warning" ? "medium" : "low",
    }));

    return notificationItems;
  },
});