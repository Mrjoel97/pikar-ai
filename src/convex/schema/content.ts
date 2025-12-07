import { defineTable } from "convex/server";
import { v } from "convex/values";

export const contentSchema = {
  contentCapsules: defineTable({
    businessId: v.id("businesses"),
    title: v.string(),
    content: v.string(),
    type: v.string(),
    status: v.string(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"]),

  brands: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    colors: v.optional(v.any()),
    fonts: v.optional(v.any()),
    guidelines: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"]),

  brandAssets: defineTable({
    brandId: v.id("brands"),
    businessId: v.id("businesses"),
    name: v.string(),
    type: v.string(),
    url: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_brand", ["brandId"])
    .index("by_business", ["businessId"]),
};
