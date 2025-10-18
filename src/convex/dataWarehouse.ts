import { v } from "convex/values";
import { query, mutation, action, internalMutation, internalAction } from "./_generated/server";
/* removed unused 'internal' import to reduce type instantiation */

/**
 * List all data warehouse sources for a business
 */
export const listDataSources = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    if (!args.businessId) return [];

    const sources = await ctx.db
      .query("dataWarehouseSources")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .collect();

    return sources;
  },
});

/**
 * Get a specific data source
 */
export const getDataSource = query({
  args: { sourceId: v.id("dataWarehouseSources") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sourceId);
  },
});

/**
 * Get job history for a data source
 */
export const getJobHistory = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    sourceId: v.optional(v.id("dataWarehouseSources")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) return [];

    let jobsQuery = ctx.db
      .query("dataWarehouseJobs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!));

    const jobs = await jobsQuery.order("desc").take(args.limit || 50);

    if (args.sourceId) {
      return jobs.filter((j) => j.sourceId === args.sourceId);
    }

    return jobs;
  },
});

/**
 * Get data quality metrics
 */
export const getQualityMetrics = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    sourceId: v.optional(v.id("dataWarehouseSources")),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) return [];

    let metricsQuery = ctx.db
      .query("dataQualityMetrics")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!));

    const metrics = await metricsQuery.order("desc").take(100);

    if (args.sourceId) {
      return metrics.filter((m) => m.sourceId === args.sourceId);
    }

    return metrics;
  },
});

/**
 * Get available connector types
 */
export const getConnectorTypes = query({
  args: {},
  handler: async () => {
    return [
      { type: "postgresql", name: "PostgreSQL", icon: "database" },
      { type: "mysql", name: "MySQL", icon: "database" },
      { type: "mongodb", name: "MongoDB", icon: "database" },
      { type: "snowflake", name: "Snowflake", icon: "cloud" },
      { type: "bigquery", name: "BigQuery", icon: "cloud" },
      { type: "redshift", name: "Redshift", icon: "cloud" },
      { type: "custom", name: "Custom Connector", icon: "plug" },
    ];
  },
});

/**
 * Create a new data source
 */
export const createDataSource = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    type: v.union(
      v.literal("postgresql"),
      v.literal("mysql"),
      v.literal("mongodb"),
      v.literal("snowflake"),
      v.literal("bigquery"),
      v.literal("redshift"),
      v.literal("custom")
    ),
    connectionString: v.optional(v.string()),
    credentials: v.optional(v.any()),
    syncSchedule: v.string(),
    config: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const now = Date.now();
    const sourceId = await ctx.db.insert("dataWarehouseSources", {
      businessId: args.businessId,
      name: args.name,
      type: args.type,
      connectionString: args.connectionString,
      credentials: args.credentials,
      syncSchedule: args.syncSchedule,
      status: "disconnected",
      config: args.config,
      createdAt: now,
      updatedAt: now,
    });

    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      action: "data_source_created",
      entityType: "data_warehouse_source",
      entityId: sourceId,
      details: { name: args.name, type: args.type },
      createdAt: now,
    });

    return sourceId;
  },
});

/**
 * Update a data source
 */
export const updateDataSource = mutation({
  args: {
    sourceId: v.id("dataWarehouseSources"),
    name: v.optional(v.string()),
    connectionString: v.optional(v.string()),
    credentials: v.optional(v.any()),
    syncSchedule: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("connected"),
        v.literal("syncing"),
        v.literal("error"),
        v.literal("disconnected")
      )
    ),
    config: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const { sourceId, ...updates } = args;
    await ctx.db.patch(sourceId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return sourceId;
  },
});

/**
 * Delete a data source
 */
export const deleteDataSource = mutation({
  args: { sourceId: v.id("dataWarehouseSources") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const source = await ctx.db.get(args.sourceId);
    if (!source) throw new Error("Source not found");

    await ctx.db.delete(args.sourceId);

    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: source.businessId,
      action: "data_source_deleted",
      entityType: "data_warehouse_source",
      entityId: args.sourceId,
      details: { name: source.name },
      createdAt: Date.now(),
    });

    return true;
  },
});

/**
 * Trigger manual sync for a data source
 */
export const triggerSync = mutation({
  args: { sourceId: v.id("dataWarehouseSources") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const source = await ctx.db.get(args.sourceId);
    if (!source) throw new Error("Source not found");

    // Update status to syncing
    await ctx.db.patch(args.sourceId, {
      status: "syncing",
      updatedAt: Date.now(),
    });

    // Schedule ETL job using string-based reference to avoid deep type instantiation
    await ctx.scheduler.runAfter(
      0,
      "dataWarehouse:executeETLJob" as any,
      { sourceId: args.sourceId },
    );

    return true;
  },
});

/**
 * Execute ETL job (internal action)
 */
export const executeETLJob = internalAction({
  args: { sourceId: v.id("dataWarehouseSources") },
  handler: async (ctx, args) => {
    // Call public query via string-based ref to avoid deep type instantiation
    const source = await ctx.runQuery("dataWarehouse:getDataSource" as any, {
      sourceId: args.sourceId,
    });

    if (!source) return null;

    const startTime = Date.now();
    let status: "completed" | "failed" = "completed";
    let recordsProcessed = 0;
    let recordsFailed = 0;
    const errors: string[] = [];

    try {
      // Simulate ETL process (placeholder)
      recordsProcessed = Math.floor(Math.random() * 10000) + 1000;
      recordsFailed = Math.floor(Math.random() * 100);

      // Update source status using public mutation via string-based ref
      await ctx.runMutation("dataWarehouse:updateDataSource" as any, {
        sourceId: args.sourceId,
        status: "connected",
        // lastSyncTime may be part of schema; omit if not present
      });
    } catch (error: any) {
      status = "failed";
      errors.push(error?.message || "Unknown error");

      await ctx.runMutation("dataWarehouse:updateDataSource" as any, {
        sourceId: args.sourceId,
        status: "error",
      });
    }

    // Record job execution (internal mutation is still referenced via string)
    await ctx.runMutation("dataWarehouse:recordJobExecution" as any, {
      businessId: source.businessId,
      sourceId: args.sourceId,
      jobType: "full_sync",
      status,
      startTime,
      endTime: Date.now(),
      recordsProcessed,
      recordsFailed,
      errors,
    });

    return { status, recordsProcessed, recordsFailed };
  },
});

/**
 * Record job execution (internal mutation)
 */
export const recordJobExecution = internalMutation({
  args: {
    businessId: v.id("businesses"),
    sourceId: v.id("dataWarehouseSources"),
    jobType: v.union(
      v.literal("full_sync"),
      v.literal("incremental_sync"),
      v.literal("validation"),
      v.literal("quality_check")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    ),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    recordsProcessed: v.number(),
    recordsFailed: v.number(),
    errors: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("dataWarehouseJobs", args);
  },
});

/**
 * Check for due syncs (internal action for cron)
 */
export const checkDueSyncs = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    // getAllSources is an internalMutation in this file; call via runMutation
    const sources = await ctx.runMutation("dataWarehouse:getAllSources" as any, {});

    for (const source of sources) {
      if (
        source.nextSyncTime &&
        source.nextSyncTime <= now &&
        source.status !== "syncing"
      ) {
        // triggerSync is a public mutation; call via string-based ref
        await ctx.runMutation("dataWarehouse:triggerSync" as any, {
          sourceId: source._id,
        });
      }
    }
  },
});

/**
 * Get all sources (internal query)
 */
export const getAllSources = internalMutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("dataWarehouseSources").collect();
  },
});