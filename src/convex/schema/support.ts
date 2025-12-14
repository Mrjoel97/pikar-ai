import { defineTable } from "convex/server";
import { v } from "convex/values";

export const supportSchema = {
  supportTickets: defineTable({
    businessId: v.id("businesses"),
    subject: v.string(),
    description: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    category: v.string(),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("waiting_customer"),
      v.literal("resolved"),
      v.literal("closed")
    ),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"]),

  apiUsageLogs: defineTable({
    businessId: v.id("businesses"),
    endpoint: v.string(),
    method: v.string(),
    statusCode: v.number(),
    responseTime: v.number(),
    userId: v.optional(v.id("users")),
    apiKeyHash: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_business_and_time", ["businessId", "timestamp"])
    .index("by_business", ["businessId"]),

  helpTips: defineTable({
    businessId: v.optional(v.id("businesses")),
    category: v.string(),
    title: v.string(),
    content: v.string(),
    page: v.string(),
    tier: v.union(v.literal("solopreneur"), v.literal("startup"), v.literal("sme"), v.literal("enterprise")),
    targetPage: v.optional(v.string()),
    priority: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_category", ["category"])
    .index("by_page_and_tier", ["page", "tier"]),

  tutorials: defineTable({
    businessId: v.optional(v.id("businesses")),
    title: v.string(),
    description: v.optional(v.string()),
    steps: v.array(v.any()),
    category: v.string(),
    difficulty: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    estimatedMinutes: v.number(),
    availableTiers: v.array(v.string()),
    order: v.optional(v.number()),
    totalSteps: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_category", ["category"]),

  tutorialProgress: defineTable({
    userId: v.id("users"),
    businessId: v.id("businesses"),
    tutorialId: v.id("tutorials"),
    currentStep: v.number(),
    completedSteps: v.array(v.number()),
    isCompleted: v.boolean(),
    lastAccessedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_tutorial", ["userId", "tutorialId"]),

  tutorialSteps: defineTable({
    tutorialId: v.id("tutorials"),
    stepNumber: v.number(),
    title: v.string(),
    content: v.string(),
    mediaUrl: v.optional(v.string()),
  }).index("by_tutorial", ["tutorialId"]),

  dismissedTips: defineTable({
    userId: v.id("users"),
    businessId: v.optional(v.id("businesses")),
    tipId: v.id("helpTips"),
    dismissedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_tip", ["userId", "tipId"]),

  tipInteractions: defineTable({
    userId: v.id("users"),
    businessId: v.optional(v.id("businesses")),
    tipId: v.id("helpTips"),
    action: v.string(), // "viewed", "clicked", "dismissed"
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_tip", ["tipId"]),

  helpProgress: defineTable({
    userId: v.id("users"),
    businessId: v.id("businesses"),
    onboardingCompleted: v.boolean(),
    tutorialsCompleted: v.number(),
    tipsDismissed: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
};