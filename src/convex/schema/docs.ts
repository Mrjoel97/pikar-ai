import { defineTable } from "convex/server";
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
    .index("by_published", ["isPublished"]),

  docsVideos: defineTable({
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.optional(v.string()),
    url: v.string(),
    thumbnailUrl: v.optional(v.string()),
    duration: v.optional(v.number()),
    isPublished: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_published", ["isPublished"]),
};
