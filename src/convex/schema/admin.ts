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
    role: v.optional(v.string()),
    isVerified: v.optional(v.boolean()),
    verificationToken: v.optional(v.string()),
    resetToken: v.optional(v.string()),
    resetTokenExpires: v.optional(v.number()),
    lastLoginAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index("by_email", ["email"]),

  adminSessions: defineTable({
    adminId: v.optional(v.id("adminAuths")),
    email: v.optional(v.string()),
    token: v.string(),
    expiresAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_admin", ["adminId"]),

  agentCatalog: defineTable({
    agent_key: v.string(),
    display_name: v.string(),
    short_desc: v.string(),
    long_desc: v.string(),
    capabilities: v.array(v.string()),
    default_model: v.string(),
    active: v.boolean(),
    tier_restrictions: v.optional(v.array(v.string())),
    confidence_hint: v.optional(v.number()),
    model_routing: v.optional(v.string()),
    prompt_templates: v.optional(v.string()),
    input_schema: v.optional(v.string()),
    output_schema: v.optional(v.string()),
    prompt_template_version: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index("by_active", ["active"]),
};
