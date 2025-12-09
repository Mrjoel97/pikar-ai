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
};
