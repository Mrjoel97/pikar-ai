import { v } from "convex/values";
import { internalMutation, mutation, query, action } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// Create a new experiment with variants
export const createExperiment = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    hypothesis: v.string(),
    goal: v.union(v.literal("opens"), v.literal("clicks"), v.literal("conversions")),
    variants: v.array(v.object({
      variantKey: v.string(),
      name: v.string(),
      subject: v.string(),
      body: v.string(),
      buttons: v.optional(v.array(v.object({ text: v.string(), url: v.string() }))),
      trafficSplit: v.number(),
    })),
    configuration: v.object({
      confidenceLevel: v.number(),
      minimumSampleSize: v.number(),
      durationDays: v.number(),
      autoDeclareWinner: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("User not found");

    // Validate traffic splits sum to 100
    const totalSplit = args.variants.reduce((sum, v) => sum + v.trafficSplit, 0);
    if (Math.abs(totalSplit - 100) > 0.01) {
      throw new Error("Traffic splits must sum to 100%");
    }

    // Create experiment
    const experimentId = await ctx.db.insert("experiments", {
      businessId: args.businessId,
      name: args.name,
      hypothesis: args.hypothesis,
      goal: args.goal,
      status: "draft",
      createdBy: user._id,
      configuration: args.configuration,
      createdAt: Date.now(),
    });

    // Create variants
    for (const variant of args.variants) {
      await ctx.db.insert("experimentVariants", {
        experimentId,
        variantKey: variant.variantKey,
        name: variant.name,
        subject: variant.subject,
        body: variant.body,
        buttons: variant.buttons,
        trafficSplit: variant.trafficSplit,
        metrics: {
          sent: 0,
          opened: 0,
          clicked: 0,
          converted: 0,
          revenue: 0,
        },
      });
    }

    // Audit log
    await ctx.runMutation(internal.audit.write, {
      businessId: args.businessId,
      action: "experiment_created",
      entityType: "experiment",
      entityId: String(experimentId),
      details: { name: args.name, variantCount: args.variants.length },
    });

    return experimentId;
  },
});

// Update experiment status
export const updateExperimentStatus = mutation({
  args: {
    experimentId: v.id("experiments"),
    status: v.union(
      v.literal("draft"),
      v.literal("running"),
      v.literal("paused"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const experiment = await ctx.db.get(args.experimentId);
    if (!experiment) throw new Error("Experiment not found");

    const updates: any = { status: args.status };

    if (args.status === "running" && experiment.status === "draft") {
      updates.startedAt = Date.now();
    } else if (args.status === "completed") {
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.experimentId, updates);

    // Audit log
    await ctx.runMutation(internal.audit.write, {
      businessId: experiment.businessId,
      action: "experiment_status_changed",
      entityType: "experiment",
      entityId: String(args.experimentId),
      details: { oldStatus: experiment.status, newStatus: args.status },
    });

    return { success: true };
  },
});

// List experiments for a business
export const listExperiments = query({
  args: {
    businessId: v.id("businesses"),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("running"),
      v.literal("paused"),
      v.literal("completed")
    )),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("experiments")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc");

    const experiments = await query.collect();

    // Filter by status if provided
    const filtered = args.status
      ? experiments.filter((e) => e.status === args.status)
      : experiments;

    return filtered;
  },
});

// Get experiment with variants
export const getExperimentById = query({
  args: { experimentId: v.id("experiments") },
  handler: async (ctx, args) => {
    const experiment = await ctx.db.get(args.experimentId);
    if (!experiment) return null;

    const variants = await ctx.db
      .query("experimentVariants")
      .withIndex("by_experiment", (q) => q.eq("experimentId", args.experimentId))
      .collect();

    return { ...experiment, variants };
  },
});

// Record experiment result event
export const recordResult = mutation({
  args: {
    experimentId: v.id("experiments"),
    variantId: v.id("experimentVariants"),
    recipientEmail: v.string(),
    event: v.union(
      v.literal("sent"),
      v.literal("opened"),
      v.literal("clicked"),
      v.literal("converted")
    ),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Insert result record
    await ctx.db.insert("experimentResults", {
      experimentId: args.experimentId,
      variantId: args.variantId,
      recipientEmail: args.recipientEmail,
      event: args.event,
      timestamp: Date.now(),
      metadata: args.metadata,
    });

    // Update variant metrics
    const variant = await ctx.db.get(args.variantId);
    if (!variant) return;

    const metrics = { ...variant.metrics };
    if (args.event === "sent") metrics.sent++;
    else if (args.event === "opened") metrics.opened++;
    else if (args.event === "clicked") metrics.clicked++;
    else if (args.event === "converted") metrics.converted++;

    await ctx.db.patch(args.variantId, { metrics });

    return { success: true };
  },
});

// Calculate real-time results
export const calculateResults = query({
  args: { experimentId: v.id("experiments") },
  handler: async (ctx, args) => {
    const variants = await ctx.db
      .query("experimentVariants")
      .withIndex("by_experiment", (q) => q.eq("experimentId", args.experimentId))
      .collect();

    return variants.map((v) => ({
      variantId: v._id,
      variantKey: v.variantKey,
      name: v.name,
      metrics: v.metrics,
      openRate: v.metrics.sent > 0 ? (v.metrics.opened / v.metrics.sent) * 100 : 0,
      clickRate: v.metrics.sent > 0 ? (v.metrics.clicked / v.metrics.sent) * 100 : 0,
      conversionRate: v.metrics.sent > 0 ? (v.metrics.converted / v.metrics.sent) * 100 : 0,
    }));
  },
});

// Declare winner manually or automatically
export const declareWinner = mutation({
  args: {
    experimentId: v.id("experiments"),
    winnerVariantId: v.id("experimentVariants"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const experiment = await ctx.db.get(args.experimentId);
    if (!experiment) throw new Error("Experiment not found");

    await ctx.db.patch(args.experimentId, {
      status: "completed",
      winnerVariantId: args.winnerVariantId,
      completedAt: Date.now(),
    });

    // Audit log
    await ctx.runMutation(internal.audit.write, {
      businessId: experiment.businessId,
      action: "experiment_winner_declared",
      entityType: "experiment",
      entityId: String(args.experimentId),
      details: { winnerVariantId: String(args.winnerVariantId) },
    });

    return { success: true };
  },
});

// Internal query for getting experiment by ID
export const getExperimentByIdInternal = internalMutation({
  args: { experimentId: v.id("experiments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.experimentId);
  },
});