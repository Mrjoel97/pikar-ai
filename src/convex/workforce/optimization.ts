import { v } from "convex/values";
import { query, mutation } from "../_generated/server";

export const getOptimizationRecommendations = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return {
      recommendations: [
        {
          category: "Resource Allocation",
          priority: "high",
          recommendation: "Reallocate 3 engineers from Project A to Project B",
          impact: "20% faster delivery",
        },
      ],
      costSavings: [
        {
          initiative: "Reduce contractor dependency",
          annualSavings: 480000,
          implementation: 50000,
        },
      ],
    };
  },
});

export const createOptimizationPlan = mutation({
  args: {
    businessId: v.id("businesses"),
    planName: v.string(),
    recommendations: v.array(v.any()),
    targetDate: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db.insert("workforceOptimizationPlans", {
      businessId: args.businessId,
      planName: args.planName,
      recommendations: args.recommendations,
      status: "draft",
      targetDate: args.targetDate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
