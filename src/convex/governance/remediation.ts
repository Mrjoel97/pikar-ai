import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Rollback a remediation action
 */
export const rollbackRemediation = mutation({
  args: {
    remediationId: v.id("governanceRemediations"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const remediation = await ctx.db.get(args.remediationId);
    if (!remediation) {
      throw new Error("Remediation not found");
    }

    if (remediation.status === "rolled_back") {
      throw new Error("Remediation already rolled back");
    }

    const workflow = await ctx.db.get(remediation.workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    await ctx.db.patch(remediation.workflowId, {
      pipeline: remediation.originalPipeline,
    });

    await ctx.db.patch(args.remediationId, {
      status: "rolled_back",
      rollbackReason: args.reason,
      rolledBackAt: Date.now(),
    });

    await ctx.db.insert("audit_logs", {
      businessId: remediation.businessId,
      action: "governance_remediation_rollback",
      entityType: "workflow",
      entityId: remediation.workflowId,
      details: {
        remediationId: args.remediationId,
        reason: args.reason,
        violationType: remediation.violationType,
      },
      createdAt: Date.now(),
    });

    return { success: true, workflowId: remediation.workflowId };
  },
});

/**
 * Get remediation history for a business or workflow
 */
export const getRemediationHistory = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    workflowId: v.optional(v.id("workflows")),
    status: v.optional(v.union(v.literal("applied"), v.literal("rolled_back"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let remediations;

    if (args.businessId) {
      remediations = await ctx.db
        .query("governanceRemediations")
        .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
        .collect();
    } else if (args.workflowId) {
      remediations = await ctx.db
        .query("governanceRemediations")
        .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId!))
        .collect();
    } else {
      remediations = await ctx.db.query("governanceRemediations").collect();
    }

    if (args.status) {
      remediations = remediations.filter((r: any) => r.status === args.status);
    }

    remediations.sort((a: any, b: any) => b.appliedAt - a.appliedAt);

    if (args.limit) {
      remediations = remediations.slice(0, args.limit);
    }

    const enriched = await Promise.all(
      remediations.map(async (rem: any) => {
        const workflow = await ctx.db.get(rem.workflowId);
        return {
          ...rem,
          workflowName: (workflow && "name" in workflow) ? workflow.name : "Unknown",
          workflowStatus: (workflow && "status" in workflow) ? workflow.status : "unknown",
        };
      })
    );

    return enriched;
  },
});

/**
 * Escalate a governance violation
 */
export const escalateViolation = mutation({
  args: {
    businessId: v.id("businesses"),
    workflowId: v.id("workflows"),
    violationType: v.string(),
    escalatedTo: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const escalationId = await ctx.db.insert("governanceEscalations", {
      businessId: args.businessId,
      workflowId: args.workflowId,
      violationType: args.violationType,
      count: 1,
      escalatedTo: args.escalatedTo,
      status: "pending",
      notes: args.notes,
      createdAt: Date.now(),
    });

    await ctx.db.insert("notifications", {
      businessId: args.businessId,
      userId: args.escalatedTo as any,
      type: "system_alert",
      title: "Governance Escalation",
      message: `Workflow governance violation requires attention: ${args.violationType}`,
      data: { workflowId: args.workflowId, escalationId },
      isRead: false,
      priority: "high",
      createdAt: Date.now(),
    });

    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      action: "governance_escalation",
      entityType: "workflow",
      entityId: args.workflowId,
      details: {
        violationType: args.violationType,
        escalatedTo: args.escalatedTo,
      },
      createdAt: Date.now(),
    });

    return escalationId;
  },
});
