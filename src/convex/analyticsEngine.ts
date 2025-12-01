import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const calculateMetric = query({
  args: {
    metricId: v.id("customMetrics"),
  },
  handler: async (ctx, args) => {
    const metric = await ctx.db.get(args.metricId);
    if (!metric) {
      throw new Error("Metric not found");
    }

    // Simple calculation - can be enhanced
    let value = 0;
    
    if (metric.metricType === "count") {
      // Count records from data source
      value = Math.floor(Math.random() * 1000); // Placeholder
    }

    return {
      metricId: args.metricId,
      value,
      calculatedAt: Date.now(),
    };
  },
});

export const updateMetricValue = mutation({
  args: {
    metricId: v.id("customMetrics"),
    value: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.metricId, {
      currentValue: args.value,
      lastCalculated: Date.now(),
    });

    await ctx.db.insert("metricHistory", {
      metricId: args.metricId,
      value: args.value,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});