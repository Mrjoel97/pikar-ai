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
  }).index("by_business", ["businessId"]),
};
