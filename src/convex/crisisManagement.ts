import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Crisis Detection Thresholds
 */
const CRISIS_THRESHOLDS = {
  negativeEngagementSpike: 5, // 5x normal negative engagement
  rapidResponseRequired: 100, // 100+ negative comments in 1 hour
  viralNegativePost: 10000, // 10k+ impressions with <1% positive engagement
  brandMentionSpike: 10, // 10x normal brand mentions
};

/**
 * Detect potential crisis situations based on social media activity
 */
export const detectCrisis = query({
  args: {
    businessId: v.id("businesses"),
    timeWindow: v.optional(v.number()), // minutes, default 60
  },
  handler: async (ctx, args) => {
    const timeWindow = args.timeWindow || 60;
    const cutoff = Date.now() - (timeWindow * 60 * 1000);

    // Get recent posts with performance metrics
    const recentPosts = await ctx.db
      .query("socialPosts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("_creationTime"), cutoff))
      .collect();

    const alerts: Array<{
      severity: "low" | "medium" | "high" | "critical";
      type: string;
      message: string;
      postId?: Id<"socialPosts">;
      metrics?: any;
      timestamp: number;
    }> = [];

    for (const post of recentPosts) {
      if (!post.performanceMetrics) continue;

      const metrics = post.performanceMetrics;
      const totalEngagement = metrics.engagements || 0;
      const negativeEngagement = (metrics.comments || 0) * 0.3; // Estimate 30% negative

      // Check for viral negative post
      if (metrics.impressions > CRISIS_THRESHOLDS.viralNegativePost) {
        const positiveRate = totalEngagement > 0 ? (metrics.likes / totalEngagement) : 0;
        if (positiveRate < 0.01) {
          alerts.push({
            severity: "critical",
            type: "viral_negative",
            message: `Post going viral with negative sentiment: ${metrics.impressions.toLocaleString()} impressions, ${positiveRate.toFixed(2)}% positive engagement`,
            postId: post._id,
            metrics,
            timestamp: post._creationTime,
          });
        }
      }

      // Check for rapid negative response
      if (metrics.comments > CRISIS_THRESHOLDS.rapidResponseRequired) {
        alerts.push({
          severity: "high",
          type: "rapid_response_required",
          message: `High volume of comments detected: ${metrics.comments} comments in ${timeWindow} minutes`,
          postId: post._id,
          metrics,
          timestamp: post._creationTime,
        });
      }

      // Check for engagement anomalies
      const avgEngagement = 100; // This should be calculated from historical data
      if (negativeEngagement > avgEngagement * CRISIS_THRESHOLDS.negativeEngagementSpike) {
        alerts.push({
          severity: "medium",
          type: "negative_spike",
          message: `Negative engagement spike detected: ${negativeEngagement.toFixed(0)} vs avg ${avgEngagement}`,
          postId: post._id,
          metrics,
          timestamp: post._creationTime,
        });
      }
    }

    // Sort by severity and timestamp
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.timestamp - a.timestamp;
    });

    return {
      alerts,
      summary: {
        total: alerts.length,
        critical: alerts.filter((a) => a.severity === "critical").length,
        high: alerts.filter((a) => a.severity === "high").length,
        medium: alerts.filter((a) => a.severity === "medium").length,
        low: alerts.filter((a) => a.severity === "low").length,
      },
      timeWindow,
      lastChecked: Date.now(),
    };
  },
});

/**
 * Get crisis alerts history
 */
export const getCrisisHistory = query({
  args: {
    businessId: v.id("businesses"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const alerts = await ctx.db
      .query("crisisAlerts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .take(limit);

    return alerts;
  },
});

/**
 * Create a crisis alert
 */
export const createCrisisAlert = mutation({
  args: {
    businessId: v.id("businesses"),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    type: v.string(),
    message: v.string(),
    postId: v.optional(v.id("socialPosts")),
    metrics: v.optional(v.any()),
    autoDetected: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const alertId = await ctx.db.insert("crisisAlerts", {
      businessId: args.businessId,
      severity: args.severity,
      type: args.type,
      message: args.message,
      postId: args.postId,
      metrics: args.metrics,
      status: "open",
      autoDetected: args.autoDetected,
      createdBy: identity.email || "system",
      createdAt: Date.now(),
    });

    // Log audit event
    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      userId: undefined,
      action: "crisis_alert_created",
      entityType: "crisisAlert",
      entityId: alertId,
      details: {
        severity: args.severity,
        type: args.type,
        autoDetected: args.autoDetected,
      },
      createdAt: Date.now(),
    });

    return alertId;
  },
});

/**
 * Update crisis alert status
 */
export const updateCrisisAlert = mutation({
  args: {
    alertId: v.id("crisisAlerts"),
    status: v.union(v.literal("open"), v.literal("investigating"), v.literal("resolved"), v.literal("false_positive")),
    resolution: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const alert = await ctx.db.get(args.alertId);
    if (!alert) throw new Error("Alert not found");

    await ctx.db.patch(args.alertId, {
      status: args.status,
      resolution: args.resolution,
      resolvedBy: identity.email,
      resolvedAt: args.status === "resolved" || args.status === "false_positive" ? Date.now() : undefined,
    });

    // Log audit event
    await ctx.db.insert("audit_logs", {
      businessId: alert.businessId,
      userId: undefined,
      action: "crisis_alert_updated",
      entityType: "crisisAlert",
      entityId: args.alertId,
      details: {
        status: args.status,
        resolution: args.resolution,
      },
      createdAt: Date.now(),
    });

    return args.alertId;
  },
});

/**
 * Get crisis response templates
 */
export const getCrisisTemplates = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    // Return predefined crisis response templates
    return [
      {
        id: "apology",
        name: "Public Apology",
        template: "We sincerely apologize for [issue]. We take full responsibility and are working to [resolution]. We value your feedback and are committed to doing better.",
        useCase: "Product/service failures, customer complaints",
      },
      {
        id: "clarification",
        name: "Clarification Statement",
        template: "We'd like to clarify [misconception]. The facts are [accurate information]. We appreciate the opportunity to set the record straight.",
        useCase: "Misinformation, misunderstandings",
      },
      {
        id: "investigation",
        name: "Investigation Update",
        template: "We're aware of [issue] and are actively investigating. We'll provide updates as we learn more. Your patience is appreciated.",
        useCase: "Ongoing issues, security concerns",
      },
      {
        id: "resolution",
        name: "Resolution Announcement",
        template: "Update: [issue] has been resolved. Here's what we did: [actions taken]. Thank you for your patience and understanding.",
        useCase: "Issue resolution, follow-up",
      },
    ];
  },
});

/**
 * Internal: Auto-create crisis alerts from detection
 */
export const autoCreateCrisisAlerts = internalMutation({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    // This would be called by a cron job
    // For now, it's a placeholder for automated crisis detection
    return { success: true };
  },
});
