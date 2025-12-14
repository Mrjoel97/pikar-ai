import { defineTable } from "convex/server";
import { v } from "convex/values";

export const onboardingSchema = {
  setupProgress: defineTable({
    businessId: v.id("businesses"),
    currentStep: v.number(),
    completedSteps: v.array(v.string()),
    isCompleted: v.boolean(),
    data: v.optional(v.any()),
    updatedAt: v.number(),
    userId: v.optional(v.id("users")),
    steps: v.optional(v.array(v.any())),
    completedAt: v.optional(v.number()),
    onboardingCompleted: v.optional(v.boolean()),
  }).index("by_business", ["businessId"]),
};