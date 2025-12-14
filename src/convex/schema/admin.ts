import { defineTable } from "convex/server";
import { v } from "convex/values";

export const adminSchema = {
  admins: defineTable({
    email: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("super_admin"),
      v.literal("pending_senior"),
      v.literal("senior")
    ),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  adminAuths: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    salt: v.optional(v.string()),
    role: v.string(),
    isVerified: v.boolean(),
    verificationToken: v.optional(v.string()),
    resetToken: v.optional(v.string()),
    resetTokenExpires: v.optional(v.number()),
    lastLoginAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_email", ["email"]),

  adminSessions: defineTable({
    adminId: v.id("adminAuths"),
    token: v.string(),
    expiresAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_admin", ["adminId"]),
};
