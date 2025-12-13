import { v } from "convex/values";
import { query } from "../_generated/server";

export const simulateWorkflowChange = query({
  args: {
    workflowId: v.id("workflows"),
    changes: v.object({
      parallelizeSteps: v.optional(v.array(v.number())),
      removeSteps: v.optional(v.array(v.number())),
      addAutomation: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) throw new Error("Workflow not found");

    const pipeline = workflow.pipeline || [];
    const currentDuration = pipeline.length * 5000; // Assume 5s per step

    let projectedDuration = currentDuration;
    let projectedCost = pipeline.length * 10; // $10 per step

    // Simulate parallelization
    if (args.changes.parallelizeSteps && args.changes.parallelizeSteps.length > 0) {
      projectedDuration = projectedDuration * 0.6; // 40% reduction
    }

    // Simulate step removal
    if (args.changes.removeSteps && args.changes.removeSteps.length > 0) {
      const reduction = args.changes.removeSteps.length / pipeline.length;
      projectedDuration = projectedDuration * (1 - reduction);
      projectedCost = projectedCost * (1 - reduction);
    }

    // Simulate automation
    if (args.changes.addAutomation) {
      projectedDuration = projectedDuration * 0.7; // 30% reduction
      projectedCost = projectedCost * 0.8; // 20% cost reduction
    }

    return {
      current: {
        duration: currentDuration,
        cost: projectedCost / (1 - (args.changes.addAutomation ? 0.2 : 0)),
        steps: pipeline.length,
      },
      projected: {
        duration: projectedDuration,
        cost: projectedCost,
        steps: pipeline.length - (args.changes.removeSteps?.length || 0),
      },
      improvement: {
        durationReduction: ((currentDuration - projectedDuration) / currentDuration) * 100,
        costReduction: ((projectedCost / (1 - (args.changes.addAutomation ? 0.2 : 0)) - projectedCost) / (projectedCost / (1 - (args.changes.addAutomation ? 0.2 : 0)))) * 100,
      },
    };
  },
});

export const getParallelizationOpportunities = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const opportunities = workflows
      .map(w => {
        const pipeline = w.pipeline || [];
        const sequentialSteps = pipeline.filter((s: any, i: number) => {
          const nextStep = pipeline[i + 1];
          return nextStep && s.type !== "approval" && nextStep.type !== "approval";
        });

        if (sequentialSteps.length < 2) return null;

        return {
          workflowId: w._id,
          workflowName: w.name,
          parallelizableSteps: sequentialSteps.length,
          estimatedTimeReduction: sequentialSteps.length * 2000, // 2s per step
          priority: sequentialSteps.length > 5 ? "high" : sequentialSteps.length > 3 ? "medium" : "low",
        };
      })
      .filter(Boolean);

    return opportunities;
  },
});

export const getAutomationCandidates = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const candidates = workflows
      .map(w => {
        const pipeline = w.pipeline || [];
        const manualSteps = pipeline.filter((s: any) => 
          s.type === "approval" || s.type === "manual"
        );

        if (manualSteps.length === 0) return null;

        const automationScore = Math.min(100, (manualSteps.length / pipeline.length) * 100);

        return {
          workflowId: w._id,
          workflowName: w.name,
          manualSteps: manualSteps.length,
          totalSteps: pipeline.length,
          automationScore,
          estimatedSavings: manualSteps.length * 15, // $15 per manual step
          priority: automationScore > 50 ? "high" : automationScore > 30 ? "medium" : "low",
          suggestions: [
            "Replace approval steps with rule-based automation",
            "Add AI agents for decision-making",
            "Implement auto-escalation for time-sensitive tasks",
          ],
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.automationScore - a.automationScore);

    return candidates;
  },
});
