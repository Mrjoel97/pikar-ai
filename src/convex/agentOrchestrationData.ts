import { internalMutation, internalQuery } from "./_generated/server";
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
    await ctx.db.insert("agentExecutions", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Parallel Orchestration CRUD
export const createParallelOrchestration = internalMutation({
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

export const listParallelOrchestrations = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("parallelOrchestrations").collect();
  },
});

export const updateParallelOrchestration = internalMutation({
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

export const deleteParallelOrchestration = internalMutation({
  args: { orchestrationId: v.id("parallelOrchestrations") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.orchestrationId);
  },
});

export const toggleParallelOrchestration = internalMutation({
  args: {
    orchestrationId: v.id("parallelOrchestrations"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orchestrationId, { isActive: args.isActive });
  },
});

// Chain Orchestration CRUD
export const createChainOrchestration = internalMutation({
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

export const listChainOrchestrations = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("chainOrchestrations").collect();
  },
});

export const updateChainOrchestration = internalMutation({
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

export const deleteChainOrchestration = internalMutation({
  args: { orchestrationId: v.id("chainOrchestrations") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.orchestrationId);
  },
});

export const toggleChainOrchestration = internalMutation({
  args: {
    orchestrationId: v.id("chainOrchestrations"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orchestrationId, { isActive: args.isActive });
  },
});

// Consensus Orchestration CRUD
export const createConsensusOrchestration = internalMutation({
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

export const listConsensusOrchestrations = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("consensusOrchestrations").collect();
  },
});

export const updateConsensusOrchestration = internalMutation({
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

export const deleteConsensusOrchestration = internalMutation({
  args: { orchestrationId: v.id("consensusOrchestrations") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.orchestrationId);
  },
});

export const toggleConsensusOrchestration = internalMutation({
  args: {
    orchestrationId: v.id("consensusOrchestrations"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orchestrationId, { isActive: args.isActive });
  },
});

// Add execution status tracking
export const getOrchestrationExecutions = internalQuery({
  args: {
    orchestrationId: v.optional(v.id("agentOrchestrations")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.orchestrationId) {
      return await ctx.db
        .query("agentExecutions")
        .withIndex("by_orchestration", (q) => q.eq("orchestrationId", args.orchestrationId))
        .order("desc")
        .take(args.limit || 50);
    }
    
    return await ctx.db
      .query("agentExecutions")
      .order("desc")
      .take(args.limit || 100);
  },
});

// Get recent orchestration runs with status
export const getRecentOrchestrationRuns = internalQuery({
  args: {
    type: v.optional(v.union(v.literal("parallel"), v.literal("chain"), v.literal("consensus"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("agentOrchestrations");
    
    if (args.type) {
      query = query.withIndex("by_type", (q) => q.eq("type", args.type));
    }
    
    const runs = await query
      .order("desc")
      .take(args.limit || 20);
    
    return runs;
  },
});

/**
 * Orchestration Analytics: Get performance metrics
 */
export const getOrchestrationAnalytics = internalQuery({
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
      .query("agentExecutions")
      .filter(q => q.gte(q.field("createdAt"), cutoff))
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