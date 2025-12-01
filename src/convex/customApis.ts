import { v } from "convex/values";
import { query, mutation, internalMutation, internalAction } from "./_generated/server";
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
      requiresAuth: args.requiresAuth,
      isActive: true,
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
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.apiId, updates);

    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: api.businessId,
      userId: identity.subject as Id<"users">,
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
      userId: identity.subject as Id<"users">,
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
    clientId: v.string(),
    statusCode: v.number(),
    responseTime: v.number(),
  },
  handler: async (ctx, args) => {
    // Insert into apiCallLogs table
    await ctx.db.insert("apiCallLogs", {
      apiId: args.apiId,
      clientId: args.clientId,
      statusCode: args.statusCode,
      responseTime: args.responseTime,
      endpoint: "", // Add endpoint if needed
      timestamp: Date.now(),
    });
  },
});

export const listApis = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customApis")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
  },
});

export const getApiById = query({
  args: { apiId: v.id("customApis") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.apiId);
  },
});

export const getApiVersions = query({
  args: { apiId: v.id("customApis") },
  handler: async (ctx, args) => {
    const api = await ctx.db.get(args.apiId);
    if (!api) throw new Error("API not found");
    
    return await ctx.db
      .query("apiVersions")
      .withIndex("by_api", (q) => q.eq("apiId", args.apiId))
      .order("desc")
      .collect();
  },
});

export const getApiAnalytics = query({
  args: { 
    apiId: v.id("customApis"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const start = args.startDate || now - 30 * 24 * 60 * 60 * 1000;
    const end = args.endDate || now;

    const calls = await ctx.db
      .query("apiCallLogs")
      .withIndex("by_api_and_timestamp", (q) => 
        q.eq("apiId", args.apiId)
          .gte("timestamp", start)
          .lte("timestamp", end)
      )
      .collect();

    const totalCalls = calls.length;
    const successfulCalls = calls.filter(c => c.statusCode >= 200 && c.statusCode < 300).length;
    const failedCalls = calls.filter(c => c.statusCode >= 400).length;
    const avgResponseTime = calls.reduce((sum, c) => sum + (c.responseTime || 0), 0) / totalCalls || 0;

    const callsByDay: Record<string, number> = {};
    calls.forEach(call => {
      const day = new Date(call.timestamp).toISOString().split('T')[0];
      callsByDay[day] = (callsByDay[day] || 0) + 1;
    });

    const callsByStatus: Record<number, number> = {};
    calls.forEach(call => {
      callsByStatus[call.statusCode] = (callsByStatus[call.statusCode] || 0) + 1;
    });

    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      successRate: totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0,
      avgResponseTime,
      callsByDay,
      callsByStatus,
      recentCalls: calls.slice(-100).reverse(),
    };
  },
});

export const createApi = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    method: v.union(v.literal("GET"), v.literal("POST"), v.literal("PUT"), v.literal("DELETE")),
    path: v.string(),
    convexFunction: v.string(),
    requiresAuth: v.boolean(),
    rateLimit: v.optional(v.number()),
    version: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) throw new Error("User not found");

    const apiId = await ctx.db.insert("customApis", {
      businessId: args.businessId,
      name: args.name,
      description: args.description,
      method: args.method,
      path: args.path,
      requiresAuth: args.requiresAuth,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("apiVersions", {
      apiId,
      version: args.version || "1.0.0",
      convexFunction: args.convexFunction,
      isActive: true,
      createdAt: Date.now(),
      changeNotes: "Initial version",
    });

    return apiId;
  },
});

export const updateApi = mutation({
  args: {
    apiId: v.id("customApis"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    rateLimit: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    convexFunction: v.optional(v.string()),
    version: v.optional(v.string()),
    changeNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { apiId, version, changeNotes, convexFunction, ...updates } = args;
    
    await ctx.db.patch(apiId, {
      ...updates,
      updatedAt: Date.now(),
    });

    if (convexFunction || version) {
      const api = await ctx.db.get(apiId);
      if (!api) throw new Error("API not found");

      const previousVersions = await ctx.db
        .query("apiVersions")
        .withIndex("by_api", (q) => q.eq("apiId", apiId))
        .collect();
      
      for (const v of previousVersions) {
        await ctx.db.patch(v._id, { isActive: false });
      }

      await ctx.db.insert("apiVersions", {
        apiId,
        version: version || "1.1.0",
        convexFunction: convexFunction || "default.handler",
        isActive: true,
        createdAt: Date.now(),
        changeNotes: changeNotes || "Updated API",
      });
    }

    return apiId;
  },
});

export const deleteApi = mutation({
  args: { apiId: v.id("customApis") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.apiId);
    
    const versions = await ctx.db
      .query("apiVersions")
      .withIndex("by_api", (q) => q.eq("apiId", args.apiId))
      .collect();
    
    for (const version of versions) {
      await ctx.db.delete(version._id);
    }
  },
});

export const getRateLimitStatus = query({
  args: { 
    apiId: v.id("customApis"),
    clientId: v.string(),
  },
  handler: async (ctx, args) => {
    const api = await ctx.db.get(args.apiId);
    if (!api) throw new Error("API not found");

    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    const recentCalls = await ctx.db
      .query("apiCallLogs")
      .withIndex("by_api_and_timestamp", (q) => 
        q.eq("apiId", args.apiId)
          .gte("timestamp", now - oneHour)
      )
      .filter((q) => q.eq(q.field("clientId"), args.clientId))
      .collect();

    const limit = api.rateLimit || 100;
    const remaining = Math.max(0, limit - recentCalls.length);
    const resetTime = now + oneHour;

    return {
      limit,
      remaining,
      resetTime,
      used: recentCalls.length,
    };
  },
});

export const getApiDocs = query({
  args: { apiId: v.id("customApis") },
  handler: async (ctx, args) => {
    const api = await ctx.db.get(args.apiId);
    if (!api) throw new Error("API not found");

    const versions = await ctx.db
      .query("apiVersions")
      .withIndex("by_api", (q) => q.eq("apiId", args.apiId))
      .collect();

    return {
      name: api.name,
      description: api.description,
      method: api.method,
      path: api.path,
      requiresAuth: api.requiresAuth,
      rateLimit: api.rateLimit,
      versions: versions.map(v => ({
        version: v.version,
        isActive: v.isActive,
        changeNotes: v.changeNotes,
        createdAt: v.createdAt,
      })),
      examples: {
        request: {
          method: api.method,
          url: `${process.env.CONVEX_SITE_URL || 'https://your-app.convex.site'}${api.path}`,
          headers: api.requiresAuth ? {
            "Authorization": "Bearer YOUR_API_KEY",
            "Content-Type": "application/json",
          } : {
            "Content-Type": "application/json",
          },
          body: api.method !== "GET" ? { "example": "data" } : undefined,
        },
        response: {
          status: 200,
          body: { "success": true, "data": {} },
        },
      },
    };
  },
});

export const trackApiUsage = internalMutation({
  args: {
    apiId: v.id("customApis"),
    clientId: v.string(),
    statusCode: v.number(),
    responseTime: v.number(),
    endpoint: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("apiCallLogs", {
      apiId: args.apiId,
      clientId: args.clientId,
      statusCode: args.statusCode,
      responseTime: args.responseTime,
      endpoint: args.endpoint,
      timestamp: Date.now(),
    });

    const api = await ctx.db.get(args.apiId);
    if (api) {
      await ctx.db.patch(args.apiId, {
        totalCalls: (api.totalCalls || 0) + 1,
      });
    }
  },
});

export const executeApi = internalAction({
  args: {
    apiId: v.id("customApis"),
    requestData: v.any(),
  },
  handler: async (ctx, args) => {
    const api = await ctx.runQuery(internal.customApis.getApi, {
      apiId: args.apiId,
    });

    if (!api) {
      throw new Error("API not found");
    }

    // Track the API call
    await ctx.runMutation(internal.customApis.trackApiCall, {
      apiId: args.apiId,
      clientId: "internal",
      statusCode: 200,
      responseTime: 0,
    });

    // Execute the API logic here
    return { success: true, data: args.requestData };
  },
});

export const getApiMetrics = query({
  args: {
    apiId: v.id("customApis"),
  },
  handler: async (ctx, args) => {
    const api = await ctx.db.get(args.apiId);
    if (!api) {
      return null;
    }

    // Get call logs for metrics
    const logs = await ctx.db
      .query("apiCallLogs")
      .withIndex("by_api_and_timestamp", (q) => q.eq("apiId", args.apiId))
      .collect();

    const totalCalls = logs.length;
    const avgResponseTime = logs.length > 0
      ? logs.reduce((sum, log) => sum + log.responseTime, 0) / logs.length
      : 0;

    return {
      api,
      metrics: {
        totalCalls,
        avgResponseTime,
        lastCall: logs.length > 0 ? logs[logs.length - 1].timestamp : null,
      },
    };
  },
});