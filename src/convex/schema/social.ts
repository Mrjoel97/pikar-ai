import { defineTable } from "convex/server";
import { v } from "convex/values";

export const socialSchema = {
  socialAccounts: defineTable({
    businessId: v.id("businesses"),
    platform: v.union(
      v.literal("twitter"),
      v.literal("linkedin"),
      v.literal("facebook"),
      v.literal("instagram"),
      v.literal("youtube"),
      v.literal("google"),
      v.literal("meta")
    ),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.number(),
    isConnected: v.boolean(),
    isActive: v.optional(v.boolean()),
    username: v.optional(v.string()),
    profileUrl: v.optional(v.string()),
    lastSyncAt: v.optional(v.number()),
    lastUsedAt: v.optional(v.number()),
    connectedAt: v.optional(v.number()),
  })
    .index("by_business", ["businessId"])
    .index("by_business_and_platform", ["businessId", "platform"]),

  socialPosts: defineTable({
    businessId: v.id("businesses"),
    platform: v.union(
      v.literal("twitter"),
      v.literal("linkedin"),
      v.literal("facebook"),
      v.literal("instagram")
    ),
    platforms: v.optional(v.array(v.string())),
    content: v.string(),
    mediaUrls: v.optional(v.array(v.string())),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("published"),
      v.literal("failed"),
      v.literal("posted"),
      v.literal("posting")
    ),
    scheduledFor: v.optional(v.number()),
    scheduledAt: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
    externalId: v.optional(v.string()),
    likes: v.optional(v.number()),
    comments: v.optional(v.number()),
    shares: v.optional(v.number()),
    reach: v.optional(v.number()),
    performanceMetrics: v.optional(v.any()),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_status", ["status"]),
};
