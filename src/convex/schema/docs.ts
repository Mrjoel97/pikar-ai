import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const docsSchema = {
  docsProposals: defineTable({
    businessId: v.id("businesses"),
    title: v.string(),
    slug: v.string(),
    contentMarkdown: v.string(),
    source: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_business", ["businessId"]),

  docsPages: defineTable({
    businessId: v.id("businesses"),
    title: v.string(),
    slug: v.string(),
    contentMarkdown: v.string(),
    isPublished: v.boolean(),
    lastEditedBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_slug", ["businessId", "slug"]),

  docsFaqs: defineTable({
    businessId: v.id("businesses"),
    question: v.string(),
    answer: v.string(),
    category: v.string(),
    isPublished: v.boolean(),
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_published", ["businessId", "isPublished"]),

  docsVideos: defineTable({
    businessId: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    videoUrl: v.string(),
    thumbnail: v.optional(v.string()),
    duration: v.optional(v.string()),
    category: v.optional(v.string()),
    tier: v.optional(v.string()),
    order: v.optional(v.number()),
    isPublished: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tier", ["tier"])
    .index("by_business", ["businessId"]),
};