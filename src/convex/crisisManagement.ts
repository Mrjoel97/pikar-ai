import { v } from "convex/values";
import { query, mutation, internalMutation, internalAction } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

/**
 * Query: Detect crisis situations based on social media metrics
 */
export const detectCrisis = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    timeWindow: v.optional(v.number()), // minutes
  },
  handler: async (ctx, args) => {
    // Guest/public: no business context → return empty
    if (!args.businessId) {
      return {
        alerts: [],
        summary: { total: 0, critical: 0, high: 0, medium: 0 },
      };
    }

    const { businessId, timeWindow = 60 } = args;

    const cutoff = Date.now() - timeWindow * 60 * 1000;

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
        type: a.alertType,
        message: a.description,
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
    businessId: v.optional(v.id("businesses")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Guest/public: no business context → return empty
    if (!args.businessId) {
      return [];
    }

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
 * Query: Get active alerts
 */
export const getActiveAlerts = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const alerts = await ctx.db
      .query("crisisAlerts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.neq(q.field("status"), "resolved"))
      .collect();

    return alerts.map((a) => ({
      id: a._id,
      type: a.alertType, // Map alertType to type
      severity: a.severity,
      message: a.description, // Map description to message
      timestamp: a.detectedAt,
      status: a.status,
    }));
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
      alertType: args.type,
      title: args.message.substring(0, 100),
      description: args.message,
      status: "active" as const,
      detectedAt: Date.now(),
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
      status: args.status === "resolved" ? "resolved" : args.status === "investigating" ? "monitoring" : "active",
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
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    // Return predefined crisis response templates
    return [
      {
        type: "negative_sentiment",
        template:
          "We sincerely apologize for any inconvenience. We're investigating this matter and will provide an update shortly.",
      },
      {
        type: "viral_negative",
        template:
          "We're aware of the concerns being raised and take them very seriously. Our team is working on a comprehensive response.",
      },
      {
        type: "engagement_spike",
        template:
          "Thank you for the overwhelming response! We're monitoring the situation closely.",
      },
    ];
  },
});

/**
 * Query: Get crisis response playbooks
 */
export const getCrisisPlaybooks = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    crisisType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Return predefined crisis response playbooks
    const playbooks = [
      {
        id: "negative_sentiment",
        name: "Negative Sentiment Response",
        crisisType: "negative_sentiment",
        steps: [
          "Acknowledge the concern publicly within 1 hour",
          "Investigate the root cause internally",
          "Prepare a detailed response with solutions",
          "Post official statement on all channels",
          "Monitor sentiment for 48 hours",
          "Follow up with affected customers",
        ],
        stakeholders: ["PR Team", "Customer Support", "Executive Team"],
        estimatedDuration: "24-48 hours",
      },
      {
        id: "viral_negative",
        name: "Viral Negative Content",
        crisisType: "viral_negative",
        steps: [
          "Activate crisis response team immediately",
          "Notify executive leadership",
          "Prepare holding statement within 30 minutes",
          "Coordinate with legal team",
          "Draft comprehensive response",
          "Execute multi-channel communication plan",
          "Monitor and respond to ongoing discussions",
        ],
        stakeholders: ["Executive Team", "Legal", "PR Team", "Social Media Team"],
        estimatedDuration: "48-72 hours",
      },
      {
        id: "engagement_spike",
        name: "Unusual Engagement Spike",
        crisisType: "engagement_spike",
        steps: [
          "Identify the source of spike",
          "Assess if positive or negative",
          "Prepare response strategy",
          "Engage with audience appropriately",
          "Monitor for escalation",
        ],
        stakeholders: ["Social Media Team", "Marketing Team"],
        estimatedDuration: "12-24 hours",
      },
    ];

    if (args.crisisType) {
      return playbooks.filter((p) => p.crisisType === args.crisisType);
    }

    return playbooks;
  },
});

/**
 * Mutation: Send stakeholder notifications
 */
export const notifyStakeholders = mutation({
  args: {
    businessId: v.id("businesses"),
    alertId: v.id("crisisAlerts"),
    stakeholders: v.array(v.string()),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Unauthorized");

    const alert = await ctx.db.get(args.alertId);
    if (!alert) throw new Error("Alert not found");

    // Create notifications for each stakeholder
    const actorUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", user.email!))
      .first();

    let notified = 0;
    if (actorUser) {
      for (const stakeholder of args.stakeholders) {
        await ctx.db.insert("notifications", {
          businessId: args.businessId,
          userId: actorUser._id,
          type: "system_alert",
          title: `Crisis Alert: ${alert.alertType}`,
          message: args.message,
          data: {
            kind: "crisis_notification",
            alertId: args.alertId,
            severity: alert.severity,
            stakeholder,
          },
          isRead: false,
          priority: alert.severity === "critical" ? "high" : "medium",
          createdAt: Date.now(),
        });
        notified++;
      }
    }

    // Log the notification
    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      action: "crisis_stakeholders_notified",
      entityType: "crisis_alert",
      entityId: args.alertId,
      details: {
        stakeholders: args.stakeholders,
        message: args.message,
      },
      createdAt: Date.now(),
    });

    return { success: true, notified };
  },
});

/**
 * Query: Get crisis resolution tracking
 */
export const getCrisisResolutionTracking = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    alertId: v.optional(v.id("crisisAlerts")),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return [];
    }

    let query = ctx.db
      .query("crisisAlerts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!));

    const alerts = await query.collect();

    return alerts.map((alert) => ({
      alertId: alert._id,
      type: alert.alertType,
      severity: alert.severity,
      status: alert.status,
      createdAt: alert.detectedAt,
      resolvedAt: alert.resolvedAt,
      timeToResolve: alert.resolvedAt ? alert.resolvedAt - alert.detectedAt : null,
      resolution: undefined,
    }));
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
          .first();

        if (!existing) {
          await ctx.db.insert("crisisAlerts", {
            businessId,
            severity: "high" as const,
            alertType: "engagement_spike",
            title: "Unusual Engagement Spike",
            description: `Post has received unusually high engagement (${engagement} interactions)`,
            status: "active" as const,
            detectedAt: Date.now(),
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
    const businesses = await ctx.runQuery(internal.businesses.listAll as any, {});
    
    let totalCreated = 0;
    for (const business of businesses) {
      try {
        const result = await ctx.runMutation(internal.crisisManagement.autoCreateCrisisAlerts, {
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

/**
 * Query: Get crisis dashboard metrics for enterprise view
 */
export const getCrisisDashboard = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const alerts = await ctx.db
      .query("crisisAlerts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const activeAlerts = alerts.filter((a) => a.status === "active").length;
    const resolvedAlerts = alerts.filter((a) => a.status === "resolved");

    // Calculate average response time (in minutes)
    const responseTimes = resolvedAlerts
      .filter((a) => a.resolvedAt && a.detectedAt)
      .map((a) => (a.resolvedAt! - a.detectedAt) / (1000 * 60));

    const avgResponseTime =
      responseTimes.length > 0
        ? `${Math.round(responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length)}m`
        : "N/A";

    const resolutionRate =
      alerts.length > 0
        ? Math.round((resolvedAlerts.length / alerts.length) * 100)
        : 0;

    return {
      activeAlerts,
      totalAlerts: alerts.length,
      resolvedAlerts: resolvedAlerts.length,
      avgResponseTime,
      resolutionRate,
      recentAlerts: alerts
        .sort((a, b) => b.detectedAt - a.detectedAt)
        .slice(0, 5)
        .map((a) => ({
          id: a._id,
          type: a.alertType,
          severity: a.severity,
          status: a.status,
          detectedAt: a.detectedAt,
        })),
    };
  },
});