import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";

const SME_MIN_SLA_HOURS = 24;
const ENT_MIN_SLA_HOURS = 48;

export const APPROVAL_RULES = {
  sme: {
    mmrRequiresMinApprovals: 1,
    roleDiversityRequired: false,
  },
  enterprise: {
    mmrRequiresMinApprovals: 1,
    minApprovers: 2,
    roleDiversityRequired: true,
  },
} as const;

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

  // Compute effective SLA in hours across steps
  const effectiveSlaHours = (() => {
    const values: number[] = [];
    for (const s of steps) {
      if (typeof s?.slaHours === "number") values.push(s.slaHours);
      else if (typeof s?.delayHours === "number") values.push(s.delayHours);
    }
    // If there are explicit delay steps without numeric hours, treat as 1 hour minimum each as a soft heuristic
    if (values.length === 0 && delaySteps.length > 0) return 1;
    return values.length ? Math.max(...values) : 0;
  })();

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

  // Enforce SME/Enterprise SLA floors
  if (tier === "sme" && effectiveSlaHours < SME_MIN_SLA_HOURS) {
    issues.push({
      code: "sla_too_low",
      message: `SLA must be at least ${SME_MIN_SLA_HOURS} hours for SME.`,
      severity: "warn",
    });
  }
  if (tier === "enterprise" && effectiveSlaHours < ENT_MIN_SLA_HOURS) {
    issues.push({
      code: "sla_too_low",
      message: `SLA must be at least ${ENT_MIN_SLA_HOURS} hours for Enterprise.`,
      severity: "error",
    });
  }

  // MMR requires approval mapping for SME+
  const mmrRequired = workflow?.mmrRequired === true || workflow?.requireHumanReview === true;
  if (mmrRequired && ["sme", "enterprise"].includes(tier) && approvalSteps.length < 1) {
    issues.push({
      code: "mmr_requires_approval",
      message: "When human review is required, include at least one approval step.",
      severity: tier === "enterprise" ? "error" : "warn",
    });
  }

  // Enterprise: at least two approvals and role diversity
  if (tier === "enterprise") {
    if (approvalSteps.length < 2) {
      issues.push({
        code: "missing_second_approval",
        message: "Enterprise requires at least two approval steps.",
        severity: "error",
      });
    } else {
      const r1 = stepRole(approvalSteps[0]);
      const r2 = stepRole(approvalSteps[1]);
      if (r1 && r2 && r1 === r2) {
        issues.push({
          code: "approver_role_diversity_required",
          message: "Enterprise requires role diversity across the first two approval steps.",
          severity: "error",
        });
      }
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

// Helper: extract role string from step
function stepRole(s: any): string | undefined {
  return s?.role || s?.assigneeRole || s?.ownerRole || undefined;
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

// Add: explicit validator mutation for workflows (non-destructive, returns result)
export const validateWorkflow = mutation({
  args: { workflowId: v.id("workflows") },
  handler: async (ctx, args) => {
    const wf = await ctx.db.get(args.workflowId);
    if (!wf) throw new Error("Workflow not found");
    const health = computeGovernanceHealth(wf);
    return {
      ok: health.issues.filter((i) => i.severity === "error").length === 0,
      health,
    };
  },
});