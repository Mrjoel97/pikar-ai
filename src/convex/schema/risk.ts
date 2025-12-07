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
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"]),

  riskMitigations: defineTable({
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.string(),
    category: v.string(),
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
    expectedReduction: v.number(),
    actualReduction: v.number(),
    progress: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
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
      v.literal("trend_analysis")
    ),
    timeRange: v.object({
      start: v.number(),
      end: v.number(),
    }),
    summary: v.object({
      totalRisks: v.number(),
      criticalRisks: v.number(),
      highRisks: v.number(),
      mediumRisks: v.number(),
      lowRisks: v.number(),
      avgRiskScore: v.number(),
    }),
    generatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_type", ["reportType"]),
};
