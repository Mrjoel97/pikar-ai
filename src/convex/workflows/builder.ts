import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { withErrorHandling } from "../utils";

// Workflow creation and editing mutations
export const createWorkflow = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.string(),
    trigger: v.union(v.literal("manual"), v.literal("schedule"), v.literal("event")),
    triggerConfig: v.object({
      schedule: v.optional(v.string()),
      eventType: v.optional(v.string()),
      conditions: v.optional(v.array(v.object({
        field: v.string(),
        operator: v.string(),
        value: v.any()
      })))
    }),
    approvalPolicy: v.object({
      type: v.union(v.literal("none"), v.literal("single"), v.literal("tiered")),
      approvers: v.array(v.string()),
      tierGates: v.optional(v.array(v.object({
        tier: v.string(),
        required: v.boolean()
      })))
    }),
    associatedAgentIds: v.array(v.id("aiAgents")),
    createdBy: v.id("users")
  },
  handler: async (ctx: any, args: any) => {
    return await ctx.db.insert("workflows", {
      ...args,
      isActive: true
    });
  },
});

export const addStep = mutation({
  args: {
    workflowId: v.id("workflows"),
    type: v.union(v.literal("agent"), v.literal("approval"), v.literal("delay")),
    title: v.string(),
    config: v.object({
      delayMinutes: v.optional(v.number()),
      approverRole: v.optional(v.string()),
      agentPrompt: v.optional(v.string())
    }),
    agentId: v.optional(v.id("aiAgents"))
  },
  handler: withErrorHandling(async (ctx, args) => {
    const existingSteps = await ctx.db
      .query("workflowSteps")
      .withIndex("by_workflow_id", (q: any) => q.eq("workflowId", args.workflowId))
      .collect();

    const nextOrder = existingSteps.length;

    return await ctx.db.insert("workflowSteps", {
      workflowId: args.workflowId,
      order: nextOrder,
      type: args.type,
      config: args.config,
      agentId: args.agentId,
      title: args.title
    });
  }),
});

export const updateStep = mutation({
  args: {
    stepId: v.id("workflowSteps"),
    title: v.optional(v.string()),
    config: v.optional(v.object({
      delayMinutes: v.optional(v.number()),
      approverRole: v.optional(v.string()),
      agentPrompt: v.optional(v.string())
    })),
    agentId: v.optional(v.id("aiAgents"))
  },
  handler: withErrorHandling(async (ctx, args) => {
    const { stepId, ...updates } = args;
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(stepId, cleanUpdates);
  }),
});

export const toggleWorkflow = mutation({
  args: { workflowId: v.id("workflows"), isActive: v.boolean() },
  handler: withErrorHandling(async (ctx, args) => {
    await ctx.db.patch(args.workflowId, { isActive: args.isActive });
  }),
});

export const updateTrigger = mutation({
  args: {
    workflowId: v.id("workflows"),
    trigger: v.object({
      type: v.union(
        v.literal("manual"),
        v.literal("schedule"),
        v.literal("webhook"),
      ),
      cron: v.optional(v.string()),
      eventKey: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const wf = await ctx.db.get(args.workflowId);
    if (!wf) throw new Error("Workflow not found");

    await ctx.db.patch(args.workflowId, {
      trigger: {
        type: args.trigger.type,
        cron: args.trigger.type === "schedule" ? args.trigger.cron : undefined,
        eventKey: args.trigger.type === "webhook" ? args.trigger.eventKey : undefined,
      },
    });
  },
});

export const upsertWorkflow = mutation({
  args: {
    businessId: v.id("businesses"),
    id: v.optional(v.id("workflows")),
    name: v.string(),
    description: v.optional(v.string()),
    pipeline: v.array(v.any()),
    isActive: v.optional(v.boolean()),
    requiresHumanReview: v.optional(v.boolean()),
    approverRoles: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const workflowData = {
      businessId: args.businessId,
      name: args.name,
      description: args.description || "",
      pipeline: args.pipeline,
      isActive: args.isActive ?? true,
      requiresHumanReview: args.requiresHumanReview || false,
      approverRoles: args.approverRoles || [],
      status: "draft" as const,
      governanceHealth: {
        score: 85,
        issues: [],
        updatedAt: Date.now(),
      },
    };

    if (args.id) {
      await ctx.db.patch(args.id, workflowData);
      return args.id;
    } else {
      return await ctx.db.insert("workflows", workflowData);
    }
  },
});

export const createQuickFromIdea = mutation({
  args: {
    businessId: v.id("businesses"),
    idea: v.string(),
    initiativeId: v.optional(v.id("initiatives")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("[ERR_NOT_AUTHENTICATED] You must be signed in.");
    
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) throw new Error("[ERR_USER_NOT_FOUND] User not found.");

    const business = await ctx.db.get(args.businessId);
    if (!business) throw new Error("[ERR_BUSINESS_NOT_FOUND] Business not found.");

    const name = args.idea.length > 60 ? `${args.idea.slice(0, 57)}...` : args.idea;
    const description = `Auto-generated from Brain Dump: ${args.idea}`;

    const workflowId = await ctx.db.insert("workflows", {
      businessId: args.businessId,
      name: name || "Quick Workflow",
      description,
      trigger: { type: "manual" },
      approval: { required: false, threshold: 1 },
      pipeline: [
        { type: "agent", name: "Draft Output", role: "content", params: { prompt: args.idea } },
        { type: "approval", name: "Quick Review", role: "self", minSlaHours: 0 },
        { type: "delay", name: "Schedule", hours: 0 },
      ],
      template: false,
      tags: ["quick", "idea"],
      status: "draft",
    });

    return workflowId;
  },
});