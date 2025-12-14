import { defineTable } from "convex/server";
import { v } from "convex/values";

export const activitySchema = {
  activityFeed: defineTable({
    businessId: v.id("businesses"),
    userId: v.optional(v.id("users")),
    type: v.string(),
    content: v.string(),
    data: v.optional(v.any()),
    isRead: v.boolean(),
    createdAt: v.number(),
  }).index("by_business", ["businessId"]),

  userCredentials: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    passwordResetToken: v.optional(v.string()),
    passwordResetExpires: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"]),

  userLoginTokens: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  }).index("by_token", ["token"]),

  savedSearches: defineTable({
    userId: v.id("users"),
    businessId: v.id("businesses"),
    name: v.string(),
    query: v.string(),
    filters: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  searchHistory: defineTable({
    userId: v.id("users"),
    businessId: v.id("businesses"),
    query: v.string(),
    timestamp: v.number(),
  }).index("by_user", ["userId"]),

  notificationPreferences: defineTable({
    userId: v.id("users"),
    businessId: v.id("businesses"),
    emailEnabled: v.boolean(),
    pushEnabled: v.boolean(),
    smsEnabled: v.boolean(),
    preferences: v.any(), // Detailed preferences by type
    rateLimits: v.optional(v.object({
      maxPerHour: v.number(),
      maxPerDay: v.number(),
    })),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  pushSubscriptions: defineTable({
    userId: v.id("users"),
    businessId: v.id("businesses"),
    subscription: v.any(), // PushSubscription JSON
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
};
