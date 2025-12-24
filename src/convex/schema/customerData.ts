import { defineTable } from "convex/server";
import { v } from "convex/values";

export const customerDataSchema = {
  customerSegments: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    criteria: v.object({
      rules: v.array(v.any()),
      operator: v.union(v.literal("AND"), v.literal("OR")),
      engagement: v.optional(v.string()),
    }),
    customerCount: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index("by_business", ["businessId"]),

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
    createdAt: v.number(),
    goal: v.optional(v.string()),
    experimentId: v.optional(v.string()),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"]),

  journeyStageDefinitions: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    order: v.number(),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    automations: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index("by_business", ["businessId"]),

  journeyTriggers: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    triggerType: v.union(
      v.literal("event"),
      v.literal("time"),
      v.literal("condition")
    ),
    conditions: v.any(),
    actions: v.array(v.any()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    lastTriggered: v.optional(v.number()),
    triggerCount: v.number(),
  }).index("by_business", ["businessId"]),

  customerJourneyStages: defineTable({
    businessId: v.id("businesses"),
    contactId: v.id("contacts"),
    stage: v.string(),
    enteredAt: v.number(),
    exitedAt: v.optional(v.number()),
    touchpoints: v.array(v.string()),
  })
    .index("by_business", ["businessId"])
    .index("by_contact", ["contactId"]),

  customerJourneyTransitions: defineTable({
    businessId: v.id("businesses"),
    contactId: v.id("contacts"),
    fromStage: v.string(),
    toStage: v.string(),
    transitionedAt: v.number(),
  })
    .index("by_business_and_date", ["businessId", "transitionedAt"])
    .index("by_contact", ["contactId"]),

  revenueTouchpoints: defineTable({
    businessId: v.id("businesses"),
    contactId: v.id("contacts"),
    channel: v.string(),
    campaignId: v.optional(v.string()),
    timestamp: v.number(),
    value: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_contact_and_business", ["contactId", "businessId"]),

  revenueEvents: defineTable({
    businessId: v.id("businesses"),
    userId: v.id("users"),
    amount: v.number(),
    source: v.string(),
    description: v.optional(v.string()),
    metadata: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"]),
};
