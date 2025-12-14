import { v } from "convex/values";
import { query } from "../_generated/server";

// Generate sales forecast based on pipeline data
export const getSalesForecast = query({
  args: {
    businessId: v.id("businesses"),
    months: v.optional(v.number()), // Number of months to forecast (default 3)
  },
  handler: async (ctx, args) => {
    const forecastMonths = args.months || 3;
    const pipeline = await ctx.db
      .query("crmDeals")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const now = Date.now();
    const monthMs = 30 * 24 * 60 * 60 * 1000;

    // Calculate forecast for each month
    const forecast = [];
    for (let i = 0; i < forecastMonths; i++) {
      const monthStart = now + (i * monthMs);
      const monthEnd = monthStart + monthMs;

      // Deals expected to close in this month
      const monthDeals = pipeline.filter(d => {
        if (!d.updatedAt) return false;
        return d.updatedAt >= monthStart && d.updatedAt < monthEnd;
      });

      const wonAmount = monthDeals
        .filter(d => d.stage === "closed_won")
        .reduce((sum, d) => sum + (d.value || 0), 0);

      const activeDeals = monthDeals.filter(d => 
        d.stage !== "Closed Won" && d.stage !== "Closed Lost"
      );

      const bestCase = activeDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      const worstCase = activeDeals
        .filter(d => (d.probability || 0) >= 70)
        .reduce((sum, d) => sum + (d.value || 0), 0);
      const mostLikely = activeDeals.reduce((sum, d) => 
        sum + ((d.value || 0) * (d.probability || 0) / 100), 0
      );

      forecast.push({
        month: new Date(monthStart).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        monthStart,
        monthEnd,
        bestCase,
        worstCase,
        mostLikely,
        dealCount: activeDeals.length,
      });
    }

    // Historical performance (last 3 months)
    const threeMonthsAgo = now - (3 * monthMs);
    const recentDeals = pipeline.filter(d => 
      d.updatedAt && d.updatedAt >= threeMonthsAgo
    );

    // Calculate win rate
    const wonDeals = recentDeals.filter(d => d.stage === "closed_won");
    const totalDeals = recentDeals.length;
    const winRate = totalDeals > 0 ? (wonDeals.length / totalDeals) * 100 : 0;

    const historicalRevenue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
    const avgMonthlyRevenue = historicalRevenue / 3;

    return {
      forecast,
      historical: {
        last3MonthsRevenue: historicalRevenue,
        avgMonthlyRevenue,
        dealsWon: wonDeals.length,
        winRate,
      },
      summary: {
        totalBestCase: forecast.reduce((sum, f) => sum + f.bestCase, 0),
        totalWorstCase: forecast.reduce((sum, f) => sum + f.worstCase, 0),
        totalMostLikely: forecast.reduce((sum, f) => sum + f.mostLikely, 0),
      },
    };
  },
});

// Get forecast accuracy metrics
export const getForecastAccuracy = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const deals = await ctx.db
      .query("crmDeals")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const now = Date.now();
    const lastMonthStart = now - (30 * 24 * 60 * 60 * 1000);

    // Deals that were forecasted to close last month
    const lastMonthDeals = deals.filter(d => 
      (d.closeDate || d.updatedAt || 0) >= lastMonthStart && (d.closeDate || d.updatedAt || 0) < now
    );

    const actualWon = lastMonthDeals.filter(d => d.stage === "closed_won");
    const actualRevenue = actualWon.reduce((sum, d) => sum + (d.value || 0), 0);
    
    const forecastedRevenue = lastMonthDeals.reduce((sum, d) => 
      sum + ((d.value || 0) * (d.probability || 0) / 100), 0
    );

    const accuracy = forecastedRevenue > 0 
      ? (actualRevenue / forecastedRevenue) * 100 
      : 0;

    return {
      forecastedRevenue,
      actualRevenue,
      variance: actualRevenue - forecastedRevenue,
      variancePercent: forecastedRevenue > 0 
        ? ((actualRevenue - forecastedRevenue) / forecastedRevenue) * 100 
        : 0,
      accuracy: Math.min(accuracy, 100),
      dealsForecasted: lastMonthDeals.length,
      dealsWon: actualWon.length,
    };
  },
});

// Get revenue trends
export const getRevenueTrends = query({
  args: {
    businessId: v.id("businesses"),
    months: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const monthsToAnalyze = args.months || 6;
    const deals = await ctx.db
      .query("crmDeals")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.eq(q.field("stage"), "closed_won"))
      .collect();

    const now = Date.now();
    const monthMs = 30 * 24 * 60 * 60 * 1000;

    const trends = [];
    for (let i = monthsToAnalyze - 1; i >= 0; i--) {
      const monthStart = now - ((i + 1) * monthMs);
      const monthEnd = now - (i * monthMs);

      const monthDeals = deals.filter(d => 
        (d.updatedAt || 0) >= monthStart && (d.updatedAt || 0) < monthEnd
      );

      const revenue = monthDeals.reduce((sum, d) => sum + (d.value || 0), 0);

      trends.push({
        month: new Date(monthStart).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue,
        dealCount: monthDeals.length,
        avgDealSize: monthDeals.length > 0 ? revenue / monthDeals.length : 0,
      });
    }

    // Calculate growth rate
    const currentMonth = trends[trends.length - 1];
    const previousMonth = trends[trends.length - 2];
    const growthRate = previousMonth && previousMonth.revenue > 0
      ? ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100
      : 0;

    return {
      trends,
      growthRate,
      totalRevenue: trends.reduce((sum, t) => sum + t.revenue, 0),
      avgMonthlyRevenue: trends.reduce((sum, t) => sum + t.revenue, 0) / trends.length,
    };
  },
});