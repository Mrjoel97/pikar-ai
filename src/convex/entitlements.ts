import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const CAPS = {
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
    workflows: 1000,
    runsPerDay: 10000,
    agents: 100,
    contactsPerList: 250000,
    emailsPerDay: 1000000,
  },
} as const;

type Tier = keyof typeof CAPS;

// Add: helper to fetch tier safely
function tierFor(biz: any): Tier {
  const raw = String(biz?.tier ?? "solopreneur").toLowerCase();
  const allowed = ["solopreneur", "startup", "sme", "enterprise"] as const;
  return (allowed as readonly string[]).includes(raw) ? (raw as Tier) : "solopreneur";
}

// Add: central limits fetcher
export const getUsageLimits = internalQuery({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const biz = await ctx.db.get(args.businessId);
    const tier: Tier = tierFor(biz);
    const caps = CAPS[tier];
    return { tier, caps };
  },
});

export const checkEntitlement = internalQuery({
  args: {
    businessId: v.id("businesses"),
    action: v.string(),
    context: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const biz = await ctx.db.get(args.businessId);
    const tier: Tier = tierFor(biz);

    // Per-campaign recipient limits by tier
    const perCampaignLimits: Record<Tier, number> = {
      solopreneur: 500,
      startup: 2000,
      sme: 10000,
      enterprise: 1_000_000,
    };
    const limitDefault = perCampaignLimits["solopreneur"];
    const tierLimit = perCampaignLimits[tier] ?? limitDefault;

    if (args.action === "emails.createCampaign" || args.action === "emails.sendCampaign") {
      const recipientsCount = Number((args.context as any)?.recipientsCount ?? 0);
      if (recipientsCount > tierLimit) {
        return {
          allowed: false,
          reason: `Plan limit exceeded: ${recipientsCount} recipients > ${tierLimit} for ${tier}`,
          tier,
          limit: tierLimit,
          action: args.action,
        };
      }
      return { allowed: true, tier, limit: tierLimit, action: args.action };
    }

    if (args.action === "featureFlags.toggle") {
      const allowed = tier === "enterprise";
      return allowed
        ? { allowed: true, tier, action: args.action }
        : { allowed: false, reason: "Feature flags are available on Enterprise plan only", tier, action: args.action };
    }

    if (args.action === "workflows.create") {
      const caps = CAPS[tier];
      let count = 0;
      for await (const _ of ctx.db.query("workflows").withIndex("by_business", (q) => q.eq("businessId", args.businessId))) {
        count++;
        if (count > caps.workflows) break;
      }
      if (count >= caps.workflows) {
        return { allowed: false, reason: `Plan limit exceeded: ${count} workflows >= ${caps.workflows} for ${tier}`, tier, limit: caps.workflows, action: args.action };
      }
      return { allowed: true, tier, limit: caps.workflows, action: args.action };
    }

    if (args.action === "workflows.run") {
      const caps = CAPS[tier];
      const since = Date.now() - 24 * 60 * 60 * 1000;
      let count = 0;
      // Count recent runs by business with index (assumes by_business)
      for await (const row of ctx.db.query("workflowRuns").withIndex("by_business", (q) => q.eq("businessId", args.businessId))) {
        if ((row as any)._creationTime >= since) {
          count++;
          if (count >= caps.runsPerDay) break;
        }
      }
      if (count >= caps.runsPerDay) {
        return { allowed: false, reason: `Daily run limit reached: ${count}/${caps.runsPerDay}`, tier, limit: caps.runsPerDay, action: args.action };
      }
      return { allowed: true, tier, limit: caps.runsPerDay, action: args.action };
    }

    if (args.action === "agents.create") {
      const caps = CAPS[tier];
      let count = 0;
      for await (const _ of ctx.db.query("aiAgents").withIndex("by_business", (q) => q.eq("businessId", args.businessId))) {
        count++;
        if (count >= caps.agents) break;
      }
      if (count >= caps.agents) {
        return { allowed: false, reason: `Agent limit exceeded: ${count}/${caps.agents}`, tier, limit: caps.agents, action: args.action };
      }
      return { allowed: true, tier, limit: caps.agents, action: args.action };
    }

    if (args.action === "contacts.addToList") {
      const caps = CAPS[tier];
      const listId = (args.context as any)?.listId;
      const toAdd = Number((args.context as any)?.count ?? 0);
      if (!listId) return { allowed: true, tier, action: args.action }; // no-op if unknown

      let count = 0;
      for await (const _ of ctx.db.query("contactListMembers").withIndex("by_list", (q) => q.eq("listId", listId))) {
        count++;
        if (count > caps.contactsPerList) break;
      }
      if (count + toAdd > caps.contactsPerList) {
        return { allowed: false, reason: `List size limit exceeded: ${count}+${toAdd} > ${caps.contactsPerList}`, tier, limit: caps.contactsPerList, action: args.action };
      }
      return { allowed: true, tier, limit: caps.contactsPerList, action: args.action };
    }

    if (args.action === "emails.sendCampaign") {
      const caps = CAPS[tier];
      const since = Date.now() - 24 * 60 * 60 * 1000;
      // Count total recipients attempted in last 24h (approx via emails table with status sent/sending/queued)
      let recipientsAttempted = 0;
      for await (const row of ctx.db.query("emails").withIndex("by_business", (q) => q.eq("businessId", args.businessId))) {
        if ((row as any)._creationTime >= since && row.type === "campaign") {
          const n = Array.isArray(row.recipients) ? row.recipients.length : 0;
          recipientsAttempted += n;
          if (recipientsAttempted >= caps.emailsPerDay) break;
        }
      }
      const thisCount = Number((args.context as any)?.recipientsCount ?? 0);
      if (recipientsAttempted + thisCount > caps.emailsPerDay) {
        return { allowed: false, reason: `Daily email limit exceeded: ${recipientsAttempted}+${thisCount} > ${caps.emailsPerDay}`, tier, limit: caps.emailsPerDay, action: args.action };
      }
      return { allowed: true, tier, limit: caps.emailsPerDay, action: args.action };
    }

    return { allowed: true, tier, action: args.action };
  },
});