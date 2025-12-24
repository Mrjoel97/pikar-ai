// Re-export from modular files
export { createWorkflow, addStep, updateStep, toggleWorkflow, updateTrigger, upsertWorkflow, createQuickFromIdea } from "./workflows/builder";
export { runWorkflow, executeNext, executeWorkflow } from "./workflows/execution";
export { listTemplates, getTemplates, createFromTemplate, copyBuiltInTemplate, upsertWorkflowTemplate } from "./workflows/templates";
export { getWorkflowAnalytics, getWorkflowExecution } from "./workflows/analytics";

// Keep only the core queries and governance helpers in main file
import { v } from "convex/values";
import { query, mutation, action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { withErrorHandling } from "./utils";
import { paginationOptsValidator } from "convex/server";

export const listWorkflows = query({
  args: {
    businessId: v.id("businesses"),
    templatesOnly: v.optional(v.boolean())
  },
  handler: async (ctx: any, args: any) => {
    return await ctx.db
      .query("workflows")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId))
      .order("desc")
      .collect();
  },
});

export const getWorkflow = query({
  args: { workflowId: v.id("workflows") },
  handler: withErrorHandling(async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) return null;

    const steps = await ctx.db
      .query("workflowSteps")
      .withIndex("by_workflow_id", (q: any) => q.eq("workflowId", args.workflowId))
      .collect();

    return { ...workflow, steps: steps.sort((a: any, b: any) => a.order - b.order) };
  }),
});

export const getByBusiness = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    try {
      return await ctx.db
        .query("workflows")
        .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
        .collect();
    } catch {
      const res: any[] = [];
      for await (const w of ctx.db.query("workflows")) {
        if (w.businessId === args.businessId) res.push(w);
      }
      return res;
    }
  },
});

export const getWorkflowInternal = internalQuery({
  args: { workflowId: v.id("workflows") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.workflowId);
  },
});

export const getWorkflowRunInternal = internalQuery({
  args: { runId: v.id("workflowRuns") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.runId);
  },
});

export const getWorkflowStep = internalQuery({
  args: { stepId: v.id("workflowSteps") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.stepId);
  },
});