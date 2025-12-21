import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Internal mutations for data persistence
 */

export const recordAgentMessage = internalMutation({
  args: {
    fromAgentKey: v.string(),
    toAgentKey: v.string(),
    message: v.string(),
    context: v.optional(v.any()),
    businessId: v.id("businesses"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agentMessages", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const updateAgentMessage = internalMutation({
  args: {
    messageId: v.id("agentMessages"),
    response: v.optional(v.any()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      response: args.response,
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const createOrchestration = internalMutation({
  args: {
    businessId: v.id("businesses"),
    type: v.string(),
    agentCount: v.number(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agentOrchestrations", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const updateOrchestration = internalMutation({
  args: {
    orchestrationId: v.id("agentOrchestrations"),
    status: v.string(),
    duration: v.optional(v.number()),
    successCount: v.optional(v.number()),
    failureCount: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { orchestrationId, ...updates } = args;
    await ctx.db.patch(orchestrationId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const recordAgentExecution = internalMutation({
  args: {
    orchestrationId: v.id("agentOrchestrations"),
    agentKey: v.string(),
    status: v.string(),
    duration: v.number(),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("orchestrationExecutions", {
      orchestrationId: args.orchestrationId,
      agentKey: args.agentKey,
      status: args.status,
      duration: args.duration,
      result: args.result,
      error: args.error,
    });
  },
});

// Parallel Orchestration CRUD
export const createParallelOrchestration = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    agents: v.array(v.object({
      agentKey: v.string(),
      mode: v.string(),
      input: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("parallelOrchestrations", {
      ...args,
      isActive: false,
      createdAt: Date.now(),
    });
  },
});

export const listParallelOrchestrations = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("parallelOrchestrations").collect();
  },
});

export const updateParallelOrchestration = mutation({
  args: {
    orchestrationId: v.id("parallelOrchestrations"),
    name: v.string(),
    description: v.string(),
    agents: v.array(v.object({
      agentKey: v.string(),
      mode: v.string(),
      input: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const { orchestrationId, ...updates } = args;
    await ctx.db.patch(orchestrationId, { ...updates, updatedAt: Date.now() });
  },
});

export const deleteParallelOrchestration = mutation({
  args: { orchestrationId: v.id("parallelOrchestrations") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.orchestrationId);
  },
});

export const toggleParallelOrchestration = mutation({
  args: {
    orchestrationId: v.id("parallelOrchestrations"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orchestrationId, { isActive: args.isActive });
  },
});

// Chain Orchestration CRUD
export const createChainOrchestration = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    chain: v.array(v.object({
      agentKey: v.string(),
      mode: v.string(),
      inputTransform: v.optional(v.string()),
    })),
    initialInput: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("chainOrchestrations", {
      ...args,
      isActive: false,
      createdAt: Date.now(),
    });
  },
});

export const listChainOrchestrations = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("chainOrchestrations").collect();
  },
});

export const updateChainOrchestration = mutation({
  args: {
    orchestrationId: v.id("chainOrchestrations"),
    name: v.string(),
    description: v.string(),
    chain: v.array(v.object({
      agentKey: v.string(),
      mode: v.string(),
      inputTransform: v.optional(v.string()),
    })),
    initialInput: v.string(),
  },
  handler: async (ctx, args) => {
    const { orchestrationId, ...updates } = args;
    await ctx.db.patch(orchestrationId, { ...updates, updatedAt: Date.now() });
  },
});

export const deleteChainOrchestration = mutation({
  args: { orchestrationId: v.id("chainOrchestrations") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.orchestrationId);
  },
});

export const toggleChainOrchestration = mutation({
  args: {
    orchestrationId: v.id("chainOrchestrations"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orchestrationId, { isActive: args.isActive });
  },
});

// Consensus Orchestration CRUD
export const createConsensusOrchestration = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    agents: v.array(v.string()),
    question: v.string(),
    consensusThreshold: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("consensusOrchestrations", {
      ...args,
      isActive: false,
      createdAt: Date.now(),
    });
  },
});

export const listConsensusOrchestrations = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("consensusOrchestrations").collect();
  },
});

export const updateConsensusOrchestration = mutation({
  args: {
    orchestrationId: v.id("consensusOrchestrations"),
    name: v.string(),
    description: v.string(),
    agents: v.array(v.string()),
    question: v.string(),
    consensusThreshold: v.number(),
  },
  handler: async (ctx, args) => {
    const { orchestrationId, ...updates } = args;
    await ctx.db.patch(orchestrationId, { ...updates, updatedAt: Date.now() });
  },
});

export const deleteConsensusOrchestration = mutation({
  args: { orchestrationId: v.id("consensusOrchestrations") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.orchestrationId);
  },
});

export const toggleConsensusOrchestration = mutation({
  args: {
    orchestrationId: v.id("consensusOrchestrations"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orchestrationId, { isActive: args.isActive });
  },
});

// Add execution status tracking
export const getOrchestrationExecutions = query({
  args: {
    orchestrationId: v.optional(v.id("agentOrchestrations")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    if (args.orchestrationId) {
      const orchestrationId = args.orchestrationId;
      return await ctx.db
        .query("orchestrationExecutions")
        .withIndex("by_orchestration", (q) => q.eq("orchestrationId", orchestrationId))
        .order("desc")
        .take(limit);
    }
    
    return await ctx.db
      .query("orchestrationExecutions")
      .order("desc")
      .take(args.limit || 100);
  },
});

// Get recent orchestration runs with status
export const getRecentOrchestrationRuns = query({
  args: {
    type: v.optional(v.union(v.literal("parallel"), v.literal("chain"), v.literal("consensus"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    if (args.type) {
      return await ctx.db.query("agentOrchestrations")
        .withIndex("by_type", (q) => q.eq("type", args.type!))
        .order("desc")
        .take(limit);
    }
    
    return await ctx.db.query("agentOrchestrations")
      .order("desc")
      .take(limit);
  },
});

// Get agent performance metrics from orchestration executions
export const getAgentPerformanceFromOrchestrations = query({
  args: {
    agentKey: v.optional(v.string()),
    since: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const cutoff = args.since || (Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days default
    
    let executions;
    
    if (args.agentKey) {
      executions = await ctx.db
        .query("orchestrationExecutions")
        .withIndex("by_agent", (q) => q.eq("agentKey", args.agentKey!))
        .take(args.limit || 1000);
    } else {
      executions = await ctx.db
        .query("orchestrationExecutions")
        .take(args.limit || 1000);
    }

    const total = executions.length;
    const successful = executions.filter(e => e.status === "success").length;
    const failed = executions.filter(e => e.status === "failed").length;
    
    const avgDuration = total > 0
      ? executions.reduce((sum, e) => sum + (e.duration || 0), 0) / total
      : 0;

    const totalTokens = executions.reduce((sum, e) => {
      const input = e.metadata?.inputTokens || 0;
      const output = e.metadata?.outputTokens || 0;
      return sum + input + output;
    }, 0);

    return {
      agentKey: args.agentKey,
      total,
      successful,
      failed,
      successRate: total > 0 ? successful / total : 0,
      avgDuration,
      totalTokens,
      avgTokensPerExecution: total > 0 ? totalTokens / total : 0,
      recentExecutions: executions.slice(0, 10),
    };
  },
});

export const deleteOrchestrationRun = mutation({
  args: { orchestrationId: v.id("agentOrchestrations") },
  handler: async (ctx, args) => {
    // Delete all associated executions first
    const executions = await ctx.db
      .query("orchestrationExecutions")
      .withIndex("by_orchestration", (q) => q.eq("orchestrationId", args.orchestrationId))
      .collect();
    
    for (const exec of executions) {
      await ctx.db.delete(exec._id);
    }
    
    // Delete the orchestration run
    await ctx.db.delete(args.orchestrationId);
  },
});

/**
 * Orchestration Analytics: Get performance metrics
 */
export const getOrchestrationAnalytics = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    since: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const cutoff = args.since || (Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days default
    
    let orchestrations;
    
    if (args.businessId) {
      const businessId = args.businessId;
      orchestrations = await ctx.db
        .query("agentOrchestrations")
        .withIndex("by_business", q => q.eq("businessId", businessId))
        .filter(q => q.gte(q.field("createdAt"), cutoff))
        .take(args.limit || 100);
    } else {
      orchestrations = await ctx.db
        .query("agentOrchestrations")
        .filter(q => q.gte(q.field("createdAt"), cutoff))
        .take(args.limit || 100);
    }

    const executions = await ctx.db
      .query("orchestrationExecutions")
      .take(1000);

    // Calculate metrics
    const totalOrchestrations = orchestrations.length;
    const completedOrchestrations = orchestrations.filter(o => o.status === "completed").length;
    const failedOrchestrations = orchestrations.filter(o => o.status === "failed").length;
    
    const avgDuration = orchestrations.length > 0
      ? orchestrations.reduce((sum, o) => sum + (o.duration || 0), 0) / orchestrations.length
      : 0;

    const byType = orchestrations.reduce((acc, o) => {
      acc[o.type] = (acc[o.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const agentPerformance = executions.reduce((acc, e) => {
      if (!acc[e.agentKey]) {
        acc[e.agentKey] = { total: 0, success: 0, failed: 0, totalDuration: 0 };
      }
      acc[e.agentKey].total++;
      if (e.status === "success") acc[e.agentKey].success++;
      if (e.status === "failed") acc[e.agentKey].failed++;
      acc[e.agentKey].totalDuration += e.duration || 0;
      return acc;
    }, {} as Record<string, any>);

    return {
      summary: {
        totalOrchestrations,
        completedOrchestrations,
        failedOrchestrations,
        successRate: totalOrchestrations > 0 ? completedOrchestrations / totalOrchestrations : 0,
        avgDuration,
      },
      byType,
      agentPerformance: Object.entries(agentPerformance).map(([key, stats]) => ({
        agentKey: key,
        ...stats,
        successRate: stats.total > 0 ? stats.success / stats.total : 0,
        avgDuration: stats.total > 0 ? stats.totalDuration / stats.total : 0,
      })),
      recentOrchestrations: orchestrations.slice(0, 10),
    };
  },
});