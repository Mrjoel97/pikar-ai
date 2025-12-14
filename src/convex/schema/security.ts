import { defineTable } from "convex/server";
import { v } from "convex/values";

export const securitySchema = {
  securityThreats: defineTable({
    businessId: v.id("businesses"),
    type: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    description: v.string(),
    source: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    affectedResource: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("resolved")),
    resolution: v.optional(v.string()),
    detectedAt: v.number(),
    resolvedAt: v.optional(v.number()),
  }).index("by_business", ["businessId"]),

  securityIncidents: defineTable({
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    category: v.string(),
    status: v.union(v.literal("open"), v.literal("investigating"), v.literal("resolved"), v.literal("closed")),
    affectedSystems: v.optional(v.array(v.string())),
    assignedTo: v.optional(v.id("users")),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    resolvedAt: v.optional(v.number()),
  }).index("by_business", ["businessId"]),

  securityCompliance: defineTable({
    businessId: v.id("businesses"),
    framework: v.string(),
    overallScore: v.number(),
    controls: v.array(v.object({
      id: v.string(),
      name: v.string(),
      status: v.union(v.literal("compliant"), v.literal("non-compliant"), v.literal("partial")),
      score: v.number(),
    })),
    lastAssessment: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_business", ["businessId"]),

  governanceRules: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    ruleType: v.string(),
    conditions: v.any(),
    actions: v.array(v.any()),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_business", ["businessId"]),

  remediationActions: defineTable({
    businessId: v.id("businesses"),
    violationId: v.optional(v.string()),
    actionType: v.string(),
    description: v.string(),
    status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed"), v.literal("failed")),
    executedBy: v.optional(v.id("users")),
    executedAt: v.optional(v.number()),
    result: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_business", ["businessId"]),

  kmsConfigs: defineTable({
    businessId: v.id("businesses"),
    keyId: v.string(),
    provider: v.union(v.literal("aws"), v.literal("gcp"), v.literal("azure"), v.literal("internal")),
    region: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("rotating"), v.literal("disabled")),
    isActive: v.boolean(),
    keyRotationDays: v.number(),
    lastRotatedAt: v.optional(v.number()),
    nextRotationAt: v.optional(v.number()),
    scope: v.array(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    metadata: v.optional(v.any()),
  }).index("by_business", ["businessId"]),

  kmsKeyRotations: defineTable({
    businessId: v.id("businesses"),
    configId: v.id("kmsConfigs"),
    status: v.union(v.literal("scheduled"), v.literal("in_progress"), v.literal("completed"), v.literal("failed")),
    scheduledAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    nextRotationDate: v.optional(v.number()),
    autoRotate: v.boolean(),
    logs: v.optional(v.array(v.string())),
  })
    .index("by_business", ["businessId"])
    .index("by_config", ["configId"]),

  kmsUsageLogs: defineTable({
    businessId: v.id("businesses"),
    configId: v.id("kmsConfigs"),
    operation: v.string(), // "encrypt", "decrypt"
    keyId: v.string(),
    userId: v.optional(v.id("users")),
    success: v.boolean(),
    error: v.optional(v.string()),
    dataType: v.optional(v.string()),
    dataSize: v.optional(v.number()),
    timestamp: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_config", ["configId"])
    .index("by_timestamp", ["timestamp"]),

  kmsEncryptionPolicies: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    scope: v.array(v.string()), // e.g., ["pii", "financial"]
    algorithm: v.string(),
    keyRotationDays: v.number(),
    encryptionLevel: v.string(), // "standard", "high", "critical"
    mandatory: v.boolean(),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_business", ["businessId"]),
};