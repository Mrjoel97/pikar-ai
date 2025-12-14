"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * Create a PayPal invoice
 */
export const createPayPalInvoice = action({
  args: {
    invoiceId: v.id("invoices"),
  },
  handler: async (ctx, args) => {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const environment = process.env.PAYPAL_ENVIRONMENT || "sandbox";

    if (!clientId || !clientSecret) {
      throw new Error("PayPal credentials not configured");
    }

    const invoice = await ctx.runQuery(internal.invoices.getInvoiceById, {
      invoiceId: args.invoiceId,
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    try {
      // Get PayPal access token
      const authUrl = environment === "production"
        ? "https://api-m.paypal.com/v1/oauth2/token"
        : "https://api-m.sandbox.paypal.com/v1/oauth2/token";

      const authResponse = await fetch(authUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        },
        body: "grant_type=client_credentials",
      });

      if (!authResponse.ok) {
        throw new Error("Failed to authenticate with PayPal");
      }

      const { access_token } = await authResponse.json() as { access_token: string };

      // Create PayPal invoice
      const invoiceUrl = environment === "production"
        ? "https://api-m.paypal.com/v2/invoicing/invoices"
        : "https://api-m.sandbox.paypal.com/v2/invoicing/invoices";

      const paypalInvoice = {
        detail: {
          invoice_number: invoice.invoiceNumber,
          reference: args.invoiceId,
          currency_code: invoice.currency,
          note: invoice.notes || "",
          terms_and_conditions: invoice.terms || "",
          invoice_date: new Date(invoice.issueDate).toISOString().split("T")[0],
          payment_term: {
            due_date: new Date(invoice.dueDate).toISOString().split("T")[0],
          },
        },
        invoicer: {
          name: { given_name: "Business" },
          email_address: process.env.PAYPAL_BUSINESS_EMAIL || "business@example.com",
        },
        primary_recipients: [
          {
            billing_info: {
              name: { given_name: invoice.clientName },
              email_address: invoice.clientEmail,
            },
          },
        ],
        items: invoice.items.map((item: any) => ({
          name: item.description,
          quantity: item.quantity.toString(),
          unit_amount: {
            currency_code: invoice.currency,
            value: item.unitPrice.toFixed(2),
          },
        })),
        configuration: {
          tax_calculated_after_discount: true,
          tax_inclusive: false,
        },
        amount: {
          breakdown: {
            item_total: {
              currency_code: invoice.currency,
              value: invoice.subtotal.toFixed(2),
            },
            tax_total: {
              currency_code: invoice.currency,
              value: invoice.taxAmount.toFixed(2),
            },
          },
        },
      };

      const createResponse = await fetch(invoiceUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify(paypalInvoice),
      });

      if (!createResponse.ok) {
        const error = await createResponse.text();
        throw new Error(`PayPal invoice creation failed: ${error}`);
      }

      const created = await createResponse.json() as { id: string; href: string };

      // Send the invoice
      const sendResponse = await fetch(
        `${invoiceUrl}/${created.id}/send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
          },
          body: JSON.stringify({
            send_to_invoicer: true,
          }),
        }
      );

      if (!sendResponse.ok) {
        throw new Error("Failed to send PayPal invoice");
      }

      // Get invoice details with payment link
      const detailsResponse = await fetch(`${invoiceUrl}/${created.id}`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const details = await detailsResponse.json() as { href: string };

      // Update invoice with PayPal link
      await ctx.runMutation(internal.invoices.updateInvoicePaymentLink, {
        invoiceId: args.invoiceId,
        paymentLink: details.href || "",
        paymentMethod: "paypal",
      });

      return {
        success: true,
        paypalInvoiceId: created.id,
        paymentLink: details.href,
      };
    } catch (error: any) {
      console.error("[PAYPAL] Invoice creation error:", error);
      throw new Error(`Failed to create PayPal invoice: ${error.message}`);
    }
  },
});