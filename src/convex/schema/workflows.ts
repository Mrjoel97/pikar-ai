import { defineTable } from "convex/server";
import { v } from "convex/values";

export const workflowsSchema = {
  workflows: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("paused"), v.literal("archived")),
    trigger: v.optional(v.any()),
    steps: v.array(v.any()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"]),

  workflowAssignments: defineTable({
    workflowId: v.id("workflows"),
    businessId: v.id("businesses"),
    assignedTo: v.id("users"),
    status: v.string(),
    assignedAt: v.number(),
  })
    .index("by_workflow", ["workflowId"])
    .index("by_business", ["businessId"])
    .index("by_user", ["assignedTo"]),

  workflowExecutions: defineTable({
    workflowId: v.id("workflows"),
    businessId: v.id("businesses"),
    status: v.union(v.literal("running"), v.literal("completed"), v.literal("failed")),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    result: v.optional(v.any()),
  })
    .index("by_workflow", ["workflowId"])
    .index("by_business", ["businessId"]),

  tasks: defineTable({
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    urgent: v.optional(v.boolean()),
    status: v.union(v.literal("todo"), v.literal("in_progress"), v.literal("completed")),
    dueDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    metadata: v.optional(v.any()),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"]),
};
