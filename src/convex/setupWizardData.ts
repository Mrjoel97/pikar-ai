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
      return existing._id;
    }

    const setupId = await ctx.db.insert("setupProgress", {
      businessId: args.businessId,
      userId: args.userId,
      currentStep: 0,
      progress: 0,
      steps: [
        { id: "business-profile", title: "Business Profile", completed: false },
        { id: "brand-identity", title: "Brand Identity", completed: false },
        { id: "social-media", title: "Social Media", completed: false },
        { id: "email-setup", title: "Email Setup", completed: false },
        { id: "ai-agent", title: "AI Agent", completed: false },
        { id: "templates", title: "Template Selection", completed: false },
        { id: "review", title: "Review & Launch", completed: false },
      ],
      data: {},
      completedAt: undefined,
    });

    return setupId;
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
      progress,
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
  args: { setupId: v.id("setupProgress") },
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
      completedAt: Date.now(),
      progress: 100,
    });

    await ctx.db.patch(setup.businessId, {
      onboardingCompleted: true,
    });

    return { success: true };
  },
});