import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Agent Memory System - stores conversation history, learned patterns, and context
export const storeMemory = mutation({
  args: {
    agentId: v.id("aiAgents"),
    businessId: v.id("businesses"),
    memoryType: v.union(
      v.literal("conversation"),
      v.literal("pattern"),
      v.literal("context"),
      v.literal("feedback")
    ),
    content: v.string(),
    metadata: v.optional(v.any()),
    importance: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("agentMemories", {
      ...args,
      timestamp: now,
      createdAt: now,
      accessCount: 0,
      lastAccessed: now,
    });
  },
});

export const getAgentMemories = query({
  args: {
    agentId: v.id("aiAgents"),
    memoryType: v.optional(v.union(
      v.literal("conversation"),
      v.literal("pattern"),
      v.literal("context"),
      v.literal("feedback")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Optimized: Use take() instead of collect() when limit is specified
    const effectiveLimit = args.limit ? args.limit * 2 : 1000; // Fetch extra for sorting
    
    let query = ctx.db
      .query("agentMemories")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId));

    const memories = await query.take(effectiveLimit);
    
    // Filter by type if specified
    let filtered = args.memoryType 
      ? memories.filter(m => m.memoryType === args.memoryType)
      : memories;

    // Sort by importance and recency
    filtered.sort((a, b) => {
      const scoreA = a.importance * 0.7 + (a.lastAccessed / Date.now()) * 0.3;
      const scoreB = b.importance * 0.7 + (b.lastAccessed / Date.now()) * 0.3;
      return scoreB - scoreA;
    });

    return args.limit ? filtered.slice(0, args.limit) : filtered;
  },
});

export const updateMemoryAccess = mutation({
  args: {
    memoryId: v.id("agentMemories"),
  },
  handler: async (ctx, args) => {
    const memory = await ctx.db.get(args.memoryId);
    if (!memory) throw new Error("Memory not found");

    await ctx.db.patch(args.memoryId, {
      accessCount: memory.accessCount + 1,
      lastAccessed: Date.now(),
    });
  },
});

// Agent Collaboration System
export const createCollaboration = mutation({
  args: {
    businessId: v.id("businesses"),
    initiatorId: v.id("aiAgents"),
    targetId: v.id("aiAgents"),
    goal: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("agentCollaborations", {
      businessId: args.businessId,
      initiatorAgentId: args.initiatorId,
      targetAgentId: args.targetId,
      goal: args.goal,
      status: "in_progress",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      // sharedContext: {}, // Removed as it doesn't exist in schema
    });
  },
});

export const addCollaborationMessage = mutation({
  args: {
    collaborationId: v.id("agentCollaborations"),
    agentId: v.id("aiAgents"),
    message: v.string(),
    messageType: v.union(v.literal("task"), v.literal("result"), v.literal("question")),
  },
  handler: async (ctx, args) => {
    const collab = await ctx.db.get(args.collaborationId);
    if (!collab) throw new Error("Collaboration not found");

    const newMessage = {
      agentId: args.agentId,
      message: args.message,
      messageType: args.messageType,
      timestamp: Date.now(),
    };

    await ctx.db.patch(args.collaborationId, {
      messages: [...collab.messages, newMessage],
    });

    return newMessage;
  },
});

export const getActiveCollaborations = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    // Optimized: Use indexed query for status if available, otherwise filter efficiently
    const collabs = await ctx.db
      .query("agentCollaborations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .take(100); // Limit to prevent excessive reads
    
    return collabs.filter(c => c.status === "active");
  },
});

// Agent Learning System
export const recordLearningEvent = mutation({
  args: {
    agentId: v.id("aiAgents"),
    businessId: v.id("businesses"),
    eventType: v.union(
      v.literal("success"),
      v.literal("failure"),
      v.literal("feedback"),
      v.literal("correction")
    ),
    context: v.string(),
    outcome: v.string(),
    learningPoints: v.array(v.string()),
    description: v.string(),
    impactScore: v.number(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agentLearningEvents", {
      agentId: args.agentId,
      businessId: args.businessId,
      eventType: args.eventType,
      description: args.description,
      context: args.context,
      outcome: args.outcome,
      impactScore: args.impactScore,
      createdAt: Date.now(),
      data: args.data,
      // timestamp: Date.now(), // Removed as it doesn't exist in schema
    });
  },
});

export const getAgentLearningInsights = query({
  args: {
    agentId: v.id("aiAgents"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("agentLearningEvents")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .take(args.limit || 100);

    // Analyze patterns
    const successRate = events.filter(e => e.eventType === "success").length / events.length;
    const commonIssues = events
      .filter(e => e.eventType === "failure")
      .map(e => e.context);

    return {
      events,
      successRate,
      commonIssues,
      totalLearningEvents: events.length,
    };
  },
});

// Agent Analytics
export const getAgentPerformanceMetrics = query({
  args: {
    agentId: v.id("aiAgents"),
    timeRange: v.optional(v.number()), // milliseconds
  },
  handler: async (ctx, args) => {
    const cutoff = args.timeRange ? Date.now() - args.timeRange : 0;

    const executions = await ctx.db
      .query("agentExecutions")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .filter((q) => q.gte(q.field("startedAt"), cutoff)) // Changed from timestamp to startedAt
      .collect();

    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter(e => e.status === "success").length;
    const avgResponseTime = executions.reduce((sum, e) => sum + (e.responseTime || 0), 0) / totalExecutions;
    const errorRate = (totalExecutions - successfulExecutions) / totalExecutions;

    return {
      totalExecutions,
      successRate: successfulExecutions / totalExecutions,
      avgResponseTime,
      errorRate,
      recentExecutions: executions.slice(0, 10),
    };
  },
});

export const getBusinessAgentAnalytics = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const agents = await ctx.db
      .query("aiAgents")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const analytics = await Promise.all(
      agents.map(async (agent) => {
        const executions = await ctx.db
          .query("agentExecutions")
          .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
          .collect();

        return {
          agentId: agent._id,
          agentName: agent.name,
          totalExecutions: executions.length,
          successRate: executions.filter(e => e.status === "success").length / executions.length,
        };
      })
    );

    return analytics;
  },
});