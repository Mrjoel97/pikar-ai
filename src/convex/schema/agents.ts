import { defineTable } from "convex/server";
import { v } from "convex/values";

export const agentsSchema = {
  aiAgents: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    type: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("training")),
    config: v.optional(v.any()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"]),

  agentProfiles: defineTable({
    agentId: v.id("aiAgents"),
    businessId: v.id("businesses"),
    capabilities: v.array(v.string()),
    performance: v.optional(v.any()),
    metadata: v.optional(v.any()),
  })
    .index("by_agent", ["agentId"])
    .index("by_business", ["businessId"]),

  agentMemories: defineTable({
    agentId: v.id("aiAgents"),
    businessId: v.id("businesses"),
    content: v.string(),
    context: v.optional(v.string()),
    timestamp: v.number(),
    metadata: v.optional(v.any()),
  })
    .index("by_agent", ["agentId"])
    .index("by_business", ["businessId"]),

  agentCollaborations: defineTable({
    businessId: v.id("businesses"),
    agentIds: v.array(v.id("aiAgents")),
    taskId: v.optional(v.string()),
    status: v.string(),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"]),

  agentLearningEvents: defineTable({
    agentId: v.id("aiAgents"),
    businessId: v.id("businesses"),
    eventType: v.string(),
    data: v.any(),
    timestamp: v.number(),
  })
    .index("by_agent", ["agentId"])
    .index("by_business", ["businessId"]),

  agentExecutions: defineTable({
    agentId: v.id("aiAgents"),
    businessId: v.id("businesses"),
    status: v.union(v.literal("pending"), v.literal("running"), v.literal("completed"), v.literal("failed")),
    duration: v.optional(v.number()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    result: v.optional(v.any()),
  })
    .index("by_agent", ["agentId"])
    .index("by_business", ["businessId"]),
};