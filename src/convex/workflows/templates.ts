import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { withErrorHandling } from "../utils";

export const listTemplates = query({
  args: {},
  handler: withErrorHandling(async (ctx) => {
    return await ctx.db.query("workflowTemplates").collect();
  }),
});

export const getTemplates = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx: any, args: any) => {
    return await ctx.db
      .query("workflows")
      .withIndex("by_business_and_template", (q: any) => q.eq("businessId", args.businessId).eq("template", true))
      .order("desc")
      .collect();
  },
});

export const createFromTemplate = mutation({
  args: {
    businessId: v.id("businesses"),
    templateId: v.id("workflowTemplates"),
    createdBy: v.id("users")
  },
  handler: withErrorHandling(async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");

    const workflowId = await ctx.db.insert("workflows", {
      businessId: args.businessId,
      name: template.name,
      description: template.description,
      trigger: "manual",
      triggerConfig: {},
      isActive: true,
      createdBy: (args as any).createdBy,
      approvalPolicy: {
        type: "single",
        approvers: ["manager"]
      },
      associatedAgentIds: []
    });

    for (let i = 0; i < template.steps.length; i++) {
      const step = template.steps[i];
      await ctx.db.insert("workflowSteps", {
        workflowId,
        order: i,
        type: step.type,
        config: step.config,
        title: step.title,
        agentId: undefined
      });
    }

    return workflowId;
  }),
});

export const copyBuiltInTemplate = mutation({
  args: {
    businessId: v.id("businesses"),
    key: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { getBuiltInTemplateByKey } = await import("../templatesData");
    const t = getBuiltInTemplateByKey(args.key);
    if (!t) {
      throw new Error("Template not found");
    }

    const doc: any = {
      name: args.name ?? t.name,
      description: t.description,
      businessId: args.businessId,
      trigger: t.trigger,
      approval: t.approval,
      pipeline: t.pipeline,
      template: false,
      tags: t.tags,
      status: "draft",
    };

    const id = await ctx.db.insert("workflows", doc);
    return { id };
  },
});

export const upsertWorkflowTemplate = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    category: v.optional(v.string()),
    steps: v.array(v.any()),
    recommendedAgents: v.optional(v.array(v.string())),
    industryTags: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    createdBy: v.optional(v.id("users")),
    tier: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("workflowTemplates")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    const doc = {
      name: args.name,
      description: args.description,
      category: args.category,
      steps: args.steps,
      recommendedAgents: args.recommendedAgents,
      industryTags: args.industryTags,
      tags: args.tags,
      createdBy: args.createdBy,
      createdAt: existing ? existing.createdAt : Date.now(),
      tier: args.tier,
    } as any;

    if (existing) {
      await ctx.db.patch(existing._id, {
        description: doc.description,
        category: doc.category,
        steps: doc.steps,
        recommendedAgents: doc.recommendedAgents,
        industryTags: doc.industryTags,
        tags: doc.tags,
        tier: doc.tier,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("workflowTemplates", {
        ...doc,
        createdAt: Date.now(),
      });
    }
  },
});
