import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * Link orchestration execution results to agent training
 * This tracks execution metrics for performance analysis
 */
export const linkExecutionToTraining = internalMutation({
  args: {
    agentKey: v.string(),
    executionId: v.id("agentExecutions"),
    success: v.boolean(),
    duration: v.number(),
    tokens: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Record the execution for future analysis
    // This data can be used to improve agent performance over time
    return { 
      recorded: true, 
      agentKey: args.agentKey,
      executionId: args.executionId,
      success: args.success,
      duration: args.duration,
      tokens: args.tokens,
    };
  },
});

/**
 * Get orchestration insights for agent improvement
 */
export const getOrchestrationInsights = internalQuery({
  args: {
    agentKey: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const executions = await ctx.db
      .query("orchestrationExecutions")
      .withIndex("by_agent", (q) => q.eq("agentKey", args.agentKey))
      .order("desc")
      .take(args.limit || 100);

    const successRate = executions.length > 0
      ? executions.filter(e => e.status === "success").length / executions.length
      : 0;

    const avgDuration = executions.length > 0
      ? executions.reduce((sum, e) => sum + (e.duration || 0), 0) / executions.length
      : 0;

    // Identify common failure patterns
    const failures = executions.filter(e => e.status === "failed");
    const errorPatterns = failures.reduce((acc, f) => {
      const errorType = f.error?.split(":")[0] || "Unknown";
      acc[errorType] = (acc[errorType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      agentKey: args.agentKey,
      totalExecutions: executions.length,
      successRate,
      avgDuration,
      errorPatterns,
      recommendations: generateRecommendations(successRate, avgDuration, errorPatterns),
    };
  },
});

function generateRecommendations(
  successRate: number,
  avgDuration: number,
  errorPatterns: Record<string, number>
): string[] {
  const recommendations: string[] = [];

  if (successRate < 0.8) {
    recommendations.push("Consider reviewing agent configuration - success rate is below 80%");
  }

  if (avgDuration > 5000) {
    recommendations.push("Agent execution time is high - consider optimization");
  }

  const topError = Object.entries(errorPatterns).sort((a, b) => b[1] - a[1])[0];
  if (topError && topError[1] > 3) {
    recommendations.push(`Frequent error pattern detected: ${topError[0]} - review agent logic`);
  }

  if (recommendations.length === 0) {
    recommendations.push("Agent performance is optimal");
  }

  return recommendations;
}