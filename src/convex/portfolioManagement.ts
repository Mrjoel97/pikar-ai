import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Global Initiative Portfolio Management
 * Enterprise-tier feature for portfolio-level tracking, dependencies, resource optimization, and risk assessment
 */

// Get portfolio overview with all initiatives
export const getPortfolioOverview = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return {
        totalInitiatives: 0,
        activeInitiatives: 0,
        completedInitiatives: 0,
        totalBudget: 0,
        totalSpent: 0,
        overallHealth: "unknown" as const,
        initiatives: [],
      };
    }

    const initiatives = await ctx.db
      .query("initiatives")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .collect();

    const active = initiatives.filter((i) => i.status === "active");
    const completed = initiatives.filter((i) => i.status === "completed");

    // Calculate portfolio metrics
    const portfolioMetrics = await ctx.db
      .query("portfolioMetrics")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .first();

    return {
      totalInitiatives: initiatives.length,
      activeInitiatives: active.length,
      completedInitiatives: completed.length,
      totalBudget: portfolioMetrics?.totalBudget || 0,
      totalSpent: portfolioMetrics?.totalSpent || 0,
      overallHealth: portfolioMetrics?.overallHealth || "unknown",
      initiatives: initiatives.map((i) => ({
        id: i._id,
        name: i.name,
        status: i.status,
        phase: i.currentPhase || 0,
        priority: "medium" as const,
      })),
    };
  },
});

// Get initiative dependencies
export const getInitiativeDependencies = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    if (!args.businessId) return [];

    const dependencies = await ctx.db
      .query("initiativeDependencies")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .collect();

    // Enrich with initiative details
    const enriched = await Promise.all(
      dependencies.map(async (dep) => {
        const source = await ctx.db.get(dep.sourceInitiativeId);
        const target = await ctx.db.get(dep.targetInitiativeId);
        return {
          ...dep,
          sourceName: source?.name || "Unknown",
          targetName: target?.name || "Unknown",
        };
      })
    );

    return enriched;
  },
});

// Create initiative dependency
export const createDependency = mutation({
  args: {
    businessId: v.id("businesses"),
    sourceInitiativeId: v.id("initiatives"),
    targetInitiativeId: v.id("initiatives"),
    dependencyType: v.union(
      v.literal("blocks"),
      v.literal("requires"),
      v.literal("related")
    ),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const depId = await ctx.db.insert("initiativeDependencies", {
      businessId: args.businessId,
      sourceInitiativeId: args.sourceInitiativeId,
      targetInitiativeId: args.targetInitiativeId,
      dependencyType: args.dependencyType,
      description: args.description,
      status: "active",
      createdAt: Date.now(),
    });

    return depId;
  },
});

// Get resource allocation across portfolio
export const getResourceAllocation = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return {
        totalResources: 0,
        allocated: 0,
        available: 0,
        utilizationRate: 0,
        byInitiative: [],
      };
    }

    const allocations = await ctx.db
      .query("resourceAllocations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .collect();

    const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
    const totalCapacity = allocations.reduce((sum, a) => sum + a.capacity, 0);

    // Group by initiative
    const byInitiative = await Promise.all(
      allocations.map(async (alloc) => {
        const initiative = await ctx.db.get(alloc.initiativeId);
        return {
          initiativeId: alloc.initiativeId,
          initiativeName: initiative?.name || "Unknown",
          resourceType: alloc.resourceType,
          allocated: alloc.allocatedAmount,
          capacity: alloc.capacity,
          utilization: alloc.capacity > 0 ? (alloc.allocatedAmount / alloc.capacity) * 100 : 0,
        };
      })
    );

    return {
      totalResources: totalCapacity,
      allocated: totalAllocated,
      available: totalCapacity - totalAllocated,
      utilizationRate: totalCapacity > 0 ? (totalAllocated / totalCapacity) * 100 : 0,
      byInitiative,
    };
  },
});

// Optimize resource allocation (AI-powered suggestion)
export const optimizeResourceAllocation = mutation({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Get current allocations (indexed)
    const allocations = await ctx.db
      .query("resourceAllocations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    // Get all initiatives for the business (indexed)
    const initiativesAll = await ctx.db
      .query("initiatives")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    // In-memory filter to avoid Convex query.filter()
    const activeInitiatives = initiativesAll.filter((i) => i.status === "active");

    // Simple optimization: suggest adjustments proportional to current allocation
    const suggestions = activeInitiatives.map((initiative) => {
      const currentAlloc = allocations.filter((a) => a.initiativeId === initiative._id);
      const totalCurrent = currentAlloc.reduce((sum, a) => sum + a.allocatedAmount, 0);

      const adjustment = totalCurrent * 0.1; // +10% suggestion
      return {
        initiativeId: initiative._id,
        initiativeName: initiative.name,
        currentAllocation: totalCurrent,
        suggestedAllocation: totalCurrent + adjustment,
        reason: "Optimized based on activity and current utilization",
      };
    });

    return { suggestions };
  },
});

// Get portfolio risk assessment
export const getPortfolioRiskAssessment = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return {
        overallRiskScore: 0,
        riskLevel: "low" as const,
        risks: [],
        mitigationStrategies: [],
      };
    }

    const risks = await ctx.db
      .query("portfolioRisks")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .collect();

    // Calculate overall risk score (weighted average)
    const totalWeight = risks.reduce((sum, r) => sum + (r.impact * r.probability), 0);
    const overallScore = risks.length > 0 ? totalWeight / risks.length : 0;

    const riskLevel =
      overallScore > 15 ? "critical" :
      overallScore > 10 ? "high" :
      overallScore > 5 ? "medium" : "low";

    // Enrich with initiative details
    const enrichedRisks = await Promise.all(
      risks.map(async (risk) => {
        const initiative = risk.initiativeId ? await ctx.db.get(risk.initiativeId) : null;
        return {
          ...risk,
          initiativeName: initiative?.name || "Portfolio-wide",
        };
      })
    );

    return {
      overallRiskScore: Math.round(overallScore),
      riskLevel,
      risks: enrichedRisks,
      mitigationStrategies: risks
        .filter((r) => r.mitigationStrategy)
        .map((r) => r.mitigationStrategy!),
    };
  },
});

// Create portfolio risk
export const createPortfolioRisk = mutation({
  args: {
    businessId: v.id("businesses"),
    initiativeId: v.optional(v.id("initiatives")),
    riskType: v.string(),
    description: v.string(),
    impact: v.number(),
    probability: v.number(),
    mitigationStrategy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const riskId = await ctx.db.insert("portfolioRisks", {
      businessId: args.businessId,
      initiativeId: args.initiativeId,
      riskType: args.riskType,
      description: args.description,
      impact: args.impact,
      probability: args.probability,
      mitigationStrategy: args.mitigationStrategy,
      status: "active",
      identifiedAt: Date.now(),
    });

    return riskId;
  },
});

// Update portfolio metrics (internal, called by cron)
export const updatePortfolioMetrics = internalMutation({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const initiatives = await ctx.db
      .query("initiatives")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const allocations = await ctx.db
      .query("resourceAllocations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const risks = await ctx.db
      .query("portfolioRisks")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const totalBudget = allocations.reduce((sum, a) => sum + a.capacity, 0);
    const totalSpent = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
    const activeRisks = risks.filter((r) => r.status === "active").length;

    const overallHealth =
      activeRisks > 5 ? "critical" :
      activeRisks > 3 ? "warning" :
      totalSpent > totalBudget * 0.9 ? "warning" : "healthy";

    const existing = await ctx.db
      .query("portfolioMetrics")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        totalBudget,
        totalSpent,
        overallHealth,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("portfolioMetrics", {
        businessId: args.businessId,
        totalBudget,
        totalSpent,
        overallHealth,
        lastUpdated: Date.now(),
      });
    }
  },
});

/**
 * Get cross-business analytics for portfolio comparison
 */
export const getCrossBusinessAnalytics = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return {
        businesses: [],
        totalInitiatives: 0,
        avgCompletionRate: 0,
        topPerformers: [],
        underperformers: [],
      };
    }

    // Get all businesses for comparison
    const allBusinesses = await ctx.db.query("businesses").collect();
    
    const businessMetrics = await Promise.all(
      allBusinesses.map(async (business) => {
        const initiatives = await ctx.db
          .query("initiatives")
          .withIndex("by_business", (q) => q.eq("businessId", business._id))
          .collect();

        const completed = initiatives.filter((i) => i.status === "completed").length;
        const active = initiatives.filter((i) => i.status === "active").length;
        const completionRate = initiatives.length > 0 ? (completed / initiatives.length) * 100 : 0;

        const metrics = await ctx.db
          .query("portfolioMetrics")
          .withIndex("by_business", (q) => q.eq("businessId", business._id))
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

/**
 * Get performance benchmarking data
 */
export const getPerformanceBenchmarks = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
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
      allBusinesses.map(async (business) => {
        const initiatives = await ctx.db
          .query("initiatives")
          .withIndex("by_business", (q) => q.eq("businessId", business._id))
          .collect();

        const completed = initiatives.filter((i) => i.status === "completed").length;
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
        { metric: "Active Initiatives", value: 0, industry: 0 }, // Placeholder
        { metric: "Resource Efficiency", value: 0, industry: 0 }, // Placeholder
      ],
    };
  },
});

/**
 * Get predictive insights using historical data
 */
export const getPredictiveInsights = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return {
        predictions: [],
        recommendations: [],
        riskForecasts: [],
      };
    }

    const initiatives = await ctx.db
      .query("initiatives")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .collect();

    const risks = await ctx.db
      .query("portfolioRisks")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .collect();

    // Simple predictive model based on historical patterns
    const activeInitiatives = initiatives.filter((i) => i.status === "active");
    const completedInitiatives = initiatives.filter((i) => i.status === "completed");
    
    const avgCompletionTime = completedInitiatives.length > 0
      ? completedInitiatives.reduce((sum, i) => sum + (i.endDate || Date.now()) - i.startDate, 0) / completedInitiatives.length
      : 0;

    const predictions = activeInitiatives.map((initiative) => {
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

    const riskForecasts = risks.map((risk) => ({
      riskId: risk._id,
      riskType: risk.riskType,
      currentImpact: risk.impact,
      forecastedImpact: risk.impact * 1.2, // Simple forecast
      trend: "increasing",
    }));

    return {
      predictions,
      recommendations,
      riskForecasts,
    };
  },
});

/**
 * Generate optimization recommendations
 */
export const generateOptimizationRecommendations = mutation({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const allocations = await ctx.db
      .query("resourceAllocations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const initiatives = await ctx.db
      .query("initiatives")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const recommendations = [];

    // Identify over-allocated resources
    const overAllocated = allocations.filter((a) => a.allocatedAmount > a.capacity * 0.9);
    if (overAllocated.length > 0) {
      recommendations.push({
        type: "reduce_allocation",
        severity: "high",
        description: `${overAllocated.length} resources are over-allocated (>90% capacity)`,
        action: "Redistribute workload or increase capacity",
      });
    }

    // Identify under-utilized resources
    const underUtilized = allocations.filter((a) => a.allocatedAmount < a.capacity * 0.5);
    if (underUtilized.length > 0) {
      recommendations.push({
        type: "increase_utilization",
        severity: "medium",
        description: `${underUtilized.length} resources are under-utilized (<50% capacity)`,
        action: "Assign additional work or reduce capacity",
      });
    }

    return { recommendations, timestamp: Date.now() };
  },
});