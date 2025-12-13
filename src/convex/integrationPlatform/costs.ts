import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get integration costs
 */
export const getIntegrationCosts = query({
  args: {
    businessId: v.id("businesses"),
    timeRange: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const cutoff = args.timeRange ? Date.now() - args.timeRange : Date.now() - 30 * 24 * 60 * 60 * 1000;

    const integrations = await ctx.db
      .query("customIntegrations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const costs = await Promise.all(
      integrations.map(async (integration) => {
        const metrics = await ctx.db
          .query("integrationMetrics")
          .withIndex("by_integration", (q) => q.eq("integrationId", integration._id))
          .filter((q) => q.gte(q.field("timestamp"), cutoff))
          .collect();

        const requests = metrics.filter(m => m.metricType === "request").length;
        const costPerRequest = 0.001; // $0.001 per request
        const totalCost = requests * costPerRequest;

        return {
          integrationId: integration._id,
          name: integration.name,
          requests,
          totalCost,
          costPerRequest,
        };
      })
    );

    const totalCost = costs.reduce((sum, c) => sum + c.totalCost, 0);

    return {
      costs,
      totalCost,
      period: args.timeRange || 30 * 24 * 60 * 60 * 1000,
    };
  },
});

/**
 * Get cost trends over time
 */
export const getCostTrends = query({
  args: {
    businessId: v.id("businesses"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const trends = [];

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = Date.now() - i * 24 * 60 * 60 * 1000;
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const integrations = await ctx.db
        .query("customIntegrations")
        .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
        .collect();

      let dayCost = 0;
      for (const integration of integrations) {
        const metrics = await ctx.db
          .query("integrationMetrics")
          .withIndex("by_integration", (q) => q.eq("integrationId", integration._id))
          .filter((q) => 
            q.and(
              q.gte(q.field("timestamp"), dayStart),
              q.lt(q.field("timestamp"), dayEnd)
            )
          )
          .collect();

        const requests = metrics.filter(m => m.metricType === "request").length;
        dayCost += requests * 0.001;
      }

      trends.push({
        date: new Date(dayStart).toISOString().split('T')[0],
        cost: dayCost,
      });
    }

    return trends;
  },
});

/**
 * Get cost optimization suggestions
 */
export const getCostOptimizationSuggestions = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const integrations = await ctx.db
      .query("customIntegrations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const suggestions = [];

    for (const integration of integrations) {
      const metrics = await ctx.db
        .query("integrationMetrics")
        .withIndex("by_integration", (q) => q.eq("integrationId", integration._id))
        .filter((q) => q.gte(q.field("timestamp"), Date.now() - 7 * 24 * 60 * 60 * 1000))
        .collect();

      const errors = metrics.filter(m => m.metricType === "error").length;
      const requests = metrics.filter(m => m.metricType === "request").length;
      const errorRate = requests > 0 ? errors / requests : 0;

      if (errorRate > 0.1) {
        suggestions.push({
          integrationId: integration._id,
          integrationName: integration.name,
          type: "high_error_rate",
          description: `${integration.name} has a ${(errorRate * 100).toFixed(1)}% error rate, wasting ${(errors * 0.001).toFixed(2)} in failed requests`,
          potentialSavings: errors * 0.001,
          priority: "high",
        });
      }

      if (requests > 10000) {
        suggestions.push({
          integrationId: integration._id,
          integrationName: integration.name,
          type: "high_volume",
          description: `Consider caching or batching requests for ${integration.name} to reduce API calls`,
          potentialSavings: requests * 0.0005,
          priority: "medium",
        });
      }
    }

    return {
      suggestions,
      totalPotentialSavings: suggestions.reduce((sum, s) => sum + s.potentialSavings, 0),
    };
  },
});
