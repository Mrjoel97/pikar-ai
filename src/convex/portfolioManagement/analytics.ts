import { v } from "convex/values";
import { query } from "../_generated/server";

export const getCrossBusinessAnalytics = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx: any, args) => {
    if (!args.businessId) {
      return {
        businesses: [],
        totalInitiatives: 0,
        avgCompletionRate: 0,
        topPerformers: [],
        underperformers: [],
      };
    }

    const allBusinesses = await ctx.db.query("businesses").collect();
    
    const businessMetrics = await Promise.all(
      allBusinesses.map(async (business: any) => {
        const initiatives = await ctx.db
          .query("initiatives")
          .withIndex("by_business", (q: any) => q.eq("businessId", business._id))
          .collect();

        const completed = initiatives.filter((i: any) => i.status === "completed").length;
        const active = initiatives.filter((i: any) => i.status === "active").length;
        const completionRate = initiatives.length > 0 ? (completed / initiatives.length) * 100 : 0;

        const metrics = await ctx.db
          .query("portfolioMetrics")
          .withIndex("by_business", (q: any) => q.eq("businessId", business._id))
          .first();

        return {
          businessId: business._id,
          businessName: business.name,
          totalInitiatives: initiatives.length,
          activeInitiatives: active,
          completedInitiatives: completed,
          completionRate,
          budget: metrics?.totalBudget || 0,
          spent: metrics?.totalSpent || 0,
          health: metrics?.overallHealth || "unknown",
        };
      })
    );

    const avgCompletionRate = businessMetrics.reduce((sum, m) => sum + m.completionRate, 0) / businessMetrics.length;
    const topPerformers = businessMetrics
      .filter((m) => m.completionRate > avgCompletionRate)
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 5);
    const underperformers = businessMetrics
      .filter((m) => m.completionRate < avgCompletionRate)
      .sort((a, b) => a.completionRate - b.completionRate)
      .slice(0, 5);

    return {
      businesses: businessMetrics,
      totalInitiatives: businessMetrics.reduce((sum, m) => sum + m.totalInitiatives, 0),
      avgCompletionRate: Math.round(avgCompletionRate),
      topPerformers,
      underperformers,
    };
  },
});

export const getPerformanceBenchmarks = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx: any, args) => {
    if (!args.businessId) {
      return {
        industryAverage: 0,
        businessScore: 0,
        percentile: 0,
        benchmarks: [],
      };
    }

    const allBusinesses = await ctx.db.query("businesses").collect();
    
    const scores = await Promise.all(
      allBusinesses.map(async (business: any) => {
        const initiatives = await ctx.db
          .query("initiatives")
          .withIndex("by_business", (q: any) => q.eq("businessId", business._id))
          .collect();

        const completed = initiatives.filter((i: any) => i.status === "completed").length;
        const score = initiatives.length > 0 ? (completed / initiatives.length) * 100 : 0;

        return { businessId: business._id, score };
      })
    );

    const industryAverage = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
    const businessScore = scores.find((s) => s.businessId === args.businessId)?.score || 0;
    const sortedScores = scores.map((s) => s.score).sort((a, b) => b - a);
    const percentile = (sortedScores.indexOf(businessScore) / sortedScores.length) * 100;

    return {
      industryAverage: Math.round(industryAverage),
      businessScore: Math.round(businessScore),
      percentile: Math.round(percentile),
      benchmarks: [
        { metric: "Completion Rate", value: businessScore, industry: industryAverage },
        { metric: "Active Initiatives", value: 0, industry: 0 },
        { metric: "Resource Efficiency", value: 0, industry: 0 },
      ],
    };
  },
});

export const getPredictiveInsights = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx: any, args) => {
    if (!args.businessId) {
      return {
        predictions: [],
        recommendations: [],
        riskForecasts: [],
      };
    }

    const initiatives = await ctx.db
      .query("initiatives")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .collect();

    const risks = await ctx.db
      .query("portfolioRisks")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .collect();

    const activeInitiatives = initiatives.filter((i: any) => i.status === "active");
    const completedInitiatives = initiatives.filter((i: any) => i.status === "completed");
    
    const avgCompletionTime = completedInitiatives.length > 0
      ? completedInitiatives.reduce((sum: any, i: any) => sum + (i.endDate || Date.now()) - i.startDate, 0) / completedInitiatives.length
      : 0;

    const predictions = activeInitiatives.map((initiative: any) => {
      const elapsed = Date.now() - initiative.startDate;
      const progress = elapsed / avgCompletionTime;
      const estimatedCompletion = initiative.startDate + avgCompletionTime;

      return {
        initiativeId: initiative._id,
        initiativeName: initiative.name,
        estimatedCompletionDate: estimatedCompletion,
        confidence: Math.min(progress * 100, 95),
        status: progress > 1.2 ? "at_risk" : progress > 0.8 ? "on_track" : "ahead",
      };
    });

    const recommendations = [
      {
        type: "resource_optimization",
        priority: "high",
        description: "Reallocate resources from over-staffed initiatives to critical projects",
        impact: "15% efficiency gain",
      },
      {
        type: "risk_mitigation",
        priority: "medium",
        description: "Address high-probability risks in active initiatives",
        impact: "Reduce risk exposure by 30%",
      },
    ];

    const riskForecasts = risks.map((risk: any) => ({
      riskId: risk._id,
      riskType: risk.riskType,
      currentImpact: risk.impact,
      forecastedImpact: risk.impact * 1.2,
      trend: "increasing",
    }));

    return {
      predictions,
      recommendations,
      riskForecasts,
    };
  },
});
