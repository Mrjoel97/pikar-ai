import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) throw new Error("User not found");

    // Call internal mutation to apply remediation
    const result = await ctx.scheduler.runAfter(
      0,
      internal.governance.remediation.applyRemediation,
      {
        workflowId: args.workflowId,
        violationType: args.violationType,
        appliedBy: user._id,
      }
    );

    return {
      remediated: true,
      action: "Remediation scheduled",
    };
  },
});

/**
 * Rollback a remediation action
 */
export const rollbackRemediation = mutation({
  args: {
    remediationId: v.id("governanceRemediations"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
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

    // Restore original pipeline
    await ctx.db.patch(remediation.workflowId, {
      pipeline: remediation.originalPipeline,
    });

    // Update remediation status
    await ctx.db.patch(args.remediationId, {
      status: "rolled_back",
      rollbackReason: args.reason,
      rolledBackAt: Date.now(),
    });

    // Log audit event
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
    businessId: v.id("businesses"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.runQuery(internal.governance.remediation.getRemediationHistory, {
      businessId: args.businessId,
      limit: args.limit,
    });
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
  handler: async (ctx: any, args) => {
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
 * Auto-escalate violations based on threshold rules
 * - If businessId is provided, processes that business
 * - If omitted, scans all businesses
 */
export const checkAndAutoEscalate = internalMutation({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx: any, args) => {
    let totalEscalated = 0;

    const processBusiness = async (bizId: Id<"businesses">) => {
      // Load settings per business
      const settings = await ctx.db
        .query("governanceAutomationSettings")
        .withIndex("by_business", (q: any) => q.eq("businessId", bizId))
        .first();

      if (!settings) return 0;

      const threshold = settings.escalationRules.threshold;
      const escalateTo = settings.escalationRules.escalateTo;

      // Get all workflows for this business
      const workflows = await ctx.db
        .query("workflows")
        .withIndex("by_business", (q: any) => q.eq("businessId", bizId))
        .collect();

      // Count violations by type per workflow
      const violationCounts: Record<
        string,
        { workflowId: Id<"workflows">; count: number; types: string[] }
      > = {};

      for (const workflow of workflows) {
        if (workflow.governanceHealth?.issues && workflow.governanceHealth.issues.length > 0) {
          const key = workflow._id;
          if (!violationCounts[key]) {
            violationCounts[key] = { workflowId: workflow._id, count: 0, types: [] };
          }
          violationCounts[key].count = workflow.governanceHealth.issues.length;
          violationCounts[key].types = workflow.governanceHealth.issues;
        }
      }

      let escalatedCount = 0;

      // Check if any workflow exceeds threshold
      for (const [, data] of Object.entries(violationCounts)) {
        if (data.count >= threshold) {
          // Check if already escalated (pending)
          const existing = await ctx.db
            .query("governanceEscalations")
            .withIndex("by_workflow", (q: any) => q.eq("workflowId", data.workflowId))
            .filter((q: any) => q.eq(q.field("status"), "pending"))
            .first();

          if (!existing) {
            // Create escalation
            await ctx.db.insert("governanceEscalations", {
              businessId: bizId,
              workflowId: data.workflowId,
              violationType: data.types.join(", "),
              count: data.count,
              escalatedTo: escalateTo,
              status: "pending",
              notes: `Auto-escalated: ${data.count} violations exceed threshold of ${threshold}`,
              createdAt: Date.now(),
            });

            escalatedCount++;
          }
        }
      }

      return escalatedCount;
    };

    if (args.businessId) {
      totalEscalated += await processBusiness(args.businessId);
    } else {
      // Process all businesses
      const businesses = await ctx.db.query("businesses").collect();
      for (const b of businesses) {
        totalEscalated += await processBusiness(b._id as Id<"businesses">);
      }
    }

    return { escalated: totalEscalated };
  },
});

/**
 * Get pending and resolved escalations
 * Guest-safe: returns [] when businessId is not provided
 */
export const getEscalations = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    status: v.optional(v.union(v.literal("pending"), v.literal("resolved"))),
  },
  handler: async (ctx: any, args) => {
    // Guest/public: no business context → return empty array
    if (!args.businessId) {
      return [];
    }

    const escalations = await ctx.db
      .query("governanceEscalations")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .collect();

    // Filter by status if provided
    const filtered = args.status
      ? escalations.filter((e: any) => e.status === args.status)
      : escalations;

    // Get automation settings for SLA calculation
    const settings = await ctx.db
      .query("governanceAutomationSettings")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .first();

    const escalationSlaHours = 48; // Default 48 hours for escalation resolution

    // Enrich with workflow details and SLA tracking
    const enriched = await Promise.all(
      filtered.map(async (esc: any) => {
        const workflow = await ctx.db.get(esc.workflowId);
        const now = Date.now();
        const slaDeadline = esc.createdAt + escalationSlaHours * 60 * 60 * 1000;
        const isOverdue = esc.status === "pending" && now > slaDeadline;
        const hoursRemaining = Math.max(0, Math.round((slaDeadline - now) / (60 * 60 * 1000)));

        return {
          ...esc,
          workflowName: workflow?.name || "Unknown",
          slaDeadline,
          isOverdue,
          hoursRemaining,
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
  handler: async (ctx: any, args) => {
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
    const daysBack = args.days || 30;
    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const compliantCount = workflows.filter(
      (w) => w.governanceHealth && w.governanceHealth.score >= 80
    ).length;

    const avgScore =
      workflows.reduce((sum, w) => sum + (w.governanceHealth?.score || 0), 0) /
      (workflows.length || 1);

    // Generate trend data (simplified - in production, store historical scores)
    const trend = Array.from({ length: Math.min(daysBack, 30) }, (_, i) => ({
      date: new Date(Date.now() - (daysBack - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      score: Math.round(avgScore + (Math.random() - 0.5) * 10),
    }));

    return {
      currentScore: Math.round(avgScore),
      compliantCount,
      totalCount: workflows.length,
      trend,
    };
  },
});

/**
 * Get automation settings for a business
 */
export const getAutomationSettings = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx: any, args) => {
    // Guest-safe: return defaults when no businessId
    if (!args.businessId) {
      return {
        businessId: args.businessId as any,
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
      };
    }

    const settings = await ctx.db
      .query("governanceAutomationSettings")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
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
  handler: async (ctx: any, args) => {
    const existing = await ctx.db
      .query("governanceAutomationSettings")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId))
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