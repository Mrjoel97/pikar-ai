import { v } from "convex/values";
import { internalMutation, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

export const scheduleRetry = internalMutation({
  args: {
    deliveryId: v.id("webhookDeliveries"),
    retryDelay: v.number(),
  },
  handler: async (ctx, args) => {
    const delivery = await ctx.db.get(args.deliveryId);
    if (!delivery) return;

    const nextRetryAt = Date.now() + args.retryDelay;
    
    await ctx.db.patch(args.deliveryId, {
      nextRetryAt,
      status: "pending",
    });

    await ctx.scheduler.runAt(nextRetryAt, internal.webhooks.retry.executeRetry, {
      deliveryId: args.deliveryId,
    });
  },
});

export const executeRetry = internalAction({
  args: { deliveryId: v.id("webhookDeliveries") },
  handler: async (ctx, args) => {
    const delivery = await ctx.runQuery(internal.webhooks.retry.getDelivery, {
      deliveryId: args.deliveryId,
    });

    if (!delivery || delivery.attempts >= 5) {
      await ctx.runMutation(internal.webhooks.retry.moveToDeadLetter, {
        deliveryId: args.deliveryId,
      });
      return;
    }

    try {
      const webhook = await ctx.runQuery(internal.webhooks.retry.getWebhook, {
        webhookId: delivery.webhookId,
      });

      if (!webhook) return;

      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": delivery.webhookId,
        },
        body: JSON.stringify(delivery.payload),
      });

      if (response.ok) {
        await ctx.runMutation(internal.webhooks.recordDelivery, {
          webhookId: delivery.webhookId,
          businessId: delivery.businessId,
          event: delivery.event,
          payload: delivery.payload,
          status: "success",
          attempts: delivery.attempts + 1,
          responseStatus: response.status,
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      const retryDelay = Math.min(1000 * Math.pow(2, delivery.attempts), 3600000);
      
      await ctx.runMutation(internal.webhooks.retry.scheduleRetry, {
        deliveryId: args.deliveryId,
        retryDelay,
      });
    }
  },
});

export const getDelivery = internalMutation({
  args: { deliveryId: v.id("webhookDeliveries") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.deliveryId);
  },
});

export const getWebhook = internalMutation({
  args: { webhookId: v.id("webhooks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.webhookId);
  },
});

export const moveToDeadLetter = internalMutation({
  args: { deliveryId: v.id("webhookDeliveries") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.deliveryId, {
      status: "failed",
      errorMessage: "Max retries exceeded",
    });
  },
});
