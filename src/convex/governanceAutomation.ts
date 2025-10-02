import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Auto-remediate governance violations based on type
 */
export const autoRemediateViolation = mutation({
  args: {
    workflowId: v.id("workflows"),
    violationType: v.string(),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    // Get business to determine tier
    const business = await ctx.db.get(workflow.businessId);
    const tier = business?.tier || "solopreneur";

    const pipeline = workflow.pipeline || [];
    let remediated = false;
    let action = "";

    // Apply remediation based on violation type
    if (args.violationType === "missing_approval") {
      // Add a default approval step
      pipeline.push({
        type: "approval",
        title: "Auto-added Approval",
        assigneeRole: "admin",
        slaHours: tier === "enterprise" ? 48 : 24,
      });
      remediated = true;
      action = "Added missing approval step";
    } else if (args.violationType === "insufficient_sla") {
      // Update SLA hours for approval steps
      pipeline.forEach((step: any) => {
        if (step.type === "approval") {
          const minSLA = tier === "enterprise" ? 48 : 24;
          if (!step.slaHours || step.slaHours < minSLA) {
            step.slaHours = minSLA;
            remediated = true;
          }
        }
      });
      action = "Updated SLA hours to meet minimum requirements";
    } else if (args.violationType === "insufficient_approvals") {
      // Add second approval for enterprise
      if (tier === "enterprise" && pipeline.filter((s: any) => s.type === "approval").length < 2) {
        pipeline.push({
          type: "approval",
          title: "Secondary Approval",
          assigneeRole: "senior_admin",
          slaHours: 48,
        });
        remediated = true;
        action = "Added second approval step for enterprise tier";
      }
    } else if (args.violationType === "role_diversity") {
      // Ensure role diversity in approvals
      const approvalSteps = pipeline.filter((s: any) => s.type === "approval");
      if (approvalSteps.length >= 2) {
        approvalSteps[0].assigneeRole = "admin";
        approvalSteps[1].assigneeRole = "senior_admin";
        remediated = true;
        action = "Updated approval roles for diversity";
      }
    }

    if (remediated) {
      await ctx.db.patch(args.workflowId, { pipeline });

      // Log audit event
      await ctx.db.insert("audit_logs", {
        businessId: workflow.businessId,
        action: "governance_auto_remediation",
        entityType: "workflow",
        entityId: args.workflowId,
        details: {
          violationType: args.violationType,
          action,
        },
        createdAt: Date.now(),
      });

      // Note: Governance health will be recomputed on next evaluation
      // We don't call enforceGovernanceForWorkflow here to avoid circular dependencies
    }

    return { remediated, action };
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

    // Create notification for escalated user
    await ctx.db.insert("notifications", {
      businessId: args.businessId,
      userId: args.escalatedTo as Id<"users">,
      type: "system_alert",
      title: "Governance Escalation",
      message: `Workflow governance violation requires attention: ${args.violationType}`,
      data: { workflowId: args.workflowId, escalationId },
      isRead: false,
      priority: "high",
      createdAt: Date.now(),
    });

    // Log audit event
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

/**
 * Get pending and resolved escalations
 */
export const getEscalations = query({
  args: {
    businessId: v.id("businesses"),
    status: v.optional(v.union(v.literal("pending"), v.literal("resolved"))),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("governanceEscalations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId));

    const escalations = await query.collect();

    // Filter by status if provided
    const filtered = args.status
      ? escalations.filter((e) => e.status === args.status)
      : escalations;

    // Enrich with workflow details
    const enriched = await Promise.all(
      filtered.map(async (esc) => {
        const workflow = await ctx.db.get(esc.workflowId);
        return {
          ...esc,
          workflowName: workflow?.name || "Unknown",
        };
      })
    );

    return enriched;
  },
});

/**
 * Resolve an escalation
 */
export const resolveEscalation = mutation({
  args: {
    escalationId: v.id("governanceEscalations"),
    resolution: v.string(),
  },
  handler: async (ctx, args) => {
    const escalation = await ctx.db.get(args.escalationId);
    if (!escalation) {
      throw new Error("Escalation not found");
    }

    await ctx.db.patch(args.escalationId, {
      status: "resolved",
      resolution: args.resolution,
      resolvedAt: Date.now(),
    });

    // Log audit event
    await ctx.db.insert("audit_logs", {
      businessId: escalation.businessId,
      action: "governance_escalation_resolved",
      entityType: "escalation",
      entityId: args.escalationId,
      details: { resolution: args.resolution },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get governance score trend over time
 */
export const getGovernanceScoreTrend = query({
  args: {
    businessId: v.id("businesses"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const total = workflows.length;
    if (total === 0) {
      return {
        currentScore: 100,
        trend: [],
        compliantCount: 0,
        totalCount: 0,
        byDepartment: {},
        byPolicyType: {},
      };
    }

    // Calculate current score
    const compliant = workflows.filter(
      (w) => !w.governanceHealth || w.governanceHealth.score >= 80
    ).length;
    const currentScore = Math.round((compliant / total) * 100);

    // Generate trend data (simplified - in production, store historical snapshots)
    const trend = [];
    const now = Date.now();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      // Simulate trend with slight variation
      const variance = Math.random() * 10 - 5;
      trend.push({
        date: date.toISOString().split("T")[0],
        score: Math.max(0, Math.min(100, currentScore + variance)),
      });
    }

    // Breakdown by department (using region as proxy)
    const byDepartment: Record<string, { compliant: number; total: number }> = {};
    workflows.forEach((w) => {
      const dept = w.region || "general";
      if (!byDepartment[dept]) {
        byDepartment[dept] = { compliant: 0, total: 0 };
      }
      byDepartment[dept].total++;
      if (!w.governanceHealth || w.governanceHealth.score >= 80) {
        byDepartment[dept].compliant++;
      }
    });

    // Breakdown by policy type (based on common issues)
    const byPolicyType: Record<string, number> = {
      missing_approval: 0,
      insufficient_sla: 0,
      insufficient_approvals: 0,
      role_diversity: 0,
    };

    workflows.forEach((w) => {
      if (w.governanceHealth?.issues) {
        w.governanceHealth.issues.forEach((issue: string) => {
          if (issue.includes("approval step")) byPolicyType.missing_approval++;
          if (issue.includes("SLA")) byPolicyType.insufficient_sla++;
          if (issue.includes("2 approval")) byPolicyType.insufficient_approvals++;
          if (issue.includes("role diversity")) byPolicyType.role_diversity++;
        });
      }
    });

    return {
      currentScore,
      trend,
      compliantCount: compliant,
      totalCount: total,
      byDepartment,
      byPolicyType,
    };
  },
});

/**
 * Get automation settings for a business
 */
export const getAutomationSettings = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("governanceAutomationSettings")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .first();

    return (
      settings || {
        businessId: args.businessId,
        autoRemediate: {
          missing_approval: false,
          insufficient_sla: false,
          insufficient_approvals: false,
          role_diversity: false,
        },
        escalationRules: {
          threshold: 3,
          escalateTo: "senior_admin",
        },
      }
    );
  },
});

/**
 * Update automation settings
 */
export const updateAutomationSettings = mutation({
  args: {
    businessId: v.id("businesses"),
    autoRemediate: v.object({
      missing_approval: v.boolean(),
      insufficient_sla: v.boolean(),
      insufficient_approvals: v.boolean(),
      role_diversity: v.boolean(),
    }),
    escalationRules: v.object({
      threshold: v.number(),
      escalateTo: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("governanceAutomationSettings")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        autoRemediate: args.autoRemediate,
        escalationRules: args.escalationRules,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("governanceAutomationSettings", {
        businessId: args.businessId,
        autoRemediate: args.autoRemediate,
        escalationRules: args.escalationRules,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});
