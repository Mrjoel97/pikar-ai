import { query } from "./_generated/server";
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
  if (tier === "startup" || tier === "sme" || tier === "enterprise") return tier;
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