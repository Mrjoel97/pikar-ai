import { v } from "convex/values";
import { internalMutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Auto-remediation strategies for different violation types
 */
const remediationStrategies: Record<string, (workflow: any) => any> = {
  missing_approval: (workflow) => ({
    action: "Add approval step",
    changes: {
      pipeline: [
        ...workflow.pipeline,
        {
          type: "approval",
          name: "Compliance Approval",
          assigneeRole: "compliance_officer",
          slaHours: 24,
        },
      ],
    },
  }),
  insufficient_sla: (workflow) => ({
    action: "Increase SLA to minimum requirements",
    changes: {
      pipeline: workflow.pipeline.map((step: any) =>
        step.type === "approval" && step.slaHours < 24
          ? { ...step, slaHours: 24 }
          : step
      ),
    },
  }),
  missing_role_diversity: (workflow) => ({
    action: "Add role diversity to approval steps",
    changes: {
      pipeline: workflow.pipeline.map((step: any, idx: number) =>
        step.type === "approval"
          ? {
              ...step,
              assigneeRole:
                idx === 0 ? "manager" : idx === 1 ? "director" : step.assigneeRole,
            }
          : step
      ),
    },
  }),
  critical_compliance: (workflow) => ({
    action: "Enable compliance monitoring and add audit trail",
    changes: {
      complianceMonitoring: true,
      auditTrail: true,
    },
  }),
};

export const getRemediationStrategy = query({
  args: {
    workflowId: v.id("workflows"),
    violationType: v.string(),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) throw new Error("Workflow not found");

    const strategy = remediationStrategies[args.violationType];
    if (!strategy) {
      return {
        available: false,
        message: "No automatic remediation available for this violation type",
      };
    }

    const remediation = strategy(workflow);
    return {
      available: true,
      action: remediation.action,
      changes: remediation.changes,
      preview: {
        before: workflow.pipeline?.length || 0,
        after: remediation.changes.pipeline?.length || workflow.pipeline?.length || 0,
      },
    };
  },
});

export const applyRemediation = internalMutation({
  args: {
    workflowId: v.id("workflows"),
    violationType: v.string(),
    appliedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) throw new Error("Workflow not found");

    const strategy = remediationStrategies[args.violationType];
    if (!strategy) {
      return { success: false, message: "No remediation strategy available" };
    }

    const remediation = strategy(workflow);

    // Apply the changes
    await ctx.db.patch(args.workflowId, remediation.changes);

    // Log the remediation
    await ctx.db.insert("remediationHistory", {
      businessId: workflow.businessId,
      workflowId: args.workflowId,
      violationType: args.violationType,
      action: remediation.action,
      appliedBy: args.appliedBy,
      changes: remediation.changes,
      appliedAt: Date.now(),
    });

    // Update governance health
    const health = await ctx.db.get(args.workflowId);
    if (health) {
      const newScore = Math.min(100, (health.governanceHealth?.score || 0) + 20);
      await ctx.db.patch(args.workflowId, {
        governanceHealth: {
          score: newScore,
          issues: (health.governanceHealth?.issues || []).filter(
            (issue: string) => !issue.includes(args.violationType)
          ),
          updatedAt: Date.now(),
        },
      });
    }

    return {
      success: true,
      action: remediation.action,
      newScore: (health?.governanceHealth?.score || 0) + 20,
    };
  },
});

export const getRemediationHistory = query({
  args: {
    businessId: v.id("businesses"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("remediationHistory")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .take(args.limit || 50);

    return history;
  },
});

export const getRemediationStats = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("remediationHistory")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const last30Days = history.filter(
      (h) => h.appliedAt > Date.now() - 30 * 24 * 60 * 60 * 1000
    );

    const byType = last30Days.reduce((acc, h) => {
      acc[h.violationType] = (acc[h.violationType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: history.length,
      last30Days: last30Days.length,
      byType,
      avgPerDay: last30Days.length / 30,
    };
  },
});