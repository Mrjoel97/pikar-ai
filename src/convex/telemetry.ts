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