import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Record an agent execution for tracking
 */
export const recordExecution = mutation({
  args: {
    agentId: v.id("aiAgents"),
    businessId: v.id("businesses"),
    taskId: v.optional(v.string()),
    input: v.any(),
    output: v.optional(v.any()),
    status: v.string(),
    duration: v.optional(v.number()),
    cost: v.optional(v.number()),
    tokensUsed: v.optional(v.number()),
    error: v.optional(v.string()),
    responseTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    await ctx.db.insert("agentExecutions", {
      agentId: args.agentId,
      businessId: args.businessId,
      taskId: args.taskId,
      input: args.input,
      output: args.output,
      status: args.status,
      duration: args.duration,
      cost: args.cost,
      tokensUsed: args.tokensUsed,
      startedAt: now - (args.duration || 0),
      completedAt: args.status === "completed" || args.status === "success" ? now : undefined,
      error: args.error,
      responseTime: args.responseTime || args.duration,
    });

    return { success: true };
  },
});

/**
 * Get predictive agent insights with trend analysis
 */
export const getPredictiveAgentInsights = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const agents = await ctx.db
      .query("aiAgents")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const last30Days = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const predictions = await Promise.all(agents.map(async (agent) => {
      // Get actual executions for this agent
      const executions = await ctx.db
        .query("agentExecutions")
        .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
        .filter((q) => q.gte(q.field("startedAt"), last30Days))
        .collect();

      const totalExecs = executions.length;
      const successfulExecs = executions.filter(e => e.status === "completed" || e.status === "success").length;
      const basePerformance = totalExecs > 0 ? (successfulExecs / totalExecs) * 100 : 75;

      // Calculate trend based on recent vs older executions
      const midPoint = Date.now() - 15 * 24 * 60 * 60 * 1000;
      const recentExecs = executions.filter(e => e.startedAt >= midPoint);
      const olderExecs = executions.filter(e => e.startedAt < midPoint);
      
      const recentSuccess = recentExecs.length > 0 
        ? (recentExecs.filter(e => e.status === "completed" || e.status === "success").length / recentExecs.length) * 100
        : basePerformance;
      const olderSuccess = olderExecs.length > 0
        ? (olderExecs.filter(e => e.status === "completed" || e.status === "success").length / olderExecs.length) * 100
        : basePerformance;

      const trend = recentSuccess > olderSuccess + 5 ? "improving" :
                   recentSuccess < olderSuccess - 5 ? "declining" : "stable";
      
      const predictedPerformance = trend === "improving" ? Math.min(basePerformance + 10, 100) :
                                  trend === "declining" ? Math.max(basePerformance - 10, 0) :
                                  basePerformance;

      const riskLevel = basePerformance < 70 ? "high" :
                       basePerformance < 85 ? "medium" : "low";

      const recommendations = [];
      if (basePerformance < 80) {
        recommendations.push("Review error logs and optimize agent configuration");
      }
      if (trend === "declining") {
        recommendations.push("Investigate recent changes that may have impacted performance");
      }
      if (totalExecs === 0) {
        recommendations.push("No execution data available - agent may need activation");
      }

      return {
        agentId: agent._id,
        agentName: agent.name,
        currentPerformance: Math.round(basePerformance),
        predictedPerformance: Math.round(predictedPerformance),
        trend,
        riskLevel,
        executionCount: totalExecs,
        recommendedActions: recommendations,
      };
    }));

    return {
      predictions,
      summary: {
        totalAgents: agents.length,
        avgPerformance: predictions.reduce((sum, p) => sum + p.currentPerformance, 0) / (predictions.length || 1),
        highRiskAgents: predictions.filter(p => p.riskLevel === "high").length,
      },
    };
  },
});

/**
 * Get agent cost optimization recommendations
 */
export const getAgentCostOptimization = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const agents = await ctx.db
      .query("aiAgents")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const last30Days = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const recommendations = await Promise.all(agents.map(async (agent) => {
      const executions = await ctx.db
        .query("agentExecutions")
        .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
        .filter((q) => q.gte(q.field("startedAt"), last30Days))
        .collect();

      const executionCount = executions.length;
      const totalCost = executions.reduce((sum, e) => sum + (e.cost || 0), 0);
      const failedCount = executions.filter(e => e.status === "failed" || e.status === "error").length;
      const efficiency = executionCount > 0 ? ((executionCount - failedCount) / executionCount) * 100 : 85;

      const optimizationPotential = efficiency < 80 ? "high" :
                                   efficiency < 90 ? "medium" : "low";

      const estimatedSavings = optimizationPotential === "high" ? totalCost * 0.3 :
                              optimizationPotential === "medium" ? totalCost * 0.15 : 0;

      const avgExecutionTime = executionCount > 0
        ? executions.reduce((sum, e) => sum + (e.duration || 0), 0) / executionCount
        : 0;

      const recommendations = [];
      if (avgExecutionTime > 5000) {
        recommendations.push("Optimize agent logic to reduce execution time");
      }
      if (efficiency < 85) {
        recommendations.push("Improve error handling to reduce failed executions");
      }
      if (executionCount > 1000) {
        recommendations.push("Consider caching frequently accessed data");
      }
      if (executionCount === 0) {
        recommendations.push("No execution data available for cost analysis");
      }

      return {
        agentId: agent._id,
        agentName: agent.name,
        currentCost: totalCost,
        estimatedSavings,
        optimizationPotential,
        avgExecutionTime: Math.round(avgExecutionTime),
        recommendations,
      };
    }));

    return {
      recommendations,
      totalCurrentCost: recommendations.reduce((sum, r) => sum + r.currentCost, 0),
      totalPotentialSavings: recommendations.reduce((sum, r) => sum + r.estimatedSavings, 0),
    };
  },
});

/**
 * Get comprehensive system agent analytics
 */
export const getSystemAgentAnalytics = query({
  args: {
    businessId: v.id("businesses"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const agents = await ctx.db
      .query("aiAgents")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    // Get all executions for this business in the time range
    const executions = await ctx.db
      .query("agentExecutions")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("startedAt"), cutoff))
      .collect();

    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter(e => e.status === "completed" || e.status === "success").length;
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;
    
    const uniqueUsers = new Set(executions.map(e => e.businessId)).size;
    
    const avgResponseTime = executions.length > 0
      ? executions.reduce((sum, e) => sum + (e.responseTime || 0), 0) / executions.length
      : 0;

    // Generate usage timeline
    const timelineMap = new Map<string, { executions: number; users: Set<string> }>();
    for (const exec of executions) {
      const date = new Date(exec.startedAt).toISOString().split('T')[0];
      if (!timelineMap.has(date)) {
        timelineMap.set(date, { executions: 0, users: new Set() });
      }
      const entry = timelineMap.get(date)!;
      entry.executions++;
      entry.users.add(exec.businessId);
    }

    const usageTimeline = Array.from(timelineMap.entries())
      .map(([date, data]) => ({
        date,
        executions: data.executions,
        users: data.users.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top agents by usage
    const agentUsageMap = new Map<string, number>();
    for (const exec of executions) {
      const count = agentUsageMap.get(exec.agentId) || 0;
      agentUsageMap.set(exec.agentId, count + 1);
    }

    const topAgents = await Promise.all(
      Array.from(agentUsageMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(async ([agentId, count]) => {
          const agent = await ctx.db.get(agentId as any);
          return {
            name: agent?.name || "Unknown",
            executions: count,
          };
        })
    );

    // Agent performance
    const agentPerformance = await Promise.all(
      agents.slice(0, 20).map(async (agent) => {
        const agentExecs = executions.filter(e => e.agentId === agent._id);
        const successful = agentExecs.filter(e => e.status === "completed" || e.status === "success").length;
        return {
          name: agent.name,
          successRate: agentExecs.length > 0 ? Math.round((successful / agentExecs.length) * 100) : 0,
          executions: agentExecs.length,
        };
      })
    );

    // Response time distribution
    const responseTimeDistribution = [
      { name: "< 500ms", value: executions.filter(e => (e.responseTime || 0) < 500).length },
      { name: "500ms-1s", value: executions.filter(e => (e.responseTime || 0) >= 500 && (e.responseTime || 0) < 1000).length },
      { name: "1s-2s", value: executions.filter(e => (e.responseTime || 0) >= 1000 && (e.responseTime || 0) < 2000).length },
      { name: "2s-5s", value: executions.filter(e => (e.responseTime || 0) >= 2000 && (e.responseTime || 0) < 5000).length },
      { name: "> 5s", value: executions.filter(e => (e.responseTime || 0) >= 5000).length },
    ];

    return {
      totalExecutions,
      successRate: Math.round(successRate),
      activeUsers: uniqueUsers,
      avgResponseTime: Math.round(avgResponseTime),
      usageTimeline,
      topAgents,
      agentPerformance,
      responseTimeDistribution,
    };
  },
});

// Export new modules
export * as predictive from "./agentPerformance/predictive";
export * as costForecasting from "./agentPerformance/costForecasting";