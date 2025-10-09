import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Query: List all custom API endpoints for a business
 */
export const listCustomApis = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const apis = await ctx.db
      .query("customApis")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    return apis;
  },
});

/**
 * Query: Get a single custom API endpoint
 */
export const getCustomApi = query({
  args: {
    apiId: v.id("customApis"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const api = await ctx.db.get(args.apiId);
    if (!api) throw new Error("API not found");

    return api;
  },
});

/**
 * Mutation: Create a new custom API endpoint
 */
export const createCustomApi = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    method: v.union(v.literal("GET"), v.literal("POST"), v.literal("PUT"), v.literal("DELETE")),
    path: v.string(),
    convexFunction: v.string(),
    requiresAuth: v.boolean(),
    rateLimit: v.optional(v.object({
      requestsPerMinute: v.number(),
      requestsPerHour: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Validate path format
    if (!args.path.startsWith("/")) {
      throw new Error("Path must start with /");
    }

    // Check for duplicate paths
    const existing = await ctx.db
      .query("customApis")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.eq(q.field("path"), args.path))
      .first();

    if (existing) {
      throw new Error("An API with this path already exists");
    }

    const apiId = await ctx.db.insert("customApis", {
      businessId: args.businessId,
      name: args.name,
      description: args.description,
      method: args.method,
      path: args.path,
      convexFunction: args.convexFunction,
      requiresAuth: args.requiresAuth,
      rateLimit: args.rateLimit ? (args.rateLimit.requestsPerMinute + args.rateLimit.requestsPerHour) / 2 : undefined,
      isActive: true,
      totalCalls: 0,
      createdBy: identity.subject as Id<"users">,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      userId: identity.subject as Id<"users">,
      action: "custom_api_created",
      entityType: "custom_api",
      entityId: apiId,
      metadata: { name: args.name, path: args.path },
      createdAt: Date.now(),
    });

    return apiId;
  },
});

/**
 * Mutation: Update a custom API endpoint
 */
export const updateCustomApi = mutation({
  args: {
    apiId: v.id("customApis"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    method: v.optional(v.union(v.literal("GET"), v.literal("POST"), v.literal("PUT"), v.literal("DELETE"))),
    convexFunction: v.optional(v.string()),
    requiresAuth: v.optional(v.boolean()),
    rateLimit: v.optional(v.object({
      requestsPerMinute: v.number(),
      requestsPerHour: v.number(),
    })),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const api = await ctx.db.get(args.apiId);
    if (!api) throw new Error("API not found");

    const updates: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.method !== undefined) updates.method = args.method;
    if (args.convexFunction !== undefined) updates.convexFunction = args.convexFunction;
    if (args.requiresAuth !== undefined) updates.requiresAuth = args.requiresAuth;
    if (args.rateLimit !== undefined) {
      updates.rateLimit = (args.rateLimit.requestsPerMinute + args.rateLimit.requestsPerHour) / 2;
    }
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.apiId, updates);

    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: api.businessId,
      userId: identity.subject,
      action: "custom_api_updated",
      entityType: "custom_api",
      entityId: args.apiId,
      metadata: updates,
      createdAt: Date.now(),
    });

    return args.apiId;
  },
});

/**
 * Mutation: Delete a custom API endpoint
 */
export const deleteCustomApi = mutation({
  args: {
    apiId: v.id("customApis"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const api = await ctx.db.get(args.apiId);
    if (!api) throw new Error("API not found");

    await ctx.db.delete(args.apiId);

    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: api.businessId,
      userId: identity.subject,
      action: "custom_api_deleted",
      entityType: "custom_api",
      entityId: args.apiId,
      metadata: { name: api.name, path: api.path },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Internal Mutation: Track API call
 */
export const trackApiCall = internalMutation({
  args: {
    apiId: v.id("customApis"),
    success: v.boolean(),
    responseTime: v.number(),
  },
  handler: async (ctx, args) => {
    const api = await ctx.db.get(args.apiId);
    if (!api) return;

    await ctx.db.patch(args.apiId, {
      totalCalls: (api.totalCalls || 0) + 1,
    });
  },
});

/**
 * Query: Get API analytics
 */
export const getApiAnalytics = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const apis = await ctx.db
      .query("customApis")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const totalCalls = apis.reduce((sum, api) => sum + (api.totalCalls || 0), 0);
    const activeEndpoints = apis.filter(api => api.isActive).length;

    return {
      totalCalls,
      activeEndpoints,
      totalEndpoints: apis.length,
      apis: apis.map(api => ({
        id: api._id,
        name: api.name,
        path: api.path,
        method: api.method,
        totalCalls: api.totalCalls || 0,
        isActive: api.isActive,
      })),
    };
  },
});