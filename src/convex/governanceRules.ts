import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

/**
 * Define a new governance rule
 */
export const defineRule = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.string(),
    ruleType: v.union(
      v.literal("approval_required"),
      v.literal("sla_enforcement"),
      v.literal("role_separation"),
      v.literal("data_retention"),
      v.literal("access_control"),
      v.literal("custom")
    ),
    severity: v.union(v.literal("critical"), v.literal("high"), v.literal("medium"), v.literal("low")),
    conditions: v.any(),
    actions: v.any(),
    enabled: v.boolean(),
    autoRemediate: v.boolean(),
  },
  handler: async (ctx, args) => {
    const ruleId = await ctx.db.insert("governanceRules", {
      businessId: args.businessId,
      name: args.name,
      description: args.description,
      ruleType: args.ruleType,
      severity: args.severity,
      conditions: args.conditions,
      actions: args.actions,
      enabled: args.enabled,
      autoRemediate: args.autoRemediate,
      violationCount: 0,
      lastEvaluated: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      action: "governance_rule_created",
      entityType: "rule",
      entityId: ruleId,
      details: { name: args.name, ruleType: args.ruleType },
      createdAt: Date.now(),
    });

    return ruleId;
  },
});

/**
 * Update an existing governance rule
 */
export const updateRule = mutation({
  args: {
    ruleId: v.id("governanceRules"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    conditions: v.optional(v.any()),
    actions: v.optional(v.any()),
    enabled: v.optional(v.boolean()),
    autoRemediate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const rule = await ctx.db.get(args.ruleId);
    if (!rule) throw new Error("Rule not found");

    await ctx.db.patch(args.ruleId, {
      ...args,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("audit_logs", {
      businessId: rule.businessId,
      action: "governance_rule_updated",
      entityType: "rule",
      entityId: args.ruleId,
      details: { changes: args },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete a governance rule
 */
export const deleteRule = mutation({
  args: { ruleId: v.id("governanceRules") },
  handler: async (ctx, args) => {
    const rule = await ctx.db.get(args.ruleId);
    if (!rule) throw new Error("Rule not found");

    await ctx.db.delete(args.ruleId);

    await ctx.db.insert("audit_logs", {
      businessId: rule.businessId,
      action: "governance_rule_deleted",
      entityType: "rule",
      entityId: args.ruleId,
      details: { name: rule.name },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get all rules for a business
 */
export const getRules = query({
  args: { 
    businessId: v.optional(v.id("businesses")),
    enabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) return [];

    let rules = await ctx.db
      .query("governanceRules")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .collect();

    if (args.enabled !== undefined) {
      rules = rules.filter((r) => r.enabled === args.enabled);
    }

    return rules.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Evaluate a rule against a workflow
 */
export const evaluateRule = action({
  args: {
    ruleId: v.id("governanceRules"),
    workflowId: v.id("workflows"),
  },
  handler: async (ctx, args) => {
    const rule = await ctx.runQuery(api.governanceRules.getRule, { ruleId: args.ruleId });
    if (!rule || !rule.enabled) {
      return { violated: false, reason: "Rule not found or disabled" };
    }

    const workflow = await ctx.runQuery(api.workflows.get, { id: args.workflowId });
    if (!workflow) {
      return { violated: false, reason: "Workflow not found" };
    }

    let violated = false;
    let reason = "";

    // Evaluate based on rule type
    switch (rule.ruleType) {
      case "approval_required":
        const approvalSteps = workflow.pipeline?.filter((s: any) => s.type === "approval") || [];
        if (rule.conditions.minApprovals && approvalSteps.length < rule.conditions.minApprovals) {
          violated = true;
          reason = `Requires ${rule.conditions.minApprovals} approval steps, found ${approvalSteps.length}`;
        }
        break;

      case "sla_enforcement":
        const steps = workflow.pipeline || [];
        for (const step of steps) {
          if (step.type === "approval" && step.slaHours < rule.conditions.minSlaHours) {
            violated = true;
            reason = `SLA ${step.slaHours}h is below minimum ${rule.conditions.minSlaHours}h`;
            break;
          }
        }
        break;

      case "role_separation":
        const approvals = workflow.pipeline?.filter((s: any) => s.type === "approval") || [];
        const roles = new Set(approvals.map((s: any) => s.assigneeRole));
        if (rule.conditions.requireDifferentRoles && roles.size < approvals.length) {
          violated = true;
          reason = "Approval steps must have different roles";
        }
        break;

      case "data_retention":
        if (workflow.createdAt && rule.conditions.maxAgeMs) {
          const age = Date.now() - workflow.createdAt;
          if (age > rule.conditions.maxAgeMs) {
            violated = true;
            reason = `Workflow age exceeds retention policy`;
          }
        }
        break;

      case "access_control":
        if (rule.conditions.allowedTiers && !rule.conditions.allowedTiers.includes(workflow.tier)) {
          violated = true;
          reason = `Workflow tier ${workflow.tier} not allowed by policy`;
        }
        break;

      case "custom":
        // Custom evaluation logic would go here
        break;
    }

    // Update rule evaluation timestamp
    await ctx.runMutation(api.governanceRules.updateRuleEvaluation, {
      ruleId: args.ruleId,
      violated,
    });

    return { violated, reason };
  },
});

/**
 * Update rule evaluation stats
 */
export const updateRuleEvaluation = mutation({
  args: {
    ruleId: v.id("governanceRules"),
    violated: v.boolean(),
  },
  handler: async (ctx, args) => {
    const rule = await ctx.db.get(args.ruleId);
    if (!rule) return;

    await ctx.db.patch(args.ruleId, {
      lastEvaluated: Date.now(),
      violationCount: args.violated ? rule.violationCount + 1 : rule.violationCount,
    });
  },
});

/**
 * Get a single rule
 */
export const getRule = query({
  args: { ruleId: v.id("governanceRules") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.ruleId);
  },
});

/**
 * Enforce a rule (apply remediation)
 */
export const enforceRule = action({
  args: {
    ruleId: v.id("governanceRules"),
    workflowId: v.id("workflows"),
  },
  handler: async (ctx, args) => {
    const rule = await ctx.runQuery(api.governanceRules.getRule, { ruleId: args.ruleId });
    if (!rule || !rule.autoRemediate) {
      return { enforced: false, reason: "Rule not found or auto-remediation disabled" };
    }

    const evaluation = await ctx.runAction(api.governanceRules.evaluateRule, {
      ruleId: args.ruleId,
      workflowId: args.workflowId,
    });

    if (!evaluation.violated) {
      return { enforced: false, reason: "No violation detected" };
    }

    // Apply remediation based on rule actions
    let enforced = false;
    let action = "";

    for (const ruleAction of rule.actions) {
      if (ruleAction.type === "add_approval_step") {
        await ctx.runMutation(api.workflows.addPipelineStep, {
          workflowId: args.workflowId,
          step: ruleAction.step,
        });
        enforced = true;
        action = "Added approval step";
      } else if (ruleAction.type === "update_sla") {
        await ctx.runMutation(api.workflows.updateSla, {
          workflowId: args.workflowId,
          slaHours: ruleAction.slaHours,
        });
        enforced = true;
        action = "Updated SLA";
      } else if (ruleAction.type === "notify") {
        await ctx.runMutation(api.notifications.create, {
          businessId: rule.businessId,
          userId: ruleAction.userId,
          type: "system_alert",
          title: "Governance Rule Violation",
          message: `Rule "${rule.name}" violated: ${evaluation.reason}`,
          priority: "high",
        });
        enforced = true;
        action = "Sent notification";
      }
    }

    // Record violation
    await ctx.runMutation(api.governanceRules.recordViolation, {
      ruleId: args.ruleId,
      workflowId: args.workflowId,
      reason: evaluation.reason,
      remediated: enforced,
      remediationAction: action,
    });

    return { enforced, action };
  },
});

/**
 * Record a rule violation
 */
export const recordViolation = mutation({
  args: {
    ruleId: v.id("governanceRules"),
    workflowId: v.id("workflows"),
    reason: v.string(),
    remediated: v.boolean(),
    remediationAction: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const rule = await ctx.db.get(args.ruleId);
    if (!rule) return;

    const violationId = await ctx.db.insert("governanceViolations", {
      businessId: rule.businessId,
      ruleId: args.ruleId,
      workflowId: args.workflowId,
      ruleName: rule.name,
      ruleType: rule.ruleType,
      severity: rule.severity,
      reason: args.reason,
      status: args.remediated ? "remediated" : "open",
      remediationAction: args.remediationAction,
      detectedAt: Date.now(),
      remediatedAt: args.remediated ? Date.now() : undefined,
    });

    await ctx.db.insert("audit_logs", {
      businessId: rule.businessId,
      action: "governance_violation_detected",
      entityType: "violation",
      entityId: violationId,
      details: {
        ruleId: args.ruleId,
        workflowId: args.workflowId,
        reason: args.reason,
      },
      createdAt: Date.now(),
    });

    return violationId;
  },
});

/**
 * Get rule violations
 */
export const getRuleViolations = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    ruleId: v.optional(v.id("governanceRules")),
    status: v.optional(v.union(v.literal("open"), v.literal("remediated"), v.literal("dismissed"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) return [];

    let violations = await ctx.db
      .query("governanceViolations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .collect();

    if (args.ruleId) {
      violations = violations.filter((v) => v.ruleId === args.ruleId);
    }

    if (args.status) {
      violations = violations.filter((v) => v.status === args.status);
    }

    violations.sort((a, b) => b.detectedAt - a.detectedAt);

    if (args.limit) {
      violations = violations.slice(0, args.limit);
    }

    return violations;
  },
});

/**
 * Generate compliance report
 */
export const generateComplianceReport = action({
  args: {
    businessId: v.id("businesses"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const rules = await ctx.runQuery(api.governanceRules.getRules, {
      businessId: args.businessId,
    });

    const violations = await ctx.runQuery(api.governanceRules.getRuleViolations, {
      businessId: args.businessId,
    });

    const filteredViolations = violations.filter(
      (v) => v.detectedAt >= args.startDate && v.detectedAt <= args.endDate
    );

    // Calculate compliance score
    const totalRules = rules.length;
    const activeRules = rules.filter((r) => r.enabled).length;
    const openViolations = filteredViolations.filter((v) => v.status === "open").length;
    const remediatedViolations = filteredViolations.filter((v) => v.status === "remediated").length;

    const complianceScore = activeRules > 0
      ? Math.round(((activeRules - openViolations) / activeRules) * 100)
      : 100;

    // Breakdown by severity
    const bySeverity = {
      critical: filteredViolations.filter((v) => v.severity === "critical").length,
      high: filteredViolations.filter((v) => v.severity === "high").length,
      medium: filteredViolations.filter((v) => v.severity === "medium").length,
      low: filteredViolations.filter((v) => v.severity === "low").length,
    };

    // Breakdown by rule type
    const byRuleType: Record<string, number> = {};
    filteredViolations.forEach((v) => {
      byRuleType[v.ruleType] = (byRuleType[v.ruleType] || 0) + 1;
    });

    // Remediation rate
    const totalViolations = filteredViolations.length;
    const remediationRate = totalViolations > 0
      ? Math.round((remediatedViolations / totalViolations) * 100)
      : 100;

    // Top violating workflows
    const workflowViolations: Record<string, number> = {};
    filteredViolations.forEach((v) => {
      const key = v.workflowId;
      workflowViolations[key] = (workflowViolations[key] || 0) + 1;
    });

    const topViolators = Object.entries(workflowViolations)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([workflowId, count]) => ({ workflowId, count }));

    return {
      complianceScore,
      totalRules,
      activeRules,
      totalViolations,
      openViolations,
      remediatedViolations,
      remediationRate,
      bySeverity,
      byRuleType,
      topViolators,
      period: {
        startDate: args.startDate,
        endDate: args.endDate,
      },
    };
  },
});

/**
 * Dismiss a violation
 */
export const dismissViolation = mutation({
  args: {
    violationId: v.id("governanceViolations"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const violation = await ctx.db.get(args.violationId);
    if (!violation) throw new Error("Violation not found");

    await ctx.db.patch(args.violationId, {
      status: "dismissed",
      dismissalReason: args.reason,
      dismissedAt: Date.now(),
    });

    await ctx.db.insert("audit_logs", {
      businessId: violation.businessId,
      action: "governance_violation_dismissed",
      entityType: "violation",
      entityId: args.violationId,
      details: { reason: args.reason },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});
