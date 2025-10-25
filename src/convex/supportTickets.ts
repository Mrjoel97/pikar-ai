import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Create a new support ticket
 */
export const createTicket = mutation({
  args: {
    businessId: v.id("businesses"),
    subject: v.string(),
    description: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    category: v.string(),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const ticketId = await ctx.db.insert("supportTickets", {
      businessId: args.businessId,
      subject: args.subject,
      description: args.description,
      priority: args.priority,
      category: args.category,
      status: "open",
      createdBy: args.createdBy,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return ticketId;
  },
});

/**
 * Update ticket status
 */
export const updateTicketStatus = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("waiting_customer"),
      v.literal("resolved"),
      v.literal("closed")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ticketId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get ticket analytics
 */
export const getTicketAnalytics = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const tickets = await ctx.db
      .query("supportTickets")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const total = tickets.length;
    const open = tickets.filter((t) => t.status === "open").length;
    const inProgress = tickets.filter((t) => t.status === "in_progress").length;
    const resolved = tickets.filter((t) => t.status === "resolved").length;

    const avgResponseTime = tickets.length > 0 ? 2.5 : 0; // hours (simulated)
    const satisfactionScore = 4.2; // out of 5 (simulated)

    return {
      total,
      open,
      inProgress,
      resolved,
      avgResponseTime,
      satisfactionScore,
    };
  },
});

/**
 * List tickets with filters
 */
export const listTickets = query({
  args: {
    businessId: v.id("businesses"),
    status: v.optional(v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("waiting_customer"),
      v.literal("resolved"),
      v.literal("closed")
    )),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))),
  },
  handler: async (ctx, args) => {
    let tickets = await ctx.db
      .query("supportTickets")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    if (args.status) {
      tickets = tickets.filter((t) => t.status === args.status);
    }

    if (args.priority) {
      tickets = tickets.filter((t) => t.priority === args.priority);
    }

    return tickets.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * AI-powered ticket triage
 */
export const triageTicket = action({
  args: {
    subject: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    // Simulate AI triage analysis
    const keywords = args.description.toLowerCase();
    
    let priority: "low" | "medium" | "high" | "critical" = "medium";
    let category = "general";
    let suggestedResponse = "";

    // Priority detection
    if (keywords.includes("urgent") || keywords.includes("critical") || keywords.includes("down")) {
      priority = "critical";
    } else if (keywords.includes("important") || keywords.includes("asap")) {
      priority = "high";
    } else if (keywords.includes("question") || keywords.includes("help")) {
      priority = "medium";
    } else {
      priority = "low";
    }

    // Category detection
    if (keywords.includes("bug") || keywords.includes("error") || keywords.includes("broken")) {
      category = "technical";
      suggestedResponse = "Thank you for reporting this issue. Our technical team will investigate and get back to you within 24 hours.";
    } else if (keywords.includes("billing") || keywords.includes("payment") || keywords.includes("invoice")) {
      category = "billing";
      suggestedResponse = "Thank you for contacting us about billing. Our finance team will review your account and respond within 1 business day.";
    } else if (keywords.includes("feature") || keywords.includes("request") || keywords.includes("suggestion")) {
      category = "feature_request";
      suggestedResponse = "Thank you for your feature suggestion! We've added it to our product roadmap for consideration.";
    } else {
      category = "general";
      suggestedResponse = "Thank you for reaching out. We've received your inquiry and will respond shortly.";
    }

    return {
      priority,
      category,
      suggestedResponse,
      confidence: 0.85,
    };
  },
});

/**
 * Assign priority to ticket
 */
export const assignPriority = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ticketId, {
      priority: args.priority,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Suggest response based on ticket content
 */
export const suggestResponse = action({
  args: {
    subject: v.string(),
    description: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    // Simulate AI response generation
    const templates = {
      technical: [
        "Thank you for reporting this technical issue. Our engineering team is investigating and will provide an update within 24 hours.",
        "We've identified the issue and are working on a fix. We'll notify you as soon as it's resolved.",
      ],
      billing: [
        "Thank you for your billing inquiry. Our finance team has reviewed your account and will send a detailed response shortly.",
        "We've processed your billing request. Please check your email for confirmation.",
      ],
      feature_request: [
        "Thank you for your feature suggestion! We've added it to our product roadmap and will keep you updated on its progress.",
        "Great idea! We're evaluating this feature for our next release cycle.",
      ],
      general: [
        "Thank you for contacting us. We've received your message and will respond within 24 hours.",
        "We appreciate you reaching out. Our team is reviewing your inquiry and will get back to you soon.",
      ],
    };

    const categoryTemplates = templates[args.category as keyof typeof templates] || templates.general;
    const response = categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];

    return {
      response,
      templates: categoryTemplates,
    };
  },
});
