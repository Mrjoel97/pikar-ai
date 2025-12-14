import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getThreats = query({
  args: {
    businessId: v.id("businesses"),
    severity: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let query = ctx.db
      .query("securityThreats")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId));

    const threats = await query.collect();

    let filtered = threats;
    if (args.severity) {
      filtered = threats.filter((t) => t.severity === args.severity);
    }

    filtered.sort((a, b) => b.detectedAt - a.detectedAt);

    return args.limit ? filtered.slice(0, args.limit) : filtered;
  },
});

export const createThreat = mutation({
  args: {
    businessId: v.id("businesses"),
    type: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    description: v.string(),
    source: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    affectedResource: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    return await ctx.db.insert("securityThreats", {
      businessId: args.businessId,
      type: args.type,
      severity: args.severity,
      description: args.description,
      source: args.source,
      ipAddress: args.ipAddress,
      affectedResource: args.affectedResource,
      status: "active",
      detectedAt: Date.now(),
    });
  },
});

export const resolveThreat = mutation({
  args: {
    threatId: v.id("securityThreats"),
    resolution: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.threatId, {
      status: "resolved",
      resolution: args.resolution,
      resolvedAt: Date.now(),
    });
  },
});
