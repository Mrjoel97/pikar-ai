import { defineTable } from "convex/server";
import { v } from "convex/values";

export const orchestrationSchema = {
  agentMessages: defineTable({
    fromAgentKey: v.string(),
    toAgentKey: v.string(),
    message: v.string(),
    context: v.optional(v.any()),
    businessId: v.id("businesses"),
    status: v.string(), // pending, completed, failed
    response: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_from_agent", ["fromAgentKey"])
    .index("by_to_agent", ["toAgentKey"])
    .index("by_status", ["status"]),

  agentOrchestrations: defineTable({
    businessId: v.id("businesses"),
    type: v.string(), // parallel, chain, consensus
    agentCount: v.number(),
    status: v.string(), // running, completed, failed
    duration: v.optional(v.number()),
    successCount: v.optional(v.number()),
    failureCount: v.optional(v.number()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_type", ["type"])
    .index("by_status", ["status"]),

  agentExecutions: defineTable({
    orchestrationId: v.id("agentOrchestrations"),
    agentKey: v.string(),
    status: v.string(), // success, failed
    duration: v.number(),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_orchestration", ["orchestrationId"])
    .index("by_agent", ["agentKey"])
    .index("by_status", ["status"]),
};
