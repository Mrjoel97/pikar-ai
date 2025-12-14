"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import Stripe from "stripe";

/**
 * Create a Stripe payment link for an invoice
 */
export const createStripePaymentLink = action({
  args: {
    invoiceId: v.id("invoices"),
  },
  handler: async (ctx, args) => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(secretKey);

    // Get invoice details
    const invoice = await ctx.runQuery(internal.invoices.getInvoiceById, {
      invoiceId: args.invoiceId,
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    try {
      // Create Stripe payment link
      const paymentLink = await stripe.paymentLinks.create({
        line_items: [
          {
            price_data: {
              currency: invoice.currency.toLowerCase(),
              product_data: {
                name: `Invoice ${invoice.invoiceNumber}`,
                description: `Payment for ${invoice.clientName}`,
              },
              unit_amount: Math.round(invoice.total * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        metadata: {
          invoiceId: args.invoiceId,
          businessId: invoice.businessId,
        },
        after_completion: {
          type: "redirect",
          redirect: {
            url: `${process.env.CONVEX_SITE_URL}/invoices?id=${args.invoiceId}&payment=success`,
          },
        },
      });

      // Update invoice with payment link
      await ctx.runMutation(internal.invoices.updateInvoicePaymentLink, {
        invoiceId: args.invoiceId,
        paymentLink: paymentLink.url,
        paymentMethod: "stripe",
      });

      return {
        success: true,
        paymentLink: paymentLink.url,
        paymentLinkId: paymentLink.id,
      };
    } catch (error: any) {
      console.error("[STRIPE] Payment link creation error:", error);
      throw new Error(`Failed to create payment link: ${error.message}`);
    }
  },
});

/**
 * Get payment status from Stripe
 */
export const getStripePaymentStatus = action({
  args: { paymentId: v.string() },
  handler: async (ctx, args) => {
    // Mock implementation for now
    return { status: "succeeded", paymentId: args.paymentId };
  },
});

export const createStripeInvoice = action({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    const invoice = await ctx.runQuery(internal.invoices.getInvoiceById, {
      invoiceId: args.invoiceId,
    });
    
    if (!invoice) throw new Error("Invoice not found");

    // Mock implementation
    return { invoiceUrl: "https://stripe.com/invoice/123", status: "open" };
  },
});