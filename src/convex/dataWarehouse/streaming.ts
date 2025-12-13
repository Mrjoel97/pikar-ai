import { v } from "convex/values";
import { query, mutation } from "../_generated/server";

/**
 * Get streaming pipeline status
 */
export const getStreamingStatus = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    // Mock streaming status
    return {
      pipelines: [
        {
          id: "pipeline-1",
          name: "Customer Events Stream",
          status: "active",
          throughput: 1250, // events/sec
          latency: 45, // ms
          errorRate: 0.02, // 2%
          lastUpdate: Date.now(),
        },
        {
          id: "pipeline-2",
          name: "Transaction Stream",
          status: "active",
          throughput: 850,
          latency: 32,
          errorRate: 0.01,
          lastUpdate: Date.now(),
        },
      ],
      overall: {
        totalThroughput: 2100,
        avgLatency: 38,
        avgErrorRate: 0.015,
        health: "healthy",
      },
    };
  },
});

/**
 * Create streaming pipeline
 */
export const createPipeline = mutation({
  args: {
    businessId: v.id("businesses"),
    sourceName: v.string(),
    sourceType: v.string(),
    config: v.any(),
  },
  handler: async (ctx, args) => {
    // Store pipeline config (would need schema table)
    const pipelineId = "pipeline-" + Date.now();
    return {
      pipelineId,
      status: "active",
      message: "Streaming pipeline created successfully",
    };
  },
});

/**
 * Pause streaming pipeline
 */
export const pauseStream = mutation({
  args: {
    businessId: v.id("businesses"),
    pipelineId: v.string(),
  },
  handler: async (ctx, args) => {
    // In production, pause the actual stream
    return { success: true, status: "paused" };
  },
});

/**
 * Resume streaming pipeline
 */
export const resumeStream = mutation({
  args: {
    businessId: v.id("businesses"),
    pipelineId: v.string(),
  },
  handler: async (ctx, args) => {
    // In production, resume the actual stream
    return { success: true, status: "active" };
  },
});
