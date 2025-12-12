import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Invoice Templates
export const createInvoiceTemplate = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    logoUrl: v.optional(v.string()),
    fromName: v.string(),
    fromAddress: v.string(),
    fromEmail: v.string(),
    fromPhone: v.optional(v.string()),
    taxRate: v.number(),
    currency: v.string(),
    notes: v.optional(v.string()),
    terms: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Unauthorized");

    const templateId = await ctx.db.insert("invoiceTemplates", {
      ...args,
      createdBy: user.subject as Id<"users">,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any);

    return templateId;
  },
});

export const updateInvoiceTemplate = mutation({
  args: {
    templateId: v.id("invoiceTemplates"),
    name: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    fromName: v.optional(v.string()),
    fromAddress: v.optional(v.string()),
    fromEmail: v.optional(v.string()),
    fromPhone: v.optional(v.string()),
    taxRate: v.optional(v.number()),
    currency: v.optional(v.string()),
    notes: v.optional(v.string()),
    terms: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Unauthorized");

    const { templateId, ...updates } = args;
    await ctx.db.patch(templateId, {
      ...updates,
      updatedAt: Date.now(),
    } as any);

    return templateId;
  },
});

export const listTemplates = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) return [];

    return await ctx.db
      .query("invoiceTemplates")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
  },
});

// Invoice Records
export const createInvoice = mutation({
  args: {
    businessId: v.id("businesses"),
    templateId: v.optional(v.id("invoiceTemplates")),
    invoiceNumber: v.string(),
    clientName: v.string(),
    clientEmail: v.string(),
    clientAddress: v.optional(v.string()),
    items: v.array(
      v.object({
        description: v.string(),
        quantity: v.number(),
        unitPrice: v.number(),
        amount: v.number(),
      })
    ),
    subtotal: v.number(),
    taxRate: v.number(),
    taxAmount: v.number(),
    total: v.number(),
    currency: v.string(),
    issueDate: v.number(),
    dueDate: v.number(),
    notes: v.optional(v.string()),
    terms: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Unauthorized");

    const invoiceId = await ctx.db.insert("invoices", {
      ...args,
      status: "draft",
      createdBy: user.subject as Id<"users">,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any);

    // Log audit event
    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      userId: user.subject as Id<"users">,
      action: "invoice_created",
      entityType: "invoice",
      entityId: invoiceId,
      details: { invoiceNumber: args.invoiceNumber, total: args.total },
      createdAt: Date.now(),
    });

    return invoiceId;
  },
});

export const markInvoicePaid = mutation({
  args: {
    invoiceId: v.id("invoices"),
    paidAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Unauthorized");

    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) throw new Error("Invoice not found");

    await ctx.db.patch(args.invoiceId, {
      status: "paid",
      paidAt: args.paidAt || Date.now(),
      updatedAt: Date.now(),
    } as any);

    // Log audit event
    await ctx.db.insert("audit_logs", {
      businessId: invoice.businessId,
      userId: user.subject as Id<"users">,
      action: "invoice_paid",
      entityType: "invoice",
      entityId: args.invoiceId,
      details: { paidAt: args.paidAt || Date.now() },
      createdAt: Date.now(),
    });

    return args.invoiceId;
  },
});

export const updateInvoicePaymentLink = mutation({
  args: {
    invoiceId: v.id("invoices"),
    paymentLink: v.string(),
    paymentMethod: v.union(v.literal("stripe"), v.literal("paypal")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Unauthorized");

    await ctx.db.patch(args.invoiceId, {
      paymentLink: args.paymentLink,
      paymentMethod: args.paymentMethod,
      updatedAt: Date.now(),
    } as any);

    return args.invoiceId;
  },
});

export const listInvoices = query({
  args: {
    businessId: v.id("businesses"),
    status: v.optional(v.union(v.literal("draft"), v.literal("sent"), v.literal("paid"), v.literal("overdue"))),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) return [];

    let query = ctx.db
      .query("invoices")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId));

    const invoices = await query.collect();

    if (args.status) {
      return invoices.filter((inv) => inv.status === args.status);
    }

    return invoices;
  },
});

export const getInvoiceById = query({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) return null;

    return await ctx.db.get(args.invoiceId);
  },
});

export const updateInvoiceStatus = mutation({
  args: {
    invoiceId: v.id("invoices"),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("paid"),
      v.literal("overdue")
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Unauthorized");

    await ctx.db.patch(args.invoiceId, {
      status: args.status,
      updatedAt: Date.now(),
    } as any);

    return args.invoiceId;
  },
});