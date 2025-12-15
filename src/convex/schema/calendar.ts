import { defineTable } from "convex/server";
import { v } from "convex/values";

export const calendarIntegrations = defineTable({
  businessId: v.id("businesses"),
  userId: v.optional(v.id("users")),
  provider: v.string(), // "google", "outlook"
  accessToken: v.string(),
  refreshToken: v.optional(v.string()),
  expiresAt: v.optional(v.number()),
  email: v.optional(v.string()),
  isActive: v.boolean(),
  lastSyncAt: v.optional(v.number()),
  lastSyncError: v.optional(v.string()),
})
  .index("by_business", ["businessId"])
  .index("by_business_and_provider", ["businessId", "provider"])
  .index("by_user", ["userId"]);

export const appointments = defineTable({
  businessId: v.id("businesses"),
  title: v.string(),
  description: v.optional(v.string()),
  startTime: v.number(),
  endTime: v.number(),
  attendees: v.array(v.string()),
  location: v.optional(v.string()),
  meetingLink: v.optional(v.string()),
  provider: v.optional(v.string()), // "google", "outlook", "internal"
  externalId: v.optional(v.string()),
  status: v.string(), // "confirmed", "cancelled", "tentative"
})
  .index("by_business", ["businessId"])
  .index("by_business_and_time", ["businessId", "startTime"]);