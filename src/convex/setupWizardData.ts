import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getSetupProgress = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const setup = await ctx.db
      .query("setupProgress")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .first();

    return setup;
  },
});

export const initializeSetup = mutation({
  args: {
    businessId: v.id("businesses"),
    userId: v.id("users"),
    stepIndex: v.number(),
    completedSteps: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db
      .query("setupProgress")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        currentStep: args.stepIndex,
        completedSteps: args.completedSteps,
        // progress: Math.round((args.completedSteps.length / 5) * 100), // Removed
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("setupProgress", {
        businessId: args.businessId,
        currentStep: args.stepIndex,
        completedSteps: args.completedSteps,
        // progress: 0, // Removed
        updatedAt: Date.now(),
        isCompleted: false, // Added required field
      });
    }

    // Update business status
    await ctx.db.patch(args.businessId, {
      // onboardingCompleted: true, // Removed as it's not in schema
    });
    
    return existing ? existing._id : null;
  },
});

export const completeStep = mutation({
  args: {
    setupId: v.id("setupProgress"),
    stepId: v.string(),
    stepData: v.any(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const setup = await ctx.db.get(args.setupId);
    if (!setup) {
      throw new Error("Setup not found");
    }

    const updatedSteps = (setup.steps || []).map((step: any) =>
      step.id === args.stepId ? { ...step, completed: true } : step
    );

    const completedCount = updatedSteps.filter((s: any) => s.completed).length;
    const progress = (completedCount / updatedSteps.length) * 100;

    const updatedData = {
      ...setup.data,
      [args.stepId]: args.stepData,
    };

    await ctx.db.patch(args.setupId, {
      steps: updatedSteps,
      // progress,
      data: updatedData,
      currentStep: setup.currentStep + 1,
    });

    const allCompleted = updatedSteps.every((s: any) => s.completed);
    if (allCompleted) {
      await ctx.db.patch(args.setupId, {
        completedAt: Date.now(),
      });
    }

    return { success: true, allCompleted };
  },
});

export const updateSetupData = mutation({
  args: {
    setupId: v.id("setupProgress"),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.setupId, {
      data: args.data,
    });

    return { success: true };
  },
});

export const skipSetup = mutation({
  args: { 
    setupId: v.id("setupProgress"),
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const setup = await ctx.db.get(args.setupId);
    if (!setup) {
      throw new Error("Setup not found");
    }

    await ctx.db.patch(args.setupId, {
      // progress: 100, // Removed
      isCompleted: true,
      updatedAt: Date.now(),
    });

    // Update business status
    await ctx.db.patch(args.businessId, {
      // onboardingCompleted: true, // Removed as it's not in schema
    });
    
    return { success: true };
  },
});