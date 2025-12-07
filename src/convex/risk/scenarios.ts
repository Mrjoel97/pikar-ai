import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Create a new risk scenario
 */
export const createScenario = mutation({
  args: {
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    likelihood: v.number(), // 1-5
    impact: v.number(), // 1-5
    timeframe: v.string(), // "immediate", "short-term", "medium-term", "long-term"
    affectedAreas: v.array(v.string()),
    assumptions: v.optional(v.array(v.string())),
    triggers: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const riskScore = args.likelihood * args.impact;
    
    const scenarioId = await ctx.db.insert("riskRegister", {
      businessId: args.businessId,
      title: args.title,
      description: args.description,
      category: args.category,
      probability: args.likelihood,
      impact: args.impact,
      riskScore,
      mitigation: "", // Will be added separately
      ownerId: args.businessId as any, // Placeholder
      createdBy: args.businessId as any, // Placeholder
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: "identified",
    });

    return scenarioId;
  },
});

/**
 * List all risk scenarios for a business
 */
export const listScenarios = query({
  args: {
    businessId: v.id("businesses"),
    category: v.optional(v.string()),
    minRiskScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("riskRegister")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId));

    const scenarios = await query.collect();

    let filtered = scenarios;
    
    if (args.category) {
      filtered = filtered.filter((s) => s.category === args.category);
    }
    
    if (args.minRiskScore !== undefined) {
      filtered = filtered.filter((s) => s.riskScore >= args.minRiskScore!);
    }

    return filtered.sort((a, b) => b.riskScore - a.riskScore);
  },
});

/**
 * Update risk scenario
 */
export const updateScenario = mutation({
  args: {
    scenarioId: v.id("riskRegister"),
    likelihood: v.optional(v.number()),
    impact: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal("identified"),
      v.literal("assessed"),
      v.literal("mitigated"),
      v.literal("closed")
    )),
  },
  handler: async (ctx, args) => {
    const scenario = await ctx.db.get(args.scenarioId);
    if (!scenario) throw new Error("Scenario not found");

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.likelihood !== undefined) {
      updates.probability = args.likelihood;
      updates.riskScore = args.likelihood * (args.impact ?? scenario.impact);
    }

    if (args.impact !== undefined) {
      updates.impact = args.impact;
      updates.riskScore = (args.likelihood ?? scenario.probability) * args.impact;
    }

    if (args.status) {
      updates.status = args.status;
    }

    await ctx.db.patch(args.scenarioId, updates);
    return args.scenarioId;
  },
});

/**
 * Run Monte Carlo simulation for risk scenarios
 */
export const runSimulation = query({
  args: {
    businessId: v.id("businesses"),
    iterations: v.number(),
  },
  handler: async (ctx, args) => {
    const scenarios = await ctx.db
      .query("riskRegister")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.neq(q.field("status"), "closed"))
      .collect();

    const results = [];
    
    for (let i = 0; i < args.iterations; i++) {
      let totalImpact = 0;
      const triggeredRisks = [];

      for (const scenario of scenarios) {
        // Simulate if risk occurs based on probability
        const random = Math.random() * 5;
        if (random <= scenario.probability) {
          totalImpact += scenario.impact;
          triggeredRisks.push(scenario._id);
        }
      }

      results.push({
        iteration: i + 1,
        totalImpact,
        triggeredCount: triggeredRisks.length,
        triggeredRisks,
      });
    }

    // Calculate statistics
    const impacts = results.map((r) => r.totalImpact);
    const avgImpact = impacts.reduce((a, b) => a + b, 0) / impacts.length;
    const maxImpact = Math.max(...impacts);
    const minImpact = Math.min(...impacts);

    return {
      iterations: args.iterations,
      avgImpact,
      maxImpact,
      minImpact,
      results: results.slice(0, 100), // Return first 100 for display
    };
  },
});
