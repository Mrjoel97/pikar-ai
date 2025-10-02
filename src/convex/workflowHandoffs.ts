import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Record a new handoff between departments
 */
export const recordHandoff = mutation({
  args: {
    workflowRunId: v.id("workflowRuns"),
    workflowId: v.id("workflows"),
    fromDept: v.string(),
    toDept: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Get workflow run to extract businessId
    const workflowRun = await ctx.db.get(args.workflowRunId);
    if (!workflowRun) throw new Error("Workflow run not found");

    const handoffId = await ctx.db.insert("workflowHandoffs", {
      workflowRunId: args.workflowRunId,
      businessId: workflowRun.businessId,
      workflowId: args.workflowId,
      fromDept: args.fromDept,
      toDept: args.toDept,
      handoffAt: Date.now(),
      status: "pending",
      notes: args.notes,
    });

    // Log audit event
    await ctx.db.insert("audit_logs", {
      businessId: workflowRun.businessId,
      userId: identity.subject as Id<"users">,
      action: "workflow_handoff_created",
      entityType: "workflowHandoff",
      entityId: handoffId,
      details: {
        fromDept: args.fromDept,
        toDept: args.toDept,
        workflowRunId: args.workflowRunId,
      },
      createdAt: Date.now(),
    });

    return handoffId;
  },
});

/**
 * Accept a pending handoff
 */
export const acceptHandoff = mutation({
  args: {
    handoffId: v.id("workflowHandoffs"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const handoff = await ctx.db.get(args.handoffId);
    if (!handoff) throw new Error("Handoff not found");
    if (handoff.status !== "pending") throw new Error("Handoff already processed");

    await ctx.db.patch(args.handoffId, {
      status: "accepted",
      acceptedAt: Date.now(),
      acceptedBy: identity.subject as Id<"users">,
      notes: args.notes || handoff.notes,
    });

    // Log audit event
    await ctx.db.insert("audit_logs", {
      businessId: handoff.businessId,
      userId: identity.subject as Id<"users">,
      action: "workflow_handoff_accepted",
      entityType: "workflowHandoff",
      entityId: args.handoffId,
      details: {
        fromDept: handoff.fromDept,
        toDept: handoff.toDept,
      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Reject a pending handoff
 */
export const rejectHandoff = mutation({
  args: {
    handoffId: v.id("workflowHandoffs"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const handoff = await ctx.db.get(args.handoffId);
    if (!handoff) throw new Error("Handoff not found");
    if (handoff.status !== "pending") throw new Error("Handoff already processed");

    await ctx.db.patch(args.handoffId, {
      status: "rejected",
      acceptedAt: Date.now(),
      acceptedBy: identity.subject as Id<"users">,
      notes: args.notes || handoff.notes,
    });

    // Log audit event
    await ctx.db.insert("audit_logs", {
      businessId: handoff.businessId,
      userId: identity.subject as Id<"users">,
      action: "workflow_handoff_rejected",
      entityType: "workflowHandoff",
      entityId: args.handoffId,
      details: {
        fromDept: handoff.fromDept,
        toDept: handoff.toDept,
      },
      createdAt: Date.now(),
    });

    return { success: true };
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

    let handoffs;
    if (args.department) {
      const dept = args.department; // Type narrowing
      handoffs = await ctx.db
        .query("workflowHandoffs")
        .withIndex("by_to_dept_and_status", (q) =>
          q.eq("toDept", dept).eq("status", "pending")
        )
        .filter((q) => q.eq(q.field("businessId"), args.businessId))
        .collect();
    } else {
      handoffs = await ctx.db
        .query("workflowHandoffs")
        .withIndex("by_business_and_status", (q) =>
          q.eq("businessId", args.businessId as Id<"businesses">).eq("status", "pending")
        )
        .collect();
    }

    // Enrich with workflow details
    const enriched = await Promise.all(
      handoffs.map(async (handoff) => {
        const workflow = await ctx.db.get(handoff.workflowId);
        return {
          ...handoff,
          workflowName: workflow?.name || "Unknown Workflow",
        };
      })
    );

    return enriched;
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
        avgHandoffTime: 0,
        failureRate: 0,
        departmentStats: [],
        flowData: [],
      };
    }

    const days = args.days || 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const allHandoffs = await ctx.db
      .query("workflowHandoffs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId as Id<"businesses">))
      .filter((q) => q.gte(q.field("handoffAt"), cutoff))
      .collect();

    const totalHandoffs = allHandoffs.length;
    const acceptedHandoffs = allHandoffs.filter((h) => h.status === "accepted");
    const rejectedHandoffs = allHandoffs.filter((h) => h.status === "rejected");

    // Calculate average handoff time (time from handoff to acceptance)
    const handoffTimes = acceptedHandoffs
      .filter((h) => h.acceptedAt)
      .map((h) => (h.acceptedAt! - h.handoffAt) / (1000 * 60 * 60)); // hours

    const avgHandoffTime =
      handoffTimes.length > 0
        ? handoffTimes.reduce((a, b) => a + b, 0) / handoffTimes.length
        : 0;

    const failureRate = totalHandoffs > 0 ? (rejectedHandoffs.length / totalHandoffs) * 100 : 0;

    // Department statistics
    const deptMap = new Map<string, { sent: number; received: number; avgTime: number }>();

    allHandoffs.forEach((h) => {
      // From department
      const fromStats = deptMap.get(h.fromDept) || { sent: 0, received: 0, avgTime: 0 };
      fromStats.sent++;
      deptMap.set(h.fromDept, fromStats);

      // To department
      const toStats = deptMap.get(h.toDept) || { sent: 0, received: 0, avgTime: 0 };
      toStats.received++;
      deptMap.set(h.toDept, toStats);
    });

    const departmentStats = Array.from(deptMap.entries()).map(([dept, stats]) => ({
      department: dept,
      ...stats,
    }));

    // Flow data for Sankey chart (from -> to with count)
    const flowMap = new Map<string, number>();
    allHandoffs.forEach((h) => {
      const key = `${h.fromDept}->${h.toDept}`;
      flowMap.set(key, (flowMap.get(key) || 0) + 1);
    });

    const flowData = Array.from(flowMap.entries()).map(([key, count]) => {
      const [from, to] = key.split("->");
      return { from, to, count };
    });

    return {
      totalHandoffs,
      avgHandoffTime: Math.round(avgHandoffTime * 10) / 10,
      failureRate: Math.round(failureRate * 10) / 10,
      departmentStats,
      flowData,
    };
  },
});

/**
 * Get handoff history for a specific workflow run
 */
export const getHandoffHistory = query({
  args: {
    workflowRunId: v.id("workflowRuns"),
  },
  handler: async (ctx, args) => {
    const handoffs = await ctx.db
      .query("workflowHandoffs")
      .withIndex("by_workflow_run", (q) => q.eq("workflowRunId", args.workflowRunId))
      .collect();

    return handoffs.sort((a, b) => a.handoffAt - b.handoffAt);
  },
});
