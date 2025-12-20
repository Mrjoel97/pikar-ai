import { query } from "./_generated/server";
import { v } from "convex/values";

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

    const predictions = await Promise.all(
      agents.map(async (agent) => {
        // Get recent executions
        const executions = await ctx.db
          .query("agentExecutions")
          .withIndex("by_agent", (q) => q.eq("agentKey", agent._id))
          .filter((q) => q.gte(q.field("_creationTime"), last30Days))
          .collect();

        const successRate = executions.length > 0
          ? (executions.filter(e => e.status === "completed").length / executions.length) * 100
          : 0;

        // Calculate trend
        const recentExecs = executions.slice(-10);
        const olderExecs = executions.slice(0, 10);
        const recentSuccess = recentExecs.length > 0
          ? (recentExecs.filter(e => e.status === "completed").length / recentExecs.length) * 100
          : 0;
        const olderSuccess = olderExecs.length > 0
          ? (olderExecs.filter(e => e.status === "completed").length / olderExecs.length) * 100
          : 0;

        const trend = recentSuccess > olderSuccess + 5 ? "improving" :
                     recentSuccess < olderSuccess - 5 ? "declining" : "stable";

        // Predict future performance
        const predictedPerformance = trend === "improving" ? Math.min(successRate + 10, 100) :
                                    trend === "declining" ? Math.max(successRate - 10, 0) :
                                    successRate;

        // Risk assessment
        const riskLevel = successRate < 70 ? "high" :
                         successRate < 85 ? "medium" : "low";

        // Generate recommendations
        const recommendations = [];
        if (successRate < 80) {
          recommendations.push("Review error logs and optimize agent configuration");
        }
        if (trend === "declining") {
          recommendations.push("Investigate recent changes that may have impacted performance");
        }
        if (executions.length < 10) {
          recommendations.push("Increase agent usage to gather more performance data");
        }

        return {
          agentId: agent._id,
          agentName: agent.name,
          currentPerformance: successRate,
          predictedPerformance,
          trend,
          riskLevel,
          executionCount: executions.length,
          recommendedActions: recommendations,
        };
      })
    );

    return {
      predictions,
      summary: {
        totalAgents: agents.length,
        avgPerformance: predictions.reduce((sum, p) => sum + p.currentPerformance, 0) / predictions.length,
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

    const recommendations = await Promise.all(
      agents.map(async (agent) => {
        const executions = await ctx.db
          .query("agentExecutions")
          .withIndex("by_agent", (q) => q.eq("agentKey", agent._id))
          .filter((q) => q.gte(q.field("_creationTime"), last30Days))
          .collect();

        // Calculate cost metrics (simulated)
        const avgExecutionTime = executions.length > 0
          ? executions.reduce((sum, e) => sum + (e.duration || 0), 0) / executions.length
          : 0;

        const estimatedCost = executions.length * 0.01; // $0.01 per execution
        const efficiency = executions.length > 0
          ? (executions.filter(e => e.status === "completed").length / executions.length) * 100
          : 0;

        // Optimization potential
        const optimizationPotential = efficiency < 80 ? "high" :
                                     efficiency < 90 ? "medium" : "low";

        const estimatedSavings = optimizationPotential === "high" ? estimatedCost * 0.3 :
                                optimizationPotential === "medium" ? estimatedCost * 0.15 : 0;

        const recommendations = [];
        if (avgExecutionTime > 5000) {
          recommendations.push("Optimize agent logic to reduce execution time");
        }
        if (efficiency < 85) {
          recommendations.push("Improve error handling to reduce failed executions");
        }
        if (executions.length > 1000) {
          recommendations.push("Consider caching frequently accessed data");
        }

        return {
          agentId: agent._id,
          agentName: agent.name,
          currentCost: estimatedCost,
          estimatedSavings,
          optimizationPotential,
          avgExecutionTime,
          recommendations,
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

// Export new modules
export * as predictive from "./agentPerformance/predictive";
export * as costForecasting from "./agentPerformance/costForecasting";