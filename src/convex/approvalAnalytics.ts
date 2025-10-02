import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// Get approval metrics with aggregation
export const getApprovalMetrics = query({
  args: {
    businessId: v.id("businesses"),
    timeRange: v.optional(v.number()), // days
    breakdown: v.optional(v.union(v.literal("user"), v.literal("workflow"), v.literal("time"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const timeRange = args.timeRange || 30;
    const startTime = Date.now() - timeRange * 24 * 60 * 60 * 1000;

    const approvals = await ctx.db
      .query("approvalQueue")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gt(q.field("_creationTime"), startTime))
      .collect();

    const totalApprovals = approvals.length;
    const overdueCount = approvals.filter(
      (a) => a.status === "pending" && a.slaDeadline && a.slaDeadline < Date.now()
    ).length;

    // Calculate average approval time
    const processedApprovals = approvals.filter((a) => a.status !== "pending");
    const totalTime = processedApprovals.reduce((sum, a) => {
      const processedAt = a.reviewedAt || Date.now();
      return sum + (processedAt - a._creationTime);
    }, 0);
    const avgTimeHours =
      processedApprovals.length > 0
        ? totalTime / processedApprovals.length / (1000 * 60 * 60)
        : 0;

    // Breakdown by user
    const approvalsByUser: Record<string, number> = {};
    approvals.forEach((a) => {
      const userId = String(a.assigneeId || "unassigned");
      approvalsByUser[userId] = (approvalsByUser[userId] || 0) + 1;
    });

    return {
      totalApprovals,
      overdueCount,
      avgTimeHours: Math.round(avgTimeHours * 10) / 10,
      approvalsByUser,
      timeRange,
    };
  },
});

// Identify approval bottlenecks
export const identifyBottlenecks = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const approvals = await ctx.db
      .query("approvalQueue")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    // Group by user
    const userStats: Record<
      string,
      {
        userId: Id<"users"> | null;
        pendingCount: number;
        totalTime: number;
        processedCount: number;
      }
    > = {};

    approvals.forEach((a) => {
      const userId = a.assigneeId;
      const key = String(userId || "unassigned");

      if (!userStats[key]) {
        userStats[key] = {
          userId: userId || null,
          pendingCount: 0,
          totalTime: 0,
          processedCount: 0,
        };
      }

      if (a.status === "pending") {
        userStats[key].pendingCount++;
      } else {
        userStats[key].processedCount++;
        const processedAt = a.reviewedAt || Date.now();
        userStats[key].totalTime += processedAt - a._creationTime;
      }
    });

    // Identify bottlenecks
    const bottlenecks = [];
    for (const [key, stats] of Object.entries(userStats)) {
      const avgTimeHours =
        stats.processedCount > 0
          ? stats.totalTime / stats.processedCount / (1000 * 60 * 60)
          : 0;

      let reason = "";
      if (stats.pendingCount > 10) {
        reason = "High pending count";
      } else if (avgTimeHours > 48) {
        reason = "Slow approval time";
      }

      if (reason) {
        // Fetch user name
        let userName = "Unknown";
        if (stats.userId) {
          const user = await ctx.db.get(stats.userId);
          userName = user?.name || user?.email || "Unknown";
        }

        bottlenecks.push({
          userId: stats.userId,
          userName,
          pendingCount: stats.pendingCount,
          avgTimeHours: Math.round(avgTimeHours * 10) / 10,
          reason,
        });
      }
    }

    return bottlenecks;
  },
});

// Get approval trends over time
export const getApprovalTrends = query({
  args: {
    businessId: v.id("businesses"),
    period: v.optional(v.union(v.literal("day"), v.literal("week"), v.literal("month"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const period = args.period || "day";
    const now = Date.now();
    const daysBack = period === "day" ? 30 : period === "week" ? 90 : 365;
    const startTime = now - daysBack * 24 * 60 * 60 * 1000;

    const approvals = await ctx.db
      .query("approvalQueue")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gt(q.field("_creationTime"), startTime))
      .collect();

    // Group by time period
    const trends: Record<string, { approved: number; rejected: number; pending: number }> = {};

    approvals.forEach((a) => {
      const date = new Date(a._creationTime);
      let key = "";

      if (period === "day") {
        key = date.toISOString().split("T")[0];
      } else if (period === "week") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }

      if (!trends[key]) {
        trends[key] = { approved: 0, rejected: 0, pending: 0 };
      }

      if (a.status === "approved") trends[key].approved++;
      else if (a.status === "rejected") trends[key].rejected++;
      else trends[key].pending++;
    });

    return Object.entries(trends)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
});
