import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Define custom journey stages for a business
 */
export const defineJourneyStages = mutation({
  args: {
    businessId: v.id("businesses"),
    stages: v.array(v.object({
      name: v.string(),
      description: v.optional(v.string()),
      order: v.number(),
      color: v.optional(v.string()),
      icon: v.optional(v.string()),
      automations: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Delete existing stage definitions
    const existing = await ctx.db
      .query("journeyStageDefinitions")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    for (const stage of existing) {
      await ctx.db.delete(stage._id);
    }

    // Create new stage definitions
    const stageIds = [];
    for (const stage of args.stages) {
      const id = await ctx.db.insert("journeyStageDefinitions", {
        businessId: args.businessId,
        name: stage.name,
        description: stage.description,
        order: stage.order,
        color: stage.color || "#3b82f6",
        icon: stage.icon,
        automations: stage.automations || [],
        createdAt: Date.now(),
      });
      stageIds.push(id);
    }

    return stageIds;
  },
});

/**
 * Get journey stage definitions for a business
 */
export const getJourneyStages = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const stages = await ctx.db
      .query("journeyStageDefinitions")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    return stages.sort((a, b) => a.order - b.order);
  },
});

/**
 * Update a single stage definition
 */
export const updateStageDefinition = mutation({
  args: {
    stageId: v.id("journeyStageDefinitions"),
    updates: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      order: v.optional(v.number()),
      color: v.optional(v.string()),
      icon: v.optional(v.string()),
      automations: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(args.stageId, {
      ...args.updates,
      updatedAt: Date.now(),
    });

    return args.stageId;
  },
});
