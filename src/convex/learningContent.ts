import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Query to list courses filtered by tier
export const listCoursesByTier = query({
  args: { 
    tier: v.optional(v.union(
      v.literal("solopreneur"),
      v.literal("startup"),
      v.literal("sme"),
      v.literal("enterprise")
    ))
  },
  handler: async (ctx, args) => {
    const courses = await ctx.db.query("learningCourses").collect();
    
    if (!args.tier) {
      return courses;
    }
    
    return courses.filter(course => 
      (course.availableTiers || []).includes(args.tier!)
    );
  },
});

// Query to get user's course progress
export const getCourseProgress = query({
  args: { 
    userId: v.id("users"),
    courseId: v.optional(v.id("learningCourses"))
  },
  handler: async (ctx, args) => {
    if (args.courseId) {
      return await ctx.db
        .query("courseProgress")
        .withIndex("by_user_and_course", (q) => 
          q.eq("userId", args.userId).eq("courseId", args.courseId!)
        )
        .first();
    }
    
    return await ctx.db
      .query("courseProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Mutation to update course progress
export const updateProgress = mutation({
  args: {
    userId: v.id("users"),
    courseId: v.id("learningCourses"),
    lessonId: v.string(),
    completed: v.boolean(),
    quizScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("courseProgress")
      .withIndex("by_user_and_course", (q) => 
        q.eq("userId", args.userId).eq("courseId", args.courseId)
      )
      .first();

    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    if (existing) {
      const completedLessons = new Set(existing.completedLessons);
      if (args.completed) {
        completedLessons.add(args.lessonId);
      } else {
        completedLessons.delete(args.lessonId);
      }

      const progressPercentage = (completedLessons.size / (course.totalLessons || 1)) * 100;
      const isCompleted = progressPercentage === 100;

      await ctx.db.patch(existing._id, {
        lastAccessedAt: Date.now(),
        completedLessons: Array.from(completedLessons),
        progressPercentage,
        completedAt: isCompleted ? Date.now() : undefined,
      });
    } else {
      const completedLessons = args.completed ? [args.lessonId] : [];
      const progressPercentage = (completedLessons.length / (course.totalLessons || 1)) * 100;
      
      await ctx.db.insert("courseProgress", {
        userId: args.userId,
        courseId: args.courseId,
        lastAccessedAt: Date.now(),
        completedLessons,
        progressPercentage,
        completedAt: progressPercentage === 100 ? Date.now() : undefined,
        // ...existing.quizScores, // Removed as it's not in schema
      });
    }
  },
});

// Mutation to mark course as completed
export const completeCourse = mutation({
  args: {
    userId: v.id("users"),
    courseId: v.id("learningCourses"),
  },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("courseProgress")
      .withIndex("by_user_and_course", (q) => 
        q.eq("userId", args.userId).eq("courseId", args.courseId)
      )
      .first();

    if (!progress) {
      throw new Error("Course progress not found");
    }

    await ctx.db.patch(progress._id, {
      completedAt: Date.now(),
    });

    return progress._id;
  },
});

// Helper query to get a single course
export const getCourseById = query({
  args: { courseId: v.id("learningCourses") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.courseId);
  },
});

// Query to get all lessons for a course
export const getCourseLessons = query({
  args: { courseId: v.id("learningCourses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courseLessons")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();
  },
});