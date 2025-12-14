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
    createdAt: v.number(),
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
  })
    .index("by_category", ["category"])
    .index("by_integration", ["integrationId"]),

  integrationMetrics: defineTable({
    integrationId: v.id("customIntegrations"),
    businessId: v.id("businesses"),
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
    createdAt: v.number(),
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
    createdAt: v.number(),
    updatedAt: v.number(),
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
  })
    .index("by_business", ["businessId"])
    .index("by_platform_and_scope", ["platform", "scope"])
    .index("by_scope", ["scope"])
    .index("by_business_and_platform", ["businessId", "platform"]),
};