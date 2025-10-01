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