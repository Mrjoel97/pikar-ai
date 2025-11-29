import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Record an agent execution for performance tracking
 */
export const recordExecution = mutation({
  args: {
    agentKey: v.string(),
    businessId: v.optional(v.id("businesses")),
    status: v.union(v.literal("success"), v.literal("failure")),
    responseTime: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Find the agent in catalog by key
    const agent = await ctx.db
      .query("agentCatalog")
      .withIndex("by_agent_key", (q) => q.eq("agent_key", args.agentKey))
      .first();

    if (!agent) {
      console.warn(`Agent not found in catalog: ${args.agentKey}`);
      return null;
    }

    // Create a temporary aiAgents entry if needed for tracking
    // (In production, you'd link to actual agent instances)
    let agentId: Id<"aiAgents"> | null = null;
    
    if (args.businessId) {
      const existingAgent = await ctx.db
        .query("aiAgents")
        .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
        .filter((q) => q.eq(q.field("type"), args.agentKey))
        .first();

      if (existingAgent) {
        agentId = existingAgent._id;
      } else {
        // Create tracking agent instance
        agentId = await ctx.db.insert("aiAgents", {
          name: agent.display_name,
          type: args.agentKey,
          businessId: args.businessId,
          isActive: true,
          performance: {
            successRate: 0,
            tasksCompleted: 0,
          },
        });
      }
    } else {
      // For global agents (landing chat, admin assistant), create a system-level tracking entry
      const systemAgent = await ctx.db
        .query("aiAgents")
        .withIndex("by_type", (q) => q.eq("type", args.agentKey))
        .filter((q) => q.eq(q.field("businessId"), undefined))
        .first();

      if (systemAgent) {
        agentId = systemAgent._id;
      } else {
        // Create system-level tracking agent
        const businesses = await ctx.db.query("businesses").first();
        if (businesses) {
          agentId = await ctx.db.insert("aiAgents", {
            name: agent.display_name,
            type: args.agentKey,
            businessId: businesses._id,
            isActive: true,
            performance: {
              successRate: 0,
              tasksCompleted: 0,
            },
          });
        }
      }
    }

    if (!agentId) {
      console.warn("Could not create or find agent instance for tracking");
      return null;
    }

    // Record the execution
    const executionId = await ctx.db.insert("agentExecutions", {
      agentId,
      businessId: args.businessId || (await ctx.db.query("businesses").first())?._id!,
      status: args.status,
      responseTime: args.responseTime,
      timestamp: now,
      errorMessage: args.errorMessage,
    });

    return executionId;
  },
});

/**
 * Get performance metrics for a specific agent
 */
export const getAgentMetrics = query({
  args: {
    agentKey: v.string(),
    timeRange: v.optional(v.union(
      v.literal("24h"),
      v.literal("7d"),
      v.literal("30d"),
      v.literal("all")
    )),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const timeRange = args.timeRange || "7d";
    
    let startTime = 0;
    if (timeRange === "24h") startTime = now - 24 * 60 * 60 * 1000;
    else if (timeRange === "7d") startTime = now - 7 * 24 * 60 * 60 * 1000;
    else if (timeRange === "30d") startTime = now - 30 * 24 * 60 * 60 * 1000;

    // Find all agent instances with this type
    const agents = await ctx.db
      .query("aiAgents")
      .withIndex("by_type", (q) => q.eq("type", args.agentKey))
      .collect();

    if (agents.length === 0) {
      return {
        agentKey: args.agentKey,
        totalExecutions: 0,
        successCount: 0,
        failureCount: 0,
        successRate: 0,
        avgResponseTime: 0,
        recentExecutions: [],
      };
    }

    // Collect all executions for these agents
    const allExecutions = [];
    for (const agent of agents) {
      const executions = await ctx.db
        .query("agentExecutions")
        .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
        .filter((q) => q.gte(q.field("timestamp"), startTime))
        .collect();
      allExecutions.push(...executions);
    }

    const totalExecutions = allExecutions.length;
    const successCount = allExecutions.filter((e) => e.status === "success").length;
    const failureCount = allExecutions.filter((e) => e.status === "failure").length;
    const successRate = totalExecutions > 0 ? (successCount / totalExecutions) * 100 : 0;

    const responseTimes = allExecutions
      .filter((e) => e.responseTime !== undefined)
      .map((e) => e.responseTime!);
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    // Get recent executions (last 10)
    const recentExecutions = allExecutions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)
      .map((e) => ({
        timestamp: e.timestamp,
        status: e.status,
        responseTime: e.responseTime,
        errorMessage: e.errorMessage,
      }));

    return {
      agentKey: args.agentKey,
      totalExecutions,
      successCount,
      failureCount,
      successRate: Math.round(successRate * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime),
      recentExecutions,
    };
  },
});

/**
 * Get performance overview for all agents
 */
export const getAllAgentsMetrics = query({
  args: {
    timeRange: v.optional(v.union(
      v.literal("24h"),
      v.literal("7d"),
      v.literal("30d"),
      v.literal("all")
    )),
  },
  handler: async (ctx, args) => {
    const catalog = await ctx.db.query("agentCatalog").collect();
    
    const metrics = [];
    for (const agent of catalog) {
      const agentMetrics = await getAgentMetrics(ctx, {
        agentKey: agent.agent_key,
        timeRange: args.timeRange,
      });
      
      metrics.push({
        agentKey: agent.agent_key,
        displayName: agent.display_name,
        active: agent.active,
        ...agentMetrics,
      });
    }

    return metrics;
  },
});

/**
 * Get detailed execution history for an agent
 */
export const getExecutionHistory = query({
  args: {
    agentKey: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    // Find all agent instances with this type
    const agents = await ctx.db
      .query("aiAgents")
      .withIndex("by_type", (q) => q.eq("type", args.agentKey))
      .collect();

    if (agents.length === 0) {
      return [];
    }

    // Collect executions from all instances
    const allExecutions = [];
    for (const agent of agents) {
      const executions = await ctx.db
        .query("agentExecutions")
        .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
        .order("desc")
        .take(limit);
      
      allExecutions.push(...executions.map(e => ({
        ...e,
        agentName: agent.name,
      })));
    }

    // Sort by timestamp and limit
    return allExecutions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  },
});
