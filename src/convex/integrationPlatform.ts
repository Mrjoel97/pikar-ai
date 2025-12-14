import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Integration Templates
export const listIntegrationTemplates = query({
  args: {
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("integrationTemplates");
    
    const templates = await query.collect();
    
    if (args.category) {
      return templates.filter(t => t.category === args.category);
    }
    
    return templates;
  },
});

export const createIntegrationTemplate = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    category: v.string(),
    provider: v.string(),
    config: v.any(),
    requiredFields: v.array(v.string()),
    documentation: v.string(),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("integrationTemplates", {
      ...args,
      createdAt: Date.now(),
      usageCount: 0,
    });
  },
});

// Custom Integration Builder
export const createCustomIntegration = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.string(),
    type: v.union(
      v.literal("api"),
      v.literal("webhook"),
      v.literal("database"),
      v.literal("custom")
    ),
    config: v.any(),
    authConfig: v.optional(v.any()),
    endpoints: v.array(v.object({
      method: v.string(),
      path: v.string(),
      description: v.string(),
      requestSchema: v.any(),
      responseSchema: v.any(),
    })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("customIntegrations", {
      ...args,
      status: "draft",
      version: "1.0.0",
      createdAt: Date.now(),
      lastModified: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
    });
  },
});

export const updateCustomIntegration = mutation({
  args: {
    integrationId: v.id("customIntegrations"),
    updates: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      config: v.optional(v.any()),
      endpoints: v.optional(v.array(v.any())),
      status: v.optional(v.union(
        v.literal("draft"),
        v.literal("testing"),
        v.literal("active"),
        v.literal("deprecated")
      )),
    }),
  },
  handler: async (ctx, args) => {
    const integration = await ctx.db.get(args.integrationId);
    if (!integration) throw new Error("Integration not found");

    await ctx.db.patch(args.integrationId, {
      ...args.updates,
      lastModified: Date.now(),
    });

    return args.integrationId;
  },
});

export const getCustomIntegration = query({
  args: {
    integrationId: v.id("customIntegrations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.integrationId);
  },
});

export const listCustomIntegrations = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customIntegrations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
  },
});

// Integration Testing
export const createIntegrationTest = mutation({
  args: {
    businessId: v.id("businesses"),
    integrationId: v.id("customIntegrations"),
    testName: v.string(),
    testType: v.union(
      v.literal("unit"),
      v.literal("integration"),
      v.literal("e2e")
    ),
    testConfig: v.any(),
    expectedResult: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("integrationTests", {
      ...args,
      createdAt: Date.now(),
      name: args.testName,
      businessId: args.businessId,
      config: args.testConfig,
      status: "pending",
    });
  },
});

export const runIntegrationTest = mutation({
  args: {
    testId: v.id("integrationTests"),
  },
  handler: async (ctx, args) => {
    const test = await ctx.db.get(args.testId);
    if (!test) throw new Error("Test not found");

    // Update test status to running
    await ctx.db.patch(args.testId, {
      status: "running",
      startedAt: Date.now(),
    });

    // Simulate test execution (in production, this would call actual test logic)
    const success = Math.random() > 0.3; // 70% success rate for demo
    const executionTime = Math.floor(Math.random() * 2000) + 500;

    // Record test result
    const resultId = await ctx.db.insert("integrationTestResults", {
      testId: args.testId,
      integrationId: test.integrationId,
      status: success ? "passed" : "failed",
      output: success ? { success: true } : { error: "Test failed" },
      duration: executionTime,
      createdAt: Date.now(),
    });

    // Update test status
    await ctx.db.patch(args.testId, {
      status: success ? "passed" : "failed",
      completedAt: Date.now(),
    });

    return resultId;
  },
});

export const getTestResults = query({
  args: {
    integrationId: v.id("customIntegrations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("integrationTestResults")
      .withIndex("by_integration", (q) => q.eq("integrationId", args.integrationId))
      .order("desc")
      .take(args.limit || 50);

    return results;
  },
});

// Integration Monitoring
export const recordIntegrationMetric = mutation({
  args: {
    integrationId: v.id("customIntegrations"),
    metricType: v.union(
      v.literal("request"),
      v.literal("error"),
      v.literal("latency"),
      v.literal("success")
    ),
    value: v.number(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("integrationMetrics", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

export const getIntegrationMetrics = query({
  args: {
    integrationId: v.id("customIntegrations"),
    metricType: v.optional(v.union(
      v.literal("request"),
      v.literal("error"),
      v.literal("latency"),
      v.literal("success")
    )),
    timeRange: v.optional(v.number()), // milliseconds
  },
  handler: async (ctx, args) => {
    const cutoff = args.timeRange ? Date.now() - args.timeRange : 0;

    const metrics = await ctx.db
      .query("integrationMetrics")
      .withIndex("by_integration", (q) => q.eq("integrationId", args.integrationId))
      .filter((q) => q.gte(q.field("timestamp"), cutoff))
      .collect();

    if (args.metricType) {
      return metrics.filter(m => m.metricType === args.metricType);
    }

    return metrics;
  },
});

export const getIntegrationHealth = query({
  args: {
    integrationId: v.id("customIntegrations"),
  },
  handler: async (ctx, args) => {
    const last24h = Date.now() - 24 * 60 * 60 * 1000;

    const metrics = await ctx.db
      .query("integrationMetrics")
      .withIndex("by_integration", (q) => q.eq("integrationId", args.integrationId))
      .filter((q) => q.gte(q.field("timestamp"), last24h))
      .collect();

    const requests = metrics.filter(m => m.metricType === "request");
    const errors = metrics.filter(m => m.metricType === "error");
    const latencies = metrics.filter(m => m.metricType === "latency");

    const totalRequests = requests.length;
    const totalErrors = errors.length;
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;
    const avgLatency = latencies.length > 0
      ? latencies.reduce((sum, m) => sum + m.value, 0) / latencies.length
      : 0;

    const uptime = totalRequests > 0 ? (1 - errorRate) * 100 : 100;

    return {
      totalRequests,
      totalErrors,
      errorRate,
      avgLatency,
      uptime,
      status: errorRate < 0.05 ? "healthy" : errorRate < 0.2 ? "degraded" : "unhealthy",
    };
  },
});

// Integration Marketplace
export const publishToMarketplace = mutation({
  args: {
    integrationId: v.id("customIntegrations"),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    provider: v.string(),
    price: v.number(),
    tags: v.array(v.string()),
    isPublished: v.boolean(),
  },
  handler: async (ctx, args) => {
    const integration = await ctx.db.get(args.integrationId);
    if (!integration) throw new Error("Integration not found");

    const id = await ctx.db.insert("integrationMarketplace", {
      integrationId: args.integrationId,
      name: args.name,
      description: args.description,
      category: args.category,
      provider: args.provider,
      // publisherId: args.publisherId, // Removed as it's not in schema
      price: args.price,
      downloads: 0,
      rating: 0,
      createdAt: Date.now(),
      isPublished: args.isPublished,
      tags: args.tags,
    });

    return id;
  },
});

export const getMarketplaceListings = query({
  args: {
    category: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let listings = await ctx.db
      .query("integrationMarketplace")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();

    if (args.category) {
      listings = listings.filter(l => l.category === args.category);
    }

    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase();
      listings = listings.filter(l =>
        l.name.toLowerCase().includes(query) ||
        l.description.toLowerCase().includes(query)
      );
    }

    return listings.sort((a, b) => b.downloads - a.downloads);
  },
});

export const installMarketplaceIntegration = mutation({
  args: {
    listingId: v.id("integrationMarketplace"),
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.listingId);
    if (!listing) throw new Error("Listing not found");

    const integration = await ctx.db.get(listing.integrationId);
    if (!integration) throw new Error("Integration not found");

    // Create a copy for the business
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, _creationTime, ...integrationData } = integration;
    
    const installedId = await ctx.db.insert("customIntegrations", {
      ...integrationData,
      businessId: args.businessId,
      status: "active",
      installedFrom: args.listingId,
      installedAt: Date.now(),
    });

    // Update download count
    await ctx.db.patch(args.listingId, {
      downloads: listing.downloads + 1,
    });

    return installedId;
  },
});

// Documentation Generator
export const generateIntegrationDocs = query({
  args: {
    integrationId: v.id("customIntegrations"),
  },
  handler: async (ctx, args) => {
    const integration = await ctx.db.get(args.integrationId);
    if (!integration) throw new Error("Integration not found");

    // Generate documentation structure
    const docs = {
      overview: {
        name: integration.name,
        description: integration.description,
        version: integration.version,
        type: integration.type,
      },
      authentication: integration.authConfig || {},
      endpoints: integration.endpoints.map(ep => ({
        method: ep.method,
        path: ep.path,
        description: ep.description,
        requestSchema: ep.requestSchema,
        responseSchema: ep.responseSchema,
      })),
      examples: [],
      changelog: [],
    };

    return docs;
  },
});

/**
 * Get integration analytics dashboard
 */
export const getIntegrationAnalytics = query({
  args: {
    businessId: v.id("businesses"),
    timeRange: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const cutoff = args.timeRange ? Date.now() - args.timeRange : Date.now() - 7 * 24 * 60 * 60 * 1000;

    const integrations = await ctx.db
      .query("customIntegrations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const analytics = await Promise.all(
      integrations.map(async (integration) => {
        const metrics = await ctx.db
          .query("integrationMetrics")
          .withIndex("by_integration", (q) => q.eq("integrationId", integration._id))
          .filter((q) => q.gte(q.field("timestamp"), cutoff))
          .collect();

        const requests = metrics.filter(m => m.metricType === "request").length;
        const errors = metrics.filter(m => m.metricType === "error").length;
        const latencies = metrics.filter(m => m.metricType === "latency");
        const avgLatency = latencies.length > 0
          ? latencies.reduce((sum, m) => sum + m.value, 0) / latencies.length
          : 0;

        return {
          integrationId: integration._id,
          name: integration.name,
          type: integration.type,
          status: integration.status,
          totalRequests: requests,
          totalErrors: errors,
          errorRate: requests > 0 ? (errors / requests) * 100 : 0,
          avgLatency: Math.round(avgLatency),
        };
      })
    );

    const totalRequests = analytics.reduce((sum, a) => sum + a.totalRequests, 0);
    const totalErrors = analytics.reduce((sum, a) => sum + a.totalErrors, 0);
    const overallErrorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
    const avgLatency = analytics.length > 0
      ? analytics.reduce((sum, a) => sum + a.avgLatency, 0) / analytics.length
      : 0;

    return {
      integrations: analytics,
      summary: {
        totalIntegrations: integrations.length,
        activeIntegrations: integrations.filter(i => i.status === "active").length,
        totalRequests,
        totalErrors,
        overallErrorRate,
        avgLatency: Math.round(avgLatency),
      },
    };
  },
});

/**
 * Get integration cost analysis
 */
export const getIntegrationCostAnalysis = query({
  args: {
    businessId: v.id("businesses"),
    timeRange: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const cutoff = args.timeRange ? Date.now() - args.timeRange : Date.now() - 30 * 24 * 60 * 60 * 1000;

    const integrations = await ctx.db
      .query("customIntegrations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const costAnalysis = await Promise.all(
      integrations.map(async (integration) => {
        const metrics = await ctx.db
          .query("integrationMetrics")
          .withIndex("by_integration", (q) => q.eq("integrationId", integration._id))
          .filter((q) => q.gte(q.field("timestamp"), cutoff))
          .collect();

        const requests = metrics.filter(m => m.metricType === "request").length;
        // Estimate cost: $0.001 per request (example pricing)
        const estimatedCost = requests * 0.001;

        return {
          integrationId: integration._id,
          name: integration.name,
          requests,
          estimatedCost,
          costPerRequest: 0.001,
        };
      })
    );

    const totalCost = costAnalysis.reduce((sum, c) => sum + c.estimatedCost, 0);

    return {
      integrations: costAnalysis,
      totalCost,
      projectedMonthlyCost: totalCost * (30 / ((Date.now() - cutoff) / (24 * 60 * 60 * 1000))),
    };
  },
});

// Export cost tracking modules
export * as costs from "./integrationPlatform/costs";
export * as billing from "./integrationPlatform/billing";