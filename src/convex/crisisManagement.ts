
import { v } from "convex/values";
import { query, mutation, internalMutation, internalAction } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Query: Detect crisis situations based on social media metrics
 */
export const detectCrisis = query({
  args: {
    businessId: v.id("businesses"),
    timeWindow: v.number(), // minutes
  },
  handler: async (ctx, args) => {
    const { businessId, timeWindow } = args;

    const cutoff = Date.now() - timeWindow * 60 * 1000;

    // Get recent crisis alerts
    const alerts = await ctx.db
      .query("crisisAlerts")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .filter((q) => q.gte(q.field("_creationTime"), cutoff))
      .collect();

    const summary = {
      total: alerts.length,
      critical: alerts.filter((a) => a.severity === "critical").length,
      high: alerts.filter((a) => a.severity === "high").length,
      medium: alerts.filter((a) => a.severity === "medium").length,
    };

    return {
      alerts: alerts.map((a) => ({
        severity: a.severity,
        type: a.type,
        message: a.message,
        timestamp: a._creationTime,
        status: a.status,
      })),
      summary,
    };
  },
});

/**
 * Query: Get crisis history
 */
export const getCrisisHistory = query({
  args: {
    businessId: v.id("businesses"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { businessId, limit = 50 } = args;

    const alerts = await ctx.db
      .query("crisisAlerts")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .order("desc")
      .take(limit);

    return alerts;
  },
});

/**
 * Mutation: Create a crisis alert
 */
export const createCrisisAlert = mutation({
  args: {
    businessId: v.id("businesses"),
    severity: v.string(),
    type: v.string(),
    message: v.string(),
    postId: v.optional(v.id("socialPosts")),
    metrics: v.optional(v.any()),
    autoDetected: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Unauthorized");

    const alertId = await ctx.db.insert("crisisAlerts", {
      businessId: args.businessId,
      severity: args.severity as "low" | "medium" | "high" | "critical",
      type: args.type,
      message: args.message,
      postId: args.postId,
      metrics: args.metrics,
      status: "open" as const,
      autoDetected: args.autoDetected ?? false,
      createdBy: user.subject,
      createdAt: Date.now(),
    });

    return alertId;
  },
});

/**
 * Mutation: Update crisis alert status
 */
export const updateCrisisAlert = mutation({
  args: {
    alertId: v.id("crisisAlerts"),
    status: v.string(),
    resolution: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Unauthorized");

    await ctx.db.patch(args.alertId, {
      status: args.status as "open" | "investigating" | "resolved" | "false_positive",
      resolution: args.resolution,
      resolvedBy: args.status === "resolved" ? user.subject : undefined,
      resolvedAt: args.status === "resolved" ? Date.now() : undefined,
    });

    return { success: true };
  },
});

/**
 * Query: Get crisis response templates
 */
export const getCrisisTemplates = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    // Return predefined crisis response templates
    return [
      {
        type: "negative_sentiment",
        template: "We sincerely apologize for any inconvenience. We're investigating this matter and will provide an update shortly.",
      },
      {
        type: "viral_negative",
        template: "We're aware of the concerns being raised and take them very seriously. Our team is working on a comprehensive response.",
      },
      {
        type: "engagement_spike",
        template: "Thank you for the overwhelming response! We're monitoring the situation closely.",
      },
    ];
  },
});

/**
 * Internal: Auto-create crisis alerts from detection for a single business
 */
export const autoCreateCrisisAlerts = internalMutation({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const { businessId } = args;

    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const recentPosts = await ctx.db
      .query("socialPosts")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .filter((q) => q.gte(q.field("_creationTime"), cutoff))
      .collect();

    let alertsCreated = 0;

    for (const post of recentPosts) {
      const metrics = post.performanceMetrics || { likes: 0, comments: 0, shares: 0, impressions: 0, engagements: 0, clicks: 0 };
      const engagement = (metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0);

      if (engagement > 1000) {
        const existing = await ctx.db
          .query("crisisAlerts")
          .withIndex("by_business", (q) => q.eq("businessId", businessId))
          .filter((q) => q.eq(q.field("postId"), post._id))
          .first();

        if (!existing) {
          await ctx.db.insert("crisisAlerts", {
            businessId,
            severity: "high" as const,
            type: "engagement_spike",
            message: `Post has received unusually high engagement (${engagement} interactions)`,
            postId: post._id,
            metrics: { engagement },
            status: "open" as const,
            autoDetected: true,
            createdBy: "system",
            createdAt: Date.now(),
          });
          alertsCreated++;
        }
      }
    }

    return { alertsCreated };
  },
});

/**
 * Internal Action: Auto-create crisis alerts for all businesses
 */
export const autoCreateCrisisAlertsForAll = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get all active businesses
    const businesses = await ctx.runQuery("businesses:listAllBusinesses" as any, {});
    
    let totalCreated = 0;
    for (const business of businesses) {
      try {
        const result = await ctx.runMutation("crisisManagement:autoCreateCrisisAlerts" as any, {
          businessId: business._id,
        });
        totalCreated += result.alertsCreated || 0;
      } catch (error) {
        console.error(`Failed to auto-create crisis alerts for business ${business._id}:`, error);
      }
    }
    
    return { success: true, totalAlertsCreated: totalCreated };
  },
});