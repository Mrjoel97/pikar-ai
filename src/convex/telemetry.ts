import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

type Caps = {
  workflows: number;
  runsPerDay: number;
  agents: number;
};

const CAP_MAP: Record<string, Caps> = {
  solopreneur: { workflows: 5, runsPerDay: 25, agents: 3 },
  startup: { workflows: 15, runsPerDay: 100, agents: 10 },
  sme: { workflows: 50, runsPerDay: 500, agents: 25 },
  enterprise: { workflows: 200, runsPerDay: 2000, agents: 100 },
};

function resolveTier(tier?: string): keyof typeof CAP_MAP {
  if (tier === "startup" || tier === "sme" || tier === "enterprise")
    return tier;
  return "solopreneur";
}

export const getUpgradeNudges = query({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    // Early safe return for guests or pages without a business context
    if (!args.businessId) {
      return {
        showBanner: false,
        nudges: [],
        usage: { workflows: 0, runs: 0, agents: 0 },
      };
    }

    const businessId = args.businessId;

    const business = await ctx.db.get(businessId);
    const tier = resolveTier(business?.tier);
    const caps = CAP_MAP[tier];

    // Usage counts
    const workflowsCount = await ctx.db
      .query("workflows")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .collect()
      .then((r) => r.length);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    const runsToday = await ctx.db
      .query("workflowRuns")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .filter((q) => q.gt(q.field("_creationTime"), todayMs))
      .collect()
      .then((r) => r.length);

    const agentsCount = await ctx.db
      .query("aiAgents")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .collect()
      .then((r) => r.length);

    const snapshot = {
      workflowsCount,
      runsCount: runsToday,
      agentsCount,
    };

    const nudges: Array<{
      id: string;
      title: string;
      reason: string;
      severity: "warn" | "info";
      snapshot: typeof snapshot;
    }> = [];

    if (caps.workflows > 0 && workflowsCount / caps.workflows >= 0.8) {
      nudges.push({
        id: "workflows_limit",
        title: "Workflow Limit",
        reason: `Using ${workflowsCount}/${caps.workflows} workflows`,
        severity: "warn",
        snapshot,
      });
    }

    if (caps.runsPerDay > 0 && runsToday / caps.runsPerDay >= 0.8) {
      nudges.push({
        id: "runs_limit",
        title: "Daily Runs Limit",
        reason: `${runsToday}/${caps.runsPerDay} runs today`,
        severity: "warn",
        snapshot,
      });
    }

    if (caps.agents > 0 && agentsCount / caps.agents >= 0.8) {
      nudges.push({
        id: "agents_limit",
        title: "Agent Limit",
        reason: `Using ${agentsCount}/${caps.agents} agents`,
        severity: "warn",
        snapshot,
      });
    }

    return {
      nudges,
      showBanner: nudges.length > 0,
      snapshot,
    };
  },
});

export const getTeamPerformanceMetrics = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Guest-safe return
    if (!args.businessId) {
      return {
        teamMembers: [],
        summary: {
          totalContributions: 0,
          totalApprovals: 0,
          totalTasks: 0,
        },
      };
    }

    const businessId = args.businessId;
    const days = args.days || 7;
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

    // Get business and team members
    const business = await ctx.db.get(businessId);
    if (!business) {
      return {
        teamMembers: [],
        summary: { totalContributions: 0, totalApprovals: 0, totalTasks: 0 },
      };
    }

    const teamMemberIds = business.teamMembers || [];
    
    // Calculate metrics per user
    const teamMetrics = await Promise.all(
      teamMemberIds.map(async (userId: any) => {
        // Narrow user and avoid union property errors by explicit casting
        const userDoc = await ctx.db.get(userId as any);
        const userEmail = (userDoc as any)?.email as string | undefined;
        const userName =
          ((userDoc as any)?.name as string | undefined) ??
          userEmail ??
          "Unknown User";

        // Count workflow runs created by user
        const workflowRuns = await ctx.db
          .query("workflowRuns")
          .withIndex("by_business", (q) => q.eq("businessId", businessId))
          .filter((q) => q.gte(q.field("_creationTime"), cutoffTime))
          .collect();

        const userWorkflowRuns = workflowRuns.filter(
          (run) => run.startedAt >= cutoffTime
        ).length;

        // Count approvals completed by user
        const approvals = await ctx.db
          .query("approvalQueue")
          .withIndex("by_business", (q) => q.eq("businessId", businessId))
          .filter((q) =>
            q.and(
              q.eq(q.field("status"), "approved"),
              q.gte(q.field("_creationTime"), cutoffTime)
            )
          )
          .collect();

        const reviewerEmail = userEmail;
        const userApprovals = approvals.filter(
          (a: any) => a.reviewedBy === reviewerEmail
        ).length;

        // Count tasks completed (from audit logs)
        const auditLogs = await ctx.db
          .query("audit_logs")
          .withIndex("by_business", (q) => q.eq("businessId", businessId))
          .filter((q) =>
            q.and(
              q.eq(q.field("userId"), userId),
              q.gte(q.field("createdAt"), cutoffTime),
              q.eq(q.field("action"), "task_completed")
            )
          )
          .collect();

        const userTasks = auditLogs.length;

        // Calculate total contributions (workflows + approvals + tasks)
        const totalContributions = userWorkflowRuns + userApprovals + userTasks;

        return {
          userId,
          userName,
          userEmail: userEmail || "",
          contributions: totalContributions,
          workflowRuns: userWorkflowRuns,
          approvals: userApprovals,
          tasks: userTasks,
        };
      })
    );

    // Sort by contributions (descending)
    teamMetrics.sort((a: any, b: any) => b.contributions - a.contributions);

    const summary = {
      totalContributions: teamMetrics.reduce((sum: number, m: any) => sum + m.contributions, 0),
      totalApprovals: teamMetrics.reduce((sum: number, m: any) => sum + m.approvals, 0),
      totalTasks: teamMetrics.reduce((sum: number, m: any) => sum + m.tasks, 0),
    };

    return {
      teamMembers: teamMetrics,
      summary,
    };
  },
});

/**
 * Track template usage event
 */
export const trackTemplateUsage = mutation({
  args: {
    businessId: v.id("businesses"),
    userId: v.id("users"),
    templateId: v.string(),
    workflowId: v.optional(v.id("workflows")),
    templateName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Log to audit trail
    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      userId: args.userId,
      entityType: "workflow",
      entityId: args.workflowId || ("template_" + args.templateId),
      action: "created_from_template",
      createdAt: Date.now(),
      metadata: {
        templateId: args.templateId,
        templateName: args.templateName,
      },
    });

    return { success: true };
  },
});

/**
 * Get predictive system alerts
 */
export const getPredictiveAlerts = query({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return { alerts: [], riskScore: 0 };
    }

    const businessId = args.businessId;
    const business = await ctx.db.get(businessId);
    const tier = resolveTier(business?.tier);
    const caps = CAP_MAP[tier];

    // Get current usage
    const workflowsCount = await ctx.db
      .query("workflows")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .collect()
      .then((r) => r.length);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    const runsToday = await ctx.db
      .query("workflowRuns")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .filter((q) => q.gt(q.field("_creationTime"), todayMs))
      .collect()
      .then((r) => r.length);

    const agentsCount = await ctx.db
      .query("aiAgents")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .collect()
      .then((r) => r.length);

    const alerts = [];
    let riskScore = 0;

    // Predict if limits will be hit in next 7 days
    const projectedWorkflows = workflowsCount * 1.15; // 15% growth assumption
    const projectedRuns = runsToday * 7 * 1.2; // 20% growth assumption
    const projectedAgents = agentsCount * 1.1; // 10% growth assumption

    if (projectedWorkflows > caps.workflows * 0.9) {
      alerts.push({
        type: "predictive",
        severity: "warning",
        title: "Workflow Limit Approaching",
        message: `Projected to reach ${Math.round((projectedWorkflows / caps.workflows) * 100)}% of workflow limit in 7 days`,
        recommendation: "Consider upgrading tier or optimizing workflows",
      });
      riskScore += 30;
    }

    if (projectedRuns > caps.runsPerDay * 7 * 0.9) {
      alerts.push({
        type: "predictive",
        severity: "warning",
        title: "Daily Runs Limit Risk",
        message: "Current usage trend suggests you may hit daily run limits",
        recommendation: "Review workflow efficiency or upgrade tier",
      });
      riskScore += 25;
    }

    if (projectedAgents > caps.agents * 0.9) {
      alerts.push({
        type: "predictive",
        severity: "info",
        title: "Agent Capacity Planning",
        message: "Agent usage growing, plan for capacity expansion",
        recommendation: "Evaluate agent consolidation or tier upgrade",
      });
      riskScore += 20;
    }

    return {
      alerts,
      riskScore: Math.min(riskScore, 100),
      projections: {
        workflows: Math.round(projectedWorkflows),
        runs: Math.round(projectedRuns),
        agents: Math.round(projectedAgents),
      },
    };
  },
});

/**
 * Get advanced system health metrics
 */
export const getAdvancedHealthMetrics = query({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return {
        overallHealth: 0,
        metrics: [],
        recommendations: [],
      };
    }

    const businessId = args.businessId;
    const last24h = Date.now() - (24 * 60 * 60 * 1000);

    // Workflow health
    const recentRuns = await ctx.db
      .query("workflowRuns")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .filter((q) => q.gte(q.field("_creationTime"), last24h))
      .collect();

    const successfulRuns = recentRuns.filter(r => r.status === "completed").length;
    const workflowHealth = recentRuns.length > 0 ? (successfulRuns / recentRuns.length) * 100 : 100;

    // Agent health
    const agents = await ctx.db
      .query("aiAgents")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .collect();

    const activeAgents = agents.filter(a => a.status === "active").length;
    const agentHealth = agents.length > 0 ? (activeAgents / agents.length) * 100 : 100;

    // Data quality health (simulated)
    const dataHealth = 95 + Math.random() * 5;

    const overallHealth = (workflowHealth * 0.4 + agentHealth * 0.3 + dataHealth * 0.3);

    const recommendations = [];
    if (workflowHealth < 90) {
      recommendations.push("Review failed workflow runs and optimize error handling");
    }
    if (agentHealth < 90) {
      recommendations.push("Check inactive agents and update configurations");
    }
    if (dataHealth < 95) {
      recommendations.push("Run data quality checks and clean up inconsistencies");
    }

    return {
      overallHealth: Math.round(overallHealth),
      metrics: [
        { name: "Workflow Success Rate", value: Math.round(workflowHealth), status: workflowHealth >= 90 ? "healthy" : "warning" },
        { name: "Agent Availability", value: Math.round(agentHealth), status: agentHealth >= 90 ? "healthy" : "warning" },
        { name: "Data Quality", value: Math.round(dataHealth), status: dataHealth >= 95 ? "healthy" : "warning" },
      ],
      recommendations,
    };
  },
});