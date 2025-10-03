"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import crypto from "crypto";

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
 * Helper function to generate HMAC signature
 */
function generateSignature(payload: any, secret: string): string {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest("hex");
}
