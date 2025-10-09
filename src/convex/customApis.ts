import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Query to list custom APIs for a business
export const listCustomApis = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const apis = await ctx.db
      .query("customApis")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
    
    return apis.map((api) => ({
      ...api,
      createdAt: api._creationTime,
    }));
  },
});

// Query to get a single custom API
export const getCustomApi = query({
  args: { apiId: v.id("customApis") },
  handler: async (ctx, args) => {
    const api = await ctx.db.get(args.apiId);
    if (!api) {
      throw new Error("API not found");
    }
    return api;
  },
});

// Query to get custom API by path
export const getCustomApiByPath = query({
  args: { 
    businessId: v.id("businesses"),
    path: v.string(),
    method: v.string(),
  },
  handler: async (ctx, args) => {
    const apis = await ctx.db
      .query("customApis")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => 
        q.and(
          q.eq(q.field("path"), args.path),
          q.eq(q.field("method"), args.method)
        )
      )
      .first();
    
    return apis;
  },
});

// Mutation to create a custom API endpoint
export const createCustomApi = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    path: v.string(),
    method: v.union(
      v.literal("GET"),
      v.literal("POST"),
      v.literal("PUT"),
      v.literal("DELETE"),
      v.literal("PATCH")
    ),
    authentication: v.union(
      v.literal("none"),
      v.literal("api_key"),
      v.literal("bearer_token")
    ),
    requestSchema: v.optional(v.string()), // JSON schema as string
    responseSchema: v.optional(v.string()), // JSON schema as string
    handler: v.object({
      type: v.union(
        v.literal("query"),
        v.literal("mutation"),
        v.literal("action")
      ),
      functionRef: v.string(), // e.g., "workflows.listWorkflows"
      paramMapping: v.optional(v.string()), // JSON mapping as string
    }),
    rateLimit: v.optional(v.object({
      enabled: v.boolean(),
      requestsPerMinute: v.number(),
    })),
    isActive: v.boolean(),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Validate path format
    if (!args.path.startsWith("/")) {
      throw new Error("Path must start with /");
    }

    // Check for duplicate path/method combination
    const existing = await ctx.db
      .query("customApis")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) =>
        q.and(
          q.eq(q.field("path"), args.path),
          q.eq(q.field("method"), args.method)
        )
      )
      .first();

    if (existing) {
      throw new Error(`API endpoint ${args.method} ${args.path} already exists`);
    }

    const apiId = await ctx.db.insert("customApis", {
      businessId: args.businessId,
      name: args.name,
      description: args.description,
      path: args.path,
      method: args.method,
      authentication: args.authentication,
      requestSchema: args.requestSchema,
      responseSchema: args.responseSchema,
      handler: args.handler,
      rateLimit: args.rateLimit,
      isActive: args.isActive,
      createdBy: args.createdBy,
      callCount: 0,
      lastCalledAt: undefined,
    });

    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      userId: args.createdBy,
      action: "custom_api.created",
      details: `Created custom API: ${args.method} ${args.path}`,
      createdAt: Date.now(),
    });

    return apiId;
  },
});

// Mutation to update a custom API endpoint
export const updateCustomApi = mutation({
  args: {
    apiId: v.id("customApis"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    authentication: v.optional(
      v.union(
        v.literal("none"),
        v.literal("api_key"),
        v.literal("bearer_token")
      )
    ),
    requestSchema: v.optional(v.string()),
    responseSchema: v.optional(v.string()),
    handler: v.optional(v.object({
      type: v.union(
        v.literal("query"),
        v.literal("mutation"),
        v.literal("action")
      ),
      functionRef: v.string(),
      paramMapping: v.optional(v.string()),
    })),
    rateLimit: v.optional(v.object({
      enabled: v.boolean(),
      requestsPerMinute: v.number(),
    })),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const api = await ctx.db.get(args.apiId);
    if (!api) {
      throw new Error("API not found");
    }

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.authentication !== undefined) updates.authentication = args.authentication;
    if (args.requestSchema !== undefined) updates.requestSchema = args.requestSchema;
    if (args.responseSchema !== undefined) updates.responseSchema = args.responseSchema;
    if (args.handler !== undefined) updates.handler = args.handler;
    if (args.rateLimit !== undefined) updates.rateLimit = args.rateLimit;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.apiId, updates);

    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: api.businessId,
      userId: api.createdBy,
      action: "custom_api.updated",
      details: `Updated custom API: ${api.method} ${api.path}`,
      createdAt: Date.now(),
    });

    return args.apiId;
  },
});

// Mutation to delete a custom API endpoint
export const deleteCustomApi = mutation({
  args: {
    apiId: v.id("customApis"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const api = await ctx.db.get(args.apiId);
    if (!api) {
      throw new Error("API not found");
    }

    await ctx.db.delete(args.apiId);

    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: api.businessId,
      userId: args.userId,
      action: "custom_api.deleted",
      details: `Deleted custom API: ${api.method} ${api.path}`,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Mutation to toggle API active status
export const toggleApiStatus = mutation({
  args: {
    apiId: v.id("customApis"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.apiId, { isActive: args.isActive });
    return { success: true };
  },
});

// Internal mutation to track API calls
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
      callCount: (api.callCount || 0) + 1,
      lastCalledAt: Date.now(),
    });
  },
});

// Query to get API analytics
export const getApiAnalytics = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const apis = await ctx.db
      .query("customApis")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const totalCalls = apis.reduce((sum, api) => sum + (api.callCount || 0), 0);
    const activeApis = apis.filter((api) => api.isActive).length;

    return {
      totalApis: apis.length,
      activeApis,
      totalCalls,
      apis: apis.map((api) => ({
        id: api._id,
        name: api.name,
        path: api.path,
        method: api.method,
        callCount: api.callCount || 0,
        lastCalledAt: api.lastCalledAt,
        isActive: api.isActive,
      })),
    };
  },
});
