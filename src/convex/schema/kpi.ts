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
    capacity: v.optional(v.number()),
    allocatedAmount: v.optional(v.number()),
    initiativeId: v.optional(v.id("initiatives")),
    resourceType: v.optional(v.string()),
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

  customMetrics: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    unit: v.string(),
    frequency: v.string(),
    target: v.optional(v.number()),
    currentValue: v.optional(v.number()),
    ownerId: v.optional(v.id("users")),
    metricType: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastCalculated: v.optional(v.number()),
  }).index("by_business", ["businessId"]),

  metricHistory: defineTable({
    metricId: v.id("customMetrics"),
    businessId: v.id("businesses"),
    value: v.number(),
    timestamp: v.number(),
    metadata: v.optional(v.any()),
  })
    .index("by_metric", ["metricId"])
    .index("by_business", ["businessId"])
    .index("by_metric_and_time", ["metricId", "timestamp"]),

  dashboardKpis: defineTable({
    businessId: v.id("businesses"),
    date: v.string(), // YYYY-MM-DD
    revenue: v.optional(v.number()),
    activeUsers: v.optional(v.number()),
    churnRate: v.optional(v.number()),
    cac: v.optional(v.number()),
    ltv: v.optional(v.number()),
    visitors: v.optional(v.number()),
    subscribers: v.optional(v.number()),
    engagement: v.optional(v.number()),
    data: v.any(), // Flexible storage for other KPIs
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_business_and_date", ["businessId", "date"]),
};