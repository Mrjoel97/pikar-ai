import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Track API usage for billing
 */
export const trackAPIUsage = mutation({
  args: {
    integrationId: v.id("customIntegrations"),
    requests: v.number(),
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("integrationMetrics", {
      integrationId: args.integrationId,
      metricType: "request",
      value: args.requests,
      timestamp: args.timestamp || Date.now(),
    });
  },
});

/**
 * Calculate costs for integrations
 */
export const calculateCosts = query({
  args: {
    businessId: v.id("businesses"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const integrations = await ctx.db
      .query("customIntegrations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const costs = await Promise.all(
      integrations.map(async (integration) => {
        const metrics = await ctx.db
          .query("integrationMetrics")
          .withIndex("by_integration", (q) => q.eq("integrationId", integration._id))
          .filter((q) => 
            q.and(
              q.gte(q.field("timestamp"), args.startDate),
              q.lte(q.field("timestamp"), args.endDate)
            )
          )
          .collect();

        const requests = metrics.filter(m => m.metricType === "request").length;
        const cost = requests * 0.001;

        return {
          integrationId: integration._id,
          integrationName: integration.name,
          requests,
          cost,
        };
      })
    );

    return {
      costs,
      totalCost: costs.reduce((sum, c) => sum + c.cost, 0),
      totalRequests: costs.reduce((sum, c) => sum + c.requests, 0),
      period: { start: args.startDate, end: args.endDate },
    };
  },
});

/**
 * Get billing forecast
 */
export const getBillingForecast = query({
  args: {
    businessId: v.id("businesses"),
    forecastDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.forecastDays || 30;
    const historicalDays = 7;
    
    const startDate = Date.now() - historicalDays * 24 * 60 * 60 * 1000;
    const integrations = await ctx.db
      .query("customIntegrations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    let totalHistoricalCost = 0;
    for (const integration of integrations) {
      const metrics = await ctx.db
        .query("integrationMetrics")
        .withIndex("by_integration", (q) => q.eq("integrationId", integration._id))
        .filter((q) => q.gte(q.field("timestamp"), startDate))
        .collect();

      const requests = metrics.filter(m => m.metricType === "request").length;
      totalHistoricalCost += requests * 0.001;
    }

    const avgDailyCost = totalHistoricalCost / historicalDays;
    const forecastedCost = avgDailyCost * days;

    return {
      forecastedCost,
      avgDailyCost,
      forecastPeriod: days,
      confidence: 0.85,
      basedOnDays: historicalDays,
    };
  },
});

/**
 * Get usage alerts
 */
export const getUsageAlerts = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const integrations = await ctx.db
      .query("customIntegrations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const alerts = [];
    const last24h = Date.now() - 24 * 60 * 60 * 1000;

    for (const integration of integrations) {
      const metrics = await ctx.db
        .query("integrationMetrics")
        .withIndex("by_integration", (q) => q.eq("integrationId", integration._id))
        .filter((q) => q.gte(q.field("timestamp"), last24h))
        .collect();

      const requests = metrics.filter(m => m.metricType === "request").length;
      const errors = metrics.filter(m => m.metricType === "error").length;
      const errorRate = requests > 0 ? errors / requests : 0;

      if (requests > 5000) {
        alerts.push({
          integrationId: integration._id,
          integrationName: integration.name,
          type: "high_usage",
          severity: "warning",
          message: `${integration.name} has made ${requests} requests in the last 24 hours`,
        });
      }

      if (errorRate > 0.15) {
        alerts.push({
          integrationId: integration._id,
          integrationName: integration.name,
          type: "high_error_rate",
          severity: "critical",
          message: `${integration.name} has a ${(errorRate * 100).toFixed(1)}% error rate`,
        });
      }
    }

    return alerts;
  },
});
