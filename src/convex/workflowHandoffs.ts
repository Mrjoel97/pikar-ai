import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Record a new handoff between departments
 */
export const recordHandoff = mutation({
  args: {
    businessId: v.id("businesses"),
    workflowId: v.id("workflows"),
    stepId: v.id("workflowSteps"),
    fromDepartment: v.string(),
    toDepartment: v.string(),
    initiatedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("workflowHandoffs", {
      businessId: args.businessId,
      workflowId: args.workflowId,
      stepId: args.stepId,
      fromDepartment: args.fromDepartment,
      toDepartment: args.toDepartment,
      status: "pending",
      initiatedBy: args.initiatedBy,
      initiatedAt: Date.now(),
    });
  },
});

/**
 * Accept a pending handoff
 */
export const acceptHandoff = mutation({
  args: {
    handoffId: v.id("workflowHandoffs"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.handoffId, {
      status: "accepted",
      resolvedBy: args.userId,
      resolvedAt: Date.now(),
    });

    const handoff = await ctx.db.get(args.handoffId);
    if (!handoff) throw new Error("Handoff not found");

    await ctx.db.insert("audit_logs", {
      businessId: handoff.businessId,
      userId: args.userId,
      action: "handoff_accepted",
      entityType: "workflow_handoff",
      entityId: args.handoffId,
      details: {
        fromDepartment: handoff.fromDepartment,
        toDepartment: handoff.toDepartment,
      },
      createdAt: Date.now(),
    });
  },
});

/**
 * Reject a pending handoff
 */
export const rejectHandoff = mutation({
  args: {
    handoffId: v.id("workflowHandoffs"),
    userId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.handoffId, {
      status: "rejected",
      resolvedBy: args.userId,
      resolvedAt: Date.now(),
      notes: args.reason,
    });

    const handoff = await ctx.db.get(args.handoffId);
    if (!handoff) throw new Error("Handoff not found");

    await ctx.db.insert("audit_logs", {
      businessId: handoff.businessId,
      userId: args.userId,
      action: "handoff_rejected",
      entityType: "workflow_handoff",
      entityId: args.handoffId,
      details: {
        fromDepartment: handoff.fromDepartment,
        toDepartment: handoff.toDepartment,
        reason: args.reason,
      },
      createdAt: Date.now(),
    });
  },
});

/**
 * Get pending handoffs for a specific department
 */
export const getPendingHandoffs = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) return [];

    let handoffsQuery = ctx.db
      .query("workflowHandoffs")
      .filter((q) => 
        q.and(
          q.eq(q.field("businessId"), args.businessId as Id<"businesses">),
          q.eq(q.field("status"), "pending")
        )
      );

    const handoffs = await handoffsQuery.collect();

    if (args.department) {
      return handoffs.filter((h) => h.toDepartment === args.department);
    }

    return handoffs;
  },
});

/**
 * Get cross-department metrics for analytics
 */
export const getCrossDepartmentMetrics = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return {
        totalHandoffs: 0,
        pendingHandoffs: 0,
        avgHandoffTime: 0,
        departmentBreakdown: [],
        topRoutes: [],
      };
    }

    const daysBack = args.days || 30;
    const cutoff = Date.now() - daysBack * 24 * 60 * 60 * 1000;

    const handoffs = await ctx.db
      .query("workflowHandoffs")
      .filter((q) => 
        q.and(
          q.eq(q.field("businessId"), args.businessId as Id<"businesses">),
          q.gte(q.field("initiatedAt"), cutoff)
        )
      )
      .collect();

    const totalHandoffs = handoffs.length;
    const pendingHandoffs = handoffs.filter((h) => h.status === "pending").length;

    const completedHandoffs = handoffs.filter((h) => h.status === "accepted" && h.resolvedAt);
    const avgHandoffTime =
      completedHandoffs.length > 0
        ? completedHandoffs.reduce((sum, h) => sum + (h.resolvedAt! - h.initiatedAt), 0) /
          completedHandoffs.length / (1000 * 60 * 60)
        : 0;

    const deptMap = new Map<string, { sent: number; received: number; avgTime: number }>();
    handoffs.forEach((h) => {
      const fromStats = deptMap.get(h.fromDepartment) || { sent: 0, received: 0, avgTime: 0 };
      fromStats.sent += 1;
      deptMap.set(h.fromDepartment, fromStats);

      const toStats = deptMap.get(h.toDepartment) || { sent: 0, received: 0, avgTime: 0 };
      toStats.received += 1;
      deptMap.set(h.toDepartment, toStats);
    });

    const departmentBreakdown = Array.from(deptMap.entries()).map(([dept, stats]) => ({
      department: dept,
      ...stats,
    }));

    const routeMap = new Map<string, number>();
    handoffs.forEach((h) => {
      const key = `${h.fromDepartment}->${h.toDepartment}`;
      routeMap.set(key, (routeMap.get(key) || 0) + 1);
    });

    const topRoutes = Array.from(routeMap.entries())
      .map(([route, count]) => ({ route, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalHandoffs,
      pendingHandoffs,
      avgHandoffTime,
      departmentBreakdown,
      topRoutes,
    };
  },
});

/**
 * Get handoff history for a specific workflow run
 */
export const getHandoffHistory = query({
  args: {
    workflowId: v.id("workflows"),
  },
  handler: async (ctx, args) => {
    const handoffs = await ctx.db
      .query("workflowHandoffs")
      .filter((q) => q.eq(q.field("workflowId"), args.workflowId))
      .collect();

    return handoffs.sort((a, b) => a.initiatedAt - b.initiatedAt);
  },
});