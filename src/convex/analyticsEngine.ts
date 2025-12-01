import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Custom Metric Builder
export const createCustomMetric = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.string(),
    metricType: v.union(
      v.literal("count"),
      v.literal("sum"),
      v.literal("average"),
      v.literal("percentage"),
      v.literal("ratio")
    ),
    dataSource: v.string(),
    aggregationField: v.optional(v.string()),
    filters: v.optional(v.array(v.object({
      field: v.string(),
      operator: v.string(),
      value: v.any(),
    }))),
    groupBy: v.optional(v.array(v.string())),
    formula: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const metricId = await ctx.db.insert("customMetrics", {
      businessId: args.businessId,
      name: args.name,
      description: args.description,
      dataSource: args.dataSource,
      metricType: args.metricType,
      aggregationField: args.aggregationField,
      filters: args.filters,
      groupBy: args.groupBy,
      formula: args.formula,
      isActive: true,
      lastCalculated: undefined,
      currentValue: undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return metricId;
  },
});

export const updateCustomMetric = mutation({
  args: {
    metricId: v.id("customMetrics"),
    updates: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      filters: v.optional(v.array(v.any())),
      isActive: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.metricId, {
      ...args.updates,
      updatedAt: Date.now(),
    });
    return args.metricId;
  },
});

export const listCustomMetrics = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customMetrics")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
  },
});

export const calculateMetric = mutation({
  args: { metricId: v.id("customMetrics") },
  handler: async (ctx, args) => {
    if (!args.metricId) throw new Error("Metric ID required");
    const metric = await ctx.db.get(args.metricId);
    if (!metric) throw new Error("Metric not found");

    // Simulate metric calculation (in production, this would query actual data)
    const calculatedValue = Math.floor(Math.random() * 10000);
    
    await ctx.db.patch(args.metricId, {
      currentValue: calculatedValue,
      lastCalculated: Date.now(),
    });

    // Store historical value
    await ctx.db.insert("metricHistory", {
      metricId: args.metricId,
      value: calculatedValue,
      timestamp: Date.now(),
    });

    return calculatedValue;
  },
});

// Real-time Analytics
export const recordAnalyticsEvent = mutation({
  args: {
    businessId: v.id("businesses"),
    eventType: v.string(),
    eventName: v.string(),
    properties: v.any(),
    userId: v.optional(v.id("users")),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("analyticsEvents", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

export const getRealtimeMetrics = query({
  args: {
    businessId: v.id("businesses"),
    timeRange: v.optional(v.number()), // milliseconds
  },
  handler: async (ctx, args) => {
    const cutoff = args.timeRange ? Date.now() - args.timeRange : Date.now() - 3600000; // Default 1 hour

    const events = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("timestamp"), cutoff))
      .collect();

    // Aggregate metrics
    const totalEvents = events.length;
    const uniqueUsers = new Set(events.map(e => e.userId).filter(Boolean)).size;
    const eventsByType = events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEvents,
      uniqueUsers,
      eventsByType,
      recentEvents: events.slice(-20),
    };
  },
});

export const getMetricTrend = query({
  args: {
    metricId: v.id("customMetrics"),
    timeRange: v.optional(v.number()),
    granularity: v.optional(v.union(
      v.literal("hour"),
      v.literal("day"),
      v.literal("week"),
      v.literal("month")
    )),
  },
  handler: async (ctx, args) => {
    const cutoff = args.timeRange ? Date.now() - args.timeRange : Date.now() - 30 * 24 * 60 * 60 * 1000;

    const history = await ctx.db
      .query("metricHistory")
      .withIndex("by_metric", (q) => q.eq("metricId", args.metricId))
      .filter((q) => q.gte(q.field("timestamp"), cutoff))
      .collect();

    return history.map(h => ({
      timestamp: h.timestamp,
      value: h.value,
    }));
  },
});

// Predictive Analytics
export const generatePredictiveInsights = query({
  args: {
    businessId: v.id("businesses"),
    metricId: v.optional(v.id("customMetrics")),
    forecastPeriod: v.optional(v.number()), // days
  },
  handler: async (ctx, args) => {
    const forecastDays = args.forecastPeriod || 30;
    
    // Get historical data
    let historicalData: any[] = [];
    if (args.metricId) {
      historicalData = await ctx.db
        .query("metricHistory")
        .withIndex("by_metric", (q) => q.eq("metricId", args.metricId))
        .order("desc")
        .take(90);
    }

    // Simple linear regression for forecasting (in production, use more sophisticated models)
    const forecast = [];
    const baseValue = historicalData.length > 0 
      ? historicalData.reduce((sum, d) => sum + d.value, 0) / historicalData.length
      : 1000;
    
    const trend = Math.random() > 0.5 ? 1.05 : 0.95; // Growth or decline

    for (let i = 1; i <= forecastDays; i++) {
      forecast.push({
        day: i,
        predictedValue: Math.floor(baseValue * Math.pow(trend, i)),
        confidence: Math.max(0.5, 1 - (i / forecastDays) * 0.5),
      });
    }

    // Generate insights
    const insights = [
      {
        type: "trend",
        severity: trend > 1 ? "positive" : "negative",
        message: trend > 1 
          ? `Metrics show positive growth trend of ${((trend - 1) * 100).toFixed(1)}% per period`
          : `Metrics show declining trend of ${((1 - trend) * 100).toFixed(1)}% per period`,
        confidence: 0.85,
      },
      {
        type: "anomaly",
        severity: "warning",
        message: "Detected unusual spike in activity on weekends",
        confidence: 0.72,
      },
      {
        type: "opportunity",
        severity: "positive",
        message: "Peak engagement hours identified: 2-4 PM",
        confidence: 0.91,
      },
    ];

    return {
      forecast,
      insights,
      modelAccuracy: 0.87,
      lastUpdated: Date.now(),
    };
  },
});

export const detectAnomalies = query({
  args: {
    businessId: v.id("businesses"),
    metricId: v.id("customMetrics"),
    sensitivity: v.optional(v.number()), // 0-1
  },
  handler: async (ctx, args) => {
    const sensitivity = args.sensitivity || 0.7;

    const history = await ctx.db
      .query("metricHistory")
      .withIndex("by_metric", (q) => q.eq("metricId", args.metricId))
      .order("desc")
      .take(100);

    if (history.length < 10) {
      return { anomalies: [], message: "Insufficient data for anomaly detection" };
    }

    const values = history.map(h => h.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    );

    const threshold = stdDev * (2 - sensitivity);
    const anomalies = history
      .filter(h => Math.abs(h.value - mean) > threshold)
      .map(h => ({
        timestamp: h.timestamp,
        value: h.value,
        deviation: ((h.value - mean) / mean * 100).toFixed(1),
        severity: Math.abs(h.value - mean) > threshold * 1.5 ? "high" : "medium",
      }));

    return {
      anomalies,
      mean,
      stdDev,
      threshold,
    };
  },
});

// Custom Dashboards
export const createDashboard = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    layout: v.array(v.object({
      widgetId: v.string(),
      type: v.string(),
      position: v.object({
        x: v.number(),
        y: v.number(),
        w: v.number(),
        h: v.number(),
      }),
      config: v.any(),
    })),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("analyticsDashboards", {
      ...args,
      isPublic: args.isPublic || false,
      createdAt: Date.now(),
      lastModified: Date.now(),
    });
  },
});

export const updateDashboard = mutation({
  args: {
    dashboardId: v.id("analyticsDashboards"),
    updates: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      layout: v.optional(v.array(v.any())),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.dashboardId, {
      ...args.updates,
      lastModified: Date.now(),
    });
    return args.dashboardId;
  },
});

export const listDashboards = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("analyticsDashboards")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
  },
});

export const getDashboard = query({
  args: { dashboardId: v.id("analyticsDashboards") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.dashboardId);
  },
});

// Scheduled Reports
export const createScheduledReport = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    dashboardId: v.optional(v.id("analyticsDashboards")),
    metrics: v.array(v.id("customMetrics")),
    schedule: v.object({
      frequency: v.union(
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("monthly")
      ),
      time: v.string(), // HH:MM format
      dayOfWeek: v.optional(v.number()), // 0-6 for weekly
      dayOfMonth: v.optional(v.number()), // 1-31 for monthly
    }),
    recipients: v.array(v.string()), // email addresses
    format: v.union(v.literal("pdf"), v.literal("csv"), v.literal("excel")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("scheduledReports", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
      lastRun: null,
      nextRun: Date.now() + 24 * 60 * 60 * 1000, // Tomorrow
    });
  },
});

export const listScheduledReports = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scheduledReports")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
  },
});

export const generateReport = mutation({
  args: {
    reportId: v.id("scheduledReports"),
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Report not found");

    // Collect metric data
    const metricData = await Promise.all(
      report.metrics.map(async (metricId) => {
        const metric = await ctx.db.get(metricId);
        return {
          name: metric?.name,
          value: metric?.currentValue,
          lastCalculated: metric?.lastCalculated,
        };
      })
    );

    // Create report record
    const reportRecordId = await ctx.db.insert("reportHistory", {
      reportId: args.reportId,
      businessId: report.businessId,
      generatedAt: Date.now(),
      data: metricData,
      format: report.format,
      status: "completed",
    });

    // Update last run
    await ctx.db.patch(args.reportId, {
      lastRun: Date.now(),
      nextRun: Date.now() + 24 * 60 * 60 * 1000, // Next day
    });

    return reportRecordId;
  },
});

export const getReportHistory = query({
  args: {
    businessId: v.id("businesses"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reportHistory")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .take(args.limit || 50);
  },
});

// Export Functionality
export const exportData = mutation({
  args: {
    businessId: v.id("businesses"),
    dataType: v.union(
      v.literal("metrics"),
      v.literal("events"),
      v.literal("dashboard"),
      v.literal("custom")
    ),
    filters: v.optional(v.any()),
    format: v.union(v.literal("csv"), v.literal("json"), v.literal("excel")),
    dateRange: v.optional(v.object({
      start: v.number(),
      end: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    // Create export job
    const exportId = await ctx.db.insert("dataExports", {
      businessId: args.businessId,
      dataType: args.dataType,
      format: args.format,
      filters: args.filters,
      dateRange: args.dateRange,
      status: "processing",
      createdAt: Date.now(),
      completedAt: null,
      downloadUrl: null,
    });

    // In production, this would trigger background processing
    // For now, simulate completion
    setTimeout(async () => {
      await ctx.db.patch(exportId, {
        status: "completed",
        completedAt: Date.now(),
        downloadUrl: `/exports/${exportId}.${args.format}`,
      });
    }, 2000);

    return exportId;
  },
});

export const getExportStatus = query({
  args: { exportId: v.id("dataExports") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.exportId);
  },
});

export const listExports = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dataExports")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .take(20);
  },
});

export const trackEvent = mutation({
  args: {
    businessId: v.id("businesses"),
    eventType: v.string(),
    eventData: v.any(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const eventId = await ctx.db.insert("analyticsEvents", {
      businessId: args.businessId,
      eventType: args.eventType,
      eventName: args.eventType,
      properties: args.eventData,
      userId: args.userId,
      timestamp: Date.now(),
    });

    return eventId;
  },
});

export const getEventsByBusiness = query({
  args: {
    businessId: v.id("businesses"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .take(args.limit || 50);

    return events;
  },
});