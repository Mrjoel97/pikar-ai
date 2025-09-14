import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";

// Internal helper: compute governance health for a workflow
function computeGovernanceHealth(workflow: any): {
  score: number;
  issues: Array<{
    code: string;
    message: string;
    severity: "info" | "warn" | "error";
  }>;
  updatedAt: number;
} {
  const issues: Array<{ code: string; message: string; severity: "info" | "warn" | "error" }> = [];
  const tier: string =
    (workflow?.tier as string) ||
    (workflow?.metadata?.tier as string) ||
    (workflow?.businessTier as string) ||
    "startup";

  const steps: Array<any> = Array.isArray(workflow?.steps) ? workflow.steps : Array.isArray(workflow?.pipeline) ? workflow.pipeline : [];
  const hasDescription = typeof workflow?.description === "string" && workflow.description.trim().length > 0;

  const approvalSteps = steps.filter((s) => (s?.type || s?.kind) === "approval");
  const delaySteps = steps.filter((s) => (s?.type || s?.kind) === "delay");
  const rolesPresent = steps.some((s) => !!(s?.role || s?.assigneeRole || s?.ownerRole));
  const hasSla =
    steps.some((s) => typeof s?.slaHours === "number" && s.slaHours > 0) ||
    steps.some((s) => typeof s?.delayHours === "number" && s.delayHours > 0) ||
    delaySteps.length > 0;

  // Tier rules (lightweight, can be expanded)
  if (["sme", "enterprise"].includes(tier)) {
    if (approvalSteps.length < 1) {
      issues.push({
        code: "missing_approval",
        message: "At least one approval step is required for SME/Enterprise.",
        severity: "error",
      });
    }
  }

  if (tier === "enterprise") {
    if (approvalSteps.length < 2) {
      issues.push({
        code: "missing_second_approval",
        message: "A second approval step is required for Enterprise.",
        severity: "error",
      });
    }
    if (!hasSla) {
      issues.push({
        code: "missing_sla",
        message: "An SLA or delay is required for Enterprise workflows.",
        severity: "warn",
      });
    }
    if (!rolesPresent) {
      issues.push({
        code: "missing_roles",
        message: "Clearly defined approver/owner roles are required.",
        severity: "warn",
      });
    }
  } else if (tier === "sme") {
    if (!hasSla) {
      issues.push({
        code: "missing_sla",
        message: "Include an SLA or delay for SME workflows.",
        severity: "warn",
      });
    }
  } else if (tier === "startup") {
    // Soft guidance
    if (!rolesPresent) {
      issues.push({
        code: "missing_roles",
        message: "Add roles to improve clarity and handoffs.",
        severity: "info",
      });
    }
  } else if (tier === "solopreneur") {
    // Minimal requirements; nudges only
    if (!hasDescription) {
      issues.push({
        code: "missing_description",
        message: "Add a brief description to clarify the workflow intent.",
        severity: "info",
      });
    }
  }

  // General best practices
  if (!hasDescription) {
    issues.push({
      code: "missing_description_general",
      message: "Workflow should include a description.",
      severity: ["enterprise", "sme"].includes(tier) ? "warn" : "info",
    });
  }

  // Score (simple heuristic)
  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warnCount = issues.filter((i) => i.severity === "warn").length;
  let score = 100 - errorCount * 40 - warnCount * 15;
  if (score < 0) score = 0;

  return {
    score,
    issues,
    updatedAt: Date.now(),
  };
}

// Query: evaluate a single workflow (returns governanceHealth-only, does not mutate)
export const evaluateWorkflow = query({
  args: {
    workflowId: v.id("workflows"),
  },
  handler: async (ctx, args) => {
    const wf = await ctx.db.get(args.workflowId);
    if (!wf) throw new Error("Workflow not found");
    const health = computeGovernanceHealth(wf);
    return health;
  },
});

// Mutation: enforce (compute and write) governanceHealth on a single workflow
export const enforceGovernanceForWorkflow = mutation({
  args: {
    workflowId: v.id("workflows"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const wf = await ctx.db.get(args.workflowId);
    if (!wf) throw new Error("Workflow not found");

    const health = computeGovernanceHealth(wf);
    // Convert issues to string[] for schema compatibility
    const compact = {
      score: health.score,
      issues: health.issues.map((i) => `${i.severity}:${i.code}:${i.message}`),
      updatedAt: health.updatedAt,
    };
    await ctx.db.patch(args.workflowId, {
      governanceHealth: {
        score: health.score,
        issues: Array.isArray(health.issues)
          ? health.issues.map((i: any) => (typeof i === "string" ? i : i.message))
          : [],
        updatedAt: health.updatedAt,
      },
    });
    return compact;
  },
});

// Mutation: enforce governance across all workflows for a business
export const enforceGovernanceForBusiness = mutation({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const updated: Array<{ id: string; score: number }> = [];
    const q = ctx.db.query("workflows").withIndex("by_business", (q) => q.eq("businessId", args.businessId));

    for await (const wf of q) {
      const health = computeGovernanceHealth(wf);
      const compact = {
        score: health.score,
        issues: health.issues.map((i) => `${i.severity}:${i.code}:${i.message}`),
        updatedAt: health.updatedAt,
      };
      await ctx.db.patch(wf._id, {
        governanceHealth: {
          score: health.score,
          issues: Array.isArray(health.issues)
            ? health.issues.map((i: any) => (typeof i === "string" ? i : i.message))
            : [],
          updatedAt: health.updatedAt,
        },
      });
      updated.push({ id: String(wf._id), score: compact.score });
    }

    return { count: updated.length, updated };
  },
});

// Internal: batch-enforce for a business (same as above but internal for schedulers)
export const enforceGovernanceForBusinessInternal = internalMutation({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const q = ctx.db.query("workflows").withIndex("by_business", (q) => q.eq("businessId", args.businessId));
    let count = 0;
    for await (const wf of q) {
      const health = computeGovernanceHealth(wf);
      const compact = {
        score: health.score,
        issues: health.issues.map((i) => `${i.severity}:${i.code}:${i.message}`),
        updatedAt: health.updatedAt,
      };
      await ctx.db.patch(wf._id, {
        governanceHealth: {
          score: health.score,
          issues: Array.isArray(health.issues)
            ? health.issues.map((i: any) => (typeof i === "string" ? i : i.message))
            : [],
          updatedAt: health.updatedAt,
        },
      });
      count++;
    }
    return count;
  },
});