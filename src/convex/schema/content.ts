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

  learningCourses: defineTable({
    businessId: v.optional(v.id("businesses")),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    duration: v.number(),
    modules: v.array(v.any()),
    isPublished: v.boolean(),
    createdBy: v.optional(v.id("users")),
    availableTiers: v.optional(v.array(v.string())),
    totalLessons: v.optional(v.number()),
    quizScores: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_category", ["category"]),

  courseProgress: defineTable({
    userId: v.id("users"),
    courseId: v.id("learningCourses"),
    completedLessons: v.array(v.string()),
    progressPercentage: v.number(),
    lastAccessedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_course", ["userId", "courseId"]),

  courseLessons: defineTable({
    courseId: v.id("learningCourses"),
    title: v.string(),
    content: v.string(),
    order: v.number(),
    duration: v.number(),
    videoUrl: v.optional(v.string()),
    resources: v.optional(v.array(v.any())),
    createdAt: v.number(),
  })
    .index("by_course", ["courseId"]),
};