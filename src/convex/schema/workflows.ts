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
    // Governance fields
    pipeline: v.optional(v.array(v.any())),
    governanceHealth: v.optional(v.object({
      score: v.number(),
      issues: v.array(v.string()),
      updatedAt: v.number(),
    })),
    tier: v.optional(v.string()),
    approval: v.optional(v.object({
      required: v.boolean(),
    })),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"]),

  playbooks: defineTable({
    businessId: v.optional(v.id("businesses")),
    name: v.string(),
    description: v.optional(v.string()),
    trigger: v.string(),
    steps: v.array(v.any()),
    triggers: v.optional(v.array(v.any())),
    input_schema: v.optional(v.any()),
    output_schema: v.optional(v.any()),
    metadata: v.optional(v.any()),
    isActive: v.boolean(),
    active: v.optional(v.boolean()),
    playbook_key: v.optional(v.string()),
    display_name: v.optional(v.string()),
    version: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_active", ["active"])
    .index("by_key_and_version", ["playbook_key", "version"]),

  playbookExecutions: defineTable({
    businessId: v.id("businesses"),
    playbookId: v.id("playbooks"),
    agentId: v.optional(v.id("aiAgents")),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    ),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
  })
    .index("by_business", ["businessId"])
    .index("by_playbook", ["playbookId"]),

  playbookVersions: defineTable({
    playbook_key: v.string(),
    version: v.string(),
    snapshot: v.any(),
    createdAt: v.number(),
  })
    .index("by_playbook_key", ["playbook_key"]),

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

  workflowHandoffs: defineTable({
    businessId: v.id("businesses"),
    workflowId: v.id("workflows"),
    fromDepartment: v.string(),
    toDepartment: v.string(),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected"), v.literal("completed")),
    handoffData: v.any(),
    initiatedAt: v.optional(v.number()),
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.id("users")),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    duration: v.optional(v.number()),
    slaDeadline: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_workflow", ["workflowId"])
    .index("by_status", ["status"]),

  // Governance tables
  governanceEscalations: defineTable({
    businessId: v.id("businesses"),
    workflowId: v.id("workflows"),
    violationType: v.string(),
    count: v.number(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("resolved")),
    escalatedTo: v.string(),
    notes: v.optional(v.string()),
    resolution: v.optional(v.string()),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_workflow", ["workflowId"])
    .index("by_status", ["status"]),

  governanceAutomationSettings: defineTable({
    businessId: v.id("businesses"),
    autoRemediate: v.object({
      missing_approval: v.boolean(),
      insufficient_sla: v.boolean(),
      insufficient_approvals: v.boolean(),
      role_diversity: v.boolean(),
    }),
    escalationRules: v.object({
      threshold: v.number(),
      escalateTo: v.string(),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_business", ["businessId"]),

  governanceRemediations: defineTable({
    businessId: v.id("businesses"),
    workflowId: v.id("workflows"),
    violationType: v.string(),
    action: v.string(),
    originalPipeline: v.array(v.any()),
    status: v.union(v.literal("applied"), v.literal("rolled_back")),
    rollbackReason: v.optional(v.string()),
    appliedAt: v.number(),
    rolledBackAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_workflow", ["workflowId"]),

  governanceViolations: defineTable({
    businessId: v.id("businesses"),
    workflowId: v.id("workflows"),
    violationType: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    status: v.union(v.literal("open"), v.literal("resolved")),
    description: v.string(),
    detectedAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_workflow", ["workflowId"])
    .index("by_status", ["status"]),

  // Policy Management tables
  policies: defineTable({
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    content: v.string(),
    version: v.string(),
    status: v.union(v.literal("draft"), v.literal("active"), v.literal("deprecated")),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_business_and_status", ["businessId", "status"]),

  policyVersions: defineTable({
    policyId: v.id("policies"),
    version: v.string(),
    content: v.string(),
    changeNotes: v.string(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_policy", ["policyId"]),

  policyApprovals: defineTable({
    businessId: v.id("businesses"),
    policyId: v.id("policies"),
    requestedBy: v.id("users"),
    approvedBy: v.optional(v.id("users")),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    comments: v.optional(v.string()),
    createdAt: v.number(),
    approvedAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_policy", ["policyId"])
    .index("by_business_and_status", ["businessId", "status"]),

  policyAcknowledgments: defineTable({
    policyId: v.id("policies"),
    userId: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("acknowledged")),
    distributedAt: v.number(),
    acknowledgedAt: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    signature: v.optional(v.string()),
  })
    .index("by_policy", ["policyId"])
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "status"]),

  tasks: defineTable({
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    urgent: v.optional(v.boolean()),
    status: v.union(v.literal("todo"), v.literal("in_progress"), v.literal("completed")),
    dueDate: v.optional(v.number()),
    initiativeId: v.optional(v.id("initiatives")),
    createdAt: v.number(),
    updatedAt: v.number(),
    metadata: v.optional(v.any()),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"]),

  experiments: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    hypothesis: v.optional(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("paused")
    ),
    variants: v.array(v.any()),
    metrics: v.array(v.any()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    results: v.optional(v.any()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"]),

  approvalQueue: defineTable({
    businessId: v.id("businesses"),
    workflowId: v.optional(v.id("workflows")),
    workflowRunId: v.optional(v.id("workflowRuns")),
    entityType: v.string(),
    entityId: v.string(),
    requestedBy: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    approvers: v.array(v.id("users")),
    approvedBy: v.optional(v.array(v.id("users"))),
    comments: v.optional(v.string()),
    slaDeadline: v.optional(v.number()),
    assigneeId: v.optional(v.id("users")),
    assigneeRole: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.string()),
    stepIndex: v.optional(v.number()),
    priority: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"])
    .index("by_assignee", ["assigneeId"])
    .index("by_sla_deadline", ["slaDeadline"]),

  workflowRuns: defineTable({
    businessId: v.id("businesses"),
    workflowId: v.id("workflows"),
    trigger: v.string(),
    status: v.union(v.literal("running"), v.literal("completed"), v.literal("failed")),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    duration: v.optional(v.number()),
    error: v.optional(v.string()),
    logs: v.optional(v.array(v.string())),
  })
    .index("by_business", ["businessId"])
    .index("by_workflow", ["workflowId"])
    .index("by_status", ["status"]),

  workflowTemplates: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    tier: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    steps: v.array(v.any()),
    businessId: v.optional(v.id("businesses")),
    createdBy: v.optional(v.id("users")),
    createdAt: v.optional(v.float64()),
    isPublic: v.optional(v.boolean()),
  })
    .index("by_business", ["businessId"])
    .index("by_category", ["category"])
    .index("by_tier", ["tier"]),

  templatePins: defineTable({
    userId: v.id("users"),
    templateId: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_template", ["templateId"]),
};