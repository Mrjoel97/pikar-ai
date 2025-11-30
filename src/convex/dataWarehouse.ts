import { v } from "convex/values";
import { query, internalAction } from "./_generated/server";

// Re-export all functions from submodules for backward compatibility
export {
  listDataSources,
  getDataSource,
  getConnectorTypes,
  createDataSource,
  updateDataSource,
  deleteDataSource,
  triggerSync,
  executeETLJob,
  recordJobExecution,
  getAllSources,
  getJobHistory,
} from "./dataWarehouse/dataSources";

export {
  createPipeline,
  listPipelines,
  getPipeline,
  updatePipeline,
  deletePipeline,
  executePipeline,
  executePipelineJob,
  recordPipelineExecution,
  getPipelineExecutions,
} from "./dataWarehouse/etlPipelines";

export {
  getQualityMetrics,
  createQualityCheck,
  listQualityChecks,
  runQualityCheck,
} from "./dataWarehouse/dataQuality";

export {
  createExportSchedule,
  listExportSchedules,
  getExportHistory,
} from "./dataWarehouse/dataExports";

/**
 * Check for due syncs (internal action for cron)
 */
export const checkDueSyncs = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const sources = await ctx.runMutation("dataWarehouse/dataSources:getAllSources" as any, {});

    for (const source of sources) {
      if (
        source.nextSyncTime &&
        source.nextSyncTime <= now &&
        source.status !== "syncing"
      ) {
        await ctx.runMutation("dataWarehouse/dataSources:triggerSync" as any, {
          sourceId: source._id,
        });
      }
    }
  },
});

/**
 * Warehouse Analytics
 */
export const getWarehouseAnalytics = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    timeRange: v.optional(v.union(
      v.literal("24h"),
      v.literal("7d"),
      v.literal("30d"),
      v.literal("90d")
    )),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) return null;

    const timeRange = args.timeRange || "7d";
    const now = Date.now();
    const ranges = {
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
    };
    const startTime = now - ranges[timeRange];

    const sources = await ctx.db
      .query("dataWarehouseSources")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .collect();

    const jobs = await ctx.db
      .query("dataWarehouseJobs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .filter((q) => q.gte(q.field("startedAt"), startTime))
      .collect();

    const pipelines = await ctx.db
      .query("etlPipelines")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .collect();

    const pipelineExecutions = await ctx.db
      .query("pipelineExecutions")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .filter((q) => q.gte(q.field("startTime"), startTime))
      .collect();

    const totalRecordsProcessed = jobs.reduce((sum, j) => sum + (j.recordsProcessed || 0), 0);
    const totalRecordsFailed = 0; // Not tracked in current schema
    const successfulJobs = jobs.filter((j) => j.status === "completed").length;
    const failedJobs = jobs.filter((j) => j.status === "failed").length;

    const pipelineRecordsProcessed = pipelineExecutions.reduce(
      (sum, e) => sum + e.recordsProcessed,
      0
    );
    const successfulPipelines = pipelineExecutions.filter((e) => e.status === "completed").length;
    const failedPipelines = pipelineExecutions.filter((e) => e.status === "failed").length;

    return {
      sources: {
        total: sources.length,
        connected: sources.filter((s) => s.isActive).length,
        syncing: 0,
        error: sources.filter((s) => !s.isActive).length,
      },
      jobs: {
        total: jobs.length,
        successful: successfulJobs,
        failed: failedJobs,
        successRate: jobs.length > 0 ? (successfulJobs / jobs.length) * 100 : 0,
      },
      records: {
        processed: totalRecordsProcessed,
        failed: totalRecordsFailed,
        successRate:
          totalRecordsProcessed > 0
            ? ((totalRecordsProcessed - totalRecordsFailed) / totalRecordsProcessed) * 100
            : 0,
      },
      pipelines: {
        total: pipelines.length,
        enabled: pipelines.filter((p) => p.enabled).length,
        executions: pipelineExecutions.length,
        successful: successfulPipelines,
        failed: failedPipelines,
        recordsProcessed: pipelineRecordsProcessed,
      },
      timeRange,
    };
  },
});