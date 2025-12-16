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
    status: v.union(v.literal("active"), v.literal("monitoring"), v.literal("resolved"), v.literal("responding")),
    affectedSystems: v.array(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    detectedAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"]),

  crisisResponses: defineTable({
    businessId: v.id("businesses"),
    alertId: v.id("crisisAlerts"),
    responseText: v.string(),
    channels: v.array(v.string()),
    status: v.union(v.literal("pending"), v.literal("sent"), v.literal("failed")),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_alert", ["alertId"]),

  responseTemplates: defineTable({
    businessId: v.id("businesses"),
    templateText: v.string(),
    category: v.string(),
    sentiment: v.string(),
    useCount: v.number(),
    createdAt: v.number(),
  }).index("by_business", ["businessId"]),

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
    config: v.optional(v.any()),
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
    lastRunTime: v.optional(v.number()),
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
    format: v.optional(v.string()),
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

  reportTemplates: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    reportType: v.string(),
    template: v.any(),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_business", ["businessId"]),

  scheduledReports: defineTable({
    businessId: v.id("businesses"),
    templateId: v.id("reportTemplates"),
    name: v.string(),
    frequency: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("quarterly")
    ),
    recipients: v.array(v.string()),
    isActive: v.boolean(),
    lastRunAt: v.optional(v.number()),
    nextRunAt: v.number(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_next_run", ["nextRunAt"]),

  generatedReports: defineTable({
    businessId: v.id("businesses"),
    templateId: v.id("reportTemplates"),
    scheduledReportId: v.optional(v.id("scheduledReports")),
    reportData: v.any(),
    fileUrl: v.optional(v.string()),
    status: v.union(v.literal("generating"), v.literal("completed"), v.literal("failed")),
    generatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_template", ["templateId"]),

  vendors: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    category: v.string(),
    contactEmail: v.optional(v.string()),
    contactName: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("pending")),
    performanceScore: v.optional(v.number()),
    riskLevel: v.optional(v.string()),
    contractStartDate: v.optional(v.number()),
    contractEndDate: v.optional(v.number()),
    contractStart: v.optional(v.number()),
    contractEnd: v.optional(v.number()),
    contractValue: v.optional(v.number()),
    lastReviewDate: v.optional(v.number()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_business", ["businessId"]),

  vendorPerformanceMetrics: defineTable({
    vendorId: v.id("vendors"),
    businessId: v.id("businesses"),
    overallScore: v.number(),
    onTimeDelivery: v.number(),
    qualityScore: v.number(),
    responsiveness: v.number(),
    costEfficiency: v.number(),
    recordedAt: v.number(),
    metadata: v.optional(v.any()),
    metricType: v.optional(v.string()),
  })
    .index("by_business", ["businessId"])
    .index("by_vendor", ["vendorId"]),

  threatDetectionAlerts: defineTable({
    businessId: v.id("businesses"),
    alertType: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    description: v.string(),
    source: v.optional(v.string()),
    affectedResources: v.optional(v.array(v.string())),
    status: v.union(v.literal("active"), v.literal("investigating"), v.literal("resolved")),
    detectedAt: v.number(),
    resolvedAt: v.optional(v.number()),
  }).index("by_business", ["businessId"]),

  qualityChecks: defineTable({
    businessId: v.id("businesses"),
    dataSourceId: v.string(),
    checkType: v.string(),
    status: v.union(v.literal("passed"), v.literal("failed"), v.literal("warning")),
    score: v.number(),
    issues: v.optional(v.array(v.any())),
    checkedAt: v.number(),
  }).index("by_business", ["businessId"]),

  capaItems: defineTable({
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.string(),
    source: v.string(), // e.g., "audit", "incident", "risk"
    sourceId: v.optional(v.string()),
    type: v.union(v.literal("corrective"), v.literal("preventive")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    severity: v.optional(v.string()),
    status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("verified"), v.literal("closed"), v.literal("verification")),
    assignedTo: v.optional(v.id("users")),
    assigneeId: v.optional(v.id("users")),
    createdBy: v.optional(v.id("users")),
    verifiedBy: v.optional(v.id("users")),
    dueDate: v.optional(v.number()),
    slaDeadline: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    verifiedAt: v.optional(v.number()),
    effectivenessRating: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    incidentId: v.optional(v.id("securityIncidents")),
    closedAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"])
    .index("by_assignee", ["assignedTo"]),

  locations: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    code: v.optional(v.string()), // Added code
    type: v.optional(v.string()), // Added type
    parentLocationId: v.optional(v.id("locations")), // Added parentLocationId
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    timezone: v.optional(v.string()),
    isActive: v.boolean(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_parent", ["parentLocationId"]),
    
  locationAudits: defineTable({
    businessId: v.id("businesses"),
    locationId: v.id("locations"),
    auditorId: v.id("users"),
    status: v.string(),
    score: v.number(),
    findings: v.any(),
    conductedAt: v.number(),
    createdAt: v.number(),
    auditType: v.optional(v.string()),
  })
    .index("by_business", ["businessId"])
    .index("by_location", ["locationId"]),

  revenueConversions: defineTable({
    businessId: v.id("businesses"),
    contactId: v.id("contacts"),
    amount: v.number(),
    currency: v.string(),
    source: v.string(),
    convertedAt: v.number(),
    timestamp: v.optional(v.number()), // Added for compatibility
    attributions: v.optional(v.any()), // Added for compatibility
    conversionType: v.optional(v.string()), // Added for compatibility
    revenue: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_contact", ["contactId"]),

  telemetryEvents: defineTable({
    businessId: v.id("businesses"),
    userId: v.optional(v.id("users")),
    event: v.string(),
    data: v.any(),
    timestamp: v.number(),
    eventName: v.optional(v.string()),
  })
    .index("by_business", ["businessId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_business_and_event", ["businessId", "event"]),
};