import { v } from "convex/values";
import { query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Get budget forecast using historical data and trend analysis
 */
export const getForecast = query({
  args: {
    businessId: v.id("businesses"),
    department: v.string(),
    months: v.union(v.literal(3), v.literal(6), v.literal(12)),
  },
  handler: async (ctx, args) => {
    const historicalMonths = 12;
    const startTime = Date.now() - historicalMonths * 30 * 24 * 60 * 60 * 1000;

    // Get historical spending
    const actuals = await ctx.db
      .query("departmentBudgetActuals")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId))
      .filter((q: any) => 
        q.and(
          q.eq(q.field("department"), args.department),
          q.gte(q.field("date"), startTime)
        )
      )
      .collect();

    // Group by month
    const monthlySpend: Record<string, number> = {};
    actuals.forEach((actual: any) => {
      const date = new Date(actual.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlySpend[key] = (monthlySpend[key] || 0) + actual.amount;
    });

    const historicalData = Object.entries(monthlySpend)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, spend]) => ({ month, spend }));

    // Simple linear regression for trend
    const n = historicalData.length;
    if (n < 3) {
      return {
        forecast: [],
        confidence: "low",
        trend: "insufficient_data",
      };
    }

    const sumX = (n * (n - 1)) / 2;
    const sumY = historicalData.reduce((sum, d) => sum + d.spend, 0);
    const sumXY = historicalData.reduce((sum, d, i) => sum + i * d.spend, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate standard deviation for confidence intervals
    const predictions = historicalData.map((_, i) => slope * i + intercept);
    const variance = historicalData.reduce((sum, d, i) => 
      sum + Math.pow(d.spend - predictions[i], 2), 0
    ) / n;
    const stdDev = Math.sqrt(variance);

    // Generate forecast
    const forecast = [];
    for (let i = 1; i <= args.months; i++) {
      const x = n + i - 1;
      const predicted = slope * x + intercept;
      const confidenceMargin = 1.96 * stdDev * Math.sqrt(1 + 1/n + Math.pow(x - sumX/n, 2) / sumX2);

      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + i);
      const monthKey = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, "0")}`;

      forecast.push({
        month: monthKey,
        predicted: Math.max(0, Math.round(predicted)),
        lower: Math.max(0, Math.round(predicted - confidenceMargin)),
        upper: Math.round(predicted + confidenceMargin),
        confidence: 95,
      });
    }

    return {
      historical: historicalData.slice(-6),
      forecast,
      trend: slope > 0 ? "increasing" : slope < 0 ? "decreasing" : "stable",
      monthlyGrowthRate: Math.round((slope / (sumY / n)) * 100 * 10) / 10,
      confidence: n >= 6 ? "high" : n >= 3 ? "medium" : "low",
    };
  },
});

/**
 * Get spending trends and patterns
 */
export const getSpendTrends = query({
  args: {
    businessId: v.id("businesses"),
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const months = 12;
    const startTime = Date.now() - months * 30 * 24 * 60 * 60 * 1000;

    const actuals = await ctx.db
      .query("departmentBudgetActuals")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId))
      .filter((q: any) => q.gte(q.field("date"), startTime))
      .collect();

    const filtered = args.department 
      ? actuals.filter((a: any) => a.department === args.department)
      : actuals;

    // Analyze by category
    const categorySpend: Record<string, number> = {};
    const monthlyTrend: Record<string, number> = {};

    filtered.forEach((actual: any) => {
      categorySpend[actual.category] = (categorySpend[actual.category] || 0) + actual.amount;
      
      const date = new Date(actual.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyTrend[monthKey] = (monthlyTrend[monthKey] || 0) + actual.amount;
    });

    return {
      byCategory: Object.entries(categorySpend)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount),
      monthlyTrend: Object.entries(monthlyTrend)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, amount]) => ({ month, amount })),
    };
  },
});

/**
 * Get predictive alerts for budget issues
 */
export const getPredictiveAlerts = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const fiscalYear = new Date().getFullYear();
    
    const allocations = await ctx.db
      .query("departmentBudgets")
      .withIndex("by_business_and_year", (q: any) =>
        q.eq("businessId", args.businessId).eq("fiscalYear", fiscalYear)
      )
      .collect();

    const actuals = await ctx.db
      .query("departmentBudgetActuals")
      .withIndex("by_business_and_year", (q: any) =>
        q.eq("businessId", args.businessId).eq("fiscalYear", fiscalYear)
      )
      .collect();

    const alerts: Array<{
      department: string;
      severity: "low" | "medium" | "high" | "critical";
      type: string;
      message: string;
      projectedOverrun: number;
    }> = [];

    for (const allocation of allocations) {
      const deptActuals = actuals.filter((a: any) => a.department === allocation.department);
      const spent = deptActuals.reduce((sum: any, a: any) => sum + a.amount, 0);
      const monthsElapsed = new Date().getMonth() + 1;
      const projected = monthsElapsed > 0 ? (spent / monthsElapsed) * 12 : spent;
      const overrun = projected - allocation.amount;

      if (overrun > allocation.amount * 0.2) {
        alerts.push({
          department: allocation.department,
          severity: "critical",
          type: "projected_overrun",
          message: `Projected to exceed budget by ${Math.round((overrun / allocation.amount) * 100)}%`,
          projectedOverrun: Math.round(overrun),
        });
      } else if (overrun > allocation.amount * 0.1) {
        alerts.push({
          department: allocation.department,
          severity: "high",
          type: "projected_overrun",
          message: `On track to exceed budget by ${Math.round((overrun / allocation.amount) * 100)}%`,
          projectedOverrun: Math.round(overrun),
        });
      } else if (spent / allocation.amount > 0.75 && monthsElapsed < 9) {
        alerts.push({
          department: allocation.department,
          severity: "medium",
          type: "burn_rate",
          message: `High burn rate: ${Math.round((spent / allocation.amount) * 100)}% spent in ${monthsElapsed} months`,
          projectedOverrun: 0,
        });
      }
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  },
});

/**
 * Detect seasonal spending patterns
 */
export const getSeasonalPatterns = query({
  args: {
    businessId: v.id("businesses"),
    department: v.string(),
  },
  handler: async (ctx, args) => {
    const years = 2;
    const startTime = Date.now() - years * 365 * 24 * 60 * 60 * 1000;

    const actuals = await ctx.db
      .query("departmentBudgetActuals")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId))
      .filter((q: any) =>
        q.and(
          q.eq(q.field("department"), args.department),
          q.gte(q.field("date"), startTime)
        )
      )
      .collect();

    // Group by month (1-12)
    const monthlyAvg: Record<number, { total: number; count: number }> = {};
    
    actuals.forEach((actual: any) => {
      const month = new Date(actual.date).getMonth() + 1;
      if (!monthlyAvg[month]) {
        monthlyAvg[month] = { total: 0, count: 0 };
      }
      monthlyAvg[month].total += actual.amount;
      monthlyAvg[month].count++;
    });

    const seasonalData = Object.entries(monthlyAvg).map(([month, data]) => ({
      month: parseInt(month),
      monthName: new Date(2024, parseInt(month) - 1).toLocaleString("default", { month: "short" }),
      avgSpend: Math.round(data.total / data.count),
      occurrences: data.count,
    }));

    const avgSpend = seasonalData.reduce((sum, d) => sum + d.avgSpend, 0) / seasonalData.length;
    const peakMonths = seasonalData.filter(d => d.avgSpend > avgSpend * 1.2);
    const lowMonths = seasonalData.filter(d => d.avgSpend < avgSpend * 0.8);

    return {
      seasonalData: seasonalData.sort((a, b) => a.month - b.month),
      peakMonths: peakMonths.map(m => m.monthName),
      lowMonths: lowMonths.map(m => m.monthName),
      hasSeasonality: peakMonths.length > 0 || lowMonths.length > 0,
    };
  },
});
