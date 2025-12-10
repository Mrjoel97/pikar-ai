import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Create a journey milestone
 */
export const createMilestone = mutation({
  args: {
    businessId: v.id("businesses"),
    initiativeId: v.id("initiatives"),
    title: v.string(),
    description: v.optional(v.string()),
    targetDate: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("blocked")
    )),
  },
  handler: async (ctx, args) => {
    const milestoneId = await ctx.db.insert("journeyMilestones", {
      businessId: args.businessId,
      initiativeId: args.initiativeId,
      title: args.title,
      description: args.description,
      targetDate: args.targetDate,
      status: args.status || "not_started",
      completedAt: null,
      createdAt: Date.now(),
    });

    return milestoneId;
  },
});

/**
 * Get journey milestones for an initiative
 */
export const getMilestones = query({
  args: {
    initiativeId: v.id("initiatives"),
  },
  handler: async (ctx, args) => {
    const milestones = await ctx.db
      .query("journeyMilestones")
      .withIndex("by_initiative", (q) => q.eq("initiativeId", args.initiativeId))
      .order("desc")
      .collect();

    return milestones;
  },
});

/**
 * Update milestone status
 */
export const updateMilestoneStatus = mutation({
  args: {
    milestoneId: v.id("journeyMilestones"),
    status: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("blocked")
    ),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      status: args.status,
    };

    if (args.status === "completed") {
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.milestoneId, updates);
    return { success: true };
  },
});

/**
 * Get journey progress summary
 */
export const getJourneyProgress = query({
  args: {
    initiativeId: v.id("initiatives"),
  },
  handler: async (ctx, args) => {
    const milestones = await ctx.db
      .query("journeyMilestones")
      .withIndex("by_initiative", (q) => q.eq("initiativeId", args.initiativeId))
      .collect();

    const total = milestones.length;
    const completed = milestones.filter((m) => m.status === "completed").length;
    const inProgress = milestones.filter((m) => m.status === "in_progress").length;
    const blocked = milestones.filter((m) => m.status === "blocked").length;

    return {
      total,
      completed,
      inProgress,
      blocked,
      notStarted: total - completed - inProgress - blocked,
      completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  },
});

/**
 * Delete a milestone
 */
export const deleteMilestone = mutation({
  args: {
    milestoneId: v.id("journeyMilestones"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.milestoneId);
    return { success: true };
  },
});

/**
 * Track milestone dependencies
 */
export const trackDependencies = mutation({
  args: {
    milestoneId: v.id("journeyMilestones"),
    dependsOn: v.array(v.id("journeyMilestones")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.milestoneId, {
      dependencies: args.dependsOn,
    });
    return { success: true };
  },
});

/**
 * Predict timeline completion
 */
export const predictCompletion = query({
  args: {
    initiativeId: v.id("initiatives"),
  },
  handler: async (ctx, args) => {
    const milestones = await ctx.db
      .query("journeyMilestones")
      .withIndex("by_initiative", (q) => q.eq("initiativeId", args.initiativeId))
      .collect();

    const completed = milestones.filter((m) => m.status === "completed").length;
    const total = milestones.length;

    if (total === 0) return null;

    const completionRate = completed / total;
    const avgTimePerMilestone = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
    const remaining = total - completed;
    const estimatedDays = Math.ceil((remaining * avgTimePerMilestone) / (24 * 60 * 60 * 1000));

    return {
      completionRate: Math.round(completionRate * 100),
      estimatedCompletionDate: Date.now() + (estimatedDays * 24 * 60 * 60 * 1000),
      estimatedDaysRemaining: estimatedDays,
      onTrack: completionRate >= 0.5,
    };
  },
});