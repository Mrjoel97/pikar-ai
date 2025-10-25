import { v } from "convex/values";
import { action, mutation, query, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * List all webhooks for a business
 */
export const listWebhooks = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("webhooks")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
  },
});

/**
 * Get webhook by ID
 */
export const getWebhook = query({
  args: { webhookId: v.id("webhooks") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    const webhook = await ctx.db.get(args.webhookId);
    return webhook;
  },
});

/**
 * Get webhook analytics
 */
export const getWebhookAnalytics = query({
  args: { 
    webhookId: v.id("webhooks"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const start = args.startDate || now - 7 * 24 * 60 * 60 * 1000; // 7 days
    const end = args.endDate || now;

    const deliveries = await ctx.db
      .query("webhookDeliveries")
      .withIndex("by_webhook", (q) => q.eq("webhookId", args.webhookId))
      .filter((q) => 
        q.and(
          q.gte(q.field("createdAt"), start),
          q.lte(q.field("createdAt"), end)
        )
      )
      .collect();

    const totalDeliveries = deliveries.length;
    const successful = deliveries.filter(d => d.status === "success").length;
    const failed = deliveries.filter(d => d.status === "failed").length;
    const pending = deliveries.filter(d => d.status === "pending").length;

    // Group by day
    const deliveriesByDay: Record<string, { success: number; failed: number }> = {};
    deliveries.forEach(delivery => {
      const day = new Date(delivery.createdAt).toISOString().split('T')[0];
      if (!deliveriesByDay[day]) {
        deliveriesByDay[day] = { success: 0, failed: 0 };
      }
      if (delivery.status === "success") deliveriesByDay[day].success++;
      if (delivery.status === "failed") deliveriesByDay[day].failed++;
    });

    // Average attempts
    const avgAttempts = deliveries.reduce((sum, d) => sum + d.attempts, 0) / totalDeliveries || 0;

    return {
      totalDeliveries,
      successful,
      failed,
      pending,
      successRate: totalDeliveries > 0 ? (successful / totalDeliveries) * 100 : 0,
      avgAttempts,
      deliveriesByDay,
      recentDeliveries: deliveries.slice(-50).reverse(),
    };
  },
});

/**
 * Get webhook templates
 */
export const getWebhookTemplates = query({
  args: {},
  handler: async (ctx) => {
    return [
      {
        id: "workflow-complete",
        name: "Workflow Completion",
        events: ["workflow.completed"],
        description: "Triggered when a workflow completes successfully",
        examplePayload: {
          event: "workflow.completed",
          workflowId: "abc123",
          workflowName: "Example Workflow",
          status: "succeeded",
          completedAt: Date.now(),
        },
      },
      {
        id: "approval-request",
        name: "Approval Request",
        events: ["approval.requested"],
        description: "Triggered when an approval is requested",
        examplePayload: {
          event: "approval.requested",
          approvalId: "xyz789",
          title: "Budget Approval",
          priority: "high",
          requestedAt: Date.now(),
        },
      },
      {
        id: "campaign-sent",
        name: "Campaign Sent",
        events: ["campaign.sent"],
        description: "Triggered when an email campaign is sent",
        examplePayload: {
          event: "campaign.sent",
          campaignId: "camp456",
          subject: "Monthly Newsletter",
          recipientCount: 1000,
          sentAt: Date.now(),
        },
      },
    ];
  },
});

/**
 * Create a new webhook
 */
export const createWebhook = mutation({
  args: {
    businessId: v.id("businesses"),
    url: v.string(),
    events: v.array(v.string()),
    retryConfig: v.optional(v.object({
      maxRetries: v.number(),
      retryDelay: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) throw new Error("User not found");

    // Generate webhook secret for signature verification
    const secret = `whsec_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

    return await ctx.db.insert("webhooks", {
      businessId: args.businessId,
      url: args.url,
      events: args.events,
      secret,
      active: true,
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update webhook configuration
 */
export const updateWebhook = mutation({
  args: {
    webhookId: v.id("webhooks"),
    url: v.optional(v.string()),
    events: v.optional(v.array(v.string())),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { webhookId, ...updates } = args;
    await ctx.db.patch(webhookId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete a webhook
 */
export const deleteWebhook = mutation({
  args: { webhookId: v.id("webhooks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.webhookId);
  },
});

/**
 * Test a webhook
 */
export const testWebhook = mutation({
  args: { webhookId: v.id("webhooks") },
  handler: async (ctx, args) => {
    const webhook = await ctx.db.get(args.webhookId);
    if (!webhook) throw new Error("Webhook not found");

    const testPayload = {
      event: "webhook.test",
      webhookId: args.webhookId,
      timestamp: Date.now(),
      message: "This is a test webhook delivery",
    };

    // Schedule webhook delivery
    await ctx.scheduler.runAfter(0, internal.webhooksActions.deliverWebhook, {
      webhookId: args.webhookId,
      event: "webhook.test",
      payload: testPayload,
    });

    return { success: true, message: "Test webhook scheduled" };
  },
});

/**
 * List recent webhook deliveries
 */
export const getWebhookDeliveries = query({
  args: { 
    webhookId: v.id("webhooks"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const deliveries = await ctx.db
      .query("webhookDeliveries")
      .withIndex("by_webhook", (q) => q.eq("webhookId", args.webhookId))
      .order("desc")
      .take(args.limit || 50);

    return deliveries;
  },
});

/**
 * Retry a webhook delivery
 */
export const retryWebhookDelivery = mutation({
  args: { deliveryId: v.id("webhookDeliveries") },
  handler: async (ctx, args) => {
    const delivery = await ctx.db.get(args.deliveryId);
    if (!delivery) throw new Error("Delivery not found");

    // Schedule retry
    await ctx.scheduler.runAfter(0, internal.webhooksActions.deliverWebhook, {
      webhookId: delivery.webhookId,
      event: delivery.event,
      payload: delivery.payload,
    });

    return { success: true, message: "Retry scheduled" };
  },
});

/**
 * Internal mutation to record webhook delivery
 */
export const recordDelivery = internalMutation({
  args: {
    webhookId: v.id("webhooks"),
    businessId: v.id("businesses"),
    event: v.string(),
    payload: v.any(),
    status: v.union(v.literal("success"), v.literal("failed")),
    attempts: v.number(),
    errorMessage: v.optional(v.string()),
    responseStatus: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("webhookDeliveries", {
      webhookId: args.webhookId,
      businessId: args.businessId,
      event: args.event,
      payload: args.payload,
      status: args.status,
      attempts: args.attempts,
      lastAttemptAt: Date.now(),
      nextRetryAt: undefined,
      errorMessage: args.errorMessage,
      responseStatus: args.responseStatus,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get webhook statistics
 */
export const getWebhookStats = query({
  args: { webhookId: v.id("webhooks") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const deliveries = await ctx.db
      .query("webhookDeliveries")
      .withIndex("by_webhook", (q) => q.eq("webhookId", args.webhookId))
      .collect();

    const total = deliveries.length;
    const successful = deliveries.filter((d) => d.status === "success").length;
    const failed = deliveries.filter((d) => d.status === "failed").length;

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
    };
  },
});