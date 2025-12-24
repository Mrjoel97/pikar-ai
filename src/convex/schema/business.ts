import { defineTable } from "convex/server";
import { v } from "convex/values";

export const businessSchema = {
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    role: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isSuspended: v.optional(v.boolean()),
    businessId: v.optional(v.id("businesses")),
    businessTier: v.optional(v.string()),
    tokenIdentifier: v.optional(v.string()),
    companyName: v.optional(v.string()),
    industry: v.optional(v.string()),
    onboardingCompleted: v.optional(v.boolean()),
  })
    .index("email", ["email"])
    .index("by_role", ["role"])
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
      plan: v.optional(v.string()),
      trialStart: v.optional(v.number()),
      trialEnd: v.optional(v.number()),
      status: v.optional(v.string()),
    })),
  })
    .index("by_owner", ["ownerId"])
    .index("by_tier", ["tier"]),

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

  brainDumps: defineTable({
    businessId: v.id("businesses"),
    userId: v.id("users"),
    initiativeId: v.optional(v.id("initiatives")),
    content: v.string(),
    title: v.optional(v.string()),
    transcript: v.optional(v.string()),
    summary: v.optional(v.string()),
    type: v.optional(v.union(
      v.literal("note"),
      v.literal("idea"),
      v.literal("task"),
      v.literal("voice")
    )),
    voice: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    processed: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
    deleted: v.optional(v.boolean()),
  })
    .index("by_business", ["businessId"])
    .index("by_user", ["userId"])
    .index("by_initiative", ["initiativeId"]),

  featureFlags: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    isEnabled: v.boolean(),
    rules: v.optional(v.any()),
    rolloutPercentage: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    flagName: v.optional(v.string()),
    businessId: v.optional(v.id("businesses")),
    tenantId: v.optional(v.id("businesses")),
  })
    .index("by_name", ["name"])
    .index("by_flag_name", ["flagName"])
    .index("by_business", ["businessId"]),
};
