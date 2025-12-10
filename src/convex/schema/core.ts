import { defineTable } from "convex/server";
import { v } from "convex/values";

export const coreSchema = {
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    companyName: v.optional(v.string()),
    industry: v.optional(v.string()),
    businessTier: v.optional(v.string()),
    onboardingCompleted: v.optional(v.boolean()),
    businessId: v.optional(v.id("businesses")),
    tokenIdentifier: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("by_token", ["tokenIdentifier"]),

  businesses: defineTable({
    name: v.string(),
    industry: v.string(),
    size: v.optional(v.string()),
    ownerId: v.id("users"),
    teamMembers: v.array(v.id("users")),
    description: v.optional(v.string()),
    website: v.optional(v.string()),
    location: v.optional(v.string()),
    foundedYear: v.optional(v.number()),
    revenue: v.optional(v.string()),
    goals: v.optional(v.array(v.string())),
    challenges: v.optional(v.array(v.string())),
    currentSolutions: v.optional(v.array(v.string())),
    targetMarket: v.optional(v.string()),
    businessModel: v.optional(v.string()),
    tier: v.optional(v.string()),
    subscriptionStatus: v.optional(v.string()),
    subscriptionId: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
    stripeCustomerId: v.optional(v.string()),
    billingEmail: v.optional(v.string()),
    paymentMethodId: v.optional(v.string()),
    trialEndsAt: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    canceledAt: v.optional(v.number()),
    features: v.optional(v.array(v.string())),
    limits: v.optional(v.object({
      maxUsers: v.number(),
      maxAgents: v.number(),
      maxWorkflows: v.number(),
      maxStorage: v.number(),
    })),
    settings: v.optional(v.object({
      aiAgentsEnabled: v.array(v.string()),
      complianceLevel: v.string(),
      dataIntegrations: v.array(v.string()),
    })),
  })
    .index("by_owner", ["ownerId"])
    .index("by_tier", ["tier"]),

  initiatives: defineTable({
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("planning"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("on_hold")
    )),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    )),
    startDate: v.optional(v.number()),
    targetDate: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"]),

  wins: defineTable({
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.optional(v.string()),
    impact: v.optional(v.string()),
    timeSaved: v.optional(v.number()),
    category: v.optional(v.union(
      v.literal("automation"),
      v.literal("revenue"),
      v.literal("efficiency"),
      v.literal("customer"),
      v.literal("other")
    )),
    date: v.number(),
  }).index("by_business", ["businessId"]),

  journeyMilestones: defineTable({
    businessId: v.id("businesses"),
    initiativeId: v.id("initiatives"),
    title: v.string(),
    description: v.optional(v.string()),
    targetDate: v.optional(v.number()),
    status: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("blocked")
    ),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_initiative", ["initiativeId"])
    .index("by_business", ["businessId"]),

  brainDumps: defineTable({
    businessId: v.id("businesses"),
    userId: v.id("users"),
    content: v.string(),
    type: v.optional(v.union(
      v.literal("note"),
      v.literal("idea"),
      v.literal("task"),
      v.literal("voice")
    )),
    tags: v.optional(v.array(v.string())),
    processed: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_user", ["userId"]),

  customerSegments: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    criteria: v.object({
      rules: v.array(v.any()),
      operator: v.union(v.literal("AND"), v.literal("OR")),
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
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"]),

  scheduleSlots: defineTable({
    businessId: v.id("businesses"),
    userId: v.id("users"),
    dayOfWeek: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    available: v.boolean(),
    timezone: v.optional(v.string()),
  })
    .index("by_business", ["businessId"])
    .index("by_user", ["userId"]),

  uploads: defineTable({
    businessId: v.id("businesses"),
    userId: v.id("users"),
    storageId: v.string(),
    filename: v.string(),
    contentType: v.string(),
    size: v.number(),
    purpose: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_user", ["userId"]),

  invoices: defineTable({
    businessId: v.id("businesses"),
    invoiceNumber: v.string(),
    clientName: v.string(),
    clientEmail: v.optional(v.string()),
    amount: v.number(),
    currency: v.optional(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("paid"),
      v.literal("overdue"),
      v.literal("cancelled")
    ),
    dueDate: v.optional(v.number()),
    paidAt: v.optional(v.number()),
    items: v.array(v.object({
      description: v.string(),
      quantity: v.number(),
      rate: v.number(),
      amount: v.number(),
    })),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"]),

  workflowTemplates: defineTable({
    businessId: v.optional(v.id("businesses")),
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    steps: v.array(v.any()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_name", ["name"]),

  notifications: defineTable({
    businessId: v.id("businesses"),
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.optional(v.union(
      v.literal("info"),
      v.literal("success"),
      v.literal("warning"),
      v.literal("error")
    )),
    read: v.optional(v.boolean()),
    actionUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_user", ["userId"]),
};