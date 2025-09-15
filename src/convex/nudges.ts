import { v } from "convex/values";
import { query } from "./_generated/server";

type Nudge = {
  key: string;
  message: string;
  tierTarget: "startup" | "sme" | "enterprise";
};

export const UPGRADE_THRESHOLDS = {
  solopreneur: {
    workflows: 5,
    runsPerDay: 25,
    agents: 3,
    contactsPerList: 1000,
    emailsPerDay: 1000,
  },
  startup: {
    workflows: 20,
    runsPerDay: 200,
    agents: 10,
    contactsPerList: 5000,
    emailsPerDay: 10000,
  },
  sme: {
    workflows: 100,
    runsPerDay: 1000,
    agents: 25,
    contactsPerList: 50000,
    emailsPerDay: 100000,
  },
  enterprise: {
    // No upper bound shown for enterprise; leave for consistency
    workflows: 1000,
    runsPerDay: 10000,
    agents: 100,
    contactsPerList: 250000,
    emailsPerDay: 1000000,
  },
} as const;

export const UPGRADE_COPY: Record<
  keyof typeof UPGRADE_THRESHOLDS,
  Record<
    "workflows" | "runsPerDay" | "agents" | "contactsPerList" | "emailsPerDay",
    { title: string; body: string; cta: string }
  >
> = {
  solopreneur: {
    workflows: {
      title: "Unlock more workflows",
      body: "You've reached the limit for Solopreneur. Upgrade to add more automated processes tailored to growth.",
      cta: "Upgrade to Startup",
    },
    runsPerDay: {
      title: "Need more daily runs?",
      body: "Increase daily executions to handle more marketing or operations automation.",
      cta: "Upgrade to Startup",
    },
    agents: {
      title: "Add more AI agents",
      body: "Scale beyond 3 agents to cover content, sales intel, and operations simultaneously.",
      cta: "Upgrade to Startup",
    },
    contactsPerList: {
      title: "Grow your audience",
      body: "Your list is full. Increase contact list capacity to reach more customers.",
      cta: "Upgrade to Startup",
    },
    emailsPerDay: {
      title: "Send more emails per day",
      body: "Raise daily email throughput for campaigns and announcements.",
      cta: "Upgrade to Startup",
    },
  },
  startup: {
    workflows: {
      title: "Scale workflows across teams",
      body: "Go beyond 20 workflows to orchestrate multi-team processes.",
      cta: "Upgrade to SME",
    },
    runsPerDay: {
      title: "Increase daily throughput",
      body: "Raise run capacity to handle heavier workloads with headroom.",
      cta: "Upgrade to SME",
    },
    agents: {
      title: "More specialized agents",
      body: "Add specialized agents for analytics, governance, and support.",
      cta: "Upgrade to SME",
    },
    contactsPerList: {
      title: "Bigger lists, bigger reach",
      body: "Lift list limits to grow your acquisition programs.",
      cta: "Upgrade to SME",
    },
    emailsPerDay: {
      title: "Higher send limits",
      body: "Send higher-volume campaigns reliably with prioritized delivery.",
      cta: "Upgrade to SME",
    },
  },
  sme: {
    workflows: {
      title: "Enterprise-grade orchestration",
      body: "Manage hundreds of workflows across regions with robust governance.",
      cta: "Upgrade to Enterprise",
    },
    runsPerDay: {
      title: "Enterprise throughput",
      body: "Enable thousands of daily runs with SLA-backed stability.",
      cta: "Upgrade to Enterprise",
    },
    agents: {
      title: "Enterprise agent fleet",
      body: "Add dozens of agents with RBAC and centralized oversight.",
      cta: "Upgrade to Enterprise",
    },
    contactsPerList: {
      title: "Large-scale lists",
      body: "Expand list sizes to support large segments and multi-brand reach.",
      cta: "Upgrade to Enterprise",
    },
    emailsPerDay: {
      title: "Enterprise send capacity",
      body: "Deliver large campaigns with batching, retries, and observability.",
      cta: "Upgrade to Enterprise",
    },
  },
  enterprise: {
    workflows: {
      title: "At limit",
      body: "You're near your configured Enterprise ceiling. Contact support for custom scaling.",
      cta: "Contact Sales",
    },
    runsPerDay: {
      title: "At limit",
      body: "You're near your configured Enterprise ceiling. Contact support for custom scaling.",
      cta: "Contact Sales",
    },
    agents: {
      title: "At limit",
      body: "You're near your configured Enterprise ceiling. Contact support for custom scaling.",
      cta: "Contact Sales",
    },
    contactsPerList: {
      title: "At limit",
      body: "You're near your configured Enterprise ceiling. Contact support for custom scaling.",
      cta: "Contact Sales",
    },
    emailsPerDay: {
      title: "At limit",
      body: "You're near your configured Enterprise ceiling. Contact support for custom scaling.",
      cta: "Contact Sales",
    },
  },
};

export const getUpgradeNudges = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args): Promise<Nudge[]> => {
    // Gather simple signals
    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const agents = await ctx.db
      .query("aiAgents")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const business = await ctx.db.get(args.businessId);

    const teamSize = business?.teamMembers?.length ?? 1;
    const activeWorkflows = workflows.filter((w) => w.status === "active").length;
    const activeAgents = agents.filter((a) => a.status === "active").length;

    const nudges: Nudge[] = [];

    // Solopreneur -> Startup
    if (activeWorkflows >= 5 || activeAgents >= 5) {
      nudges.push({
        key: "growth_team_collab",
        message: "You're growing fast. Unlock team collaboration and approvals with Startup.",
        tierTarget: "startup",
      });
    }

    // Startup -> SME
    if (teamSize > 15 || activeWorkflows >= 10) {
      nudges.push({
        key: "compliance_governance",
        message: "Scale governance with advanced approvals and compliance in SME.",
        tierTarget: "sme",
      });
    }

    // SME -> Enterprise
    if (teamSize > 100) {
      nudges.push({
        key: "enterprise_controls",
        message: "Enable enterprise controls, SSO, and global dashboards with Enterprise.",
        tierTarget: "enterprise",
      });
    }

    return nudges;
  },
});