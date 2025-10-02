import { query } from "./_generated/server";
import { v } from "convex/values";

export const getRiskMatrix = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const risks = await ctx.db
      .query("risks")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
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
      highRisks: risks.filter(r => r.probability >= 4 && r.impact >= 4).length,
    };
  },
});

export const getRiskTrend = query({
  args: { 
    businessId: v.id("businesses"),
    days: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const days = args.days ?? 30;
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

    const risks = await ctx.db
      .query("risks")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const recentRisks = risks.filter(r => r.createdAt >= cutoffTime);
    const newRisks = recentRisks.filter(r => r.status === "identified");
    const mitigatedRisks = recentRisks.filter(r => 
      r.status === "mitigated" && r.updatedAt >= cutoffTime
    );

    // Calculate average risk score (probability * impact)
    const avgRiskScore = risks.length > 0
      ? risks.reduce((sum, r) => sum + (r.probability * r.impact), 0) / risks.length
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
      
      const dayRisks = risks.filter(r => r.createdAt <= dayEnd);
      const dayScore = dayRisks.length > 0
        ? dayRisks.reduce((sum, r) => sum + (r.probability * r.impact), 0) / dayRisks.length
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