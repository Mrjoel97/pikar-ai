import { query } from "./_generated/server";
import { v } from "convex/values";

export const getRiskMatrix = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx: any, args) => {
    // Guest/public: no business context → return empty matrix
    if (!args.businessId) {
      return {
        matrix: {},
        totalRisks: 0,
        highRisks: 0,
      };
    }
    const risks = await ctx.db
      .query("risks")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .collect();

    // Group risks by probability (1-5) and impact (1-5)
    const matrix: Record<string, Array<any>> = {};
    
    for (const risk of risks) {
      const key = `${risk.probability}_${risk.impact}`;
      if (!matrix[key]) {
        matrix[key] = [];
      }
      matrix[key].push(risk);
    }

    return {
      matrix,
      totalRisks: risks.length,
      highRisks: risks.filter((r: any) => r.probability >= 4 && r.impact >= 4).length,
    };
  },
});

export const getRiskTrend = query({
  args: { 
    businessId: v.optional(v.id("businesses")),
    days: v.optional(v.number())
  },
  handler: async (ctx: any, args) => {
    // Guest/public: no business context → return empty trend
    if (!args.businessId) {
      return {
        newRisks: 0,
        mitigatedRisks: 0,
        avgRiskScore: 0,
        byCategory: {},
        trendData: [],
        period: `${args.days ?? 30}d`,
      };
    }
    const days = args.days ?? 30;
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

    const risks = await ctx.db
      .query("risks")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .collect();

    const recentRisks = risks.filter((r: any) => r.createdAt >= cutoffTime);
    const newRisks = recentRisks.filter((r: any) => r.status === "identified");
    const mitigatedRisks = recentRisks.filter((r: any) => 
      r.status === "mitigated" && r.updatedAt >= cutoffTime
    );

    // Calculate average risk score (probability * impact)
    const avgRiskScore = risks.length > 0
      ? risks.reduce((sum: number, r: any) => sum + (r.probability * r.impact), 0) / risks.length
      : 0;

    // Group by category for trend analysis
    const byCategory: Record<string, number> = {};
    for (const risk of risks) {
      const category = risk.category || "uncategorized";
      byCategory[category] = (byCategory[category] || 0) + (risk.probability * risk.impact);
    }

    // Generate daily trend data
    const trendData = [];
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = Date.now() - i * 24 * 60 * 60 * 1000;
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      
      const dayRisks = risks.filter((r: any) => r.createdAt <= dayEnd);
      const dayScore = dayRisks.length > 0
        ? dayRisks.reduce((sum: number, r: any) => sum + (r.probability * r.impact), 0) / dayRisks.length
        : 0;

      trendData.push({
        date: new Date(dayStart).toISOString().split('T')[0],
        score: Math.round(dayScore * 100) / 100,
        count: dayRisks.length,
      });
    }

    return {
      newRisks: newRisks.length,
      mitigatedRisks: mitigatedRisks.length,
      avgRiskScore: Math.round(avgRiskScore * 100) / 100,
      byCategory,
      trendData,
      period: `${days}d`,
    };
  },
});

// NEW: Predictive risk modeling using historical trends
export const getPredictiveRiskModel = query({
  args: { 
    businessId: v.optional(v.id("businesses")),
    forecastDays: v.optional(v.number())
  },
  handler: async (ctx: any, args) => {
    if (!args.businessId) {
      return {
        predictions: [],
        confidence: 0,
        trendDirection: "stable" as const,
        estimatedNewRisks: 0,
      };
    }

    const forecastDays = args.forecastDays ?? 30;
    const historicalDays = 90;
    const cutoffTime = Date.now() - historicalDays * 24 * 60 * 60 * 1000;

    const risks = await ctx.db
      .query("risks")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .filter((q: any) => q.gte(q.field("createdAt"), cutoffTime))
      .collect();

    // Calculate weekly risk creation rate
    const weeklyRates = [];
    for (let week = 0; week < 12; week++) {
      const weekStart = Date.now() - (week + 1) * 7 * 24 * 60 * 60 * 1000;
      const weekEnd = Date.now() - week * 7 * 24 * 60 * 60 * 1000;
      const weekRisks = risks.filter((r: any) => r.createdAt >= weekStart && r.createdAt < weekEnd);
      weeklyRates.push(weekRisks.length);
    }

    // Simple linear regression for trend
    const avgRate = weeklyRates.reduce((a: any, b: any) => a + b, 0) / weeklyRates.length;
    const trend = weeklyRates.slice(0, 4).reduce((a: any, b: any) => a + b, 0) / 4 - 
                  weeklyRates.slice(-4).reduce((a: any, b: any) => a + b, 0) / 4;

    // Generate predictions
    const predictions = [];
    for (let day = 1; day <= forecastDays; day++) {
      const weekOffset = day / 7;
      const predictedRate = avgRate + (trend * weekOffset);
      const predictedScore = risks.length > 0
        ? risks.reduce((sum: any, r: any) => sum + (r.probability * r.impact), 0) / risks.length
        : 0;

      predictions.push({
        date: new Date(Date.now() + day * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        predictedScore: Math.max(0, Math.round(predictedScore * 100) / 100),
        confidence: Math.max(0, 100 - (day * 2)), // Confidence decreases over time
      });
    }

    return {
      predictions,
      confidence: Math.round((1 - Math.abs(trend) / avgRate) * 100),
      trendDirection: trend > 0.5 ? "increasing" as const : trend < -0.5 ? "decreasing" as const : "stable" as const,
      estimatedNewRisks: Math.round(avgRate * (forecastDays / 7)),
    };
  },
});

// NEW: Correlation analysis between risk categories
export const getRiskCorrelations = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx: any, args) => {
    if (!args.businessId) {
      return { correlations: [], strongCorrelations: [] };
    }

    const risks = await ctx.db
      .query("risks")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .collect();

    // Group risks by category and time windows
    const categories = Array.from(new Set(risks.map((r: any) => r.category || "uncategorized")));
    const correlations = [];

    for (let i = 0; i < categories.length; i++) {
      for (let j = i + 1; j < categories.length; j++) {
        const cat1 = categories[i];
        const cat2 = categories[j];

        const cat1Risks = risks.filter((r: any) => (r.category || "uncategorized") === cat1);
        const cat2Risks = risks.filter((r: any) => (r.category || "uncategorized") === cat2);

        // Calculate temporal correlation (risks occurring within 7 days)
        let coOccurrences = 0;
        for (const r1 of cat1Risks) {
          for (const r2 of cat2Risks) {
            if (Math.abs(r1.createdAt - r2.createdAt) < 7 * 24 * 60 * 60 * 1000) {
              coOccurrences++;
            }
          }
        }

        const correlation = cat1Risks.length > 0 && cat2Risks.length > 0
          ? coOccurrences / Math.sqrt(cat1Risks.length * cat2Risks.length)
          : 0;

        if (correlation > 0.1) {
          correlations.push({
            category1: cat1,
            category2: cat2,
            correlation: Math.round(correlation * 100) / 100,
            strength: correlation > 0.7 ? "strong" : correlation > 0.4 ? "moderate" : "weak",
          });
        }
      }
    }

    return {
      correlations: correlations.sort((a: any, b: any) => b.correlation - a.correlation),
      strongCorrelations: correlations.filter((c: any) => c.correlation > 0.7),
    };
  },
});

// NEW: Scenario planning and simulation
export const simulateRiskScenario = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    scenario: v.object({
      name: v.string(),
      categoryImpact: v.record(v.string(), v.number()), // category -> multiplier
      probabilityShift: v.number(), // -2 to +2
    }),
  },
  handler: async (ctx: any, args) => {
    if (!args.businessId) {
      return {
        scenarioName: args.scenario.name,
        currentRiskScore: 0,
        projectedRiskScore: 0,
        impactedRisks: 0,
        recommendations: [],
      };
    }

    const risks = await ctx.db
      .query("risks")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .collect();

    const currentScore = risks.reduce((sum: number, r: any) => sum + (r.probability * r.impact), 0);

    // Apply scenario modifications
    let projectedScore = 0;
    let impactedCount = 0;

    for (const risk of risks) {
      const category = risk.category || "uncategorized";
      const categoryMultiplier = args.scenario.categoryImpact[category] || 1;
      const newProbability = Math.max(1, Math.min(5, risk.probability + args.scenario.probabilityShift));
      const newImpact = risk.impact * categoryMultiplier;

      projectedScore += newProbability * newImpact;
      
      if (categoryMultiplier !== 1 || args.scenario.probabilityShift !== 0) {
        impactedCount++;
      }
    }

    const scoreDelta = projectedScore - currentScore;
    const recommendations = [];

    if (scoreDelta > currentScore * 0.2) {
      recommendations.push("High risk increase detected. Consider implementing preventive controls.");
      recommendations.push("Review and strengthen mitigation strategies for affected categories.");
    }

    if (impactedCount > risks.length * 0.5) {
      recommendations.push("Widespread impact detected. Conduct comprehensive risk assessment.");
    }

    return {
      scenarioName: args.scenario.name,
      currentRiskScore: Math.round(currentScore * 100) / 100,
      projectedRiskScore: Math.round(projectedScore * 100) / 100,
      scoreDelta: Math.round(scoreDelta * 100) / 100,
      percentageChange: currentScore > 0 ? Math.round((scoreDelta / currentScore) * 100) : 0,
      impactedRisks: impactedCount,
      recommendations,
    };
  },
});

// NEW: AI-powered mitigation recommendations
export const getMitigationRecommendations = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx: any, args) => {
    if (!args.businessId) {
      return { recommendations: [], priorityActions: [] };
    }

    const risks = await ctx.db
      .query("risks")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .filter((q: any) => q.neq(q.field("status"), "mitigated"))
      .collect();

    const recommendations = [];
    const priorityActions = [];

    // Analyze high-impact risks
    const criticalRisks = risks.filter((r: any) => r.probability * r.impact >= 16);
    if (criticalRisks.length > 0) {
      priorityActions.push({
        priority: "critical",
        action: `Address ${criticalRisks.length} critical risk(s) immediately`,
        affectedRisks: criticalRisks.length,
        estimatedImpact: "high",
      });
    }

    // Category-based recommendations
    const categoryGroups: Record<string, any[]> = {};
    for (const risk of risks) {
      const cat = risk.category || "uncategorized";
      if (!categoryGroups[cat]) categoryGroups[cat] = [];
      categoryGroups[cat].push(risk);
    }

    for (const [category, catRisks] of Object.entries(categoryGroups)) {
      if (catRisks.length >= 3) {
        const avgScore = catRisks.reduce((sum: any, r: any) => sum + (r.probability * r.impact), 0) / catRisks.length;
        
        recommendations.push({
          category,
          riskCount: catRisks.length,
          avgRiskScore: Math.round(avgScore * 100) / 100,
          recommendation: `Implement category-wide controls for ${category} risks`,
          estimatedReduction: Math.round(avgScore * 0.3 * 100) / 100,
        });
      }
    }

    // Trend-based recommendations
    const recentRisks = risks.filter((r: any) => r.createdAt > Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (recentRisks.length > risks.length * 0.4) {
      priorityActions.push({
        priority: "high",
        action: "Risk creation rate is accelerating. Review risk identification processes.",
        affectedRisks: recentRisks.length,
        estimatedImpact: "medium",
      });
    }

    return {
      recommendations: recommendations.sort((a: any, b: any) => b.avgRiskScore - a.avgRiskScore),
      priorityActions: priorityActions.sort((a: any, b: any) => 
        (a.priority === "critical" ? 0 : 1) - (b.priority === "critical" ? 0 : 1)
      ),
      totalRisksAnalyzed: risks.length,
    };
  },
});

// NEW: Advanced trend forecasting with seasonality
export const getAdvancedTrendForecast = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    forecastDays: v.optional(v.number()),
  },
  handler: async (ctx: any, args) => {
    if (!args.businessId) {
      return {
        forecast: [],
        seasonalityDetected: false,
        trendStrength: 0,
      };
    }

    const forecastDays = args.forecastDays ?? 30;
    const historicalDays = 180;
    const cutoffTime = Date.now() - historicalDays * 24 * 60 * 60 * 1000;

    const risks = await ctx.db
      .query("risks")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .filter((q: any) => q.gte(q.field("createdAt"), cutoffTime))
      .collect();

    // Calculate monthly averages
    const monthlyScores = [];
    for (let month = 0; month < 6; month++) {
      const monthStart = Date.now() - (month + 1) * 30 * 24 * 60 * 60 * 1000;
      const monthEnd = Date.now() - month * 30 * 24 * 60 * 60 * 1000;
      const monthRisks = risks.filter((r: any) => r.createdAt >= monthStart && r.createdAt < monthEnd);
      
      const avgScore = monthRisks.length > 0
        ? monthRisks.reduce((sum: any, r: any) => sum + (r.probability * r.impact), 0) / monthRisks.length
        : 0;
      
      monthlyScores.push(avgScore);
    }

    // Detect seasonality (simple variance check)
    const avgMonthly = monthlyScores.reduce((a: any, b: any) => a + b, 0) / monthlyScores.length;
    const variance = monthlyScores.reduce((sum: any, score: any) => sum + Math.pow(score - avgMonthly, 2), 0) / monthlyScores.length;
    const seasonalityDetected = variance > avgMonthly * 0.5;

    // Generate forecast
    const forecast = [];
    const recentTrend = monthlyScores[0] - monthlyScores[monthlyScores.length - 1];
    
    for (let day = 1; day <= forecastDays; day++) {
      const trendComponent = avgMonthly + (recentTrend * (day / 30));
      const seasonalComponent = seasonalityDetected ? Math.sin((day / 30) * Math.PI) * (avgMonthly * 0.2) : 0;
      
      forecast.push({
        date: new Date(Date.now() + day * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        forecastScore: Math.max(0, Math.round((trendComponent + seasonalComponent) * 100) / 100),
        upperBound: Math.round((trendComponent + seasonalComponent + variance) * 100) / 100,
        lowerBound: Math.max(0, Math.round((trendComponent + seasonalComponent - variance) * 100) / 100),
      });
    }

    return {
      forecast,
      seasonalityDetected,
      trendStrength: Math.abs(recentTrend) / avgMonthly,
      historicalAverage: Math.round(avgMonthly * 100) / 100,
    };
  },
});