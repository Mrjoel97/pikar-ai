import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { api } from "./_generated/api";

// Create a new playbook execution record
export const createExecution = mutation({
  args: {
    businessId: v.id("businesses"),
    playbookKey: v.string(),
    playbookVersion: v.string(),
    triggeredBy: v.optional(v.id("users")),
    input: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const executionId = await ctx.db.insert("playbookExecutions", {
      businessId: args.businessId,
      playbookKey: args.playbookKey,
      playbookVersion: args.playbookVersion,
      status: "pending",
      triggeredBy: args.triggeredBy,
      input: args.input,
      steps: [],
      startedAt: Date.now(),
      completedAt: undefined,
      error: undefined,
      result: undefined,
    });

    return { executionId };
  },
});

// Update execution status
export const updateExecutionStatus = internalMutation({
  args: {
    executionId: v.id("playbookExecutions"),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    error: v.optional(v.string()),
    result: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const execution = await ctx.db.get(args.executionId);
    if (!execution) throw new Error("Execution not found");

    const updates: any = {
      status: args.status,
    };

    if (args.status === "completed" || args.status === "failed") {
      updates.completedAt = Date.now();
    }

    if (args.error) {
      updates.error = args.error;
    }

    if (args.result) {
      updates.result = args.result;
    }

    await ctx.db.patch(args.executionId, updates);
  },
});

// Add execution step
export const addExecutionStep = internalMutation({
  args: {
    executionId: v.id("playbookExecutions"),
    stepName: v.string(),
    stepStatus: v.union(v.literal("pending"), v.literal("running"), v.literal("completed"), v.literal("failed")),
    stepResult: v.optional(v.any()),
    stepError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const execution = await ctx.db.get(args.executionId);
    if (!execution) throw new Error("Execution not found");

    const newStep = {
      name: args.stepName,
      status: args.stepStatus,
      result: args.stepResult,
      error: args.stepError,
      timestamp: Date.now(),
    };

    const updatedSteps = [...(execution.steps || []), newStep];
    await ctx.db.patch(args.executionId, { steps: updatedSteps });
  },
});

// Get execution by ID
export const getExecution = query({
  args: { executionId: v.id("playbookExecutions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.executionId);
  },
});

// List recent executions for a business
export const listExecutions = query({
  args: {
    businessId: v.id("businesses"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 20, 100);
    
    return await ctx.db
      .query("playbookExecutions")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .take(limit);
  },
});

// Retry a failed execution
export const retryExecution = mutation({
  args: { executionId: v.id("playbookExecutions") },
  handler: async (ctx, args) => {
    const execution = await ctx.db.get(args.executionId);
    if (!execution) throw new Error("Execution not found");

    if (execution.status !== "failed") {
      throw new Error("Can only retry failed executions");
    }

    // Create a new execution with the same parameters
    const newExecutionId = await ctx.db.insert("playbookExecutions", {
      businessId: execution.businessId,
      playbookKey: execution.playbookKey,
      playbookVersion: execution.playbookVersion,
      status: "pending",
      triggeredBy: execution.triggeredBy,
      input: execution.input,
      steps: [],
      startedAt: Date.now(),
      completedAt: undefined,
      error: undefined,
      result: undefined,
    });

    // Audit log
    await ctx.runMutation(api.audit.write as any, {
      action: "playbook_execution_retry",
      entityType: "playbookExecutions",
      entityId: newExecutionId,
      details: {
        originalExecutionId: args.executionId,
        playbookKey: execution.playbookKey,
      },
    });

    return { executionId: newExecutionId };
  },
});
