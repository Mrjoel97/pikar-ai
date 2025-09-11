import { v } from "convex/values";
import { query } from "./_generated/server";

type Nudge = {
  key: string;
  message: string;
  tierTarget: "startup" | "sme" | "enterprise";
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
        message: "You’re growing fast. Unlock team collaboration and approvals with Startup.",
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
