import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get comprehensive journey analytics
 */
export const getJourneyAnalytics = query({
  args: {
    businessId: v.id("businesses"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const transitions = await ctx.db
      .query("customerJourneyTransitions")
      .withIndex("by_business_and_date", (q) =>
        q.eq("businessId", args.businessId).gte("transitionedAt", cutoff)
      )
      .collect();

    const stages = await ctx.db
      .query("customerJourneyStages")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    // Calculate metrics
    const totalTransitions = transitions.length;
    const uniqueContacts = new Set(transitions.map((t) => t.contactId)).size;
    const avgTransitionsPerContact = uniqueContacts > 0 ? totalTransitions / uniqueContacts : 0;

    // Stage distribution
    const currentStages = stages.filter((s) => !s.exitedAt);
    const stageDistribution: Record<string, number> = {};
    for (const stage of currentStages) {
      stageDistribution[stage.stage] = (stageDistribution[stage.stage] || 0) + 1;
    }

    return {
      totalTransitions,
      uniqueContacts,
      avgTransitionsPerContact: Math.round(avgTransitionsPerContact * 10) / 10,
      stageDistribution,
      timeRange: days,
    };
  },
});

/**
 * Identify drop-off points in the journey
 */
export const getDropoffPoints = query({
  args: {
    businessId: v.id("businesses"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const transitions = await ctx.db
      .query("customerJourneyTransitions")
      .withIndex("by_business_and_date", (q) =>
        q.eq("businessId", args.businessId).gte("transitionedAt", cutoff)
      )
      .collect();

    // Count transitions by stage pair
    const transitionCounts: Record<string, { entered: number; exited: number }> = {};

    for (const transition of transitions) {
      const key = `${transition.fromStage}_to_${transition.toStage}`;
      if (!transitionCounts[key]) {
        transitionCounts[key] = { entered: 0, exited: 0 };
      }
      transitionCounts[key].entered++;
    }

    // Calculate drop-off rates
    const dropoffs = Object.entries(transitionCounts)
      .map(([key, counts]) => {
        const [from, , to] = key.split("_");
        const dropoffRate = counts.entered > 0 ? ((counts.entered - counts.exited) / counts.entered) * 100 : 0;
        return {
          from,
          to,
          entered: counts.entered,
          dropoffRate: Math.round(dropoffRate),
          severity: dropoffRate > 50 ? "high" : dropoffRate > 30 ? "medium" : "low",
        };
      })
      .filter((d) => d.dropoffRate > 20)
      .sort((a, b) => b.dropoffRate - a.dropoffRate);

    return dropoffs;
  },
});

/**
 * Get conversion rates between stages
 */
export const getConversionRates = query({
  args: {
    businessId: v.id("businesses"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const transitions = await ctx.db
      .query("customerJourneyTransitions")
      .withIndex("by_business_and_date", (q) =>
        q.eq("businessId", args.businessId).gte("transitionedAt", cutoff)
      )
      .collect();

    const stageOrder = ["awareness", "consideration", "decision", "retention", "advocacy"];
    const conversionRates = [];

    for (let i = 0; i < stageOrder.length - 1; i++) {
      const fromStage = stageOrder[i];
      const toStage = stageOrder[i + 1];

      const fromCount = transitions.filter((t) => t.fromStage === fromStage).length;
      const toCount = transitions.filter(
        (t) => t.fromStage === fromStage && t.toStage === toStage
      ).length;

      const rate = fromCount > 0 ? (toCount / fromCount) * 100 : 0;

      conversionRates.push({
        from: fromStage,
        to: toStage,
        rate: Math.round(rate * 10) / 10,
        count: toCount,
        total: fromCount,
      });
    }

    return conversionRates;
  },
});

/**
 * Get AI-powered optimization recommendations
 */
export const getOptimizationRecommendations = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const dropoffs = await ctx.runQuery("customerJourney.analytics:getDropoffPoints" as any, {
      businessId: args.businessId,
      days: 30,
    });

    const conversionRates = await ctx.runQuery("customerJourney.analytics:getConversionRates" as any, {
      businessId: args.businessId,
      days: 30,
    });

    const recommendations = [];

    // Analyze drop-offs
    for (const dropoff of dropoffs.slice(0, 3)) {
      if (dropoff.severity === "high") {
        recommendations.push({
          type: "critical",
          title: `High Drop-off: ${dropoff.from} → ${dropoff.to}`,
          description: `${dropoff.dropoffRate}% of contacts are dropping off at this transition.`,
          suggestion: `Add nurture campaigns or reduce friction between ${dropoff.from} and ${dropoff.to} stages.`,
          impact: "high",
          priority: 1,
        });
      }
    }

    // Analyze conversion rates
    for (const conversion of conversionRates) {
      if (conversion.rate < 30 && conversion.total > 10) {
        recommendations.push({
          type: "warning",
          title: `Low Conversion: ${conversion.from} → ${conversion.to}`,
          description: `Only ${conversion.rate}% conversion rate between these stages.`,
          suggestion: `Consider adding automated triggers or personalized content for ${conversion.from} stage.`,
          impact: "medium",
          priority: 2,
        });
      }
    }

    // Add positive feedback
    const bestConversion = conversionRates.reduce((best, curr) =>
      curr.rate > best.rate ? curr : best
    , conversionRates[0]);

    if (bestConversion && bestConversion.rate > 60) {
      recommendations.push({
        type: "success",
        title: `Strong Performance: ${bestConversion.from} → ${bestConversion.to}`,
        description: `${bestConversion.rate}% conversion rate - excellent!`,
        suggestion: `Replicate this success pattern in other stages.`,
        impact: "positive",
        priority: 3,
      });
    }

    return recommendations.sort((a, b) => a.priority - b.priority);
  },
});
