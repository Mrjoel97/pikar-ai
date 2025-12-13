import { v } from "convex/values";
import { query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Get predictive ROI using historical data and trend analysis
 */
export const getPredictiveROI = query({
  args: {
    businessId: v.id("businesses"),
    userId: v.id("users"),
    forecastDays: v.optional(v.number()), // Default 90 days
  },
  handler: async (ctx, args) => {
    const forecastDays = args.forecastDays ?? 90;
    const historicalDays = 180; // 6 months of historical data
    const startTime = Date.now() - historicalDays * 24 * 60 * 60 * 1000;

    // Get historical ROI data
    const auditLogs = await ctx.db
      .query("audit_logs")
      .filter((q: any) =>
        q.and(
          q.eq(q.field("businessId"), args.businessId),
          q.gte(q.field("createdAt"), startTime)
        )
      )
      .collect();

    const revenueEvents = await ctx.db
      .query("revenueEvents")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId))
      .collect();

    const filteredRevenue = revenueEvents.filter(
      (event: any) => event.timestamp >= startTime
    );

    // Calculate daily historical ROI
    const dailyData: Array<{
      date: number;
      timeSaved: number;
      revenue: number;
      roi: number;
    }> = [];

    for (let i = historicalDays - 1; i >= 0; i--) {
      const dayStart = Date.now() - i * 24 * 60 * 60 * 1000;
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const dayLogs = auditLogs.filter(
        (log: any) => log.createdAt >= dayStart && log.createdAt < dayEnd
      );
      const dayRevenue = filteredRevenue.filter(
        (event: any) => event.timestamp >= dayStart && event.timestamp < dayEnd
      );

      const timeSaved = dayLogs.reduce(
        (total: number, log: any) => total + (log.details?.timeSavedMinutes ?? 0),
        0
      );
      const revenue = dayRevenue.reduce(
        (total: number, event: any) => total + event.amount,
        0
      );

      dailyData.push({
        date: dayStart,
        timeSaved,
        revenue,
        roi: timeSaved > 0 ? (revenue / (timeSaved / 60)) : 0,
      });
    }

    // Simple linear regression for trend prediction
    const calculateTrend = (data: number[]) => {
      const n = data.length;
      const sumX = (n * (n - 1)) / 2;
      const sumY = data.reduce((a, b) => a + b, 0);
      const sumXY = data.reduce((sum, y, x) => sum + x * y, 0);
      const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      return { slope, intercept };
    };

    const revenueValues = dailyData.map((d) => d.revenue);
    const timeSavedValues = dailyData.map((d) => d.timeSaved);

    const revenueTrend = calculateTrend(revenueValues);
    const timeSavedTrend = calculateTrend(timeSavedValues);

    // Generate forecast
    const forecast: Array<{
      date: number;
      predictedRevenue: number;
      predictedTimeSaved: number;
      predictedROI: number;
      confidenceLower: number;
      confidenceUpper: number;
    }> = [];

    const stdDev = (arr: number[]) => {
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
      return Math.sqrt(variance);
    };

    const revenueStdDev = stdDev(revenueValues);
    const timeSavedStdDev = stdDev(timeSavedValues);

    for (let i = 1; i <= forecastDays; i++) {
      const x = historicalDays + i;
      const predictedRevenue = Math.max(0, revenueTrend.slope * x + revenueTrend.intercept);
      const predictedTimeSaved = Math.max(0, timeSavedTrend.slope * x + timeSavedTrend.intercept);
      const predictedROI = predictedTimeSaved > 0 ? (predictedRevenue / (predictedTimeSaved / 60)) : 0;

      // 95% confidence interval (±1.96 * stdDev)
      const confidenceMargin = 1.96 * Math.sqrt(i) * revenueStdDev;

      forecast.push({
        date: Date.now() + i * 24 * 60 * 60 * 1000,
        predictedRevenue: Math.round(predictedRevenue),
        predictedTimeSaved: Math.round(predictedTimeSaved),
        predictedROI: Math.round(predictedROI * 100) / 100,
        confidenceLower: Math.max(0, Math.round(predictedRevenue - confidenceMargin)),
        confidenceUpper: Math.round(predictedRevenue + confidenceMargin),
      });
    }

    return {
      historical: dailyData.slice(-30).map((d) => ({
        date: d.date,
        revenue: Math.round(d.revenue),
        timeSaved: Math.round(d.timeSaved),
        roi: Math.round(d.roi * 100) / 100,
      })),
      forecast,
      trends: {
        revenueGrowthRate: revenueTrend.slope,
        timeSavedGrowthRate: timeSavedTrend.slope,
        averageROI: dailyData.reduce((sum, d) => sum + d.roi, 0) / dailyData.length,
      },
    };
  },
});

/**
 * Get ROI forecast for specific time periods
 */
export const getROIForecast = query({
  args: {
    businessId: v.id("businesses"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const predictiveData = await ctx.runQuery(
      ctx.db.system.get("functions").then(() => "getPredictiveROI" as any),
      { businessId: args.businessId, userId: args.userId, forecastDays: 90 }
    );

    // Aggregate forecasts for 30, 60, 90 days
    const periods = [30, 60, 90];
    const forecasts = periods.map((days) => {
      const periodData = (predictiveData as any).forecast.slice(0, days);
      const totalRevenue = periodData.reduce((sum: number, d: any) => sum + d.predictedRevenue, 0);
      const totalTimeSaved = periodData.reduce((sum: number, d: any) => sum + d.predictedTimeSaved, 0);
      const avgROI = periodData.reduce((sum: number, d: any) => sum + d.predictedROI, 0) / days;

      return {
        period: `${days}d`,
        predictedRevenue: Math.round(totalRevenue),
        predictedTimeSaved: Math.round(totalTimeSaved / 60), // Convert to hours
        averageROI: Math.round(avgROI * 100) / 100,
        confidence: 95 - (days / 90) * 10, // Confidence decreases over time
      };
    });

    return forecasts;
  },
});

/**
 * Get scenario analysis for different ROI scenarios
 */
export const getScenarioAnalysis = query({
  args: {
    businessId: v.id("businesses"),
    userId: v.id("users"),
    scenarios: v.array(
      v.object({
        name: v.string(),
        hourlyRateMultiplier: v.number(),
        efficiencyMultiplier: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Get current baseline hourly rate
    const baseHourlyRate = 50; // Default rate - can be customized per user

    // Get historical data
    const historicalDays = 30;
    const startTime = Date.now() - historicalDays * 24 * 60 * 60 * 1000;

    const auditLogs = await ctx.db
      .query("audit_logs")
      .filter((q: any) =>
        q.and(
          q.eq(q.field("businessId"), args.businessId),
          q.gte(q.field("createdAt"), startTime)
        )
      )
      .collect();

    const baseTimeSaved = auditLogs.reduce(
      (total: number, log: any) => total + (log.details?.timeSavedMinutes ?? 0),
      0
    );

    // Calculate scenarios
    const scenarioResults = args.scenarios.map((scenario) => {
      const adjustedHourlyRate = baseHourlyRate * scenario.hourlyRateMultiplier;
      const adjustedTimeSaved = baseTimeSaved * scenario.efficiencyMultiplier;
      const estimatedRevenue = (adjustedTimeSaved / 60) * adjustedHourlyRate;

      return {
        name: scenario.name,
        hourlyRate: Math.round(adjustedHourlyRate),
        timeSavedHours: Math.round((adjustedTimeSaved / 60) * 10) / 10,
        estimatedRevenue: Math.round(estimatedRevenue),
        improvement: Math.round(((scenario.efficiencyMultiplier - 1) * 100) * 10) / 10,
      };
    });

    return {
      baseline: {
        hourlyRate: baseHourlyRate,
        timeSavedHours: Math.round((baseTimeSaved / 60) * 10) / 10,
        estimatedRevenue: Math.round((baseTimeSaved / 60) * baseHourlyRate),
      },
      scenarios: scenarioResults,
    };
  },
});
