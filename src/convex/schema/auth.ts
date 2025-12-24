import { defineTable } from "convex/server";
import { v } from "convex/values";

export const authSchema = {
  authRefreshTokens: defineTable({
    userId: v.optional(v.id("users")),
    token: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    createdAt: v.optional(v.number()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    // Legacy/External auth fields
    expirationTime: v.optional(v.number()),
    firstUsedTime: v.optional(v.number()),
    parentRefreshTokenId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  }).index("by_token", ["token"]),

  authSessions: defineTable({
    userId: v.id("users"),
    expirationTime: v.number(),
  }).index("by_user", ["userId"]),

  authAccounts: defineTable({
    userId: v.id("users"),
    provider: v.string(),
    providerAccountId: v.string(),
    refreshToken: v.optional(v.string()),
    accessToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    tokenType: v.optional(v.string()),
    scope: v.optional(v.string()),
    idToken: v.optional(v.string()),
    sessionState: v.optional(v.string()),
    emailVerified: v.optional(v.string()),
    // Password provider fields
    secret: v.optional(v.string()),
  })
    .index("by_user_and_provider", ["userId", "provider"])
    .index("by_provider_and_account_id", ["provider", "providerAccountId"]),

  authVerificationCodes: defineTable({
    accountId: v.id("authAccounts"),
    provider: v.string(),
    code: v.string(),
    expirationTime: v.number(),
  })
    .index("by_account_and_provider", ["accountId", "provider"])
    .index("by_code", ["code"]),

  authRateLimits: defineTable({
    identifier: v.string(),
    lastAttempt: v.number(),
    attempts: v.number(),
  }).index("by_identifier", ["identifier"]),
};
