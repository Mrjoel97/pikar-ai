import { defineTable } from "convex/server";
import { v } from "convex/values";

export const notificationsSchema = {
  notifications: defineTable({
    businessId: v.id("businesses"),
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.optional(v.union(
      v.literal("info"),
      v.literal("success"),
      v.literal("warning"),
      v.literal("error"),
      v.literal("approval"),
      v.literal("sla_warning"),
      v.literal("assignment"),
      v.literal("sla_overdue"),
      v.literal("integration_error"),
      v.literal("workflow_completion"),
      v.literal("system_alert")
    )),
    priority: v.optional(v.string()),
    read: v.optional(v.boolean()),
    isRead: v.optional(v.boolean()),
    actionUrl: v.optional(v.string()),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
    snoozeUntil: v.optional(v.number()),
    data: v.optional(v.any()),
    readAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_user", ["userId"])
    .index("by_user_and_read", ["userId", "isRead"])
    .index("by_expires_at", ["expiresAt"]),
};
