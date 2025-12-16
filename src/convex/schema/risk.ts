import { defineTable } from "convex/server";
import { v } from "convex/values";

export const riskSchema = {
  riskScenarios: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    status: v.string(),
    timeframe: v.string(),
    assumptions: v.array(
      v.object({
        factor: v.string(),
        value: v.string(),
        impact: v.string(),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    probability: v.optional(v.number()),
    impact: v.optional(v.number()),
    outcomes: v.optional(v.any()),
    createdBy: v.optional(v.id("users")),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"]),

  riskMitigations: defineTable({
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.string(),
    category: v.optional(v.string()),
    priority: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    status: v.union(
      v.literal("planned"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    targetDate: v.number(),
    estimatedCost: v.optional(v.number()),
    expectedReduction: v.optional(v.number()),
    actualReduction: v.optional(v.number()),
    progress: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    effectiveness: v.optional(v.number()),
    strategy: v.optional(v.string()),
    scenarioId: v.optional(v.id("riskScenarios")),
    riskId: v.optional(v.string()),
    ownerId: v.optional(v.id("users")),
    actualCost: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"])
    .index("by_priority", ["priority"]),

  riskReports: defineTable({
    businessId: v.id("businesses"),
    reportType: v.union(
      v.literal("executive_summary"),
      v.literal("detailed_analysis"),
      v.literal("compliance"),
      v.literal("trend_analysis"),
      v.literal("trend_report"),
      v.literal("compliance_report")
    ),
    timeRange: v.optional(v.object({
      start: v.number(),
      end: v.number(),
    })),
    period: v.optional(v.object({
      start: v.number(),
      end: v.number(),
    })),
    summary: v.any(),
    generatedAt: v.number(),
    title: v.optional(v.string()),
    keyFindings: v.optional(v.array(v.string())),
    recommendations: v.optional(v.array(v.string())),
    metrics: v.optional(v.any()),
    generatedBy: v.optional(v.id("users")),
  })
    .index("by_business", ["businessId"])
    .index("by_type", ["reportType"]),

  wins: defineTable({
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.optional(v.string()),
    impact: v.optional(v.string()),
    timeSaved: v.optional(v.number()),
    category: v.optional(v.string()),
    date: v.number(),
  }).index("by_business", ["businessId"]),
};