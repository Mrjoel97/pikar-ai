import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const createMitigationStrategy = mutation({
  args: {
    businessId: v.id("businesses"),
    scenarioId: v.optional(v.id("riskScenarios")),
    riskId: v.optional(v.id("risks")),
    title: v.string(),
    description: v.string(),
    strategy: v.union(
      v.literal("avoid"),
      v.literal("mitigate"),
      v.literal("transfer"),
      v.literal("accept")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    ownerId: v.id("users"),
    targetDate: v.number(),
    estimatedCost: v.optional(v.number()),
    expectedImpactReduction: v.number(),
  },
  handler: async (ctx, args) => {
    const mitigationId = await ctx.db.insert("riskMitigations", {
      businessId: args.businessId,
      scenarioId: args.scenarioId,
      riskId: args.riskId,
      title: args.title,
      description: args.description,
      strategy: args.strategy,
      status: "planned",
      priority: args.priority,
      ownerId: args.ownerId,
      dueDate: args.targetDate,
      estimatedCost: args.estimatedCost,
      actualCost: 0,
      effectiveness: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return mitigationId;
  },
});

export const updateMitigationProgress = mutation({
  args: {
    mitigationId: v.id("riskMitigations"),
    status: v.optional(v.union(
      v.literal("planned"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    )),
    actualCost: v.optional(v.number()),
    effectiveness: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      updatedAt: Date.now(),
    };
    
    if (args.status) updates.status = args.status;
    if (args.actualCost !== undefined) updates.actualCost = args.actualCost;
    if (args.effectiveness !== undefined) updates.effectiveness = args.effectiveness;
    
    await ctx.db.patch(args.mitigationId, updates);
  },
});

export const listMitigations = query({
  args: { 
    businessId: v.id("businesses"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let mitigations = await ctx.db
      .query("riskMitigations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    if (args.status) {
      mitigations = mitigations.filter(m => m.status === args.status);
    }

    return mitigations;
  },
});

export const getMitigationEffectiveness = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const mitigations = await ctx.db
      .query("riskMitigations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    const avgEffectiveness = mitigations.reduce((sum, m) => sum + (m.effectiveness || 0), 0) / mitigations.length || 0;

    return {
      totalMitigations: mitigations.length,
      averageEffectiveness: Math.round(avgEffectiveness),
      byStrategy: mitigations.reduce((acc: any, m) => {
        if (!acc[m.strategy]) {
          acc[m.strategy] = { effectiveness: 0, count: 0 };
        }
        acc[m.strategy].effectiveness += (m.effectiveness || 0);
        acc[m.strategy].count += 1;
        return acc;
      }, {}),
    };
  },
});