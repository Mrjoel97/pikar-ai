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
};
