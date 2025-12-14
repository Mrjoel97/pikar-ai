import { defineTable } from "convex/server";
import { v } from "convex/values";

export const integrationsSchema = {
  integrationTemplates: defineTable({
    name: v.string(),
    description: v.string(),
    category: v.string(),
    provider: v.string(),
    logoUrl: v.optional(v.string()),
    config: v.any(),
    usageCount: v.optional(v.number()),
    createdAt: v.number(),
    requiredFields: v.optional(v.array(v.string())),
    documentation: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  }).index("by_category", ["category"]),

  integrationMarketplace: defineTable({
    name: v.string(),
    description: v.string(),
    category: v.string(),
    provider: v.string(),
    integrationId: v.id("customIntegrations"),
    downloads: v.number(),
    rating: v.optional(v.number()),
    createdAt: v.number(),
    isPublished: v.optional(v.boolean()),
    price: v.optional(v.number()),
    publisherId: v.optional(v.id("users")),
    tags: v.optional(v.array(v.string())),
  })
    .index("by_category", ["category"])
    .index("by_integration", ["integrationId"]),

  integrationMetrics: defineTable({
    integrationId: v.id("customIntegrations"),
    businessId: v.optional(v.id("businesses")),
    metricType: v.string(), // "request", "error", "latency"
    value: v.number(),
    timestamp: v.number(),
    metadata: v.optional(v.any()),
  })
    .index("by_integration", ["integrationId"])
    .index("by_business", ["businessId"]),

  integrationTests: defineTable({
    businessId: v.id("businesses"),
    integrationId: v.id("customIntegrations"),
    name: v.string(),
    config: v.any(),
    status: v.string(),
    lastRunAt: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    executionTime: v.optional(v.number()),
    testName: v.optional(v.string()),
    testType: v.optional(v.string()),
    testConfig: v.optional(v.any()),
    expectedResult: v.optional(v.any()),
  })
    .index("by_business", ["businessId"])
    .index("by_integration", ["integrationId"]),

  integrationTestResults: defineTable({
    testId: v.id("integrationTests"),
    integrationId: v.id("customIntegrations"),
    status: v.string(),
    output: v.any(),
    duration: v.number(),
    createdAt: v.number(),
  })
    .index("by_test", ["testId"])
    .index("by_integration", ["integrationId"]),

  customIntegrations: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    type: v.string(),
    config: v.any(),
    authConfig: v.optional(v.any()),
    endpoints: v.array(v.any()),
    isActive: v.boolean(),
    status: v.optional(v.string()),
    version: v.optional(v.string()),
    installedFrom: v.optional(v.string()),
    rating: v.optional(v.number()),
    lastModified: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    installedAt: v.optional(v.number()),
  }).index("by_business", ["businessId"]),

  socialApiConfigs: defineTable({
    businessId: v.id("businesses"),
    platform: v.string(),
    clientId: v.optional(v.string()),
    clientSecret: v.optional(v.string()),
    callbackUrl: v.optional(v.string()),
    scope: v.string(),
    isActive: v.boolean(),
    updatedAt: v.number(),
    createdAt: v.number(),
    plan: v.optional(v.string()),
  })
    .index("by_business", ["businessId"])
    .index("by_platform_and_scope", ["platform", "scope"])
    .index("by_scope", ["scope"])
    .index("by_business_and_platform", ["businessId", "platform"]),

  crmConnections: defineTable({
    businessId: v.id("businesses"),
    userId: v.optional(v.id("users")),
    provider: v.union(
      v.literal("salesforce"),
      v.literal("hubspot"),
      v.literal("pipedrive"),
      v.literal("zoho")
    ),
    platform: v.optional(v.string()),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.number(),
    isActive: v.boolean(),
    syncStatus: v.optional(v.string()),
    lastSyncAt: v.optional(v.number()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    accountName: v.optional(v.string()),
  })
    .index("by_business", ["businessId"])
    .index("by_provider", ["provider"])
    .index("by_business_and_provider", ["businessId", "provider"]),

  crmSyncConflicts: defineTable({
    businessId: v.id("businesses"),
    connectionId: v.id("crmConnections"),
    entityType: v.string(),
    remoteData: v.any(),
    contactEmail: v.optional(v.string()),
    localId: v.optional(v.string()),
    remoteId: v.optional(v.string()),
    conflictType: v.optional(v.string()),
    localData: v.optional(v.any()),
    status: v.union(v.literal("pending"), v.literal("resolved"), v.literal("ignored")),
    resolution: v.optional(v.string()),
    resolvedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_connection", ["connectionId"])
    .index("by_status", ["status"]),

  crmDeals: defineTable({
    businessId: v.id("businesses"),
    connectionId: v.optional(v.id("crmConnections")),
    externalId: v.string(),
    name: v.string(),
    value: v.optional(v.number()),
    amount: v.optional(v.number()),
    stage: v.optional(v.string()),
    probability: v.optional(v.number()),
    closeDate: v.optional(v.number()),
    contactId: v.optional(v.id("contacts")),
    metadata: v.optional(v.any()),
    lastSyncAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    contactName: v.optional(v.string()),
  })
    .index("by_business", ["businessId"])
    .index("by_external_id", ["externalId"])
    .index("by_connection", ["connectionId"]),
};