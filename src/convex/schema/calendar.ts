import { defineTable } from "convex/server";
import { v } from "convex/values";

export const calendarSchema = {
  scheduleSlots: defineTable({
    businessId: v.id("businesses"),
    userId: v.id("users"),
    dayOfWeek: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    available: v.boolean(),
    timezone: v.optional(v.string()),
    label: v.optional(v.string()),
    channel: v.optional(v.string()),
    scheduledAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_user", ["userId"])
    .index("by_user_and_time", ["userId", "scheduledAt"]),

  appointments: defineTable({
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    attendees: v.array(v.string()),
    location: v.optional(v.string()),
    type: v.string(),
    status: v.string(),
  }).index("by_business", ["businessId"]),

  availabilityBlocks: defineTable({
    businessId: v.id("businesses"),
    dayOfWeek: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    isAvailable: v.boolean(),
  }).index("by_business", ["businessId"]),

  calendarIntegrations: defineTable({
    businessId: v.id("businesses"),
    userId: v.id("users"),
    provider: v.union(v.literal("google"), v.literal("outlook"), v.literal("apple")),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.number(),
    isActive: v.boolean(),
    connectedAt: v.number(),
    lastSyncAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_user", ["userId"]),
};
