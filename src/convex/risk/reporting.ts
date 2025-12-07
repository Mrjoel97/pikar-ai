import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Generate comprehensive risk report
 */
export const generateRiskReport = query({
  args: {
    businessId: v.id("businesses"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const risks = await ctx.db
      .query("riskRegister")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    // Filter by date range if provided
    let filteredRisks = risks;
    if (args.startDate) {
      filteredRisks = filteredRisks.filter((r) => r.createdAt >= args.startDate!);
    }
    if (args.endDate) {
      filteredRisks = filteredRisks.filter((r) => r.createdAt <= args.endDate!);
    }

    // Risk distribution by category
    const byCategory: Record<string, number> = {};
    filteredRisks.forEach((r) => {
      byCategory[r.category] = (byCategory[r.category] || 0) + 1;
    });

    // Risk distribution by severity
    const bySeverity = {
      critical: filteredRisks.filter((r) => r.riskScore > 20).length,
      high: filteredRisks.filter((r) => r.riskScore > 15 && r.riskScore <= 20).length,
      medium: filteredRisks.filter((r) => r.riskScore > 9 && r.riskScore <= 15).length,
      low: filteredRisks.filter((r) => r.riskScore <= 9).length,
    };

    // Top risks
    const topRisks = filteredRisks
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10)
      .map((r) => ({
        id: r._id,
        title: r.title,
        category: r.category,
        riskScore: r.riskScore,
        status: r.status,
      }));

    // Mitigation status
    const mitigationStatus = {
      identified: filteredRisks.filter((r) => r.status === "identified").length,
      assessed: filteredRisks.filter((r) => r.status === "assessed").length,
      mitigated: filteredRisks.filter((r) => r.status === "mitigated").length,
      closed: filteredRisks.filter((r) => r.status === "closed").length,
    };

    // Trend analysis (last 90 days)
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;
    const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;

    const trend = {
      last30Days: filteredRisks.filter((r) => r.createdAt >= thirtyDaysAgo).length,
      days30to60: filteredRisks.filter((r) => r.createdAt >= sixtyDaysAgo && r.createdAt < thirtyDaysAgo).length,
      days60to90: filteredRisks.filter((r) => r.createdAt >= ninetyDaysAgo && r.createdAt < sixtyDaysAgo).length,
    };

    return {
      summary: {
        totalRisks: filteredRisks.length,
        avgRiskScore: filteredRisks.reduce((sum, r) => sum + r.riskScore, 0) / filteredRisks.length || 0,
        activeRisks: filteredRisks.filter((r) => r.status !== "closed").length,
      },
      byCategory,
      bySeverity,
      topRisks,
      mitigationStatus,
      trend,
      generatedAt: Date.now(),
    };
  },
});

/**
 * Get risk heatmap data
 */
export const getRiskHeatmap = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const risks = await ctx.db
      .query("riskRegister")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.neq(q.field("status"), "closed"))
      .collect();

    // Create 5x5 heatmap grid
    const heatmap: Array<Array<{ count: number; risks: any[] }>> = [];
    for (let i = 0; i < 5; i++) {
      heatmap[i] = [];
      for (let j = 0; j < 5; j++) {
        heatmap[i][j] = { count: 0, risks: [] };
      }
    }

    risks.forEach((risk) => {
      const impactIndex = Math.min(Math.floor(risk.impact) - 1, 4);
      const probabilityIndex = Math.min(Math.floor(risk.probability) - 1, 4);
      
      if (impactIndex >= 0 && probabilityIndex >= 0) {
        heatmap[impactIndex][probabilityIndex].count++;
        heatmap[impactIndex][probabilityIndex].risks.push({
          id: risk._id,
          title: risk.title,
          category: risk.category,
        });
      }
    });

    return heatmap;
  },
});
