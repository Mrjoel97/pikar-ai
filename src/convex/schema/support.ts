import { defineTable } from "convex/server";
import { v } from "convex/values";

export const supportSchema = {
  supportTickets: defineTable({
    businessId: v.id("businesses"),
    subject: v.string(),
    description: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    category: v.string(),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("waiting_customer"),
      v.literal("resolved"),
      v.literal("closed")
    ),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"]),

  apiUsageLogs: defineTable({
    businessId: v.id("businesses"),
    endpoint: v.string(),
    method: v.string(),
    statusCode: v.number(),
    responseTime: v.number(),
    userId: v.optional(v.id("users")),
    apiKeyHash: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_business_and_time", ["businessId", "timestamp"])
    .index("by_business", ["businessId"]),
};
