import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get funnel stages and metrics
 */
export const getFunnelStages = query({
  args: {
    businessId: v.id("businesses"),
    timeRange: v.optional(v.number()), // days
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const timeRange = args.timeRange || 30;
    const startTime = Date.now() - timeRange * 24 * 60 * 60 * 1000;

    // Get contacts in time range
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("createdAt"), startTime))
      .take(1000);

    // Define funnel stages
    const stages = [
      { name: "Awareness", count: contacts.length },
      { name: "Interest", count: contacts.filter((c) => c.status === "lead" || c.status === "active").length },
      { name: "Consideration", count: contacts.filter((c) => c.status === "active").length },
      { name: "Conversion", count: contacts.filter((c) => c.status === "customer").length },
      { name: "Retention", count: contacts.filter((c) => c.status === "customer" && c.updatedAt && c.updatedAt > startTime).length },
    ];

    return stages;
  },
});

/**
 * Get funnel conversion rates
 */
export const getFunnelConversion = query({
  args: {
    businessId: v.id("businesses"),
    timeRange: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const stages = await ctx.runQuery("analytics.funnel:getFunnelStages" as any, {
      businessId: args.businessId,
      timeRange: args.timeRange,
    });

    if (!stages || stages.length === 0) return null;

    const conversions = [];
    for (let i = 0; i < stages.length - 1; i++) {
      const current = stages[i];
      const next = stages[i + 1];
      const rate = current.count > 0 ? (next.count / current.count) * 100 : 0;

      conversions.push({
        from: current.name,
        to: next.name,
        rate: Math.round(rate * 10) / 10,
        count: next.count,
      });
    }

    return conversions;
  },
});

/**
 * Get funnel drop-off analysis
 */
export const getFunnelDropoff = query({
  args: {
    businessId: v.id("businesses"),
    timeRange: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const stages = await ctx.runQuery("analytics.funnel:getFunnelStages" as any, {
      businessId: args.businessId,
      timeRange: args.timeRange,
    });

    if (!stages || stages.length === 0) return null;

    const dropoffs = [];
    for (let i = 0; i < stages.length - 1; i++) {
      const current = stages[i];
      const next = stages[i + 1];
      const dropoffCount = current.count - next.count;
      const dropoffRate = current.count > 0 ? (dropoffCount / current.count) * 100 : 0;

      dropoffs.push({
        stage: current.name,
        dropoffCount,
        dropoffRate: Math.round(dropoffRate * 10) / 10,
        severity: dropoffRate > 70 ? "critical" : dropoffRate > 50 ? "high" : dropoffRate > 30 ? "medium" : "low",
      });
    }

    return dropoffs.sort((a, b) => b.dropoffRate - a.dropoffRate);
  },
});

/**
 * AI-powered optimization suggestions
 */
export const getOptimizationSuggestions = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const dropoffs = await ctx.runQuery("analytics.funnel:getFunnelDropoff" as any, {
      businessId: args.businessId,
    });

    if (!dropoffs || dropoffs.length === 0) return [];

    const suggestions = [];

    for (const dropoff of dropoffs) {
      if (dropoff.severity === "critical" || dropoff.severity === "high") {
        let suggestion = "";
        let action = "";

        switch (dropoff.stage) {
          case "Awareness":
            suggestion = "High drop-off at awareness stage indicates targeting issues";
            action = "Refine audience targeting and improve initial messaging";
            break;
          case "Interest":
            suggestion = "Losing prospects at interest stage suggests weak value proposition";
            action = "Enhance content quality and clarify benefits";
            break;
          case "Consideration":
            suggestion = "Drop-off at consideration indicates friction in decision process";
            action = "Add social proof, testimonials, and reduce barriers to entry";
            break;
          case "Conversion":
            suggestion = "High conversion drop-off suggests pricing or trust issues";
            action = "Optimize pricing, add guarantees, and simplify checkout";
            break;
          case "Retention":
            suggestion = "Poor retention indicates onboarding or product-market fit issues";
            action = "Improve onboarding experience and customer success programs";
            break;
        }

        suggestions.push({
          stage: dropoff.stage,
          severity: dropoff.severity,
          dropoffRate: dropoff.dropoffRate,
          suggestion,
          action,
          priority: dropoff.severity === "critical" ? "immediate" : "high",
        });
      }
    }

    return suggestions;
  },
});
