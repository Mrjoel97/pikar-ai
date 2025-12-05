import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

type GovernanceHealth = {
  score: number;
  issues: string[];
  updatedAt: number;
};

function computeGovernanceHealth(workflow: any): GovernanceHealth {
  const issues: string[] = [];
  let score = 100;
  
  const tier = workflow.tier || "solopreneur";
  const pipeline = workflow.pipeline || [];
  const approvalSteps = pipeline.filter((step: any) => step.type === "approval");
  
  // SME tier requirements
  if (tier === "sme") {
    if (workflow.approval?.required && approvalSteps.length === 0) {
      issues.push("SME tier with MMR enabled requires at least 1 approval step");
      score -= 30;
    }
    
    const hasMinSLA = approvalSteps.every((step: any) => 
      step.slaHours && step.slaHours >= 24
    );
    if (!hasMinSLA && approvalSteps.length > 0) {
      issues.push("SME tier requires minimum 24-hour SLA for approval steps");
      score -= 20;
    }
  }
  
  // Enterprise tier requirements
  if (tier === "enterprise") {
    if (approvalSteps.length < 2) {
      issues.push("Enterprise tier requires at least 2 approval steps");
      score -= 40;
    }
    
    const roles = new Set(approvalSteps.map((step: any) => step.assigneeRole).filter(Boolean));
    if (roles.size < 2 && approvalSteps.length >= 2) {
      issues.push("Enterprise tier requires role diversity in approval steps");
      score -= 25;
    }
    
    const hasMinSLA = approvalSteps.every((step: any) => 
      step.slaHours && step.slaHours >= 48
    );
    if (!hasMinSLA && approvalSteps.length > 0) {
      issues.push("Enterprise tier requires minimum 48-hour SLA for approval steps");
      score -= 20;
    }
  }
  
  return {
    score: Math.max(0, score),
    issues,
    updatedAt: Date.now(),
  };
}

export const evaluateWorkflow = query({
  args: { workflowId: v.id("workflows") },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    
    return computeGovernanceHealth(workflow);
  },
});

export const enforceGovernanceForWorkflow = mutation({
  args: { workflowId: v.id("workflows") },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    
    const health = computeGovernanceHealth(workflow);
    
    await ctx.db.patch(args.workflowId, {
      governanceHealth: health,
    });
    
    return health;
  },
});

export const enforceGovernanceForBusiness = mutation({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
    
    let count = 0;
    for (const workflow of workflows) {
      const health = computeGovernanceHealth(workflow);
      await ctx.db.patch(workflow._id, {
        governanceHealth: health,
      });
      count++;
    }
    
    return { count };
  },
});

export const validateWorkflow = query({
  args: { workflow: v.any() },
  handler: async (ctx, args) => {
    return computeGovernanceHealth(args.workflow);
  },
});

export const enforceWorkflowCompliance = internalMutation({
  args: {
    businessId: v.id("businesses"),
    workflowId: v.id("workflows"),
    violations: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) return;

    // Update workflow governance health
    await ctx.db.patch(args.workflowId, {
      governanceHealth: {
        score: Math.max(0, 100 - args.violations.length * 20),
        issues: args.violations,
        updatedAt: Date.now(),
      },
    });

    // Create escalation if critical violations exist
    const criticalViolations = args.violations.filter(v => 
      v.includes("critical") || v.includes("security") || v.includes("compliance")
    );

    if (criticalViolations.length > 0) {
      await ctx.db.insert("governanceEscalations", {
        businessId: args.businessId,
        workflowId: args.workflowId,
        violationType: "critical_compliance",
        count: criticalViolations.length,
        title: `Critical Compliance Violations in ${workflow.name}`,
        description: `Workflow has ${criticalViolations.length} critical violations that require immediate attention.`,
        priority: "urgent",
        status: "pending",
        escalatedTo: "admin",
        createdAt: Date.now(),
      });
    }

    // Log audit event
    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      action: "governance_enforcement",
      entityType: "workflow",
      entityId: args.workflowId,
      details: {
        violations: args.violations,
        healthScore: 100 - args.violations.length * 20,
      },
      createdAt: Date.now(),
    });
  },
});

export const getComplianceScore = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const violations = await ctx.db
      .query("governanceViolations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.eq(q.field("status"), "open"))
      .collect();

    const totalWorkflows = workflows.length;
    const workflowsWithIssues = workflows.filter(
      (w) => w.governanceHealth && w.governanceHealth.score < 80
    ).length;

    const complianceRate = totalWorkflows > 0
      ? ((totalWorkflows - workflowsWithIssues) / totalWorkflows) * 100
      : 100;

    return {
      complianceRate: Math.round(complianceRate),
      totalWorkflows,
      workflowsWithIssues,
      openViolations: violations.length,
      criticalViolations: violations.filter((v) => v.severity === "critical").length,
    };
  },
});

export const createGovernanceEscalation = mutation({
  args: {
    businessId: v.id("businesses"),
    workflowId: v.id("workflows"),
    violationType: v.string(),
    title: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) throw new Error("Workflow not found");

    const violations = await ctx.db
      .query("governanceViolations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const relatedViolations = violations.filter(
      (v) => v.status === "open"
    );

    if (relatedViolations.length > 0) {
      await ctx.db.insert("governanceEscalations", {
        businessId: args.businessId,
        workflowId: args.workflowId,
        violationType: args.violationType,
        count: relatedViolations.length,
        title: args.title,
        description: args.description,
        priority: "urgent",
        status: "pending",
        escalatedTo: "admin",
        createdAt: Date.now(),
      });
    }

    return { success: true };
  },
});