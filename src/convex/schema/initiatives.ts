import { defineTable } from "convex/server";
import { v } from "convex/values";

export const initiativesSchema = {
  initiatives: defineTable({
    businessId: v.id("businesses"),
    // Fields from createInitiative
    title: v.optional(v.string()),
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
    createdAt: v.optional(v.number()),
    
    // Fields from upsertForBusiness
    name: v.optional(v.string()),
    industry: v.optional(v.string()),
    businessModel: v.optional(v.string()),
    currentPhase: v.optional(v.number()),
    ownerId: v.optional(v.id("users")),
    onboardingProfile: v.optional(v.any()),
    featureFlags: v.optional(v.array(v.string())),
    updatedAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"]),

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
    dependencies: v.optional(v.array(v.string())),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_initiative", ["initiativeId"])
    .index("by_business", ["businessId"]),

  diagnostics: defineTable({
    businessId: v.id("businesses"),
    createdBy: v.id("users"),
    phase: v.string(),
    inputs: v.any(),
    outputs: v.any(),
    runAt: v.number(),
  })
    .index("by_business", ["businessId"]),
};