import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Add mitigation strategy to a risk
 */
export const addMitigation = mutation({
  args: {
    riskId: v.id("riskRegister"),
    strategy: v.string(),
    owner: v.id("users"),
    targetDate: v.number(),
    budget: v.optional(v.number()),
    expectedReduction: v.number(), // Percentage reduction in risk score
  },
  handler: async (ctx, args) => {
    const risk = await ctx.db.get(args.riskId);
    if (!risk) throw new Error("Risk not found");

    await ctx.db.patch(args.riskId, {
      mitigation: args.strategy,
      ownerId: args.owner,
      mitigationDeadline: args.targetDate,
      status: "assessed",
      updatedAt: Date.now(),
    });

    // Create a task for mitigation tracking
    await ctx.db.insert("tasks", {
      businessId: risk.businessId,
      title: `Mitigate: ${risk.title}`,
      description: args.strategy,
      priority: risk.riskScore > 15 ? "high" : risk.riskScore > 9 ? "medium" : "low",
      urgent: risk.riskScore > 15,
      status: "todo",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      dueDate: args.targetDate,
    });

    return args.riskId;
  },
});

/**
 * Track mitigation progress
 */
export const updateMitigationProgress = mutation({
  args: {
    riskId: v.id("riskRegister"),
    progressNotes: v.string(),
    newLikelihood: v.optional(v.number()),
    newImpact: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const risk = await ctx.db.get(args.riskId);
    if (!risk) throw new Error("Risk not found");

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.newLikelihood !== undefined) {
      updates.probability = args.newLikelihood;
      updates.riskScore = args.newLikelihood * (args.newImpact ?? risk.impact);
    }

    if (args.newImpact !== undefined) {
      updates.impact = args.newImpact;
      updates.riskScore = (args.newLikelihood ?? risk.probability) * args.newImpact;
    }

    // If risk score is significantly reduced, mark as mitigated
    if (updates.riskScore && updates.riskScore < 6) {
      updates.status = "mitigated";
    }

    await ctx.db.patch(args.riskId, updates);

    // Log the progress
    await ctx.db.insert("audit_logs", {
      businessId: risk.businessId,
      action: "risk_mitigation_update",
      entityType: "risk",
      entityId: args.riskId,
      details: {
        notes: args.progressNotes,
        oldScore: risk.riskScore,
        newScore: updates.riskScore,
      },
      createdAt: Date.now(),
    });

    return args.riskId;
  },
});

/**
 * Get mitigation effectiveness metrics
 */
export const getMitigationMetrics = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const risks = await ctx.db
      .query("riskRegister")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const totalRisks = risks.length;
    const mitigatedRisks = risks.filter((r) => r.status === "mitigated").length;
    const activeRisks = risks.filter((r) => r.status !== "closed" && r.status !== "mitigated").length;

    const avgRiskScore = risks.reduce((sum, r) => sum + r.riskScore, 0) / totalRisks || 0;
    const highRisks = risks.filter((r) => r.riskScore > 15).length;

    return {
      totalRisks,
      mitigatedRisks,
      activeRisks,
      mitigationRate: totalRisks > 0 ? (mitigatedRisks / totalRisks) * 100 : 0,
      avgRiskScore,
      highRisks,
    };
  },
});
