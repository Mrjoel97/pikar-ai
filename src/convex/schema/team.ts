import { defineTable } from "convex/server";
import { v } from "convex/values";

export const teamSchema = {
  teamOnboarding: defineTable({
    businessId: v.id("businesses"),
    userId: v.id("users"),
    role: v.string(),
    department: v.optional(v.string()),
    startDate: v.number(),
    currentStep: v.number(),
    completedSteps: v.array(v.number()),
    progress: v.number(),
    status: v.union(v.literal("in_progress"), v.literal("completed")),
    hrSystemId: v.optional(v.string()),
    hrSystemData: v.optional(v.any()),
    lastHRSync: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_user", ["userId"]),

  onboardingChecklists: defineTable({
    businessId: v.id("businesses"),
    userId: v.id("users"),
    steps: v.array(v.any()),
    currentStepIndex: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_user_and_business", ["userId", "businessId"])
    .index("by_business", ["businessId"]),

  milestones: defineTable({
    keyResultId: v.id("keyResults"),
    title: v.string(),
    description: v.optional(v.string()),
    targetDate: v.number(),
    targetValue: v.number(),
    actualValue: v.optional(v.number()),
    completed: v.boolean(),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_key_result", ["keyResultId"]),

  userRoles: defineTable({
    userId: v.id("users"),
    businessId: v.id("businesses"),
    role: v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer"), v.literal("custom")),
    permissions: v.object({
      canApprove: v.boolean(),
      canEdit: v.boolean(),
      canView: v.boolean(),
      canManageTeam: v.boolean(),
      canManageSettings: v.boolean(),
    }),
    assignedBy: v.id("users"),
    assignedAt: v.number(),
  })
    .index("by_user_and_business", ["userId", "businessId"])
    .index("by_business", ["businessId"]),

  onboardingTemplates: defineTable({
    role: v.string(),
    steps: v.array(v.any()),
    createdAt: v.number(),
  })
    .index("by_role", ["role"]),

  objectives: defineTable({
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.optional(v.string()),
    ownerId: v.id("users"),
    parentObjectiveId: v.optional(v.id("objectives")),
    category: v.optional(v.string()),
    status: v.union(
      v.literal("not_started"),
      v.literal("on_track"),
      v.literal("at_risk"),
      v.literal("completed")
    ),
    progress: v.number(),
    startDate: v.number(),
    targetDate: v.number(),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_owner", ["ownerId"])
    .index("by_parent", ["parentObjectiveId"]),

  keyResults: defineTable({
    objectiveId: v.id("objectives"),
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.optional(v.string()),
    targetValue: v.number(),
    currentValue: v.number(),
    unit: v.string(),
    status: v.union(
      v.literal("not_started"),
      v.literal("on_track"),
      v.literal("at_risk"),
      v.literal("completed")
    ),
    progress: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_objective", ["objectiveId"])
    .index("by_business", ["businessId"]),
    
  keyResultUpdates: defineTable({
    keyResultId: v.id("keyResults"),
    businessId: v.id("businesses"),
    previousValue: v.number(),
    newValue: v.number(),
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_key_result", ["keyResultId"])
    .index("by_business", ["businessId"]),
};