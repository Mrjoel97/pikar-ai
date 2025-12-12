import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get sprint velocity metrics
 */
export const getSprintVelocity = query({
  args: {
    businessId: v.id("businesses"),
    sprints: v.optional(v.number()), // Number of sprints to analyze
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const sprints = args.sprints || 6;
    const sprintDuration = 14; // 2 weeks in days
    const now = Date.now();

    // Get goal updates for velocity calculation
    const updates = await ctx.db
      .query("goalUpdates")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .take(500);

    // Group by sprint periods
    const sprintData = [];
    for (let i = 0; i < sprints; i++) {
      const sprintEnd = now - i * sprintDuration * 24 * 60 * 60 * 1000;
      const sprintStart = sprintEnd - sprintDuration * 24 * 60 * 60 * 1000;

      const sprintUpdates = updates.filter(
        (u) => u.timestamp >= sprintStart && u.timestamp < sprintEnd
      );

      const velocity = sprintUpdates.reduce(
        (sum, u) => sum + (u.newValue - u.previousValue),
        0
      );

      sprintData.push({
        sprint: `Sprint ${sprints - i}`,
        velocity: Math.round(velocity),
        completedTasks: sprintUpdates.length,
        startDate: sprintStart,
        endDate: sprintEnd,
      });
    }

    // Calculate average velocity
    const avgVelocity =
      sprintData.reduce((sum, s) => sum + s.velocity, 0) / sprints;

    return {
      sprints: sprintData.reverse(),
      averageVelocity: Math.round(avgVelocity),
      trend:
        sprintData.length > 1
          ? sprintData[0].velocity > sprintData[sprintData.length - 1].velocity
            ? "increasing"
            : "decreasing"
          : "stable",
    };
  },
});

/**
 * Get burndown data for current sprint
 */
export const getBurndownData = query({
  args: {
    businessId: v.id("businesses"),
    goalId: v.optional(v.id("teamGoals")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const sprintDuration = 14; // days
    const now = Date.now();
    const sprintStart = now - sprintDuration * 24 * 60 * 60 * 1000;

    // Get active goals
    let goals = await ctx.db
      .query("teamGoals")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(50);

    if (args.goalId) {
      const goal = await ctx.db.get(args.goalId);
      goals = goal ? [goal] : [];
    }

    const totalWork = goals.reduce((sum, g) => sum + g.targetValue, 0);
    const currentWork = goals.reduce((sum, g) => sum + g.currentValue, 0);
    const remainingWork = totalWork - currentWork;

    // Generate ideal burndown line
    const idealBurndown = [];
    const actualBurndown = [];

    for (let day = 0; day <= sprintDuration; day++) {
      const date = sprintStart + day * 24 * 60 * 60 * 1000;
      const idealRemaining = totalWork * (1 - day / sprintDuration);

      idealBurndown.push({
        day,
        date,
        remaining: Math.round(idealRemaining),
      });

      // Calculate actual remaining at this point
      const updatesUntilDate = await ctx.db
        .query("goalUpdates")
        .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
        .filter((q) => q.lte(q.field("timestamp"), date))
        .take(100);

      const completedUntilDate = updatesUntilDate.reduce(
        (sum, u) => sum + (u.newValue - u.previousValue),
        0
      );

      actualBurndown.push({
        day,
        date,
        remaining: Math.round(totalWork - completedUntilDate),
      });
    }

    return {
      totalWork,
      remainingWork,
      idealBurndown,
      actualBurndown,
      daysRemaining: sprintDuration - Math.floor((now - sprintStart) / (24 * 60 * 60 * 1000)),
    };
  },
});

/**
 * Get predictive completion date using AI
 */
export const getPredictiveCompletion = query({
  args: {
    businessId: v.id("businesses"),
    goalId: v.optional(v.id("teamGoals")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Get velocity data
    const velocity = await ctx.runQuery("analytics.teamVelocity:getSprintVelocity" as any, {
      businessId: args.businessId,
      sprints: 4,
    });

    if (!velocity) return null;

    // Get remaining work
    let goals = await ctx.db
      .query("teamGoals")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(50);

    if (args.goalId) {
      const goal = await ctx.db.get(args.goalId);
      goals = goal ? [goal] : [];
    }

    const remainingWork = goals.reduce(
      (sum, g) => sum + (g.targetValue - g.currentValue),
      0
    );

    // Predict completion based on average velocity
    const daysToComplete = Math.ceil(remainingWork / (velocity.averageVelocity / 14));
    const predictedDate = Date.now() + daysToComplete * 24 * 60 * 60 * 1000;

    // Calculate confidence based on velocity consistency
    const velocityVariance =
      velocity.sprints.reduce((sum: number, s: { velocity: number }) => {
        const diff = s.velocity - velocity.averageVelocity;
        return sum + diff * diff;
      }, 0) / velocity.sprints.length;

    const confidence = Math.max(
      50,
      Math.min(95, 100 - Math.sqrt(velocityVariance) / 10)
    );

    return {
      predictedDate,
      daysToComplete,
      confidence: Math.round(confidence),
      remainingWork,
      averageVelocity: velocity.averageVelocity,
      recommendation:
        daysToComplete > 30
          ? "Consider increasing team capacity or reducing scope"
          : daysToComplete > 14
          ? "On track for completion within a month"
          : "Excellent progress, completion expected soon",
    };
  },
});

/**
 * Get burnup data for current sprint
 */
export const getBurnupData = query({
  args: {
    businessId: v.id("businesses"),
    goalId: v.optional(v.id("teamGoals")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const sprintDuration = 14; // days
    const now = Date.now();
    const sprintStart = now - sprintDuration * 24 * 60 * 60 * 1000;

    // Get active goals
    let goals = await ctx.db
      .query("teamGoals")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(50);

    if (args.goalId) {
      const goal = await ctx.db.get(args.goalId);
      goals = goal ? [goal] : [];
    }

    const totalWork = goals.reduce((sum, g) => sum + g.targetValue, 0);
    const currentWork = goals.reduce((sum, g) => sum + g.currentValue, 0);

    // Generate burnup data (completed work over time)
    const burnupData = [];

    for (let day = 0; day <= sprintDuration; day++) {
      const date = sprintStart + day * 24 * 60 * 60 * 1000;

      // Calculate work completed by this date
      const updatesUntilDate = await ctx.db
        .query("goalUpdates")
        .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
        .filter((q) => q.lte(q.field("timestamp"), date))
        .take(100);

      const completedUntilDate = updatesUntilDate.reduce(
        (sum, u) => sum + (u.newValue - u.previousValue),
        0
      );

      burnupData.push({
        day,
        date,
        completed: Math.round(completedUntilDate),
        total: totalWork,
      });
    }

    return {
      totalWork,
      currentWork,
      burnupData,
      daysRemaining: sprintDuration - Math.floor((now - sprintStart) / (24 * 60 * 60 * 1000)),
    };
  },
});