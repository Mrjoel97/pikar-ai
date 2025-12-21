import { defineTable } from "convex/server";
import { v } from "convex/values";

export const agentsSchema = {
  aiAgents: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    type: v.string(),
    status: v.optional(v.string()),
    isActive: v.boolean(),
    isTemplate: v.optional(v.boolean()),
    category: v.optional(v.string()),
    capabilities: v.optional(v.array(v.string())),
    config: v.optional(v.any()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    description: v.optional(v.string()),
    personality: v.optional(v.string()),
    channels: v.optional(v.array(v.any())),
    configuration: v.optional(v.any()),
    mmrPolicy: v.optional(v.string()),
    performance: v.optional(v.any()),
    playbooks: v.optional(v.array(v.string())),
  })
    .index("by_business", ["businessId"])
    .index("by_active", ["isActive"])
    .index("by_category", ["category"]),

  agentProfiles: defineTable({
    businessId: v.id("businesses"),
    userId: v.id("users"),
    trainingNotes: v.optional(v.string()),
    brandVoice: v.optional(v.string()),
    preferences: v.optional(v.any()),
    lastUpdated: v.number(),
    cadence: v.optional(v.string()),
    persona: v.optional(v.string()),
    tone: v.optional(v.string()),
  })
    .index("by_business", ["businessId"])
    .index("by_user_and_business", ["userId", "businessId"]),

  agentCatalog: defineTable({
    agent_key: v.string(),
    display_name: v.string(),
    short_desc: v.string(),
    long_desc: v.string(),
    capabilities: v.array(v.string()),
    default_model: v.string(),
    active: v.boolean(),
    tier_restrictions: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    prompt_templates: v.optional(v.array(v.object({
      id: v.string(),
      name: v.string(),
      description: v.string(),
      template: v.string(),
      variables: v.optional(v.array(v.string())),
      category: v.optional(v.string()),
    }))),
  })
    .index("by_active", ["active"])
    .index("by_agent_key", ["agent_key"]),
    
  agentVersions: defineTable({
    agent_key: v.string(),
    version: v.string(),
    config: v.any(),
    createdAt: v.number(),
    createdBy: v.optional(v.id("users")),
    note: v.optional(v.string()),
  })
    .index("by_key", ["agent_key"]),

  playbookVersions: defineTable({
    playbook_key: v.string(),
    version: v.string(),
    snapshot: v.any(),
    createdAt: v.number(),
    createdBy: v.optional(v.id("users")),
    note: v.optional(v.string()),
  })
    .index("by_playbook_key", ["playbook_key"]),
    
  agentDatasets: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    agent_key: v.optional(v.string()),
    data: v.any(),
    createdAt: v.number(),
    createdBy: v.optional(v.id("users")),
  })
    .index("by_agent", ["agent_key"]),

  agentMemories: defineTable({
    agentId: v.id("aiAgents"),
    businessId: v.id("businesses"),
    memoryType: v.string(),
    content: v.string(),
    context: v.optional(v.any()),
    importance: v.number(),
    lastAccessed: v.number(),
    accessCount: v.number(),
    createdAt: v.number(),
    timestamp: v.optional(v.number()),
  })
    .index("by_agent", ["agentId"])
    .index("by_business", ["businessId"]),

  agentCollaborations: defineTable({
    businessId: v.id("businesses"),
    initiatorAgentId: v.id("aiAgents"),
    targetAgentId: v.id("aiAgents"),
    goal: v.string(),
    status: v.string(),
    messages: v.array(v.any()),
    result: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
    startedAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_initiator", ["initiatorAgentId"])
    .index("by_target", ["targetAgentId"]),

  agentLearningEvents: defineTable({
    agentId: v.id("aiAgents"),
    businessId: v.id("businesses"),
    eventType: v.string(),
    description: v.string(),
    context: v.optional(v.any()),
    outcome: v.optional(v.any()),
    impactScore: v.optional(v.number()),
    createdAt: v.number(),
    data: v.optional(v.any()),
  })
    .index("by_agent", ["agentId"])
    .index("by_business", ["businessId"]),

  agentExecutions: defineTable({
    agentId: v.id("aiAgents"),
    businessId: v.id("businesses"),
    taskId: v.optional(v.string()),
    input: v.any(),
    output: v.optional(v.any()),
    status: v.string(),
    duration: v.optional(v.number()),
    cost: v.optional(v.number()),
    tokensUsed: v.optional(v.number()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    responseTime: v.optional(v.number()),
    metadata: v.optional(v.object({
      model: v.optional(v.string()),
      inputTokens: v.optional(v.number()),
      outputTokens: v.optional(v.number()),
      retries: v.optional(v.number()),
    })),
  })
    .index("by_agent", ["agentId"])
    .index("by_business", ["businessId"])
    .index("by_status", ["status"])
    .index("by_agent_and_status", ["agentId", "status"]),
};