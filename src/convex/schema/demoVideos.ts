import { defineTable } from "convex/server";
import { v } from "convex/values";

export const demoVideosSchema = {
  demoVideos: defineTable({
    title: v.string(),
    url: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    duration: v.optional(v.number()),
    thumbnailUrl: v.optional(v.string()),
    views: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    createdBy: v.string(),
  }).index("by_category", ["category"]),
};
