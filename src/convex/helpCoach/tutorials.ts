import { v } from "convex/values";
import { query, mutation } from "../_generated/server";

// Query to list tutorials by tier
export const listTutorials = query({
  args: {
    tier: v.optional(v.union(
      v.literal("solopreneur"),
      v.literal("startup"),
      v.literal("sme"),
      v.literal("enterprise")
    )),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let tutorials = await ctx.db.query("tutorials").collect();

    if (args.tier) {
      tutorials = tutorials.filter(t => t.availableTiers.includes(args.tier!));
    }

    if (args.category) {
      tutorials = tutorials.filter(t => t.category === args.category);
    }

    return tutorials.sort((a, b) => (a.order || 0) - (b.order || 0));
  },
});

// Query to get a single tutorial with steps
export const getTutorial = query({
  args: { tutorialId: v.id("tutorials") },
  handler: async (ctx, args) => {
    const tutorial = await ctx.db.get(args.tutorialId);
    if (!tutorial) return null;

    const steps = await ctx.db
      .query("tutorialSteps")
      .withIndex("by_tutorial", (q) => q.eq("tutorialId", args.tutorialId))
      .collect();

    return {
      ...tutorial,
      steps: steps.sort((a, b) => a.stepNumber - b.stepNumber),
    };
  },
});

// Query to get user's tutorial progress
export const getTutorialProgress = query({
  args: {
    userId: v.id("users"),
    tutorialId: v.optional(v.id("tutorials")),
  },
  handler: async (ctx, args) => {
    if (args.tutorialId) {
      const tutorialId = args.tutorialId;
      return await ctx.db
        .query("tutorialProgress")
        .withIndex("by_user_and_tutorial", (q) => 
          q.eq("userId", args.userId).eq("tutorialId", tutorialId)
        )
        .first();
    }

    return await ctx.db
      .query("tutorialProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Mutation to start a tutorial
export const startTutorial = mutation({
  args: {
    userId: v.id("users"),
    tutorialId: v.id("tutorials"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tutorialProgress")
      .withIndex("by_user_and_tutorial", (q) => 
        q.eq("userId", args.userId).eq("tutorialId", args.tutorialId)
      )
      .first();

    if (existing) {
      // Reset progress
      await ctx.db.patch(existing._id, {
        currentStep: 1,
        completedSteps: [],
        isCompleted: false,
        startedAt: Date.now(),
        lastAccessedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("tutorialProgress", {
      userId: args.userId,
      tutorialId: args.tutorialId,
      currentStep: 1,
      completedSteps: [],
      isCompleted: false,
      startedAt: Date.now(),
      lastAccessedAt: Date.now(),
    });
  },
});

// Mutation to update tutorial progress
export const updateTutorialProgress = mutation({
  args: {
    userId: v.id("users"),
    tutorialId: v.id("tutorials"),
    stepNumber: v.number(),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("tutorialProgress")
      .withIndex("by_user_and_tutorial", (q) => 
        q.eq("userId", args.userId).eq("tutorialId", args.tutorialId)
      )
      .first();

    if (!progress) {
      throw new Error("Tutorial not started");
    }

    const tutorial = await ctx.db.get(args.tutorialId);
    if (!tutorial) {
      throw new Error("Tutorial not found");
    }

    const completedSteps = new Set(progress.completedSteps);
    if (args.completed) {
      completedSteps.add(args.stepNumber);
    } else {
      completedSteps.delete(args.stepNumber);
    }

    const isCompleted = completedSteps.size === tutorial.totalSteps;

    await ctx.db.patch(progress._id, {
      currentStep: args.stepNumber,
      completedSteps: Array.from(completedSteps),
      isCompleted,
      lastAccessedAt: Date.now(),
      ...(isCompleted && { completedAt: Date.now() }),
    });

    return progress._id;
  },
});

// Mutation to complete tutorial
export const completeTutorial = mutation({
  args: {
    userId: v.id("users"),
    tutorialId: v.id("tutorials"),
  },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("tutorialProgress")
      .withIndex("by_user_and_tutorial", (q) => 
        q.eq("userId", args.userId).eq("tutorialId", args.tutorialId)
      )
      .first();

    if (!progress) {
      throw new Error("Tutorial not started");
    }

    await ctx.db.patch(progress._id, {
      isCompleted: true,
      completedAt: Date.now(),
    });

    return progress._id;
  },
});
