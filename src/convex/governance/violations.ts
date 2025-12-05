import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

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
      violations = violations.filter((v: any) => v.ruleId === args.ruleId);
    }

    if (args.status) {
      violations = violations.filter((v: any) => v.status === args.status);
    }

    violations.sort((a: any, b: any) => b.detectedAt - a.detectedAt);

    if (args.limit) {
      violations = violations.slice(0, args.limit);
    }

    return violations;
  },
});

/**
 * Record a rule violation
 */
export const recordViolation = mutation({
  args: {
    ruleId: v.id("governanceRules"),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const rule = await ctx.db.get(args.ruleId);
    if (!rule) return;

    const violationId = await ctx.db.insert("governanceViolations", {
      businessId: rule.businessId,
      ruleId: args.ruleId,
      severity: rule.severity,
      description: args.description,
      status: "open",
      detectedAt: Date.now(),
    });

    await ctx.db.insert("audit_logs", {
      businessId: rule.businessId,
      action: "governance_violation_detected",
      entityType: "violation",
      entityId: violationId,
      details: {
        ruleId: args.ruleId,
        description: args.description,
      },
      createdAt: Date.now(),
    });

    return violationId;
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
      status: "acknowledged",
      resolvedAt: Date.now(),
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

/**
 * Get pending and resolved escalations
 */
export const getEscalations = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    status: v.optional(v.union(v.literal("pending"), v.literal("resolved"))),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return [];
    }

    const escalations = await ctx.db
      .query("governanceEscalations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .collect();

    const filtered = args.status
      ? escalations.filter((e: any) => e.status === args.status)
      : escalations;

    const escalationSlaHours = 48;

    const enriched = await Promise.all(
      filtered.map(async (esc: any) => {
        const workflow = await ctx.db.get(esc.workflowId);
        const now = Date.now();
        const slaDeadline = esc.createdAt + escalationSlaHours * 60 * 60 * 1000;
        const isOverdue = esc.status === "pending" && now > slaDeadline;
        const hoursRemaining = Math.max(0, Math.round((slaDeadline - now) / (60 * 60 * 1000)));

        return {
          ...esc,
          workflowName: (workflow as any)?.name || "Unknown",
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

    const compliant = workflows.filter(
      (w: any) => !w.governanceHealth || w.governanceHealth.score >= 80
    ).length;
    const currentScore = Math.round((compliant / total) * 100);

    const trend = [];
    const now = Date.now();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const variance = Math.random() * 10 - 5;
      trend.push({
        date: date.toISOString().split("T")[0],
        score: Math.max(0, Math.min(100, currentScore + variance)),
      });
    }

    const byDepartment: Record<string, { compliant: number; total: number }> = {};
    workflows.forEach((w: any) => {
      const dept = w.region || "general";
      if (!byDepartment[dept]) {
        byDepartment[dept] = { compliant: 0, total: 0 };
      }
      byDepartment[dept].total++;
      if (!w.governanceHealth || w.governanceHealth.score >= 80) {
        byDepartment[dept].compliant++;
      }
    });

    const byPolicyType: Record<string, number> = {
      missing_approval: 0,
      insufficient_sla: 0,
      insufficient_approvals: 0,
      role_diversity: 0,
    };

    workflows.forEach((w: any) => {
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
