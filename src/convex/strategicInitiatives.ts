"use node";

import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Strategic Command Center Backend
 * Handles global initiatives, resource allocation, and strategic planning
 */

// Get all strategic initiatives for a business with resource allocation
export const listStrategicInitiatives = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const initiatives = await ctx.db
      .query("initiatives")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    // Enrich with resource allocation data
    const enriched = await Promise.all(
      initiatives.map(async (initiative) => {
        const workflows = await ctx.db
          .query("workflows")
          .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();

        const agents = await ctx.db
          .query("aiAgents")
          .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
          .filter((q) => q.eq(q.field("isActive"), true))
          .collect();

        const tasks = await ctx.db
          .query("tasks")
          .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
          .filter((q) => q.eq(q.field("status"), "in_progress"))
          .collect();

        return {
          ...initiative,
          resources: {
            activeWorkflows: workflows.length,
            activeAgents: agents.length,
            activeTasks: tasks.length,
          },
        };
      })
    );

    return enriched;
  },
});

// Get resource allocation summary across all initiatives
export const getResourceAllocation = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const agents = await ctx.db
      .query("aiAgents")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const workflowRuns = await ctx.db
      .query("workflowRuns")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    // Calculate resource utilization
    const activeWorkflows = workflows.filter((w) => w.status === "active").length;
    const totalWorkflows = workflows.length;
    const activeAgents = agents.filter((a) => a.isActive).length;
    const totalAgents = agents.length;

    const runningWorkflows = workflowRuns.filter((r) => r.status === "running").length;
    const succeededRuns = workflowRuns.filter((r) => r.status === "succeeded").length;
    const failedRuns = workflowRuns.filter((r) => r.status === "failed").length;

    const activeTasks = tasks.filter((t) => t.status === "in_progress").length;
    const completedTasks = tasks.filter((t) => t.status === "done").length;

    return {
      workflows: {
        active: activeWorkflows,
        total: totalWorkflows,
        utilization: totalWorkflows > 0 ? (activeWorkflows / totalWorkflows) * 100 : 0,
      },
      agents: {
        active: activeAgents,
        total: totalAgents,
        utilization: totalAgents > 0 ? (activeAgents / totalAgents) * 100 : 0,
      },
      workflowRuns: {
        running: runningWorkflows,
        succeeded: succeededRuns,
        failed: failedRuns,
        successRate: succeededRuns + failedRuns > 0 
          ? (succeededRuns / (succeededRuns + failedRuns)) * 100 
          : 0,
      },
      tasks: {
        active: activeTasks,
        completed: completedTasks,
        completionRate: activeTasks + completedTasks > 0 
          ? (completedTasks / (activeTasks + completedTasks)) * 100 
          : 0,
      },
    };
  },
});

// Get strategic KPIs and metrics
export const getStrategicKpis = query({
  args: { 
    businessId: v.id("businesses"),
    timeRange: v.optional(v.union(v.literal("7d"), v.literal("30d"), v.literal("90d"))),
  },
  handler: async (ctx, args) => {
    const timeRange = args.timeRange || "30d";
    const daysAgo = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const cutoffTime = Date.now() - daysAgo * 24 * 60 * 60 * 1000;

    // Get recent workflow runs
    const recentRuns = await ctx.db
      .query("workflowRuns")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("startedAt"), cutoffTime))
      .collect();

    // Get recent revenue events
    const revenueEvents = await ctx.db
      .query("revenueEvents")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("timestamp"), cutoffTime))
      .collect();

    // Get recent audit logs for activity tracking
    const auditLogs = await ctx.db
      .query("audit_logs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("createdAt"), cutoffTime))
      .collect();

    const totalRevenue = revenueEvents.reduce((sum, e) => sum + e.amount, 0);
    const totalRuns = recentRuns.length;
    const succeededRuns = recentRuns.filter((r) => r.status === "succeeded").length;
    const totalActivities = auditLogs.length;

    return {
      revenue: {
        total: totalRevenue,
        average: totalRevenue / daysAgo,
        trend: totalRevenue > 0 ? "up" : "stable",
      },
      automation: {
        totalRuns,
        successRate: totalRuns > 0 ? (succeededRuns / totalRuns) * 100 : 0,
        trend: succeededRuns > totalRuns * 0.8 ? "up" : "down",
      },
      activity: {
        total: totalActivities,
        average: totalActivities / daysAgo,
        trend: totalActivities > 0 ? "up" : "stable",
      },
      timeRange,
    };
  },
});

// Get initiative progress and milestones
export const getInitiativeProgress = query({
  args: { initiativeId: v.id("initiatives") },
  handler: async (ctx, args) => {
    const initiative = await ctx.db.get(args.initiativeId);
    if (!initiative) return null;

    // Get related tasks
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_business", (q) => q.eq("businessId", initiative.businessId))
      .collect();

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "done").length;
    const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
    const blockedTasks = tasks.filter((t) => t.status === "blocked").length;

    // Get workflow runs for this initiative
    const workflowRuns = await ctx.db
      .query("workflowRuns")
      .withIndex("by_business", (q) => q.eq("businessId", initiative.businessId))
      .collect();

    const totalRuns = workflowRuns.length;
    const succeededRuns = workflowRuns.filter((r) => r.status === "succeeded").length;

    return {
      initiative,
      progress: {
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          inProgress: inProgressTasks,
          blocked: blockedTasks,
          completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        },
        workflows: {
          total: totalRuns,
          succeeded: succeededRuns,
          successRate: totalRuns > 0 ? (succeededRuns / totalRuns) * 100 : 0,
        },
        phase: initiative.currentPhase || 0,
        status: initiative.status,
      },
    };
  },
});

// Allocate resources to an initiative
export const allocateResources = internalMutation({
  args: {
    initiativeId: v.id("initiatives"),
    workflowIds: v.optional(v.array(v.id("workflows"))),
    agentIds: v.optional(v.array(v.id("aiAgents"))),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const initiative = await ctx.db.get(args.initiativeId);
    if (!initiative) throw new Error("Initiative not found");

    // Log the resource allocation
    await ctx.db.insert("audit_logs", {
      businessId: initiative.businessId,
      userId: identity.subject as Id<"users">,
      action: "allocate_resources",
      entityType: "initiative",
      entityId: args.initiativeId,
      details: {
        workflowIds: args.workflowIds || [],
        agentIds: args.agentIds || [],
        notes: args.notes,
      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Create a strategic initiative
export const createStrategicInitiative = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    goals: v.array(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const initiativeId = await ctx.db.insert("initiatives", {
      businessId: args.businessId,
      name: args.name,
      status: "active",
      currentPhase: 0,
      ownerId: identity.subject as Id<"users">,
      onboardingProfile: {
        industry: "",
        businessModel: "",
        goals: args.goals,
      },
    });

    // Log the creation
    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      userId: identity.subject as Id<"users">,
      action: "create_strategic_initiative",
      entityType: "initiative",
      entityId: initiativeId,
      details: {
        name: args.name,
        priority: args.priority,
        goals: args.goals,
      },
      createdAt: Date.now(),
    });

    return initiativeId;
  },
});

// Get cross-initiative insights
export const getCrossInitiativeInsights = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const initiatives = await ctx.db
      .query("initiatives")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const activeInitiatives = initiatives.filter((i) => i.status === "active");
    const completedInitiatives = initiatives.filter((i) => i.status === "completed");

    // Get all workflows and agents
    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const agents = await ctx.db
      .query("aiAgents")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    return {
      summary: {
        totalInitiatives: initiatives.length,
        active: activeInitiatives.length,
        completed: completedInitiatives.length,
        completionRate: initiatives.length > 0 
          ? (completedInitiatives.length / initiatives.length) * 100 
          : 0,
      },
      resources: {
        totalWorkflows: workflows.length,
        totalAgents: agents.length,
        activeWorkflows: workflows.filter((w) => w.status === "active").length,
        activeAgents: agents.filter((a) => a.isActive).length,
      },
      initiatives: activeInitiatives.map((i) => ({
        id: i._id,
        name: i.name,
        phase: i.currentPhase,
        status: i.status,
      })),
    };
  },
});
