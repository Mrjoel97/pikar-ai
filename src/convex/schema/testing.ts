import { defineTable } from "convex/server";
import { v } from "convex/values";

export const testingSchema = {
  experiments: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    hypothesis: v.string(),
    goal: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("running"),
      v.literal("paused"),
      v.literal("completed"),
      v.literal("archived")
    ),
    createdBy: v.id("users"),
    configuration: v.any(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"]),

  evalSets: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    tests: v.array(v.any()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_business", ["businessId"]),

  evalRuns: defineTable({
    setId: v.id("evalSets"),
    businessId: v.id("businesses"),
    status: v.union(v.literal("running"), v.literal("completed"), v.literal("failed")),
    passCount: v.number(),
    failCount: v.number(),
    results: v.array(v.any()),
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
  })
    .index("by_set", ["setId"])
    .index("by_business", ["businessId"]),

  experimentVariants: defineTable({
    experimentId: v.id("experiments"),
    businessId: v.id("businesses"),
    name: v.string(),
    variantKey: v.string(),
    config: v.any(),
    metrics: v.object({
      sent: v.number(),
      opened: v.number(),
      clicked: v.number(),
      converted: v.number(),
      revenue: v.optional(v.number()),
    }),
    createdAt: v.number(),
  })
    .index("by_experiment", ["experimentId"])
    .index("by_business", ["businessId"]),
};