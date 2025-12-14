import { v } from "convex/values";
import { query, mutation, internalQuery } from "./_generated/server";

export const calculateMetric = query({
  args: {
    metricId: v.id("customMetrics"),
  },
  handler: async (ctx, args) => {
    const metric = await ctx.db.get(args.metricId);
    if (!metric) {
      throw new Error("Metric not found");
    }

    // Simple calculation - can be enhanced
    let value = 0;
    
    if (metric.metricType === "count") {
      // Count records from data source
      value = Math.floor(Math.random() * 1000); // Placeholder
    }

    return {
      metricId: args.metricId,
      value,
      calculatedAt: Date.now(),
    };
  },
});

export const updateMetricValue = mutation({
  args: {
    metricId: v.id("customMetrics"),
    value: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.metricId, {
      currentValue: args.value,
      lastCalculated: Date.now(),
    });

    await ctx.db.insert("metricHistory", {
      metricId: args.metricId,
      businessId: args.businessId,
      value: args.value,
      timestamp: Date.now(),
      metadata: args.metadata,
    });

    return { success: true };
  },
});

// New: Aggregate analytics across business
export const getBusinessAnalytics = query({
  args: {
    businessId: v.id("businesses"),
    timeRange: v.optional(v.union(
      v.literal("7d"),
      v.literal("30d"),
      v.literal("90d"),
      v.literal("1y")
    )),
  },
  handler: async (ctx, args) => {
    const timeRange = args.timeRange || "30d";
    const now = Date.now();
    const ranges: Record<string, number> = {
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
      "1y": 365 * 24 * 60 * 60 * 1000,
    };
    const startTime = now - ranges[timeRange];

    // Aggregate workflow executions
    const workflowExecutions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("_creationTime"), startTime))
      .collect();

    const successfulExecutions = workflowExecutions.filter(
      (e) => e.status === "succeeded"
    ).length;
    const failedExecutions = workflowExecutions.filter(
      (e) => e.status === "failed"
    ).length;

    // Aggregate email campaigns
    const emailCampaigns = await ctx.db
      .query("emails")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("createdAt"), startTime))
      .collect();

    const sentEmails = emailCampaigns.filter((e) => e.status === "sent").length;

    // Aggregate social posts
    const socialPosts = await ctx.db
      .query("socialPosts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("_creationTime"), startTime))
      .collect();

    const publishedPosts = socialPosts.filter((p) => p.status === "posted").length;

    // Aggregate AI agent activity - using aiAgents table instead
    const aiAgents = await ctx.db
      .query("aiAgents")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
    
    const agentExecutions = aiAgents.length; // Simplified metric

    return {
      timeRange,
      workflows: {
        total: workflowExecutions.length,
        successful: successfulExecutions,
        failed: failedExecutions,
        successRate: workflowExecutions.length > 0 
          ? Math.round((successfulExecutions / workflowExecutions.length) * 100) 
          : 0,
      },
      emails: {
        total: emailCampaigns.length,
        sent: sentEmails,
        sendRate: emailCampaigns.length > 0
          ? Math.round((sentEmails / emailCampaigns.length) * 100)
          : 0,
      },
      social: {
        total: socialPosts.length,
        published: publishedPosts,
        publishRate: socialPosts.length > 0
          ? Math.round((publishedPosts / socialPosts.length) * 100)
          : 0,
      },
      aiAgents: {
        totalAgents: agentExecutions,
        activeAgents: aiAgents.filter((a: any) => a.status === "active").length,
      },
    };
  },
});

// New: Get integration health summary
export const getIntegrationHealth = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    // Check CRM integrations
    const crmConnections = await ctx.db
      .query("crmConnections")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const crmHealthy = crmConnections.filter((c) => c.isActive).length;

    // Check social integrations
    const socialAccounts = await ctx.db
      .query("socialAccounts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const now = Date.now();
    const socialHealthy = socialAccounts.filter((a) => {
      if (a.expiresAt && a.expiresAt < now) return false;
      return true;
    }).length;

    // Check email configuration
    const emailConfig = await ctx.db
      .query("emailConfigs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .first();

    const emailHealthy = emailConfig && emailConfig.fromEmail && emailConfig.replyTo;

    return {
      crm: {
        total: crmConnections.length,
        healthy: crmHealthy,
        healthPercentage: crmConnections.length > 0
          ? Math.round((crmHealthy / crmConnections.length) * 100)
          : 100,
      },
      social: {
        total: socialAccounts.length,
        healthy: socialHealthy,
        healthPercentage: socialAccounts.length > 0
          ? Math.round((socialHealthy / socialAccounts.length) * 100)
          : 100,
      },
      email: {
        configured: !!emailHealthy,
        status: emailHealthy ? "healthy" : "needs_configuration",
      },
      overall: {
        totalIntegrations: crmConnections.length + socialAccounts.length + (emailHealthy ? 1 : 0),
        healthyIntegrations: crmHealthy + socialHealthy + (emailHealthy ? 1 : 0),
      },
    };
  },
});

// New: Track metric trends over time
export const getMetricTrends = internalQuery({
  args: {
    metricId: v.id("customMetrics"),
    days: v.number(),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now() - args.days * 24 * 60 * 60 * 1000;
    
    const history = await ctx.db
      .query("metricHistory")
      .withIndex("by_metric", (q) => q.eq("metricId", args.metricId))
      .filter((q) => q.gte(q.field("timestamp"), startTime))
      .order("asc")
      .collect();

    return history.map((h) => ({
      timestamp: h.timestamp,
      value: h.value,
    }));
  },
});