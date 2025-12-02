import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Get rate limit usage for a business
 */
export const getRateLimitUsage = query({
  args: {
    businessId: v.id("businesses"),
    timeRange: v.optional(v.union(v.literal("hour"), v.literal("day"), v.literal("month"))),
  },
  handler: async (ctx: any, args) => {
    const range = args.timeRange || "hour";
    const now = Date.now();
    
    let startTime: number;
    switch (range) {
      case "hour":
        startTime = now - (60 * 60 * 1000);
        break;
      case "day":
        startTime = now - (24 * 60 * 60 * 1000);
        break;
      case "month":
        startTime = now - (30 * 24 * 60 * 60 * 1000);
        break;
    }

    // Query API usage logs (you'll need to create this table in schema)
    const usage = await ctx.db
      .query("apiUsageLogs")
      .withIndex("by_business_and_time", (q: any) =>
        q.eq("businessId", args.businessId).gte("timestamp", startTime)
      )
      .collect();

    const totalRequests = usage.length;
    const successfulRequests = usage.filter((u: any) => u.statusCode < 400).length;
    const rateLimitedRequests = usage.filter((u: any) => u.statusCode === 429).length;
    const errorRequests = usage.filter((u: any) => u.statusCode >= 500).length;

    // Group by endpoint
    const byEndpoint: Record<string, number> = {};
    usage.forEach((u: any) => {
      byEndpoint[u.endpoint] = (byEndpoint[u.endpoint] || 0) + 1;
    });

    return {
      timeRange: range,
      totalRequests,
      successfulRequests,
      rateLimitedRequests,
      errorRequests,
      successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
      byEndpoint: Object.entries(byEndpoint)
        .map(([endpoint, count]) => ({ endpoint, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };
  },
});

/**
 * Log API usage (called from HTTP endpoints)
 */
export const logApiUsage = mutation({
  args: {
    businessId: v.id("businesses"),
    endpoint: v.string(),
    method: v.string(),
    statusCode: v.number(),
    responseTime: v.number(),
    userId: v.optional(v.id("users")),
    apiKey: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
    await ctx.db.insert("apiUsageLogs", {
      businessId: args.businessId,
      endpoint: args.endpoint,
      method: args.method,
      statusCode: args.statusCode,
      responseTime: args.responseTime,
      userId: args.userId,
      apiKeyHash: args.apiKey ? hashApiKey(args.apiKey) : undefined,
      timestamp: Date.now(),
    });
  },
});

function hashApiKey(key: string): string {
  // Simple hash for demo - use proper crypto in production
  return key.substring(0, 8) + "...";
}