import { v } from "convex/values";
import { query } from "../_generated/server";

export const getWorkflowAnalytics = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_business", q => q.eq("businessId", args.businessId))
      .collect();

    const runs = await ctx.db
      .query("workflowRuns")
      .withIndex("by_business", q => q.eq("businessId", args.businessId))
      .collect();

    const totalWorkflows = workflows.length;
    const activeWorkflows = workflows.filter(w => w.status === "active").length;
    const totalRuns = runs.length;
    const successfulRuns = runs.filter(r => r.status === "succeeded").length;
    const failedRuns = runs.filter(r => r.status === "failed").length;
    const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0;

    const completedRuns = runs.filter(r => r.completedAt);
    const avgExecutionTime = completedRuns.length > 0
      ? completedRuns.reduce((sum, r) => sum + (r.completedAt! - r.startedAt), 0) / completedRuns.length
      : 0;

    const workflowPerformance = workflows.map(w => ({
      id: w._id,
      name: w.name,
      totalRuns: w.metrics?.totalRuns || 0,
      successRate: w.metrics?.successRate || 0,
      avgExecutionTime: w.metrics?.avgExecutionTime || 0,
    })).sort((a, b) => b.totalRuns - a.totalRuns).slice(0, 5);

    const recentRuns = runs
      .sort((a, b) => b.startedAt - a.startedAt)
      .slice(0, 10)
      .map(r => {
        const workflow = workflows.find(w => w._id === r.workflowId);
        return {
          id: r._id,
          workflowName: workflow?.name || "Unknown",
          status: r.status,
          startedAt: r.startedAt,
          completedAt: r.completedAt,
          duration: r.completedAt ? r.completedAt - r.startedAt : null,
        };
      });

    return {
      summary: {
        totalWorkflows,
        activeWorkflows,
        totalRuns,
        successfulRuns,
        failedRuns,
        successRate,
        avgExecutionTime,
      },
      topWorkflows: workflowPerformance,
      recentRuns,
    };
  },
});

export const getWorkflowExecution = query({
  args: { runId: v.id("workflowRuns") },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) return null;

    const workflow = await ctx.db.get(run.workflowId);
    
    return {
      ...run,
      workflowName: workflow?.name || "Unknown",
      pipeline: workflow?.pipeline || [],
    };
  },
});
