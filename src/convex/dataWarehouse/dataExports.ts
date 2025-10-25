import { v } from "convex/values";
import { query, mutation } from "../_generated/server";

/**
 * Create export schedule
 */
export const createExportSchedule = mutation({
  args: {
    businessId: v.id("businesses"),
    sourceId: v.id("dataWarehouseSources"),
    name: v.string(),
    format: v.union(v.literal("csv"), v.literal("json"), v.literal("parquet")),
    destination: v.string(),
    schedule: v.string(),
    filters: v.optional(v.any()),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const now = Date.now();
    const scheduleId = await ctx.db.insert("exportSchedules", {
      businessId: args.businessId,
      sourceId: args.sourceId,
      name: args.name,
      format: args.format,
      destination: args.destination,
      schedule: args.schedule,
      filters: args.filters,
      enabled: args.enabled,
      createdAt: now,
      updatedAt: now,
    });

    return scheduleId;
  },
});

export const listExportSchedules = query({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) return [];

    return await ctx.db
      .query("exportSchedules")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .collect();
  },
});

export const getExportHistory = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) return [];

    return await ctx.db
      .query("exportHistory")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .order("desc")
      .take(args.limit || 50);
  },
});
