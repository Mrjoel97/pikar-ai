import { v } from "convex/values";
import { internalMutation, mutation, query, action } from "./_generated/server";
import { internal, api } from "./_generated/api";
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
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", identity.email!))
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
  handler: async (ctx: any, args) => {
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
  handler: async (ctx: any, args) => {
    let query = ctx.db
      .query("experiments")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId))
      .order("desc");

    const experiments = await query.collect();

    // Filter by status if provided
    const filtered = args.status
      ? experiments.filter((e: any) => e.status === args.status)
      : experiments;

    return filtered;
  },
});

// Get experiment with variants
export const getExperimentById = query({
  args: { experimentId: v.id("experiments") },
  handler: async (ctx: any, args) => {
    const experiment = await ctx.db.get(args.experimentId);
    if (!experiment) return null;

    const variants = await ctx.db
      .query("experimentVariants")
      .withIndex("by_experiment", (q: any) => q.eq("experimentId", args.experimentId))
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
  handler: async (ctx: any, args) => {
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
  handler: async (ctx: any, args) => {
    const variants = await ctx.db
      .query("experimentVariants")
      .withIndex("by_experiment", (q: any) => q.eq("experimentId", args.experimentId))
      .collect();

    return variants.map((v: any) => ({
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
  handler: async (ctx: any, args) => {
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
  handler: async (ctx: any, args) => {
    return await ctx.db.get(args.experimentId);
  },
});

// Statistical significance calculation using Z-test
export const calculateStatisticalSignificance = query({
  args: { experimentId: v.id("experiments") },
  handler: async (ctx: any, args) => {
    const experiment = await ctx.db.get(args.experimentId);
    if (!experiment) return null;

    const variants = await ctx.db
      .query("experimentVariants")
      .withIndex("by_experiment", (q: any) => q.eq("experimentId", args.experimentId))
      .collect();

    if (variants.length < 2) return null;

    // Calculate conversion rates and sample sizes
    const stats = variants.map((v: any) => ({
      variantId: v._id,
      variantKey: v.variantKey,
      name: v.name,
      sampleSize: v.metrics.sent,
      conversions: v.metrics.converted,
      conversionRate: v.metrics.sent > 0 ? v.metrics.converted / v.metrics.sent : 0,
    }));

    // Find control (first variant) and compare others
    const control = stats[0];
    const comparisons = stats.slice(1).map((variant: any) => {
      const p1 = control.conversionRate;
      const p2 = variant.conversionRate;
      const n1 = control.sampleSize;
      const n2 = variant.sampleSize;

      // Pooled proportion
      const pooledP = (control.conversions + variant.conversions) / (n1 + n2);
      
      // Standard error
      const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2));
      
      // Z-score
      const zScore = se > 0 ? (p2 - p1) / se : 0;
      
      // P-value (two-tailed test)
      const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));
      
      // Confidence interval (95%)
      const diff = p2 - p1;
      const ciMargin = 1.96 * se;
      const confidenceInterval = {
        lower: diff - ciMargin,
        upper: diff + ciMargin,
      };

      // Statistical significance at 95% confidence
      const isSignificant = pValue < 0.05;
      
      // Relative improvement
      const relativeImprovement = p1 > 0 ? ((p2 - p1) / p1) * 100 : 0;

      return {
        variantId: variant.variantId,
        variantKey: variant.variantKey,
        name: variant.name,
        zScore,
        pValue,
        confidenceInterval,
        isSignificant,
        relativeImprovement,
        sampleSize: n2,
        conversionRate: p2,
      };
    });

    return {
      control: {
        variantId: control.variantId,
        variantKey: control.variantKey,
        name: control.name,
        sampleSize: control.sampleSize,
        conversionRate: control.conversionRate,
      },
      comparisons,
      overallSignificance: comparisons.some((c: any) => c.isSignificant),
    };
  },
});

// Helper function: Normal CDF approximation
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

// Calculate required sample size
export const calculateSampleSize = query({
  args: {
    baselineRate: v.number(),
    minimumDetectableEffect: v.number(),
    confidenceLevel: v.number(),
    statisticalPower: v.number(),
  },
  handler: async (ctx: any, args) => {
    const alpha = 1 - args.confidenceLevel / 100;
    const beta = 1 - args.statisticalPower / 100;
    
    const p1 = args.baselineRate / 100;
    const p2 = p1 * (1 + args.minimumDetectableEffect / 100);
    
    // Z-scores for alpha and beta
    const zAlpha = getZScore(1 - alpha / 2);
    const zBeta = getZScore(1 - beta);
    
    // Sample size calculation
    const numerator = Math.pow(zAlpha + zBeta, 2) * (p1 * (1 - p1) + p2 * (1 - p2));
    const denominator = Math.pow(p2 - p1, 2);
    
    const sampleSizePerVariant = Math.ceil(numerator / denominator);
    
    return {
      sampleSizePerVariant,
      totalSampleSize: sampleSizePerVariant * 2,
      estimatedDays: Math.ceil(sampleSizePerVariant / 100), // Assuming 100 emails/day
    };
  },
});

// Helper function: Get Z-score for probability
function getZScore(p: number): number {
  // Approximation of inverse normal CDF
  if (p === 0.5) return 0;
  if (p < 0.5) return -getZScore(1 - p);
  
  const t = Math.sqrt(-2 * Math.log(1 - p));
  const c0 = 2.515517;
  const c1 = 0.802853;
  const c2 = 0.010328;
  const d1 = 1.432788;
  const d2 = 0.189269;
  const d3 = 0.001308;
  
  return t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t);
}

// Automated winner determination with statistical validation
export const determineWinner: any = action({
  args: { experimentId: v.id("experiments") },
  handler: async (ctx: any, args) => {
    const experiment = await ctx.runQuery(api.experiments.getExperimentById, {
      experimentId: args.experimentId,
    });

    if (!experiment) {
      throw new Error("Experiment not found");
    }

    const significance: any = await ctx.runQuery(api.experiments.calculateStatisticalSignificance, {
      experimentId: args.experimentId,
    });

    if (!significance) {
      return {
        isSignificant: false,
        message: "Not enough data for statistical analysis",
      };
    }

    // Check if minimum sample size is met
    const config = experiment.configuration;
    const allVariantsMeetMinimum = [significance.control, ...significance.comparisons].every(
      (v) => v.sampleSize >= config.minimumSampleSize
    );

    if (!allVariantsMeetMinimum) {
      return {
        isSignificant: false,
        message: "Minimum sample size not reached",
        progress: Math.min(
          ...significance.comparisons.map((c: any) => (c.sampleSize / config.minimumSampleSize) * 100)
        ),
      };
    }

    // Find best performing variant
    const allVariants = [significance.control, ...significance.comparisons];
    const bestVariant = allVariants.reduce((best, current) =>
      current.conversionRate > best.conversionRate ? current : best
    );

    // Check if winner is statistically significant
    const winnerComparison = significance.comparisons.find(
      (c: any) => c.variantId === bestVariant.variantId
    );

    const isSignificant = winnerComparison ? winnerComparison.isSignificant : false;

    if (isSignificant && experiment.configuration.autoDeclareWinner) {
      // Auto-declare winner
      await ctx.runMutation(api.experiments.declareWinner, {
        experimentId: args.experimentId,
        winnerVariantId: bestVariant.variantId,
      });
    }

    return {
      isSignificant,
      winnerId: bestVariant.variantId,
      bestVariantKey: bestVariant.variantKey,
      conversionRate: bestVariant.conversionRate * 100,
      relativeImprovement: winnerComparison?.relativeImprovement || 0,
      pValue: winnerComparison?.pValue || 1,
      message: isSignificant
        ? `Winner: ${bestVariant.name} with ${(bestVariant.conversionRate * 100).toFixed(2)}% conversion rate`
        : "No statistically significant winner yet",
    };
  },
});

// Add new mutation to link experiments with email campaigns
export const linkExperimentToCampaign = mutation({
  args: {
    experimentId: v.id("experiments"),
    campaignId: v.id("emails"),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const experiment = await ctx.db.get(args.experimentId);
    if (!experiment) throw new Error("Experiment not found");

    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");

    // Update campaign with experiment reference
    await ctx.db.patch(args.campaignId, {
      experimentId: args.experimentId,
    });

    return { success: true };
  },
});

// Add new query to get experiments for a campaign
export const getExperimentForCampaign = query({
  args: { campaignId: v.id("emails") },
  handler: async (ctx: any, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign || !campaign.experimentId) return null;

    const experiment = await ctx.db.get(campaign.experimentId as Id<"experiments">);
    if (!experiment) return null;

    const variants = await ctx.db
      .query("experimentVariants")
      .withIndex("by_experiment", (q: any) => q.eq("experimentId", experiment._id))
      .collect();

    return { ...experiment, variants };
  },
});

/**
 * Get A/B test results with detailed analysis
 */
export const getABTestResults = query({
  args: {
    experimentId: v.id("experiments"),
  },
  handler: async (ctx, args) => {
    const experiment = await ctx.db.get(args.experimentId);
    if (!experiment) throw new Error("Experiment not found");

    const variants = await ctx.db
      .query("experimentVariants")
      .withIndex("by_experiment", (q) => q.eq("experimentId", args.experimentId))
      .collect();

    // Calculate detailed metrics for each variant
    const results = variants.map((variant) => {
      const conversionRate =
        variant.metrics.sent > 0
          ? (variant.metrics.converted / variant.metrics.sent) * 100
          : 0;
      const clickRate =
        variant.metrics.sent > 0
          ? (variant.metrics.clicked / variant.metrics.sent) * 100
          : 0;

      return {
        variantKey: variant.variantKey,
        name: variant.name,
        sent: variant.metrics.sent,
        opened: variant.metrics.opened,
        clicked: variant.metrics.clicked,
        converted: variant.metrics.converted,
        conversionRate: Math.round(conversionRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
        revenue: variant.metrics.revenue || 0,
      };
    });

    // Determine winner
    const winner = results.reduce((best, current) =>
      current.conversionRate > best.conversionRate ? current : best
    );

    return {
      experimentId: args.experimentId,
      status: experiment.status,
      results,
      winner: winner.variantKey,
      totalSent: results.reduce((sum, r) => sum + r.sent, 0),
      totalConverted: results.reduce((sum, r) => sum + r.converted, 0),
    };
  },
});

/**
 * Analyze experiment performance over time
 */
export const analyzeExperiment = query({
  args: {
    experimentId: v.id("experiments"),
  },
  handler: async (ctx, args) => {
    const experiment = await ctx.db.get(args.experimentId);
    if (!experiment) throw new Error("Experiment not found");

    const variants = await ctx.db
      .query("experimentVariants")
      .withIndex("by_experiment", (q) => q.eq("experimentId", args.experimentId))
      .collect();

    // Calculate confidence intervals
    const analysis = variants.map((variant) => {
      const conversionRate =
        variant.metrics.sent > 0
          ? variant.metrics.converted / variant.metrics.sent
          : 0;

      // Simple confidence interval calculation (95%)
      const standardError = Math.sqrt(
        (conversionRate * (1 - conversionRate)) / variant.metrics.sent
      );
      const marginOfError = 1.96 * standardError;

      return {
        variantKey: variant.variantKey,
        conversionRate: Math.round(conversionRate * 10000) / 100,
        confidenceInterval: {
          lower: Math.max(0, Math.round((conversionRate - marginOfError) * 10000) / 100),
          upper: Math.min(100, Math.round((conversionRate + marginOfError) * 10000) / 100),
        },
        sampleSize: variant.metrics.sent,
        isSignificant: variant.metrics.sent >= (experiment.configuration?.minimumSampleSize || 100),
      };
    });

    return {
      experimentId: args.experimentId,
      analysis,
      recommendation: analysis.every((a) => a.isSignificant)
        ? "Sufficient data collected for decision"
        : "Continue collecting data for statistical significance",
    };
  },
});