import { v } from "convex/values";
import { mutation, query, action } from "../_generated/server";

/**
 * Create an automated journey trigger
 */
export const createJourneyTrigger = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    triggerType: v.union(
      v.literal("event"),
      v.literal("time"),
      v.literal("condition")
    ),
    conditions: v.object({
      event: v.optional(v.string()),
      field: v.optional(v.string()),
      operator: v.optional(v.string()),
      value: v.optional(v.any()),
      delay: v.optional(v.number()),
    }),
    actions: v.array(v.object({
      type: v.union(
        v.literal("move_stage"),
        v.literal("send_email"),
        v.literal("add_tag"),
        v.literal("notify")
      ),
      config: v.any(),
    })),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const triggerId = await ctx.db.insert("journeyTriggers", {
      businessId: args.businessId,
      name: args.name,
      description: args.description,
      triggerType: args.triggerType,
      conditions: args.conditions,
      actions: args.actions,
      isActive: args.isActive ?? true,
      createdAt: Date.now(),
      lastTriggered: undefined,
      triggerCount: 0,
    });

    return triggerId;
  },
});

/**
 * Get active triggers for a business
 */
export const getActiveTriggers = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const triggers = await ctx.db
      .query("journeyTriggers")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return triggers;
  },
});

/**
 * Test a trigger with sample data
 */
export const testTrigger = action({
  args: {
    triggerId: v.id("journeyTriggers"),
    testData: v.any(),
  },
  handler: async (ctx, args) => {
    const trigger = await ctx.runQuery("customerJourney.triggers:getTriggerById" as any, {
      triggerId: args.triggerId,
    });

    if (!trigger) {
      return { success: false, error: "Trigger not found" };
    }

    // Simulate trigger execution
    const results = [];
    for (const action of trigger.actions) {
      results.push({
        action: action.type,
        status: "simulated",
        config: action.config,
      });
    }

    return {
      success: true,
      trigger: trigger.name,
      results,
      testData: args.testData,
    };
  },
});

/**
 * Get trigger by ID (internal query)
 */
export const getTriggerById = query({
  args: { triggerId: v.id("journeyTriggers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.triggerId);
  },
});

/**
 * Update trigger status
 */
export const updateTriggerStatus = mutation({
  args: {
    triggerId: v.id("journeyTriggers"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(args.triggerId, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    });

    return args.triggerId;
  },
});
