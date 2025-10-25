import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Initialize setup wizard for a business
export const initializeSetup = mutation({
  args: {
    businessId: v.id("businesses"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if setup already exists
    const existing = await ctx.db
      .query("setupWizard")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create new setup wizard record
    const setupId = await ctx.db.insert("setupWizard", {
      businessId: args.businessId,
      userId: args.userId,
      currentStep: 0,
      completedSteps: [],
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
      status: "in_progress",
      startedAt: Date.now(),
    });

    return setupId;
  },
});

// Complete a setup step
export const completeStep = mutation({
  args: {
    setupId: v.id("setupWizard"),
    stepId: v.string(),
    stepData: v.any(),
  },
  handler: async (ctx, args) => {
    const setup = await ctx.db.get(args.setupId);
    if (!setup) throw new Error("Setup wizard not found");

    const steps = setup.steps as any[];
    const stepIndex = steps.findIndex((s: any) => s.id === args.stepId);
    
    if (stepIndex === -1) {
      throw new Error("Step not found");
    }

    // Mark step as completed
    steps[stepIndex].completed = true;

    // Update completed steps array
    const completedSteps = [...(setup.completedSteps || [])];
    if (!completedSteps.includes(args.stepId)) {
      completedSteps.push(args.stepId);
    }

    // Merge step data
    const data = { ...(setup.data || {}), [args.stepId]: args.stepData };

    // Calculate next step
    const nextIncompleteIndex = steps.findIndex((s: any, idx: number) => 
      idx > stepIndex && !s.completed
    );
    const currentStep = nextIncompleteIndex !== -1 ? nextIncompleteIndex : stepIndex + 1;

    // Check if all steps completed
    const allCompleted = steps.every((s: any) => s.completed);
    const status = allCompleted ? "completed" : "in_progress";

    await ctx.db.patch(args.setupId, {
      steps,
      completedSteps,
      currentStep,
      data,
      status,
      ...(allCompleted ? { completedAt: Date.now() } : {}),
    });

    return { success: true, allCompleted };
  },
});

// Get setup progress
export const getSetupProgress = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const setup = await ctx.db
      .query("setupWizard")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .first();

    if (!setup) {
      return null;
    }

    const steps = setup.steps as any[];
    const completedCount = steps.filter((s: any) => s.completed).length;
    const progress = (completedCount / steps.length) * 100;

    return {
      ...setup,
      progress,
      completedCount,
      totalSteps: steps.length,
    };
  },
});

// Connect integrations during setup
export const connectIntegrations = mutation({
  args: {
    setupId: v.id("setupWizard"),
    integrations: v.array(v.object({
      platform: v.string(),
      accountId: v.optional(v.string()),
      accountName: v.optional(v.string()),
      connected: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const setup = await ctx.db.get(args.setupId);
    if (!setup) throw new Error("Setup wizard not found");

    const data = setup.data || {};
    const integrationsData = {
      ...data,
      integrations: args.integrations,
    };

    await ctx.db.patch(args.setupId, {
      data: integrationsData,
    });

    return { success: true };
  },
});

// Update setup wizard data
export const updateSetupData = mutation({
  args: {
    setupId: v.id("setupWizard"),
    stepId: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const setup = await ctx.db.get(args.setupId);
    if (!setup) throw new Error("Setup wizard not found");

    const currentData = setup.data || {};
    const updatedData = {
      ...currentData,
      [args.stepId]: {
        ...(currentData[args.stepId] || {}),
        ...args.data,
      },
    };

    await ctx.db.patch(args.setupId, {
      data: updatedData,
    });

    return { success: true };
  },
});

// Skip setup wizard
export const skipSetup = mutation({
  args: {
    setupId: v.id("setupWizard"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.setupId, {
      status: "skipped",
      completedAt: Date.now(),
    });

    return { success: true };
  },
});
