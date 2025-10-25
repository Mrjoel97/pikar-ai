"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

// Action to generate certificate
export const getCertificate = action({
  args: {
    userId: v.id("users"),
    courseId: v.id("learningCourses"),
  },
  handler: async (ctx, args) => {
    const progress = await ctx.runQuery(api.learningContent.getCourseProgress, {
      userId: args.userId,
      courseId: args.courseId,
    });

    if (!progress || !progress.isCompleted) {
      throw new Error("Course not completed");
    }

    const course = await ctx.runQuery(api.learningContent.getCourseById, {
      courseId: args.courseId,
    });

    const user = await ctx.runQuery(api.users.currentUser, {});

    if (!user || !course) {
      throw new Error("User or course not found");
    }

    // Calculate average quiz score
    const quizScores = Object.values(progress.quizScores || {}) as number[];
    const averageScore = quizScores.length > 0
      ? quizScores.reduce((a, b) => a + b, 0) / quizScores.length
      : 0;

    // Generate certificate data
    const certificate = {
      certificateId: `CERT-${Date.now()}-${args.userId.slice(-6)}`,
      userName: user.name || user.email || "User",
      courseName: course.title,
      completedAt: progress.completedAt || Date.now(),
      averageScore: Math.round(averageScore),
      issuer: "Pikar AI Learning Hub",
      verificationUrl: `https://pikar.ai/verify/${args.userId}/${args.courseId}`,
    };

    return certificate;
  },
});
