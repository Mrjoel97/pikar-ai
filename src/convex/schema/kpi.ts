import { defineTable } from "convex/server";
import { v } from "convex/values";

export const kpiSchema = {
  departmentKpis: defineTable({
    businessId: v.id("businesses"),
    department: v.string(),
    name: v.string(),
    value: v.number(),
    unit: v.string(),
    trend: v.number(),
    timestamp: v.number(),
    metadata: v.optional(v.any()),
  })
    .index("by_business", ["businessId"])
    .index("by_department", ["businessId", "department"])
    .index("by_timestamp", ["timestamp"]),

  kpiTargets: defineTable({
    businessId: v.id("businesses"),
    department: v.string(),
    name: v.string(),
    targetValue: v.number(),
    unit: v.string(),
    timeframe: v.union(
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("yearly")
    ),
    ownerId: v.id("users"),
    alertThreshold: v.number(),
    status: v.union(v.literal("active"), v.literal("archived")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_department", ["businessId", "department"])
    .index("by_owner", ["ownerId"]),

  kpiAlerts: defineTable({
    businessId: v.id("businesses"),
    targetId: v.id("kpiTargets"),
    department: v.string(),
    kpiName: v.string(),
    alertType: v.union(
      v.literal("threshold_breach"),
      v.literal("trend_warning"),
      v.literal("target_missed")
    ),
    severity: v.union(
      v.literal("info"),
      v.literal("warning"),
      v.literal("critical")
    ),
    message: v.string(),
    currentValue: v.number(),
    targetValue: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("acknowledged"),
      v.literal("resolved")
    ),
    acknowledgedBy: v.optional(v.id("users")),
    acknowledgedAt: v.optional(v.number()),
    resolvedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_target", ["targetId"])
    .index("by_status", ["status"])
    .index("by_department", ["businessId", "department"]),

  departmentBudgets: defineTable({
    businessId: v.id("businesses"),
    department: v.string(),
    fiscalYear: v.number(),
    amount: v.number(),
    notes: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_business_and_year", ["businessId", "fiscalYear"]),

  departmentBudgetActuals: defineTable({
    businessId: v.id("businesses"),
    department: v.string(),
    fiscalYear: v.number(),
    amount: v.number(),
    date: v.number(),
    category: v.string(),
    description: v.string(),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_business_and_year", ["businessId", "fiscalYear"]),

  departmentBudgetForecasts: defineTable({
    businessId: v.id("businesses"),
    department: v.string(),
    fiscalYear: v.number(),
    forecastAmount: v.number(),
    reason: v.string(),
    createdAt: v.number(),
    createdBy: v.string(),
  }).index("by_business", ["businessId"]),

  resourceAllocations: defineTable({
    businessId: v.id("businesses"),
    resourceId: v.string(),
    resourceName: v.string(),
    projectId: v.optional(v.string()),
    projectName: v.optional(v.string()),
    allocationPercent: v.number(),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("planned")),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_resource", ["resourceId"]),

  resourceCapacity: defineTable({
    businessId: v.id("businesses"),
    resourceId: v.string(),
    resourceName: v.string(),
    resourceType: v.string(),
    totalHours: v.number(),
    availableHours: v.number(),
    utilizationPercent: v.number(),
    skills: v.array(v.string()),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_resource", ["resourceId"]),
};