import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/**
 * Guest-safe approval metrics: no auth checks; returns defaults when businessId is not provided.
 */
export const getApprovalMetrics = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    timeRange: v.optional(v.number()), // days
    breakdown: v.optional(
      v.union(v.literal("user"), v.literal("workflow"), v.literal("time"))
    ),
  },
  handler: async (ctx, args) => {
    // Default to 30 days if not provided
    const timeRange = args.timeRange ?? 30;

    // Guest/public: no business context → return defaults
    if (!args.businessId) {
      return {
        totalApprovals: 0,
        overdueCount: 0,
        avgTimeHours: 0,
        approvalsByUser: {},
        timeRange,
      };
    }

    const startTime = Date.now() - timeRange * 24 * 60 * 60 * 1000;

    const approvals = await ctx.db
      .query("approvalQueue")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .filter((q) => q.gt(q.field("_creationTime"), startTime))
      .collect();

    const totalApprovals = approvals.length;
    const overdueCount = approvals.filter(
      (a) => a.status === "pending" && a.slaDeadline && a.slaDeadline < Date.now()
    ).length;

    const processedApprovals = approvals.filter((a) => a.status !== "pending");
    const totalTime = processedApprovals.reduce((sum, a) => {
      const processedAt = a.reviewedAt || Date.now();
      return sum + (processedAt - a._creationTime);
    }, 0);
    const avgTimeHours =
      processedApprovals.length > 0
        ? totalTime / processedApprovals.length / (1000 * 60 * 60)
        : 0;

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

// Ensure identifyBottlenecks is guest-safe: return [] if no businessId
export const identifyBottlenecks = query({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    // Return empty array if no businessId provided (guest/public)
    if (!args.businessId) {
      return [];
    }

    const approvals = await ctx.db
      .query("approvalQueue")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .collect();

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

    const bottlenecks = [];
    for (const [_, stats] of Object.entries(userStats)) {
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

// Ensure getApprovalTrends is guest-safe: return [] if no businessId
export const getApprovalTrends = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    period: v.optional(v.union(v.literal("day"), v.literal("week"), v.literal("month"))),
  },
  handler: async (ctx, args) => {
    // Return empty array if no businessId provided (guest/public)
    if (!args.businessId) {
      return [];
    }

    const period = args.period || "day";
    const now = Date.now();
    const daysBack = period === "day" ? 30 : period === "week" ? 90 : 365;
    const startTime = now - daysBack * 24 * 60 * 60 * 1000;

    const approvals = await ctx.db
      .query("approvalQueue")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .filter((q) => q.gt(q.field("_creationTime"), startTime))
      .collect();

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

// Approval velocity metrics - measures speed of approvals over time
export const getApprovalVelocity = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    timeRange: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return {
        avgVelocity: 0,
        velocityTrend: [],
        fastestApprovals: [],
        slowestApprovals: [],
      };
    }

    const timeRange = args.timeRange ?? 30;
    const startTime = Date.now() - timeRange * 24 * 60 * 60 * 1000;

    const approvals = await ctx.db
      .query("approvalQueue")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .filter((q) => q.gt(q.field("_creationTime"), startTime))
      .collect();

    const processedApprovals = approvals.filter((a) => a.status !== "pending");

    // Calculate velocity (approvals per day)
    const velocityByDay: Record<string, number> = {};
    processedApprovals.forEach((a) => {
      const date = new Date(a.reviewedAt || a._creationTime).toISOString().split("T")[0];
      velocityByDay[date] = (velocityByDay[date] || 0) + 1;
    });

    const velocityTrend = Object.entries(velocityByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const avgVelocity = processedApprovals.length / timeRange;

    // Find fastest and slowest approvals
    const approvalsWithTime = processedApprovals.map((a) => ({
      ...a,
      timeToApprove: (a.reviewedAt || Date.now()) - a._creationTime,
    }));

    const sorted = approvalsWithTime.sort((a, b) => a.timeToApprove - b.timeToApprove);
    const fastestApprovals = sorted.slice(0, 5).map((a) => ({
      id: a._id,
      timeHours: Math.round((a.timeToApprove / (1000 * 60 * 60)) * 10) / 10,
    }));
    const slowestApprovals = sorted.slice(-5).reverse().map((a) => ({
      id: a._id,
      timeHours: Math.round((a.timeToApprove / (1000 * 60 * 60)) * 10) / 10,
    }));

    return {
      avgVelocity: Math.round(avgVelocity * 10) / 10,
      velocityTrend,
      fastestApprovals,
      slowestApprovals,
    };
  },
});

// Team performance analytics - compare team members
export const getTeamPerformance = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    timeRange: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return [];
    }

    const timeRange = args.timeRange ?? 30;
    const startTime = Date.now() - timeRange * 24 * 60 * 60 * 1000;

    const approvals = await ctx.db
      .query("approvalQueue")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .filter((q) => q.gt(q.field("_creationTime"), startTime))
      .collect();

    const userPerformance: Record<
      string,
      {
        userId: Id<"users"> | null;
        userName: string;
        totalAssigned: number;
        approved: number;
        rejected: number;
        pending: number;
        avgTimeHours: number;
        approvalRate: number;
      }
    > = {};

    for (const approval of approvals) {
      const userId = approval.assigneeId;
      const key = String(userId || "unassigned");

      if (!userPerformance[key]) {
        let userName = "Unassigned";
        if (userId) {
          const user = await ctx.db.get(userId);
          userName = user?.name || user?.email || "Unknown";
        }

        userPerformance[key] = {
          userId: userId || null,
          userName,
          totalAssigned: 0,
          approved: 0,
          rejected: 0,
          pending: 0,
          avgTimeHours: 0,
          approvalRate: 0,
        };
      }

      userPerformance[key].totalAssigned++;
      if (approval.status === "approved") userPerformance[key].approved++;
      else if (approval.status === "rejected") userPerformance[key].rejected++;
      else userPerformance[key].pending++;
    }

    // Calculate avg time and approval rate
    for (const [key, perf] of Object.entries(userPerformance)) {
      const userApprovals = approvals.filter(
        (a) => String(a.assigneeId || "unassigned") === key && a.status !== "pending"
      );

      if (userApprovals.length > 0) {
        const totalTime = userApprovals.reduce((sum, a) => {
          const processedAt = a.reviewedAt || Date.now();
          return sum + (processedAt - a._creationTime);
        }, 0);
        perf.avgTimeHours = Math.round((totalTime / userApprovals.length / (1000 * 60 * 60)) * 10) / 10;
      }

      const processed = perf.approved + perf.rejected;
      perf.approvalRate = processed > 0 ? Math.round((perf.approved / processed) * 100) : 0;
    }

    return Object.values(userPerformance);
  },
});

// Predictive insights - forecast approval trends
export const getPredictiveInsights = query({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return {
        predictedBottlenecks: [],
        riskScore: 0,
        recommendations: [],
        forecast: [],
      };
    }

    const approvals = await ctx.db
      .query("approvalQueue")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .collect();

    const pendingApprovals = approvals.filter((a) => a.status === "pending");
    const processedApprovals = approvals.filter((a) => a.status !== "pending");

    // Calculate risk score (0-100)
    const overdueCount = pendingApprovals.filter(
      (a) => a.slaDeadline && a.slaDeadline < Date.now()
    ).length;
    const pendingRatio = approvals.length > 0 ? pendingApprovals.length / approvals.length : 0;
    const riskScore = Math.min(100, Math.round((overdueCount * 10 + pendingRatio * 50)));

    // Predict bottlenecks
    const userLoad: Record<string, number> = {};
    pendingApprovals.forEach((a) => {
      const key = String(a.assigneeId || "unassigned");
      userLoad[key] = (userLoad[key] || 0) + 1;
    });

    const predictedBottlenecks = [];
    for (const [userId, count] of Object.entries(userLoad)) {
      if (count > 5) {
        let userName = "Unassigned";
        if (userId !== "unassigned") {
          const user = await ctx.db.get(userId as Id<"users">);
          userName = user?.name || user?.email || "Unknown";
        }
        predictedBottlenecks.push({ userName, pendingCount: count });
      }
    }

    // Generate recommendations
    const recommendations = [];
    if (overdueCount > 0) {
      recommendations.push(`${overdueCount} overdue approvals need immediate attention`);
    }
    if (pendingRatio > 0.5) {
      recommendations.push("High pending ratio - consider redistributing workload");
    }
    if (predictedBottlenecks.length > 0) {
      recommendations.push(`${predictedBottlenecks.length} team members at risk of bottleneck`);
    }
    if (recommendations.length === 0) {
      recommendations.push("All systems operating normally");
    }

    // Simple forecast (linear projection)
    const last7Days = processedApprovals.filter(
      (a) => a._creationTime > Date.now() - 7 * 24 * 60 * 60 * 1000
    );
    const avgPerDay = last7Days.length / 7;
    const forecast = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      predicted: Math.round(avgPerDay),
    }));

    return {
      predictedBottlenecks,
      riskScore,
      recommendations,
      forecast,
    };
  },
});

// Custom report generation
export const generateCustomReport = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    includeMetrics: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return {
        summary: {},
        details: [],
        generatedAt: Date.now(),
      };
    }

    const startDate = args.startDate || Date.now() - 30 * 24 * 60 * 60 * 1000;
    const endDate = args.endDate || Date.now();

    const approvals = await ctx.db
      .query("approvalQueue")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .filter((q) => q.gt(q.field("_creationTime"), startDate))
      .filter((q) => q.lt(q.field("_creationTime"), endDate))
      .collect();

    const summary: Record<string, any> = {
      totalApprovals: approvals.length,
      approved: approvals.filter((a) => a.status === "approved").length,
      rejected: approvals.filter((a) => a.status === "rejected").length,
      pending: approvals.filter((a) => a.status === "pending").length,
      dateRange: {
        start: new Date(startDate).toISOString(),
        end: new Date(endDate).toISOString(),
      },
    };

    const processedApprovals = approvals.filter((a) => a.status !== "pending");
    if (processedApprovals.length > 0) {
      const totalTime = processedApprovals.reduce((sum, a) => {
        const processedAt = a.reviewedAt || Date.now();
        return sum + (processedAt - a._creationTime);
      }, 0);
      summary.avgTimeHours = Math.round((totalTime / processedApprovals.length / (1000 * 60 * 60)) * 10) / 10;
    }

    return {
      summary,
      details: approvals.slice(0, 100), // Limit to 100 for performance
      generatedAt: Date.now(),
    };
  },
});