import { v } from "convex/values";
import { action, internalAction, internalMutation, mutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { withErrorHandling } from "../utils";

// Workflow execution engine
export const runWorkflow = action({
  args: {
    workflowId: v.id("workflows"),
    startedBy: v.id("users"),
    dryRun: v.optional(v.boolean())
  },
  handler: withErrorHandling(async (ctx, args) => {
    const workflow: any = await ctx.runQuery(internal.workflows.getWorkflowInternal, {
      workflowId: args.workflowId
    });

    if (!workflow) throw new Error("Workflow not found");

    const runId: Id<"workflowExecutions"> = await ctx.runMutation(internal.workflows.execution.createWorkflowRun, {
      workflowId: args.workflowId,
      startedBy: args.startedBy ?? undefined,
      dryRun: args.dryRun || false,
      totalSteps: workflow.steps.length
    });

    await ctx.runAction(internal.workflows.execution.executeNext, { runId });

    return runId;
  }),
});

export const executeNext = internalAction({
  args: { runId: v.id("workflowRuns") },
  handler: withErrorHandling(async (ctx, args) => {
    const run: any = await ctx.runQuery(internal.workflows.getWorkflowRunInternal, {
      runId: args.runId
    });

    if (!run || run.status !== "running") return;

    const nextStep = run.steps.find((s: any) => s.status === "pending");
    if (!nextStep) {
      await ctx.runMutation(internal.workflows.execution.completeWorkflowRun, {
        runId: args.runId
      });
      return;
    }

    await ctx.runMutation(internal.workflows.execution.startRunStep, {
      runStepId: nextStep._id
    });

    const step: any = await ctx.runQuery(internal.workflows.getWorkflowStep, {
      stepId: nextStep.stepId
    });

    if (step?.type === "agent") {
      const output = {
        result: `Agent ${step.agentId || 'unknown'} executed: ${step.title}`,
        metrics: { confidence: 0.85, executionTime: Math.random() * 1000 },
        timestamp: Date.now()
      };

      await ctx.runMutation(internal.workflows.execution.completeRunStep, {
        runStepId: nextStep._id,
        output
      });

      await ctx.runAction(internal.workflows.execution.executeNext, { runId: args.runId });

    } else if (step?.type === "approval") {
      await ctx.runMutation(internal.workflows.execution.awaitApproval, {
        runStepId: nextStep._id
      });

    } else if (step?.type === "delay") {
      await ctx.runMutation(internal.workflows.execution.completeRunStep, {
        runStepId: nextStep._id,
        output: { skipped: true, reason: "Delay skipped in demo" }
      });

      await ctx.runAction(internal.workflows.execution.executeNext, { runId: args.runId });
    }
  }),
});

export const createWorkflowRun = internalMutation({
  args: {
    workflowId: v.id("workflows"),
    startedBy: v.optional(v.id("users")),
    dryRun: v.boolean(),
    totalSteps: v.number()
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) throw new Error("Workflow not found");

    return await ctx.db.insert("workflowRuns", {
      workflowId: args.workflowId,
      businessId: workflow.businessId,
      trigger: "manual",
      status: "running",
      startedAt: Date.now(),
    });
  },
});

export const completeWorkflowRun = internalMutation({
  args: { runId: v.id("workflowRuns") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.runId, {
      status: "completed",
      completedAt: Date.now(),
    });
  },
});

export const startRunStep = internalMutation({
  args: { runStepId: v.id("workflowRunSteps") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.runStepId, {
      status: "running",
      startedAt: Date.now(),
    });
  },
});

export const completeRunStep = internalMutation({
  args: {
    runStepId: v.id("workflowRunSteps"),
    output: v.any()
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.runStepId, {
      status: "completed",
      finishedAt: Date.now(),
      output: args.output
    });
  },
});

export const awaitApproval = internalMutation({
  args: { runStepId: v.id("workflowRunSteps") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.runStepId, {
      status: "awaiting_approval",
    });
  },
});

export const executeWorkflow = mutation({
  args: {
    workflowId: v.id("workflows"),
    input: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    const executionId = await ctx.db.insert("workflowExecutions", {
      workflowId: args.workflowId,
      businessId: workflow.businessId,
      status: "running",
      startedAt: Date.now(),
      mode: "manual",
      summary: "",
      metrics: { roi: 0 },
    });

    await ctx.scheduler.runAfter(0, internal.workflows.execution.runWorkflowExecution, {
      executionId,
      workflowId: args.workflowId,
      input: args.input || {},
    });

    return executionId;
  },
});

export const runWorkflowExecution = internalAction({
  args: {
    executionId: v.id("workflowExecutions"),
    workflowId: v.id("workflows"),
    input: v.any(),
  },
  handler: async (ctx, args) => {
    // Placeholder for actual execution logic
    await ctx.runMutation(internal.workflows.execution.updateExecutionStatus, {
      executionId: args.executionId,
      status: "completed",
    });
  },
});

export const updateExecutionStatus = internalMutation({
  args: {
    executionId: v.id("workflowExecutions"),
    status: v.union(v.literal("running"), v.literal("completed"), v.literal("failed")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.executionId, {
      status: args.status,
    });
  },
});