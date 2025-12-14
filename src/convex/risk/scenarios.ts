import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const createScenario = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    probability: v.number(),
    impact: v.number(),
    timeframe: v.string(),
    assumptions: v.array(v.object({
      factor: v.string(),
      value: v.string(),
      impact: v.string(),
    })),
    // createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const scenarioId = await ctx.db.insert("riskScenarios", {
      businessId: args.businessId,
      name: args.name,
      description: args.description,
      category: args.category,
      probability: args.probability,
      impact: args.impact,
      timeframe: args.timeframe,
      assumptions: args.assumptions,
      outcomes: [],
      status: "draft",
      // createdBy: args.createdBy,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return scenarioId;
  },
});

export const listScenarios = query({
  args: { 
    businessId: v.id("businesses"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let scenarios = await ctx.db
      .query("riskScenarios")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    if (args.status) {
      scenarios = scenarios.filter(s => s.status === args.status);
    }

    return scenarios;
  },
});

export const runScenarioSimulation = mutation({
  args: {
    scenarioId: v.id("riskScenarios"),
    iterations: v.number(),
  },
  handler: async (ctx, args) => {
    const scenario = await ctx.db.get(args.scenarioId);
    if (!scenario) throw new Error("Scenario not found");

    // Monte Carlo simulation logic
    const outcomes = [];
    for (let i = 0; i < Math.min(args.iterations, 10); i++) {
      const likelihood = Math.random();
      const financialImpact = Math.floor(Math.random() * 1000000);
      
      outcomes.push({
        description: `Outcome ${i + 1}: ${likelihood > 0.5 ? "Positive" : "Negative"} scenario`,
        likelihood,
        financialImpact,
      });
    }

    await ctx.db.patch(args.scenarioId, {
      status: "active",
      outcomes,
      updatedAt: Date.now(),
    });

    const avgImpact = outcomes.reduce((sum, o) => sum + o.financialImpact, 0) / outcomes.length;
    const maxImpact = Math.max(...outcomes.map(o => o.financialImpact));
    const minImpact = Math.min(...outcomes.map(o => o.financialImpact));

    return { avgImpact, maxImpact, minImpact, outcomes };
  },
});

export const getScenario = query({
  args: { scenarioId: v.id("riskScenarios") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.scenarioId);
  },
});

export const updateScenario = mutation({
  args: {
    scenarioId: v.id("riskScenarios"),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("archived")
    )),
    probability: v.optional(v.number()),
    impact: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      updatedAt: Date.now(),
    };
    
    if (args.status) updates.status = args.status;
    if (args.probability !== undefined) updates.probability = args.probability;
    if (args.impact !== undefined) updates.impact = args.impact;
    
    await ctx.db.patch(args.scenarioId, updates);
  },
});