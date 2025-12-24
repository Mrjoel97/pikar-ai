import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import Stripe from "stripe";

/**
 * Helper: Map a Stripe price ID back to a tier using env vars.
 */
function priceIdToTier(priceId?: string | null) {
  if (!priceId) return null;
  const map: Record<string, "solopreneur" | "startup" | "sme" | "enterprise" | null> = {
    [String(process.env.STRIPE_PRICE_ID_SOLOPRENEUR)]: "solopreneur",
    [String(process.env.STRIPE_PRICE_ID_STARTUP)]: "startup",
    [String(process.env.STRIPE_PRICE_ID_SME)]: "sme",
    [String(process.env.STRIPE_PRICE_ID_ENTERPRISE)]: "enterprise",
  };
  return map[priceId] ?? null;
}

export const stripeWebhook = httpAction(async (ctx: any, req) => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return new Response("Missing STRIPE_SECRET_KEY", { status: 500 });
  }
  const stripe = new Stripe(secretKey);

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
  const sig = req.headers.get("stripe-signature");
  const bodyBytes = await req.arrayBuffer();
  const buf = Buffer.from(bodyBytes);

  let event: any;
  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } else {
      // Fallback: accept JSON without signature verification (dev)
      event = JSON.parse(Buffer.from(bodyBytes).toString("utf8"));
    }
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return new Response("Bad signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const tier =
          (session.metadata?.tier as "solopreneur" | "startup" | "sme" | "enterprise" | undefined) ||
          (session.subscription && typeof session.subscription !== "string"
            ? (session.subscription as any)?.metadata?.tier
            : undefined);

        const businessIdStr =
          session.metadata?.businessId ||
          (session.subscription && typeof session.subscription !== "string"
            ? (session.subscription as any)?.metadata?.businessId
            : undefined);

        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : (session.subscription as any)?.id;

        if (tier && businessIdStr) {
          await ctx.runMutation(internal.billingInternal.applyCheckoutResult, {
            businessId: businessIdStr as any,
            tier,
            stripeCustomerId: customerId ?? null,
            stripeSubscriptionId: subscriptionId ?? null,
          });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const businessIdStr = (sub.metadata?.businessId as string | undefined) || undefined;
        const priceId = sub.items?.data?.[0]?.price?.id;
        const tier = priceIdToTier(priceId);
        const status = sub.status; // active | trialing | past_due | canceled | etc.

        if (businessIdStr) {
          await ctx.runMutation(internal.billingInternal.updateSubscriptionStatus, {
            businessId: businessIdStr as any,
            status,
            plan: tier ?? undefined,
            stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
            stripeSubscriptionId: sub.id,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const businessIdStr = (sub.metadata?.businessId as string | undefined) || undefined;
        if (businessIdStr) {
          await ctx.runMutation(internal.billingInternal.updateSubscriptionStatus, {
            businessId: businessIdStr as any,
            status: "canceled",
            stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
            stripeSubscriptionId: sub.id,
          });
        }
        break;
      }

      default: {
        // Ignore other events
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Stripe webhook handling error:", err);
    return new Response("Webhook handling error", { status: 500 });
  }
});

export const paypalWebhook = httpAction(async (ctx: any, req) => {
  try {
    const body = await req.json();
    const eventType = body.event_type;

    // Handle PayPal invoice events
    if (eventType === "INVOICING.INVOICE.PAID") {
      const invoiceId = body.resource?.reference;
      if (invoiceId) {
        await ctx.runMutation(internal.invoices.markInvoicePaid, {
          invoiceId: invoiceId as any,
          paidAt: Date.now(),
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("PayPal webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
