import { mutation, query, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

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

    const business = await ctx.db.get(workflow.businessId);
    const tier = business?.tier || "solopreneur";

    const pipeline = workflow.pipeline || [];
    const originalPipeline = JSON.parse(JSON.stringify(pipeline));
    let remediated = false;
    let action = "";
    let changes: any = {};

    if (args.violationType === "missing_approval") {
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
      const approvalSteps = pipeline.filter((s: any) => s.type === "approval");
      if (approvalSteps.length >= 2) {
        const oldRoles = approvalSteps.map((s: any) => s.assigneeRole);
        approvalSteps[0].assigneeRole = "admin";
        approvalSteps[1].assigneeRole = "senior_admin";
        remediated = true;
        action = "Updated approval roles for diversity";
        changes = { oldRoles, newRoles: ["admin", "senior_admin"] };
      }
    }

    if (remediated) {
      await ctx.db.patch(args.workflowId, { pipeline });

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
 * Get automation settings for a business
 */
export const getAutomationSettings = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
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

/**
 * Auto-escalate violations based on threshold rules
 */
export const checkAndAutoEscalate = internalMutation({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    let totalEscalated = 0;

    const processBusiness = async (bizId: Id<"businesses">) => {
      const settings = await ctx.db
        .query("governanceAutomationSettings")
        .withIndex("by_business", (q) => q.eq("businessId", bizId))
        .first();

      if (!settings) return 0;

      const threshold = settings.escalationRules.threshold;
      const escalateTo = settings.escalationRules.escalateTo;

      const workflows = await ctx.db
        .query("workflows")
        .withIndex("by_business", (q) => q.eq("businessId", bizId))
        .collect();

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

      for (const [, data] of Object.entries(violationCounts)) {
        if (data.count >= threshold) {
          const existing = await ctx.db
            .query("governanceEscalations")
            .withIndex("by_workflow", (q) => q.eq("workflowId", data.workflowId))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .first();

          if (!existing) {
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
      const businesses = await ctx.db.query("businesses").collect();
      for (const b of businesses) {
        totalEscalated += await processBusiness(b._id as Id<"businesses">);
      }
    }

    return { escalated: totalEscalated };
  },
});
