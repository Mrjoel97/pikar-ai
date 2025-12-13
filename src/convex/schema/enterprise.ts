import { defineTable } from "convex/server";
import { v } from "convex/values";

export const enterpriseSchema = {
  // Custom API Builder
  customApis: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    method: v.union(v.literal("GET"), v.literal("POST"), v.literal("PUT"), v.literal("DELETE")),
    path: v.string(),
    requiresAuth: v.boolean(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_path", ["path"]),

  apiVersions: defineTable({
    apiId: v.id("customApis"),
    version: v.string(),
    convexFunction: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
    changeNotes: v.optional(v.string()),
  }).index("by_api", ["apiId"]),

  apiCallLogs: defineTable({
    apiId: v.id("customApis"),
    clientId: v.string(),
    statusCode: v.number(),
    responseTime: v.number(),
    endpoint: v.string(),
    timestamp: v.number(),
  })
    .index("by_api_and_timestamp", ["apiId", "timestamp"]),

  // Webhooks
  webhooks: defineTable({
    businessId: v.id("businesses"),
    url: v.string(),
    events: v.array(v.string()),
    secret: v.string(),
    active: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_business", ["businessId"]),

  webhookDeliveries: defineTable({
    webhookId: v.id("webhooks"),
    businessId: v.id("businesses"),
    event: v.string(),
    payload: v.any(),
    status: v.union(v.literal("success"), v.literal("failed"), v.literal("pending")),
    attempts: v.number(),
    lastAttemptAt: v.number(),
    nextRetryAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    responseStatus: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_webhook", ["webhookId"])
    .index("by_status", ["status"]),

  // Crisis Management
  crisisAlerts: defineTable({
    businessId: v.id("businesses"),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    alertType: v.string(),
    title: v.string(),
    description: v.string(),
    status: v.union(v.literal("active"), v.literal("monitoring"), v.literal("resolved")),
    affectedSystems: v.array(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    detectedAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"]),

  // Workforce Analytics
  workforceOptimizationPlans: defineTable({
    businessId: v.id("businesses"),
    planName: v.string(),
    recommendations: v.array(v.any()),
    status: v.string(),
    targetDate: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_business", ["businessId"]),

  remediationHistory: defineTable({
    businessId: v.id("businesses"),
    workflowId: v.id("workflows"),
    violationType: v.string(),
    action: v.string(),
    appliedBy: v.id("users"),
    changes: v.any(),
    appliedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_workflow", ["workflowId"]),

  // Data Warehouse
  dataWarehouseSources: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    sourceType: v.string(),
    type: v.optional(v.string()), // Added for analytics compatibility
    connectionConfig: v.any(),
    isActive: v.boolean(),
    lastSyncTime: v.optional(v.number()),
    nextSyncTime: v.optional(v.number()),
    syncFrequency: v.optional(v.string()),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"]),

  dataWarehouseJobs: defineTable({
    businessId: v.id("businesses"),
    sourceId: v.id("dataWarehouseSources"),
    jobType: v.string(),
    status: v.string(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    recordsProcessed: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  })
    .index("by_business", ["businessId"])
    .index("by_source", ["sourceId"])
    .index("by_status", ["status"]),

  etlPipelines: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    sourceId: v.id("dataWarehouseSources"),
    transformations: v.array(v.any()),
    schedule: v.optional(v.string()),
    enabled: v.boolean(),
    status: v.optional(v.string()), // Added for compatibility
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_source", ["sourceId"]),

  pipelineExecutions: defineTable({
    businessId: v.id("businesses"),
    pipelineId: v.id("etlPipelines"),
    status: v.string(),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    recordsProcessed: v.number(),
    errorMessage: v.optional(v.string()),
    errors: v.optional(v.array(v.any())), // Added for error tracking
  })
    .index("by_business", ["businessId"])
    .index("by_pipeline", ["pipelineId"])
    .index("by_status", ["status"]),

  dataQualityChecks: defineTable({
    businessId: v.id("businesses"),
    sourceId: v.id("dataWarehouseSources"),
    checkType: v.string(),
    checkConfig: v.any(),
    lastRunTime: v.optional(v.number()),
    status: v.string(),
    score: v.optional(v.number()), // Added for quality scoring
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_source", ["sourceId"]),

  exportSchedules: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    exportType: v.string(),
    destination: v.string(),
    sourceId: v.optional(v.id("dataWarehouseSources")), // Added for source tracking
    schedule: v.string(),
    enabled: v.boolean(),
    lastRunTime: v.optional(v.number()),
    nextRunTime: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_next_run", ["nextRunTime"]),

  exportHistory: defineTable({
    businessId: v.id("businesses"),
    scheduleId: v.id("exportSchedules"),
    status: v.string(),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    recordCount: v.optional(v.number()),
    fileSize: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  })
    .index("by_business", ["businessId"])
    .index("by_schedule", ["scheduleId"]),

  // Portfolio Management
  portfolioMetrics: defineTable({
    businessId: v.id("businesses"),
    totalBudget: v.number(),
    totalSpent: v.number(),
    overallHealth: v.union(
      v.literal("healthy"),
      v.literal("warning"),
      v.literal("critical"),
      v.literal("unknown")
    ),
    lastUpdated: v.number(),
  }).index("by_business", ["businessId"]),

  initiativeDependencies: defineTable({
    businessId: v.id("businesses"),
    sourceInitiativeId: v.id("initiatives"),
    targetInitiativeId: v.id("initiatives"),
    dependencyType: v.union(
      v.literal("blocks"),
      v.literal("requires"),
      v.literal("related")
    ),
    description: v.optional(v.string()),
    status: v.string(),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_source", ["sourceInitiativeId"])
    .index("by_target", ["targetInitiativeId"]),

  portfolioRisks: defineTable({
    businessId: v.id("businesses"),
    initiativeId: v.optional(v.id("initiatives")),
    riskType: v.string(),
    description: v.string(),
    impact: v.number(),
    probability: v.number(),
    mitigationStrategy: v.optional(v.string()),
    status: v.string(),
    identifiedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_initiative", ["initiativeId"])
    .index("by_status", ["status"]),

  portfolioResourceAllocations: defineTable({
    businessId: v.id("businesses"),
    initiativeId: v.id("initiatives"),
    resourceType: v.string(),
    allocatedAmount: v.number(),
    capacity: v.number(),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    status: v.string(),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_initiative", ["initiativeId"]),

};