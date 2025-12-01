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