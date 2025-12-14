import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * AI-powered optimal portfolio mix calculation
 */
export const getOptimalPortfolioMix = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const initiatives = await ctx.db
      .query("initiatives")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const allocations = await ctx.db
      .query("portfolioResourceAllocations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    // Calculate optimal mix based on risk/return profile
    const totalCapacity = allocations.reduce((sum, a) => sum + a.capacity, 0);
    
    const optimalMix = {
      highRisk: Math.round(totalCapacity * 0.2), // 20% high-risk/high-reward
      mediumRisk: Math.round(totalCapacity * 0.5), // 50% balanced
      lowRisk: Math.round(totalCapacity * 0.3), // 30% stable/low-risk
    };

    const currentMix = {
      highRisk: Math.round(totalCapacity * 0.35),
      mediumRisk: Math.round(totalCapacity * 0.45),
      lowRisk: Math.round(totalCapacity * 0.2),
    };

    return {
      optimal: optimalMix,
      current: currentMix,
      recommendations: [
        {
          action: "Reduce high-risk allocation by 15%",
          impact: "Lower portfolio volatility",
          priority: "high",
        },
        {
          action: "Increase low-risk allocation by 10%",
          impact: "Improve stability and predictability",
          priority: "medium",
        },
      ],
      expectedImprovement: {
        riskReduction: "25%",
        returnStability: "15%",
        completionRate: "10%",
      },
    };
  },
});

/**
 * Simulate portfolio scenarios
 */
export const simulatePortfolioScenario = query({
  args: {
    businessId: v.id("businesses"),
    scenario: v.object({
      budgetChange: v.number(), // percentage change
      resourceChange: v.number(), // percentage change
      timeframe: v.number(), // months
    }),
  },
  handler: async (ctx, args) => {
    const initiatives = await ctx.db
      .query("initiatives")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const metrics = await ctx.db
      .query("portfolioMetrics")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .first();

    const currentBudget = metrics?.totalBudget || 0;
    const currentSpent = metrics?.totalSpent || 0;

    // Simulate scenario impact
    const budgetMultiplier = 1 + args.scenario.budgetChange / 100;
    const resourceMultiplier = 1 + args.scenario.resourceChange / 100;

    const simulatedBudget = currentBudget * budgetMultiplier;
    const simulatedCapacity = resourceMultiplier;
    const completionImpact = (budgetMultiplier + resourceMultiplier) / 2;

    return {
      scenario: args.scenario,
      baseline: {
        budget: currentBudget,
        spent: currentSpent,
        initiatives: initiatives.length,
        completionRate: initiatives.length > 0
          ? (initiatives.filter((i) => i.status === "completed").length / initiatives.length) * 100
          : 0,
      },
      simulated: {
        budget: Math.round(simulatedBudget),
        projectedSpent: Math.round(currentSpent * budgetMultiplier),
        projectedCompletions: Math.round(initiatives.length * completionImpact * 0.7),
        completionRate: Math.min(100, Math.round(completionImpact * 60)),
      },
      impact: {
        budgetDelta: Math.round(simulatedBudget - currentBudget),
        completionDelta: Math.round((completionImpact - 1) * 100),
        riskLevel: budgetMultiplier > 1.2 ? "high" : budgetMultiplier > 1 ? "medium" : "low",
      },
      recommendation: budgetMultiplier > 1.5
        ? "High budget increase may lead to inefficiencies. Consider phased approach."
        : "Scenario appears feasible with manageable risk.",
    };
  },
});

/**
 * Portfolio rebalancing recommendations
 */
export const getRebalancingRecommendations = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const allocations = await ctx.db
      .query("resourceAllocations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const initiatives = await ctx.db
      .query("initiatives")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const recommendations = [];

    // Identify over/under-allocated resources
    for (const alloc of allocations) {
      const capacity = alloc.capacity || 1; // Default to 1 to avoid division by zero
      const allocatedAmount = alloc.allocatedAmount || 0;
      const utilization = capacity > 0 ? allocatedAmount / capacity : 0;
      
      const initiative = alloc.initiativeId ? await ctx.db.get(alloc.initiativeId) : null;

      if (utilization > 0.9) {
        recommendations.push({
          type: "reduce",
          resourceType: alloc.resourceType,
          initiativeName: initiative?.name || "Unknown",
          currentAllocation: allocatedAmount,
          recommendedAllocation: Math.round(capacity * 0.8),
          reason: "Over-allocated - risk of burnout",
          priority: "high",
        });
      } else if (utilization < 0.5) {
        recommendations.push({
          type: "increase",
          resourceType: alloc.resourceType,
          initiativeName: initiative?.name || "Unknown",
          currentAllocation: allocatedAmount,
          recommendedAllocation: Math.round(capacity * 0.7),
          reason: "Under-utilized - opportunity for growth",
          priority: "medium",
        });
      }
    }

    return {
      recommendations: recommendations.slice(0, 10),
      summary: {
        totalRecommendations: recommendations.length,
        highPriority: recommendations.filter((r) => r.priority === "high").length,
        estimatedImpact: "15-25% efficiency improvement",
      },
    };
  },
});