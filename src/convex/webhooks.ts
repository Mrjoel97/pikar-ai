"use node";

import { v } from "convex/values";
import { action, mutation, query, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import crypto from "crypto";

/**
 * List all webhooks for a business
 */
export const listWebhooks = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const webhooks = await ctx.db
      .query("webhooks")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    return webhooks;
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
 * Create a new webhook
 */
export const createWebhook = mutation({
  args: {
    businessId: v.id("businesses"),
    url: v.string(),
    events: v.array(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Validate URL
    try {
      const urlObj = new URL(args.url);
      if (process.env.NODE_ENV === "production" && urlObj.protocol !== "https:") {
        throw new Error("Webhook URLs must use HTTPS in production");
      }
    } catch (error) {
      throw new Error("Invalid webhook URL");
    }

    // Generate secure secret for HMAC
    const secret = crypto.randomBytes(32).toString("hex");

    const webhookId = await ctx.db.insert("webhooks", {
      businessId: args.businessId,
      url: args.url,
      events: args.events,
      secret,
      active: args.active ?? true,
      createdBy: identity.subject as Id<"users">,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      userId: identity.subject as Id<"users">,
      action: "webhook.created",
      entityType: "webhook",
      entityId: webhookId,
      details: { url: args.url, events: args.events },
      createdAt: Date.now(),
    });

    return webhookId;
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const webhook = await ctx.db.get(args.webhookId);
    if (!webhook) {
      throw new Error("Webhook not found");
    }

    // Validate URL if provided
    if (args.url) {
      try {
        const urlObj = new URL(args.url);
        if (process.env.NODE_ENV === "production" && urlObj.protocol !== "https:") {
          throw new Error("Webhook URLs must use HTTPS in production");
        }
      } catch (error) {
        throw new Error("Invalid webhook URL");
      }
    }

    const updates: any = { updatedAt: Date.now() };
    if (args.url !== undefined) updates.url = args.url;
    if (args.events !== undefined) updates.events = args.events;
    if (args.active !== undefined) updates.active = args.active;

    await ctx.db.patch(args.webhookId, updates);

    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: webhook.businessId,
      userId: identity.subject as Id<"users">,
      action: "webhook.updated",
      entityType: "webhook",
      entityId: args.webhookId,
      details: updates,
      createdAt: Date.now(),
    });

    return args.webhookId;
  },
});

/**
 * Delete a webhook
 */
export const deleteWebhook = mutation({
  args: { webhookId: v.id("webhooks") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const webhook = await ctx.db.get(args.webhookId);
    if (!webhook) {
      throw new Error("Webhook not found");
    }

    await ctx.db.delete(args.webhookId);

    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: webhook.businessId,
      userId: identity.subject as Id<"users">,
      action: "webhook.deleted",
      entityType: "webhook",
      entityId: args.webhookId,
      details: { url: webhook.url },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Test webhook by sending a test payload
 */
export const testWebhook = action({
  args: { webhookId: v.id("webhooks") },
  handler: async (ctx, args): Promise<{ success: boolean; status?: number; statusText?: string; error?: string }> => {
    const webhook: any = await ctx.runQuery(api.webhooks.getWebhook, {
      webhookId: args.webhookId,
    });

    if (!webhook) {
      throw new Error("Webhook not found");
    }

    const testPayload = {
      event: "webhook.test",
      timestamp: Date.now(),
      data: {
        message: "This is a test webhook delivery from Pikar AI",
      },
    };

    try {
      const signature = generateSignature(testPayload, webhook.secret);
      
      const response: Response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "User-Agent": "Pikar-AI-Webhook/1.0",
        },
        body: JSON.stringify(testPayload),
      });

      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
});

/**
 * Deliver webhook with retry logic
 */
export const deliverWebhook = action({
  args: {
    webhookId: v.id("webhooks"),
    event: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    const webhook = await ctx.runQuery(api.webhooks.getWebhook, {
      webhookId: args.webhookId,
    });

    if (!webhook || !webhook.active) {
      return { success: false, reason: "Webhook not active" };
    }

    // Check if webhook is subscribed to this event
    if (!webhook.events.includes(args.event)) {
      return { success: false, reason: "Webhook not subscribed to event" };
    }

    const deliveryPayload = {
      event: args.event,
      timestamp: Date.now(),
      data: args.payload,
    };

    let attempts = 0;
    let success = false;
    let errorMessage = "";
    let responseStatus = 0;

    // Retry logic: 3 attempts with exponential backoff
    while (attempts < 3 && !success) {
      attempts++;

      try {
        const signature = generateSignature(deliveryPayload, webhook.secret);
        
        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
            "User-Agent": "Pikar-AI-Webhook/1.0",
          },
          body: JSON.stringify(deliveryPayload),
        });

        responseStatus = response.status;

        if (response.ok) {
          success = true;
        } else {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
      } catch (error: any) {
        errorMessage = error.message;
      }

      // Exponential backoff: wait before retry
      if (!success && attempts < 3) {
        const backoffMs = Math.pow(2, attempts) * 1000; // 2s, 4s, 8s
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }

    // Record delivery attempt
    await ctx.runMutation(internal.webhooks.recordDelivery, {
      webhookId: args.webhookId,
      businessId: webhook.businessId,
      event: args.event,
      payload: deliveryPayload,
      status: success ? "success" : "failed",
      attempts,
      errorMessage: success ? undefined : errorMessage,
      responseStatus: responseStatus || undefined,
    });

    return { success, attempts, errorMessage };
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
 * List recent webhook deliveries
 */
export const listDeliveries = query({
  args: {
    webhookId: v.optional(v.id("webhooks")),
    businessId: v.optional(v.id("businesses")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    if (args.webhookId) {
      const webhookId = args.webhookId;
      const deliveries = await ctx.db
        .query("webhookDeliveries")
        .withIndex("by_webhook", (q) => q.eq("webhookId", webhookId))
        .order("desc")
        .take(args.limit || 50);
      return deliveries;
    } else if (args.businessId) {
      const businessId = args.businessId;
      const deliveries = await ctx.db
        .query("webhookDeliveries")
        .withIndex("by_business", (q) => q.eq("businessId", businessId))
        .order("desc")
        .take(args.limit || 50);
      return deliveries;
    }

    // Default: return empty array if no filter provided
    return [];
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

/**
 * Helper function to generate HMAC signature
 */
function generateSignature(payload: any, secret: string): string {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest("hex");
}
