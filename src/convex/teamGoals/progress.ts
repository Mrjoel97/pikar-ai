import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// Create a milestone for a key result
export const createMilestone = mutation({
  args: {
    keyResultId: v.id("keyResults"),
    title: v.string(),
    description: v.optional(v.string()),
    targetDate: v.number(),
    targetValue: v.number(),
  },
  handler: async (ctx, args) => {
    const milestoneId = await ctx.db.insert("milestones", {
      keyResultId: args.keyResultId,
      title: args.title,
      description: args.description,
      targetDate: args.targetDate,
      targetValue: args.targetValue,
      completed: false,
      createdAt: Date.now(),
    });

    return milestoneId;
  },
});

// Mark milestone as completed
export const completeMilestone = mutation({
  args: {
    milestoneId: v.id("milestones"),
    actualValue: v.number(),
    completedAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.milestoneId, {
      completed: true,
      actualValue: args.actualValue,
      completedAt: args.completedAt,
    });

    return { success: true };
  },
});

// Get progress analytics for an objective
export const getObjectiveProgressAnalytics = query({
  args: { objectiveId: v.id("objectives") },
  handler: async (ctx, args) => {
    const objective = await ctx.db.get(args.objectiveId);
    if (!objective) return null;

    const keyResults = await ctx.db
      .query("keyResults")
      .withIndex("by_objective", (q) => q.eq("objectiveId", args.objectiveId))
      .collect();

    // Get all updates for all key results
    const allUpdates = await Promise.all(
      keyResults.map(async (kr) => {
        const updates = await ctx.db
          .query("keyResultUpdates")
          .withIndex("by_key_result", (q) => q.eq("keyResultId", kr._id))
          .collect();
        return updates.map((u) => ({ ...u, keyResultTitle: kr.title }));
      })
    );

    const flatUpdates = allUpdates.flat().sort((a, b) => a.createdAt - b.createdAt);

    // Calculate velocity (progress per week)
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const recentUpdates = flatUpdates.filter((u) => u.createdAt >= oneWeekAgo);
    
    const weeklyProgress = recentUpdates.reduce(
      (sum, update) => sum + (update.newValue - update.previousValue),
      0
    );

    // Calculate health score
    const onTrackKRs = keyResults.filter((kr) => kr.progress >= 70).length;
    const atRiskKRs = keyResults.filter(
      (kr) => kr.progress >= 40 && kr.progress < 70
    ).length;
    const offTrackKRs = keyResults.filter((kr) => kr.progress < 40).length;

    const healthScore = keyResults.length > 0
      ? Math.round(
          ((onTrackKRs * 100 + atRiskKRs * 60 + offTrackKRs * 20) /
            keyResults.length)
        )
      : 0;

    // Get milestones
    const allMilestones = await Promise.all(
      keyResults.map(async (kr) => {
        const milestones = await ctx.db
          .query("milestones")
          .withIndex("by_key_result", (q) => q.eq("keyResultId", kr._id))
          .collect();
        return milestones.map((m) => ({ ...m, keyResultTitle: kr.title }));
      })
    );

    const flatMilestones = allMilestones.flat();
    const completedMilestones = flatMilestones.filter((m) => m.completed).length;
    const totalMilestones = flatMilestones.length;

    return {
      objective,
      keyResults,
      progressHistory: flatUpdates,
      weeklyProgress,
      healthScore,
      health:
        healthScore >= 70 ? "on-track" : healthScore >= 40 ? "at-risk" : "off-track",
      milestones: {
        completed: completedMilestones,
        total: totalMilestones,
        percentage: totalMilestones > 0
          ? Math.round((completedMilestones / totalMilestones) * 100)
          : 0,
      },
      keyResultBreakdown: {
        onTrack: onTrackKRs,
        atRisk: atRiskKRs,
        offTrack: offTrackKRs,
      },
    };
  },
});

// Get progress trends for a business
export const getBusinessProgressTrends = query({
  args: {
    businessId: v.id("businesses"),
    timeframe: v.optional(v.union(v.literal("week"), v.literal("month"), v.literal("quarter"))),
  },
  handler: async (ctx, args) => {
    const timeframe = args.timeframe || "month";
    const now = Date.now();
    const timeframeMs = {
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      quarter: 90 * 24 * 60 * 60 * 1000,
    }[timeframe];

    const startDate = now - timeframeMs;

    const objectives = await ctx.db
      .query("objectives")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const activeObjectives = objectives.filter((obj) => obj.status === "active");

    // Get all key results for active objectives
    const allKeyResults = await Promise.all(
      activeObjectives.map(async (obj) => {
        const krs = await ctx.db
          .query("keyResults")
          .withIndex("by_objective", (q) => q.eq("objectiveId", obj._id))
          .collect();
        return krs;
      })
    );

    const flatKeyResults = allKeyResults.flat();

    // Get updates within timeframe
    const allUpdates = await Promise.all(
      flatKeyResults.map(async (kr) => {
        const updates = await ctx.db
          .query("keyResultUpdates")
          .withIndex("by_key_result", (q) => q.eq("keyResultId", kr._id))
          .collect();
        return updates.filter((u) => u.createdAt >= startDate);
      })
    );

    const flatUpdates = allUpdates.flat().sort((a, b) => a.createdAt - b.createdAt);

    // Calculate average progress
    const avgProgress = activeObjectives.length > 0
      ? Math.round(
          activeObjectives.reduce((sum, obj) => sum + obj.progress, 0) /
            activeObjectives.length
        )
      : 0;

    return {
      totalObjectives: activeObjectives.length,
      averageProgress: avgProgress,
      totalKeyResults: flatKeyResults.length,
      updatesCount: flatUpdates.length,
      progressHistory: flatUpdates,
      objectivesByCategory: {
        company: activeObjectives.filter((o) => o.category === "company").length,
        department: activeObjectives.filter((o) => o.category === "department").length,
        team: activeObjectives.filter((o) => o.category === "team").length,
        individual: activeObjectives.filter((o) => o.category === "individual").length,
      },
    };
  },
});
