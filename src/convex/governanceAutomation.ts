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
    const originalPipeline = JSON.parse(JSON.stringify(pipeline)); // Deep copy for rollback
    let remediated = false;
    let action = "";
    let changes: any = {};

    // Apply remediation based on violation type
    if (args.violationType === "missing_approval") {
      // Add a default approval step
      const newStep = {
        type: "approval",
        title: "Auto-added Approval",
        assigneeRole: "admin",
        slaHours: tier === "enterprise" ? 48 : 24,
      };
      pipeline.push(newStep);
      remediated = true;
      action = "Added missing approval step";
      changes = { addedStep: newStep, position: pipeline.length - 1 };
    } else if (args.violationType === "insufficient_sla") {
      // Update SLA hours for approval steps
      const updatedSteps: any[] = [];
      pipeline.forEach((step: any, index: number) => {
        if (step.type === "approval") {
          const minSLA = tier === "enterprise" ? 48 : 24;
          if (!step.slaHours || step.slaHours < minSLA) {
            const oldSLA = step.slaHours;
            step.slaHours = minSLA;
            remediated = true;
            updatedSteps.push({ index, oldSLA, newSLA: minSLA });
          }
        }
      });
      action = "Updated SLA hours to meet minimum requirements";
      changes = { updatedSteps };
    } else if (args.violationType === "insufficient_approvals") {
      // Add second approval for enterprise
      if (tier === "enterprise" && pipeline.filter((s: any) => s.type === "approval").length < 2) {
        const newStep = {
          type: "approval",
          title: "Secondary Approval",
          assigneeRole: "senior_admin",
          slaHours: 48,
        };
        pipeline.push(newStep);
        remediated = true;
        action = "Added second approval step for enterprise tier";
        changes = { addedStep: newStep, position: pipeline.length - 1 };
      }
    } else if (args.violationType === "role_diversity") {
      // Ensure role diversity in approvals
      const approvalSteps = pipeline.filter((s: any) => s.type === "approval");
      if (approvalSteps.length >= 2) {
        const oldRoles = approvalSteps.map((s: any) => s.assigneeRole);
        approvalSteps[0].assigneeRole = "admin";
        approvalSteps[1].assigneeRole = "senior_admin";
        remediated = true;
        action = "Updated approval roles for diversity";
        changes = { oldRoles, newRoles: ["admin", "senior_admin"] };
      }
    } else if (args.violationType === "missing_notification") {
      // Add notification step
      const newStep = {
        type: "notification",
        title: "Auto-added Notification",
        recipients: ["admin"],
        template: "workflow_status_update",
      };
      pipeline.push(newStep);
      remediated = true;
      action = "Added missing notification step";
      changes = { addedStep: newStep, position: pipeline.length - 1 };
    } else if (args.violationType === "missing_audit_log") {
      // Add audit logging step
      const newStep = {
        type: "audit",
        title: "Auto-added Audit Log",
        logLevel: "info",
        includePayload: true,
      };
      pipeline.push(newStep);
      remediated = true;
      action = "Added audit logging step";
      changes = { addedStep: newStep, position: pipeline.length - 1 };
    }

    if (remediated) {
      await ctx.db.patch(args.workflowId, { pipeline });

      // Store remediation history for rollback support
      const remediationId = await ctx.db.insert("governanceRemediations", {
        businessId: workflow.businessId,
        workflowId: args.workflowId,
        violationType: args.violationType,
        action,
        changes,
        originalPipeline,
        newPipeline: pipeline,
        status: "applied",
        appliedAt: Date.now(),
      });

      // Log audit event
      await ctx.db.insert("audit_logs", {
        businessId: workflow.businessId,
        action: "governance_auto_remediation",
        entityType: "workflow",
        entityId: args.workflowId,
        details: {
          violationType: args.violationType,
          action,
          remediationId,
        },
        createdAt: Date.now(),
      });

      return { remediated, action, remediationId };
    }

    return { remediated: false, action: "", remediationId: null };
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
    businessId: v.optional(v.id("businesses")),
    workflowId: v.optional(v.id("workflows")),
    status: v.optional(v.union(v.literal("applied"), v.literal("rolled_back"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let remediations;

    // Filter by business or workflow
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

    // Filter by status if provided
    if (args.status) {
      remediations = remediations.filter((r) => r.status === args.status);
    }

    // Sort by most recent first
    remediations.sort((a, b) => b.appliedAt - a.appliedAt);

    // Apply limit
    if (args.limit) {
      remediations = remediations.slice(0, args.limit);
    }

    // Enrich with workflow details
    const enriched = await Promise.all(
      remediations.map(async (rem) => {
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
  handler: async (ctx, args) => {
    let totalEscalated = 0;

    const processBusiness = async (bizId: Id<"businesses">) => {
      // Load settings per business
      const settings = await ctx.db
        .query("governanceAutomationSettings")
        .withIndex("by_business", (q) => q.eq("businessId", bizId))
        .first();

      if (!settings) return 0;

      const threshold = settings.escalationRules.threshold;
      const escalateTo = settings.escalationRules.escalateTo;

      // Get all workflows for this business
      const workflows = await ctx.db
        .query("workflows")
        .withIndex("by_business", (q) => q.eq("businessId", bizId))
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
            .withIndex("by_workflow", (q) => q.eq("workflowId", data.workflowId))
            .filter((q) => q.eq(q.field("status"), "pending"))
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
  handler: async (ctx, args) => {
    // Guest/public: no business context → return empty array
    if (!args.businessId) {
      return [];
    }

    const escalations = await ctx.db
      .query("governanceEscalations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .collect();

    // Filter by status if provided
    const filtered = args.status
      ? escalations.filter((e) => e.status === args.status)
      : escalations;

    // Get automation settings for SLA calculation
    const settings = await ctx.db
      .query("governanceAutomationSettings")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .first();

    const escalationSlaHours = 48; // Default 48 hours for escalation resolution

    // Enrich with workflow details and SLA tracking
    const enriched = await Promise.all(
      filtered.map(async (esc) => {
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
    businessId: v.optional(v.id("businesses")),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Guest-safe: return defaults if no business context
    if (!args.businessId) {
      return {
        currentScore: 100,
        trend: [],
        compliantCount: 0,
        totalCount: 0,
        byDepartment: {},
        byPolicyType: {},
      };
    }
    const days = args.days || 30;
    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
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
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
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
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
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