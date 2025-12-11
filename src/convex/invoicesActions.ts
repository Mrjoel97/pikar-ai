"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

export const generateInvoicePdf = action({
  args: {
    invoiceId: v.id("invoices"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; pdfUrl: string; message: string }> => {
    // Fetch invoice data by querying with the specific ID
    const invoices: any[] = await ctx.runQuery(api.invoices.listInvoices, {
      businessId: "" as any,
    });
    
    const invoice: any = invoices?.find((inv: any) => inv._id === args.invoiceId);

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Generate simple HTML-based PDF content
    const htmlContent: string = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .invoice-details { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            .total { font-weight: bold; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>INVOICE</h1>
          </div>
          <div class="invoice-details">
            <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Client:</strong> ${invoice.clientName}</p>
            <p><strong>Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map((item: any) => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.unitPrice.toFixed(2)}</td>
                  <td>$${item.amount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">
            <p>Subtotal: $${invoice.subtotal.toFixed(2)}</p>
            <p>Tax (${invoice.taxRate}%): $${invoice.taxAmount.toFixed(2)}</p>
            <p>Total: $${invoice.total.toFixed(2)}</p>
          </div>
        </body>
      </html>
    `;

    // Return a demo PDF URL (in production, generate actual PDF)
    return {
      success: true,
      pdfUrl: "data:text/html;base64," + Buffer.from(htmlContent).toString("base64"),
      message: "Invoice PDF generated successfully",
    };
  },
});

export const sendInvoiceEmail = action({
  args: {
    invoiceId: v.id("invoices"),
    recipientEmail: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; message: string }> => {
    // Fetch invoice data
    const invoice: any = await ctx.runQuery(api.invoices.getInvoiceById, {
      invoiceId: args.invoiceId,
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const recipientEmail = args.recipientEmail || invoice.clientEmail;
    if (!recipientEmail) {
      throw new Error("No recipient email provided");
    }

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn("[INVOICE] RESEND_API_KEY not configured. Email not sent.");
      return { success: false, message: "Email service not configured" };
    }

    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);

      // Generate invoice HTML
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; background: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
              .invoice-details { margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
              th { background: #f8f8f8; font-weight: bold; }
              .total { font-weight: bold; font-size: 18px; text-align: right; margin-top: 20px; }
              .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>INVOICE</h1>
                <p style="color: #666; margin: 0;">#${invoice.invoiceNumber}</p>
              </div>
              
              <div class="invoice-details">
                <p><strong>Bill To:</strong></p>
                <p>${invoice.clientName}</p>
                <p style="color: #666;">${invoice.clientEmail}</p>
                ${invoice.clientAddress ? `<p style="color: #666;">${invoice.clientAddress}</p>` : ''}
                
                <p style="margin-top: 20px;"><strong>Issue Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</p>
                <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th style="text-align: center;">Quantity</th>
                    <th style="text-align: right;">Unit Price</th>
                    <th style="text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoice.items.map((item: any) => `
                    <tr>
                      <td>${item.description}</td>
                      <td style="text-align: center;">${item.quantity}</td>
                      <td style="text-align: right;">$${item.unitPrice.toFixed(2)}</td>
                      <td style="text-align: right;">$${item.amount.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <div style="text-align: right; margin-top: 20px;">
                <p style="margin: 5px 0;">Subtotal: <strong>$${invoice.subtotal.toFixed(2)}</strong></p>
                <p style="margin: 5px 0;">Tax (${invoice.taxRate}%): <strong>$${invoice.taxAmount.toFixed(2)}</strong></p>
                <p class="total" style="font-size: 20px; margin-top: 10px;">Total: <strong>$${invoice.total.toFixed(2)}</strong></p>
              </div>
              
              ${invoice.notes ? `
                <div style="margin-top: 30px; padding: 15px; background: #f8f8f8; border-radius: 4px;">
                  <p style="margin: 0;"><strong>Notes:</strong></p>
                  <p style="margin: 10px 0 0 0;">${invoice.notes}</p>
                </div>
              ` : ''}
              
              <div class="footer">
                <p>Thank you for your business!</p>
                <p style="font-size: 12px; color: #999;">This invoice was generated by Pikar AI</p>
              </div>
            </div>
          </body>
        </html>
      `;

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "invoices@pikar.ai",
        to: recipientEmail,
        subject: `Invoice ${invoice.invoiceNumber} from ${invoice.businessId}`,
        html: htmlContent,
      });

      // Update invoice status to sent
      await ctx.runMutation(api.invoices.updateInvoiceStatus, {
        invoiceId: args.invoiceId,
        status: "sent",
      });

      return { success: true, message: "Invoice sent successfully" };
    } catch (error: any) {
      console.error("[INVOICE] Email send failed:", error.message);
      return { success: false, message: error.message };
    }
  },
});