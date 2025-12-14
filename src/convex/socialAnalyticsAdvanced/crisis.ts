import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Detect potential crisis situations using AI
 */
export const detectCrisis = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    // In production, this would use AI to analyze sentiment trends and mention volume
    const recentPosts = await ctx.db
      .query("socialPosts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .take(100);

    // Simple crisis detection based on engagement patterns
    const avgEngagement = recentPosts.reduce((sum, p) => 
      sum + ((p.likes || 0) + (p.comments || 0) + (p.shares || 0)), 0
    ) / (recentPosts.length || 1);

    const recentEngagement = recentPosts.slice(0, 10).reduce((sum, p) => 
      sum + ((p.likes || 0) + (p.comments || 0) + (p.shares || 0)), 0
    ) / 10;

    const crisisScore = recentEngagement > avgEngagement * 2 ? 
      Math.min(100, (recentEngagement / avgEngagement) * 30) : 0;

    return {
      crisisDetected: crisisScore > 50,
      crisisScore: Math.round(crisisScore),
      severity: crisisScore > 80 ? "critical" : crisisScore > 50 ? "high" : "low",
      indicators: [
        { type: "mention_spike", value: crisisScore > 50 },
        { type: "negative_sentiment", value: crisisScore > 60 },
        { type: "engagement_surge", value: recentEngagement > avgEngagement * 1.5 },
      ],
      timestamp: Date.now(),
    };
  },
});

/**
 * Get crisis alerts
 */
export const getCrisisAlerts = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const alerts = await ctx.db
      .query("crisisAlerts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.neq(q.field("status"), "resolved"))
      .order("desc")
      .take(20);

    return alerts;
  },
});

/**
 * Create crisis response
 */
export const createCrisisResponse = mutation({
  args: {
    businessId: v.id("businesses"),
    alertId: v.id("crisisAlerts"),
    responseText: v.string(),
    channels: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const alert = await ctx.db.get(args.alertId);
    if (!alert) throw new Error("Alert not found");

    // Create response record
    const responseId = await ctx.db.insert("crisisResponses", {
      businessId: args.businessId,
      alertId: args.alertId,
      responseText: args.responseText,
      channels: args.channels,
      status: "pending",
      createdAt: Date.now(),
    });

    // Update alert status
    await ctx.db.patch(args.alertId, {
      status: "responding",
      updatedAt: Date.now(),
    });

    // Create crisis events for response sent
    if (args.channels && args.channels.length > 0) {
      await ctx.db.insert("crisisEvents", {
        businessId: args.businessId,
        type: "response_sent",
        severity: "medium", // Default severity
        title: "Crisis Response Sent", // Default title
        description: `Response sent to ${args.channels.join(", ")}`,
        status: "active",
        detectedAt: Date.now(),
        updatedAt: Date.now(),
        metadata: { channels: args.channels, status: "sent" }, // Move to metadata
      });
    }

    return responseId;
  },
});

/**
 * Get crisis timeline
 */
export const getCrisisTimeline = query({
  args: {
    alertId: v.id("crisisAlerts"),
  },
  handler: async (ctx, args) => {
    const alert = await ctx.db.get(args.alertId);
    if (!alert) return [];

    const responses = await ctx.db
      .query("crisisResponses")
      .withIndex("by_alert", (q) => q.eq("alertId", args.alertId))
      .collect();

    const timeline = [
      {
        type: "alert_created",
        timestamp: alert.createdAt,
        data: { severity: alert.severity, title: alert.title },
      },
      ...responses.map(r => ({
        type: "response_created",
        timestamp: r.createdAt,
        data: { channels: r.channels, status: r.status },
      })),
    ];

    if (alert.resolvedAt) {
      timeline.push({
        type: "alert_resolved",
        timestamp: alert.resolvedAt,
        data: {},
      });
    }

    return timeline.sort((a, b) => a.timestamp - b.timestamp);
  },
});