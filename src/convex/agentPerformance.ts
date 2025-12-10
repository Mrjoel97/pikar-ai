import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const getAgentMetrics = query({
  args: { 
    agentId: v.id("aiAgents"),
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const executions = await ctx.db
      .query("agentExecutions")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();

    const total = executions.length;
    const successful = executions.filter(e => e.status === "success").length;
    const avgResponseTime = executions.reduce((sum, e) => sum + (e.responseTime || 0), 0) / (total || 1);

    return {
      totalExecutions: total,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      avgResponseTime,
      lastExecution: executions[0]?.timestamp || null,
    };
  },
});

export const getBusinessAgentPerformance = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const agents = await ctx.db
      .query("aiAgents")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const performance = await Promise.all(
      agents.map(async (agent) => {
        const executions = await ctx.db
          .query("agentExecutions")
          .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
          .collect();

        const total = executions.length;
        const successful = executions.filter(e => e.status === "success").length;
        const avgResponseTime = executions.reduce((sum, e) => sum + (e.responseTime || 0), 0) / (total || 1);

        return {
          agentId: agent._id,
          agentName: agent.name,
          totalExecutions: total,
          successRate: total > 0 ? (successful / total) * 100 : 0,
          avgResponseTime,
          lastExecution: executions[0]?.timestamp || null,
        };
      })
    );

    return performance;
  },
});

/**
 * Get predictive agent performance insights
 */
export const getPredictiveAgentInsights = query({
  args: { 
    businessId: v.id("businesses"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);

    const agents = await ctx.db
      .query("aiAgents")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const predictions = await Promise.all(
      agents.map(async (agent) => {
        const executions = await ctx.db
          .query("agentExecutions")
          .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
          .filter((q) => q.gte(q.field("timestamp"), cutoff))
          .collect();

        const total = executions.length;
        const successful = executions.filter(e => e.status === "success").length;
        const avgResponseTime = executions.reduce((sum, e) => sum + (e.responseTime || 0), 0) / (total || 1);

        // Calculate trend
        const recentExecutions = executions.slice(0, Math.floor(total / 2));
        const olderExecutions = executions.slice(Math.floor(total / 2));
        const recentSuccessRate = recentExecutions.length > 0 
          ? (recentExecutions.filter(e => e.status === "success").length / recentExecutions.length) * 100 
          : 0;
        const olderSuccessRate = olderExecutions.length > 0 
          ? (olderExecutions.filter(e => e.status === "success").length / olderExecutions.length) * 100 
          : 0;

        const trend = recentSuccessRate > olderSuccessRate ? "improving" : 
                     recentSuccessRate < olderSuccessRate ? "declining" : "stable";

        return {
          agentId: agent._id,
          agentName: agent.name,
          currentPerformance: total > 0 ? (successful / total) * 100 : 0,
          predictedPerformance: recentSuccessRate,
          trend,
          recommendedActions: trend === "declining" 
            ? ["Review recent failures", "Update training data", "Check resource allocation"]
            : trend === "improving"
            ? ["Scale up capacity", "Document best practices"]
            : ["Maintain current configuration"],
          riskLevel: trend === "declining" ? "high" : trend === "stable" ? "medium" : "low",
        };
      })
    );

    return {
      predictions,
      summary: {
        totalAgents: agents.length,
        improving: predictions.filter(p => p.trend === "improving").length,
        declining: predictions.filter(p => p.trend === "declining").length,
        stable: predictions.filter(p => p.trend === "stable").length,
      },
    };
  },
});

/**
 * Get agent cost optimization recommendations
 */
export const getAgentCostOptimization = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const agents = await ctx.db
      .query("aiAgents")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const recommendations = await Promise.all(
      agents.map(async (agent) => {
        const executions = await ctx.db
          .query("agentExecutions")
          .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
          .take(100);

        const avgCost = executions.reduce((sum, e) => sum + (e.cost || 0), 0) / (executions.length || 1);
        const totalCost = executions.reduce((sum, e) => sum + (e.cost || 0), 0);

        return {
          agentId: agent._id,
          agentName: agent.name,
          currentCost: totalCost,
          avgCostPerExecution: avgCost,
          optimizationPotential: avgCost > 0.5 ? "high" : avgCost > 0.2 ? "medium" : "low",
          recommendations: avgCost > 0.5 
            ? ["Consider model optimization", "Implement caching", "Batch similar requests"]
            : ["Current cost is optimal"],
          estimatedSavings: avgCost > 0.5 ? totalCost * 0.3 : 0,
        };
      })
    );

    return {
      recommendations,
      totalCurrentCost: recommendations.reduce((sum, r) => sum + r.currentCost, 0),
      totalPotentialSavings: recommendations.reduce((sum, r) => sum + r.estimatedSavings, 0),
    };
  },
});