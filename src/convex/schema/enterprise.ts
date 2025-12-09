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
};
