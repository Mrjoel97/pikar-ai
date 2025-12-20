import { defineTable } from "convex/server";
import { v } from "convex/values";

export const emailSchema = {
  emailCampaigns: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    subject: v.string(),
    content: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("sent"),
      v.literal("failed")
    ),
    segmentId: v.optional(v.id("customerSegments")),
    scheduledFor: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    stats: v.optional(v.object({
      sent: v.number(),
      delivered: v.number(),
      opened: v.number(),
      clicked: v.number(),
      bounced: v.number(),
      unsubscribed: v.number(),
    })),
    metrics: v.optional(v.any()),
    abTest: v.optional(v.any()),
    previewText: v.optional(v.string()),
    recipients: v.optional(v.array(v.string())),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"])
    .index("by_experiment", ["abTest"]),

  emailConfigs: defineTable({
    businessId: v.id("businesses"),
    provider: v.union(v.literal("resend"), v.literal("sendgrid"), v.literal("smtp"), v.literal("aws_ses")),
    apiKey: v.optional(v.string()),
    fromEmail: v.string(),
    fromName: v.string(),
    replyTo: v.optional(v.string()),
    domain: v.optional(v.string()),
    isVerified: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    // Workspace-specific fields
    resendApiKey: v.optional(v.string()),
    salesInbox: v.optional(v.string()),
    publicBaseUrl: v.optional(v.string()),
    // Invoice settings (all tiers)
    invoicePrefix: v.optional(v.string()),
    invoiceNumberStart: v.optional(v.number()),
    invoiceCurrency: v.optional(v.string()),
    invoicePaymentTerms: v.optional(v.string()),
    invoiceNotes: v.optional(v.string()),
    // Business profile information (Startup, SME, Enterprise)
    businessLegalName: v.optional(v.string()),
    businessAddress: v.optional(v.string()),
    businessPhone: v.optional(v.string()),
    businessTaxId: v.optional(v.string()),
    businessWebsite: v.optional(v.string()),
  }).index("by_business", ["businessId"]),

  emailDrafts: defineTable({
    businessId: v.id("businesses"),
    subject: v.string(),
    content: v.string(),
    recipientListId: v.optional(v.id("contactLists")),
    status: v.union(v.literal("draft"), v.literal("scheduled"), v.literal("sent")),
    scheduledFor: v.optional(v.number()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"]),

  emails: defineTable({
    businessId: v.id("businesses"),
    campaignId: v.optional(v.id("emailCampaigns")),
    recipientEmail: v.string(),
    subject: v.string(),
    content: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("opened"),
      v.literal("clicked"),
      v.literal("bounced"),
      v.literal("failed")
    ),
    sentAt: v.optional(v.number()),
    openedAt: v.optional(v.number()),
    clickedAt: v.optional(v.number()),
    scheduledAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_campaign", ["campaignId"])
    .index("by_status", ["status"]),
};