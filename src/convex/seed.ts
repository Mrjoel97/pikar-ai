// @ts-nocheck

import { Id } from "./_generated/dataModel";
import { action, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { AGENT_CATALOG_SEED } from "./data/agentCatalogSeed";

export const run = action({
  args: {},
  handler: async (ctx): Promise<{
    message: string;
    summary: FullAppInspectionReport["summary"];
    timestamp: number;
  }> => {
    const report: FullAppInspectionReport = await ctx.runAction(
      api.inspector.runInspection,
      {}
    );
    return {
      message: "Inspection completed",
      summary: report.summary,
      timestamp: report.timestamp,
    };
  }
});

export const seedOneCommand = action({
  args: {},
  handler: async (
    ctx,
  ): Promise<{
    message: string;
    businessId?: Id<"businesses">;
    initiativeId?: Id<"initiatives">;
    diagnosticId?: Id<"diagnostics">;
  }> => {
    // Deterministic seed flow using a single command
    const email = "demo@pikar.ai";

    // Ensure the seed user exists
    await ctx.runMutation(api.users.ensureSeedUser, { email });

    // Seed business/initiative/diagnostics
    const seeded: {
      businessId?: Id<"businesses">;
      initiativeId?: Id<"initiatives">;
      diagnosticId?: Id<"diagnostics">;
    } = await ctx.runMutation(api.initiatives.seedForEmail, { email });

    // Also seed KPIs if business created (idempotent if already seeded elsewhere)
    if (seeded?.businessId) {
      try {
        await ctx.runMutation(api.kpis.upsert, {
          businessId: seeded.businessId,
          date: new Date().toISOString().slice(0, 10),
          visitors: 420,
          subscribers: 180,
          engagement: 62,
          revenue: 12500,
          visitorsDelta: 8,
          subscribersDelta: 5,
          engagementDelta: 3,
          revenueDelta: 12,
        });
      } catch {
        // best-effort
      }
    }

    return {
      message: "Deterministic seed completed",
      ...seeded,
    };
  },
});

export const seedDemo: any = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args): Promise<{
    message: string;
    businessId?: Id<"businesses">;
    initiativeId?: Id<"initiatives">;
    diagnosticId?: Id<"diagnostics">;
  }> => {
    // Ensure a user exists for the provided email before seeding
    await ctx.runMutation(api.users.ensureSeedUser, { email: args.email });

    // Create or find business + initiative for the email
    const seeded: {
      businessId?: Id<"businesses">;
      initiativeId?: Id<"initiatives">;
      diagnosticId?: Id<"diagnostics">;
    } = await ctx.runMutation(api.initiatives.seedForEmail, {
      email: args.email,
    });

    // Seed AI agents bypassing RBAC using an internal mutation
    if (seeded?.businessId) {
      await ctx.runMutation(internal.aiAgents.seedForBusinessInternal, {
        businessId: seeded.businessId,
      });
    }

    // Seed KPIs + 3 SNAP tasks for Solopreneur testing if business exists
    if (seeded?.businessId) {
      const today = new Date();
      const yyyyMmDd = today.toISOString().slice(0, 10);

      // Upsert KPI snapshot with simple positive deltas
      await ctx.runMutation(api.kpis.upsert, {
        businessId: seeded.businessId,
        date: yyyyMmDd,
        visitors: 420,
        subscribers: 180,
        engagement: 62,
        revenue: 12500,
        visitorsDelta: 8,
        subscribersDelta: 5,
        engagementDelta: 3,
        revenueDelta: 12,
      });

      // Create three focus tasks with varying priority/urgency
      await ctx.runMutation(api.tasks.create, {
        businessId: seeded.businessId,
        initiativeId: seeded.initiativeId,
        title: "Publish weekly newsletter",
        description: "Send the curated newsletter to subscribers.",
        priority: "high",
        urgent: true,
        dueDate: Date.now() + 24 * 60 * 60 * 1000,
      });
      await ctx.runMutation(api.tasks.create, {
        businessId: seeded.businessId,
        initiativeId: seeded.initiativeId,
        title: "Schedule social posts",
        description: "Queue 5 posts for the week.",
        priority: "medium",
        urgent: false,
      });
      await ctx.runMutation(api.tasks.create, {
        businessId: seeded.businessId,
        initiativeId: seeded.initiativeId,
        title: "Review analytics snapshot",
        description: "Check engagement trends and top content.",
        priority: "low",
        urgent: false,
      });
    }

    return {
      message: "Demo data seeded",
      ...seeded,
    };
  },
});

export const seedForCurrentUser = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) {
      throw new Error("Not authenticated");
    }

    const email = identity.email;

    // Ensure user
    await ctx.runMutation(api.users.ensureSeedUser, { email });

    // Seed business/initiative/diagnostics
    const seeded: {
      businessId?: Id<"businesses">;
      initiativeId?: Id<"initiatives">;
      diagnosticId?: Id<"diagnostics">;
    } = await ctx.runMutation(api.initiatives.seedForEmail, { email });

    // Seed AI agents (best effort)
    if (seeded?.businessId) {
      try {
        await ctx.runMutation(internal.aiAgents.seedForBusinessInternal, {
          businessId: seeded.businessId,
        });
      } catch {
        // ignore
      }
    }

    // KPIs + Focus tasks
    if (seeded?.businessId) {
      const today = new Date();
      const yyyyMmDd = today.toISOString().slice(0, 10);

      try {
        await ctx.runMutation(api.kpis.upsert, {
          businessId: seeded.businessId,
          date: yyyyMmDd,
          visitors: 420,
          subscribers: 180,
          engagement: 62,
          revenue: 12500,
          visitorsDelta: 8,
          subscribersDelta: 5,
          engagementDelta: 3,
          revenueDelta: 12,
        });
      } catch {
        // ignore
      }

      // Seed 3 tasks
      await ctx.runMutation(api.tasks.create, {
        businessId: seeded.businessId,
        initiativeId: seeded.initiativeId,
        title: "Publish weekly newsletter",
        description: "Send the curated newsletter to subscribers.",
        priority: "high",
        urgent: true,
        dueDate: Date.now() + 24 * 60 * 60 * 1000,
      });
      await ctx.runMutation(api.tasks.create, {
        businessId: seeded.businessId,
        initiativeId: seeded.initiativeId,
        title: "Schedule social posts",
        description: "Queue 5 posts for the week.",
        priority: "medium",
        urgent: false,
      });
      await ctx.runMutation(api.tasks.create, {
        businessId: seeded.businessId,
        initiativeId: seeded.initiativeId,
        title: "Review analytics snapshot",
        description: "Check engagement trends and top content.",
        priority: "low",
        urgent: false,
      });
    }

    return {
      message: "Seeded demo data for current user",
      ...seeded,
    };
  },
});

export const seedKpis: any = action({
  args: {},
  handler: async (ctx): Promise<any> => {
    const res: any = await ctx.runAction(api.seed.seedForCurrentUser, {});
    return { message: "KPIs seeded (via seedForCurrentUser)", ...res };
  },
});

export const seedTasks: any = action({
  args: {},
  handler: async (ctx): Promise<any> => {
    const res: any = await ctx.runAction(api.seed.seedForCurrentUser, {});
    return { message: "Tasks seeded (via seedForCurrentUser)", ...res };
  },
});

export const seedFeatureFlagsPreset = action({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const flags: Array<{
      businessId?: Id<"businesses">;
      flagName: string;
      isEnabled: boolean;
      rolloutPercentage: number;
      conditions?: {
        userTier?: string[];
        businessTier?: string[];
      };
    }> = [
      {
        businessId: args.businessId,
        flagName: "solopreneur_quick_actions",
        isEnabled: true,
        rolloutPercentage: 100,
        conditions: { userTier: ["solopreneur"] },
      },
      {
        businessId: args.businessId,
        flagName: "solopreneur_focus_panel",
        isEnabled: true,
        rolloutPercentage: 100,
        conditions: { userTier: ["solopreneur"] },
      },
      {
        businessId: args.businessId,
        flagName: "startup_growth_panels",
        isEnabled: true,
        rolloutPercentage: 100,
        conditions: { userTier: ["startup"] },
      },
      {
        businessId: args.businessId,
        flagName: "sme_insights",
        isEnabled: true,
        rolloutPercentage: 100,
        conditions: { businessTier: ["sme"] },
      },
      {
        businessId: args.businessId,
        flagName: "enterprise_governance",
        isEnabled: true,
        rolloutPercentage: 100,
        conditions: { businessTier: ["enterprise"] },
      },
      {
        businessId: args.businessId,
        flagName: "guest_mode_demo",
        isEnabled: true,
        rolloutPercentage: 100,
      },
      {
        businessId: args.businessId,
        flagName: "email_campaigns_basic",
        isEnabled: true,
        rolloutPercentage: 100,
      },
    ];

    // Upsert each flag via public mutation
    for (const f of flags) {
      await ctx.runMutation(api.featureFlags.upsertFeatureFlag, {
        businessId: f.businessId,
        flagName: f.flagName,
        isEnabled: f.isEnabled,
        rolloutPercentage: f.rolloutPercentage,
        conditions: f.conditions
          ? {
              userTier: f.conditions.userTier,
              businessTier: f.conditions.businessTier,
            }
          : undefined,
      });
    }

    return { message: "Feature flags seeded", count: flags.length, businessId: args.businessId, ts: now };
  },
});

export const seedAllDemo: any = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args): Promise<{
    message: string;
    email: string;
    businessId?: Id<"businesses">;
    globalFlags: any;
    businessFlags: any;
  }> => {
    // Ensure a user exists for the provided email before seeding
    await ctx.runMutation(api.users.ensureSeedUser, { email: args.email });

    // Create or find business + initiative for the email
    const seeded: {
      businessId?: Id<"businesses">;
      initiativeId?: Id<"initiatives">;
      diagnosticId?: Id<"diagnostics">;
    } = await ctx.runMutation(api.initiatives.seedForEmail, {
      email: args.email,
    });

    // Seed AI agents bypassing RBAC using an internal mutation (best effort)
    if (seeded?.businessId) {
      try {
        await ctx.runMutation(internal.aiAgents.seedForBusinessInternal, {
          businessId: seeded.businessId,
        });
      } catch {
        // ignore
      }
    }

    // Seed KPIs + 3 SNAP tasks for Solopreneur testing if business exists
    if (seeded?.businessId) {
      const today = new Date();
      const yyyyMmDd = today.toISOString().slice(0, 10);

      try {
        await ctx.runMutation(api.kpis.upsert, {
          businessId: seeded.businessId,
          date: yyyyMmDd,
          visitors: 420,
          subscribers: 180,
          engagement: 62,
          revenue: 12500,
          visitorsDelta: 8,
          subscribersDelta: 5,
          engagementDelta: 3,
          revenueDelta: 12,
        });
      } catch {
        // best-effort
      }

      await ctx.runMutation(api.tasks.create, {
        businessId: seeded.businessId,
        initiativeId: seeded.initiativeId,
        title: "Publish weekly newsletter",
        description: "Send the curated newsletter to subscribers.",
        priority: "high",
        urgent: true,
        dueDate: Date.now() + 24 * 60 * 60 * 1000,
      });
      await ctx.runMutation(api.tasks.create, {
        businessId: seeded.businessId,
        initiativeId: seeded.initiativeId,
        title: "Schedule social posts",
        description: "Queue 5 posts for the week.",
        priority: "medium",
        urgent: false,
      });
      await ctx.runMutation(api.tasks.create, {
        businessId: seeded.businessId,
        initiativeId: seeded.initiativeId,
        title: "Review analytics snapshot",
        description: "Check engagement trends and top content.",
        priority: "low",
        urgent: false,
      });
    }

    // Seed global feature flags
    const globalFlags: any = await ctx.runAction(api.seed.seedFeatureFlagsPreset, {});

    // If business available, also seed business-scoped flags
    let businessFlags: any = null;
    const businessId: Id<"businesses"> | undefined = seeded?.businessId;
    if (businessId) {
      businessFlags = await ctx.runAction(api.seed.seedFeatureFlagsPreset, { businessId }).catch(() => null);
    }

    return {
      message: "All demo data + flags seeded",
      email: args.email,
      businessId,
      globalFlags,
      businessFlags,
    };
  },
});

export const seedTieredTemplatesAndAgents = action({
  args: {
    creatorEmail: v.optional(v.string()), // default to demo@pikar.ai if not provided
  },
  handler: async (ctx, args) => {
    const creatorEmail = args.creatorEmail ?? "demo@pikar.ai";
    // Ensure a creator user exists
    await ctx.runMutation(api.users.ensureSeedUser, { email: creatorEmail });
    const creator =
      (await ctx.runQuery(((api as any).users?.getByEmail) as any, {
        email: creatorEmail,
      }).catch(() => null)) ||
      (await (async () => {
        const u = await ctx.runQuery(((api as any).users?.findByEmail) as any, {
          email: creatorEmail,
        }).catch(() => null);
        return u;
      })());

    // Fallback: fetch directly from DB via internal query bridge if helper queries not available
    let creatorId = null as Id<"users"> | null;
    try {
      if (creator?._id) creatorId = creator._id as Id<"users">;
    } catch {
      // ignore
    }
    if (!creatorId) {
      // last resort: query users table by email (public query may not exist; use action+internal not allowed)
      // use seed user creation flow: the ensureSeedUser should have created the user; attempt to find via index scan proxy through mutations not available.
      // To avoid failing, we will seed with a temporary creator using business owner path when available. If not, we set createdBy to a deterministic dummy by creating a new user through ensureSeedUser and querying again via a light mutation below if available.
      // If we cannot resolve a user id, we'll skip createdBy (it's optional in schema).
    }

    const TIERS: Array<string> = ["solopreneur", "startup", "sme", "enterprise"];
    const INDUSTRIES: Array<string> = [
      "ecommerce",
      "saas",
      "healthcare",
      "fintech",
      "education",
      "manufacturing",
      "retail",
      "marketing",
      "real_estate",
      "hospitality",
    ];
    const CATEGORIES: Array<string> = [
      "lead_generation",
      "email_marketing",
      "content_calendar",
      "customer_success",
      "sales_outreach",
      "seo_growth",
      "onboarding",
      "churn_recovery",
      "product_launch",
      "ops_automation",
    ];
    // 480 templates total: 120 per tier.
    // For each tier: 10 industries x 12 patterns = 120.
    const patterns: Array<string> = [
      "Quickstart",
      "Pro Playbook",
      "Deep Dive",
      "Performance Sprint",
      "Retention Boost",
      "CRO Drill",
      "Launch Blitz",
      "Nurture Stream",
      "SEO Track",
      "Social Burst",
      "Analytics Sync",
      "Ops Auto",
    ];

    // Align recommendedAgents with names of seeded agent templates by tier
    const RECO_AGENT_NAMES: Record<string, string[]> = {
      solopreneur: [
        "Solo Campaign Planner",
        "Solo Copywriter",
        "Solo SEO Scout",
        "Solo Social Scheduler",
        "Inbox Outreach",
        "Newsletter Builder",
        "Landing Optimizer",
        "Metrics Snapshot",
      ],
      startup: [
        "Startup GTM Planner",
        "Growth Copywriter",
        "SEO Accelerator",
        "Social Amplifier",
        "Sales SDR Agent",
        "Lifecycle Emailer",
        "CRO Optimizer",
        "Growth Analyst",
      ],
      sme: [
        "SME Campaign Orchestrator",
        "Brand Copy Studio",
        "SEO Program Manager",
        "Paid Media Optimizer",
        "Sales Enrichment",
        "Retention Email Ops",
        "Site CRO Lead",
        "BI Analyst",
      ],
      enterprise: [
        "Enterprise Program Director",
        "Enterprise Content Studio",
        "Enterprise SEO Lead",
        "Global Paid Ops",
        "RevOps SDR Supervisor",
        "Compliance Mailer",
        "CRO Council",
        "Enterprise Insights",
      ],
    };

    let createdTemplates = 0;
    for (const tier of TIERS) {
      for (const industry of INDUSTRIES) {
        for (const pattern of patterns) {
          const name = `${tier.toUpperCase()} • ${industry} • ${pattern}`;
          const description = `A ${pattern.toLowerCase()} workflow tailored for ${industry} (${tier}).`;
          const steps = [
            { name: "Plan", type: "plan", config: { depth: pattern } },
            { name: "Execute", type: "action", config: { channel: "email" } },
            {
              name: "Review",
              type: "review",
              config: { metrics: ["roi", "conversion", "reach"] },
            },
          ];

          // Recommend real agent template names that are seeded for this tier
          const slug = pattern.toLowerCase().replace(/\s+/g, "_");
          const agentPool: string[] = (RECO_AGENT_NAMES[tier] ?? []).map((n) => n);
          const poolLen = agentPool.length || 1;
          const offset =
            (patterns.indexOf(pattern) + INDUSTRIES.indexOf(industry)) % poolLen;
          const recommendedAgents =
            agentPool.length > 0
              ? [
                  agentPool[offset],
                  agentPool[(offset + 1) % poolLen],
                  agentPool[(offset + 2) % poolLen],
                ]
              : [];

          const industryTags = [industry];
          // Normalize tags to match UI filtering
          const tags = [`tier:${tier}`, `pattern:${slug}`, `industry:${industry}`];

          await ctx.runMutation(((api as any).workflows?.upsertWorkflowTemplate) as any, {
            name,
            description,
            category: "growth",
            steps,
            recommendedAgents,
            industryTags,
            tags,
            createdBy: (creatorId as any) ?? undefined,
            tier,
          });

          createdTemplates += 1;
        }
      }
    }

    // Seed agent templates per tier (8 per tier = 32 total)
    const AGENTS_BY_TIER: Record<string, Array<{ name: string; desc: string; tags: string[] }>> = {
      solopreneur: [
        { name: "Solo Campaign Planner", desc: "Plan lean campaigns.", tags: ["planning", "lightweight"] },
        { name: "Solo Copywriter", desc: "Generate concise, high-CTR copy.", tags: ["copywriting", "conversion"] },
        { name: "Solo SEO Scout", desc: "Quick keyword suggestions.", tags: ["seo"] },
        { name: "Solo Social Scheduler", desc: "Schedule multi-network posts.", tags: ["social", "scheduler"] },
        { name: "Inbox Outreach", desc: "Personalized cold emails.", tags: ["sales", "outreach"] },
        { name: "Newsletter Builder", desc: "Build weekly digest fast.", tags: ["email", "newsletter"] },
        { name: "Landing Optimizer", desc: "Improve hero and CTAs.", tags: ["conversion", "ux"] },
        { name: "Metrics Snapshot", desc: "Daily KPIs overview.", tags: ["analytics", "kpi"] },
      ],
      startup: [
        { name: "Startup GTM Planner", desc: "Coordinate GTM launch.", tags: ["planning", "gtm"] },
        { name: "Growth Copywriter", desc: "A/B-ready high-impact copy.", tags: ["copywriting", "ab_test"] },
        { name: "SEO Accelerator", desc: "Keyword clustering + briefs.", tags: ["seo", "content"] },
        { name: "Social Amplifier", desc: "Multi-channel amplification.", tags: ["social", "multi"] },
        { name: "Sales SDR Agent", desc: "Prospect and sequence.", tags: ["sales", "sdr"] },
        { name: "Lifecycle Emailer", desc: "Onboarding and retention.", tags: ["email", "lifecycle"] },
        { name: "CRO Optimizer", desc: "Run CRO experiments.", tags: ["conversion", "experiments"] },
        { name: "Growth Analyst", desc: "Funnel and cohort insights.", tags: ["analytics", "funnel"] },
      ],
      sme: [
        { name: "SME Campaign Orchestrator", desc: "Cross-team orchestration.", tags: ["planning", "orchestration"] },
        { name: "Brand Copy Studio", desc: "On-brand messaging at scale.", tags: ["copywriting", "brand"] },
        { name: "SEO Program Manager", desc: "Program-level SEO ops.", tags: ["seo", "program"] },
        { name: "Paid Media Optimizer", desc: "Optimize ads spend.", tags: ["paid", "optimization"] },
        { name: "Sales Enrichment", desc: "Enrich and route leads.", tags: ["sales", "ops"] },
        { name: "Retention Email Ops", desc: "Automated retention flows.", tags: ["email", "retention"] },
        { name: "Site CRO Lead", desc: "CRO roadmap and tests.", tags: ["conversion", "roadmap"] },
        { name: "BI Analyst", desc: "Dashboards and insights.", tags: ["analytics", "bi"] },
      ],
      enterprise: [
        { name: "Enterprise Program Director", desc: "Global program planning.", tags: ["planning", "governance"] },
        { name: "Enterprise Content Studio", desc: "Compliance-aware content.", tags: ["copywriting", "compliance"] },
        { name: "Enterprise SEO Lead", desc: "Multi-domain SEO.", tags: ["seo", "enterprise"] },
        { name: "Global Paid Ops", desc: "Regional budget optimizer.", tags: ["paid", "governance"] },
        { name: "RevOps SDR Supervisor", desc: "Pipeline and SLAs.", tags: ["sales", "revops"] },
        { name: "Compliance Mailer", desc: "Compliant messaging flows.", tags: ["email", "compliance"] },
        { name: "CRO Council", desc: "Cross-unit CRO governance.", tags: ["conversion", "governance"] },
        { name: "Enterprise Insights", desc: "Executive analytics.", tags: ["analytics", "executive"] },
      ],
    };

    let agentTemplatesSeeded = 0;
    for (const tier of TIERS) {
      const entries = AGENTS_BY_TIER[tier] ?? [];
      for (const a of entries) {
        await ctx.runMutation(((api as any).aiAgents?.upsertAgentTemplate) as any, {
          name: a.name,
          description: a.desc,
          tags: [tier, ...a.tags],
          tier,
          configPreview: {
            model: "gpt-4o-mini",
            parameters: { temperature: tier === "enterprise" ? 0.3 : 0.6 },
            capabilities: a.tags,
          },
          createdBy: (creatorId as any) ?? (await ctx.runQuery(((api as any).users?.getAny) as any, {}).catch(() => null))?._id ?? (undefined as any),
        });
        agentTemplatesSeeded += 1;
      }
    }

    return {
      message: "Seeded tiered templates (120 per tier) and agent templates",
      workflowTemplates: createdTemplates, // expect 480
      agentTemplates: agentTemplatesSeeded, // 32
    };
  },
});

export const seedDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    // Resolve the current user's business via existing query
    const business = await ctx.runQuery(api.businesses.currentUserBusiness, {});
    if (!business?._id) {
      throw new Error("No business found for current user. Complete onboarding first.");
    }
    const businessId = business._id;
    const ownerId = business.ownerId;
    const now = Date.now();

    // Seed tasks if none exist
    const existingTask = await ctx.db
      .query("tasks")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .take(1);

    let tasksCreated = 0;
    if (existingTask.length === 0) {
      const tasksToCreate = [
        {
          title: "Plan weekly content",
          description: "Outline 3 blog posts and 5 social posts",
          priority: "high" as const,
          urgent: false,
          status: "todo" as const,
        },
        {
          title: "Send welcome newsletter",
          description: "Announce new features and tips",
          priority: "medium" as const,
          urgent: false,
          status: "todo" as const,
        },
        {
          title: "Review analytics",
          description: "Identify top channels and trends",
          priority: "low" as const,
          urgent: false,
          status: "todo" as const,
        },
        {
          title: "Setup approvals",
          description: "Add approvers for marketing workflows",
          priority: "high" as const,
          urgent: true,
          status: "in_progress" as const,
        },
        {
          title: "Clean contact list",
          description: "Remove bounces and unsubscribes",
          priority: "medium" as const,
          urgent: false,
          status: "todo" as const,
        },
      ];

      for (const t of tasksToCreate) {
        await ctx.db.insert("tasks", {
          businessId,
          title: t.title,
          description: t.description,
          priority: t.priority,
          urgent: t.urgent,
          status: t.status,
          createdAt: now,
          updatedAt: now,
          // initiativeId intentionally omitted
        });
        tasksCreated += 1;
      }
    }

    // Seed contacts if none exist
    const existingContact = await ctx.db
      .query("contacts")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .take(1);

    let contactsCreated = 0;
    if (existingContact.length === 0) {
      const contactsToCreate = [
        { email: "alex@example.com", name: "Alex Rivera" },
        { email: "sam@example.com", name: "Sam Lee" },
        { email: "jordan@example.com", name: "Jordan Kim" },
        { email: "devon@example.com", name: "Devon Patel" },
      ];
      for (const c of contactsToCreate) {
        await ctx.db.insert("contacts", {
          businessId,
          email: c.email,
          name: c.name,
          tags: ["newsletter"],
          status: "subscribed",
          source: "seed",
          createdBy: ownerId,
          createdAt: now,
          lastEngagedAt: now,
        });
        contactsCreated += 1;
      }
    }

    // Seed KPI snapshot for today if missing
    const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const existingKpi = await ctx.db
      .query("dashboardKpis")
      .withIndex("by_business_and_date", (q) => q.eq("businessId", businessId).eq("date", dateStr))
      .unique();

    let kpisCreated = 0;
    if (!existingKpi) {
      await ctx.db.insert("dashboardKpis", {
        businessId,
        date: dateStr,
        visitors: 1240,
        subscribers: 560,
        engagement: 68,
        revenue: 4200,
        visitorsDelta: 12,
        subscribersDelta: 8,
        engagementDelta: 3,
        revenueDelta: 15,
      });
      kpisCreated = 1;
    }

    return {
      tasksCreated,
      contactsCreated,
      kpisCreated,
      businessId,
    };
  },
});

export const seedAgentCatalogMutation = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    type Row = {
      agent_key: string;
      display_name: string;
      short_desc: string;
      long_desc: string;
      capabilities: string[];
      default_model: string;
      model_routing: string;
      prompt_template_version: string;
      prompt_templates: string;
      input_schema: string;
      output_schema: string;
      tier_restrictions: string[];
      confidence_hint: number;
      active: boolean;
    };

    const rows: Array<Row> = [
      {
        agent_key: "strategic_planning",
        display_name: "Strategic Planning Agent",
        short_desc: "Market analysis, scenario planning, roadmaps and risk mitigation.",
        long_desc:
          "Performs market scans, SWOT, scenario modelling and creates prioritized roadmaps with confidence scoring and ownerable tasks.",
        capabilities: ["market_scan", "swot", "scenario_modeling", "roadmap", "risk_assessment"],
        default_model: "gpt-4",
        model_routing: "{\"analysis\":\"gpt-4\",\"dialog\":\"gpt-3.5-turbo\"}",
        prompt_template_version: "v1.0",
        prompt_templates: `{
          "v1.0": {
            "template_id":"sp_v1.0",
            "title":"Strategic Planning - Market Scan v1.0",
            "description":"Produces SWOT + market-entry roadmap given inputs",
            "prompt_text":"You are a senior strategy consultant. Given company_profile: {{company_profile}} and market_context: {{market_context}}, produce: {\\"summary\\":\\"50-120 words\\",\\"opportunities\\":[{\\"name\\":\\"\\",\\"impact_estimate\\\":0}],\\"swot\\":{\\"strengths\\\":[],\\"weaknesses\\\":[],\\"opportunities\\\":[],\\"threats\\\":[]},\\"roadmap\\\":[{\\"quarter\\\":\\"Q1\\",\\"action\\\":\\"\\",\\"owner\\\":\\"\\",\\"kpi\\\":\\"\\\"}] , \\"confidence\\\":0.0}. Use conservative numeric estimates where relevant. Return JSON only.",
            "model":"gpt-4",
            "temperature":0.2,
            "max_tokens":1200,
            "variables_schema":{"type":"object","properties":{"company_profile":{"type":"string"},"market_context":{"type":"string"}}}
          }
        }`,
        input_schema: "{\"type\":\"object\",\"properties\":{\"company_profile\":{\"type\":\"string\"},\"market_context\":{\"type\":\"string\"}}}",
        output_schema: "{\"type\":\"object\",\"required\":[\"summary\",\"opportunities\",\"swot\",\"roadmap\",\"confidence\"]}",
        tier_restrictions: [],
        confidence_hint: 0.80,
        active: true
      },
      {
        agent_key: "customer_support",
        display_name: "Customer Support Agent",
        short_desc: "Ticket triage, automated replies, KB search and escalation routing.",
        long_desc:
          "Classifies incoming tickets, retrieves KB matches via embeddings, drafts recommended replies, and selects escalation path when needed.",
        capabilities: ["ticket_classification","automated_reply","kb_lookup","escalation","multilingual"],
        default_model: "gpt-3.5-turbo",
        model_routing: "{\"conversational\":\"gpt-3.5-turbo\",\"summarization\":\"gpt-4\"}",
        prompt_template_version: "v1.0",
        prompt_templates: `{
          "v1.0": {
            "template_id":"cs_v1.0",
            "title":"Support triage + suggested reply",
            "description":"Classify ticket, find KB links, draft reply, and set urgency",
            "prompt_text":"You are a helpful support agent. Input: ticket_text: {{ticket_text}}, customer_metadata: {{customer_metadata}}, kb_documents: {{kb_documents}}. Output JSON: {\\"classification\\":\\"billing|technical|account|feature-request|other\\",\\"urgency\\":\\"low|medium|high\\",\\"kb_matches\\\":[{\\"id\\\":\\"...\\",\\"relevance\\\":0.0}],\\"reply_text\\\":\\"...\\",\\"confidence\\\":0.0}. Ensure reply uses company voice: friendly, concise, < 150 words.",
            "model":"gpt-3.5-turbo",
            "temperature":0.3,
            "max_tokens":600,
            "variables_schema":{"type":"object","properties":{"ticket_text":{"type":"string"},"customer_metadata":{"type":"object"},"kb_documents":{"type":"array"}}}
          }
        }`,
        input_schema: "{\"type\":\"object\",\"properties\":{\"ticket_text\":{\"type\":\"string\"}}}",
        output_schema: "{\"type\":\"object\",\"required\":[\"classification\",\"urgency\",\"reply_text\",\"confidence\"]}",
        tier_restrictions: [],
        confidence_hint: 0.70,
        active: true
      },
      {
        agent_key: "sales_intelligence",
        display_name: "Sales Intelligence Agent",
        short_desc: "Lead scoring, account profiling, playbooks and deal risk scoring.",
        long_desc:
          "Scores leads and accounts using integrated activity data and firmographics; recommends plays and assets for reps; surfaces risks.",
        capabilities: ["lead_scoring","account_intel","playbook_recommendation","deal_risk"],
        default_model: "gpt-4",
        model_routing: "{\"analysis\":\"gpt-4\",\"conversation\":\"gpt-3.5-turbo\"}",
        prompt_template_version: "v1.0",
        prompt_templates: `{
          "v1.0": {
            "template_id":"si_v1.0",
            "title":"Sales Intelligence - Lead Scoring v1.0",
            "description":"Score leads and propose playbooks",
            "prompt_text":"You are a sales analyst. Given lead_profile: {{lead_profile}} and account_history: {{account_history}}, produce {\\"lead_score\\":0.0,\\"risk_reasons\\\":[],\\"recommended_playbook\\\":[{\\"step\\\":\\"\\",\\"owner\\\":\\"\\",\\"cta\\\":\\"\\",\\"timing\\\":\\"\\\"}],\\"recommended_assets\\\":[],\\"confidence\\\":0.0}. Return JSON only.",
            "model":"gpt-4",
            "temperature":0.25,
            "max_tokens":800,
            "variables_schema":{"type":"object","properties":{"lead_profile":{"type":"object"},"account_history":{"type":"object"}}}
          }
        }`,
        input_schema: "{\"type\":\"object\"}",
        output_schema: "{\"type\":\"object\",\"required\":[\"lead_score\",\"recommended_playbook\",\"confidence\"]}",
        tier_restrictions: [],
        confidence_hint: 0.65,
        active: true
      },
      {
        agent_key: "content_creation",
        display_name: "Content Creation Agent",
        short_desc: "Generates multi-format content, enforces brand voice and SEO optimizations.",
        long_desc:
          "Creates blog posts, social posts, email copy and collateral; outputs structured content metadata and publishing plan.",
        capabilities: ["blog_generation","social_posts","seo","brand_voice","a_b_variants"],
        default_model: "gpt-4",
        model_routing: "{\"creative\":\"gpt-4\",\"shortform\":\"gpt-3.5-turbo\"}",
        prompt_template_version: "v1.0",
        prompt_templates: `{
          "v1.0": {
            "template_id":"cc_v1.0",
            "title":"Content Creation - Brief to Draft v1.0",
            "description":"Create content from brief and brand voice",
            "prompt_text":"You are a content studio assistant. Given brief: {{brief}} and brand_voice: {{brand_voice}}, produce {\\"title\\\":\\"\\",\\"meta_description\\\":\\"\\",\\"headings\\\":[],\\"body\\\":\\"\\",\\"seo_keywords\\\":[],\\"publish_plan\\\":[{\\"channel\\\":\\"\\",\\"cadence\\\":\\"\\\"}],\\"confidence\\\":0.0}. Return JSON only. Body should be markdown, 300-1200 words depending on requested length in brief.",
            "model":"gpt-4",
            "temperature":0.6,
            "max_tokens":1200,
            "variables_schema":{"type":"object","properties":{"brief":{"type":"string"},"brand_voice":{"type":"string"}}}
          }
        }`,
        input_schema: "{\"type\":\"object\",\"properties\":{\"brief\":{\"type\":\"string\"},\"brand_voice\":{\"type\":\"string\"}}}",
        output_schema: "{\"type\":\"object\",\"required\":[\"title\",\"body\",\"seo_keywords\"]}",
        tier_restrictions: [],
        confidence_hint: 0.65,
        active: true
      },
      {
        agent_key: "data_analysis",
        display_name: "Data Analysis Agent",
        short_desc: "Data summarization, forecasting, anomaly detection and natural-language reports.",
        long_desc:
          "Ingests dataset summaries or aggregates, runs explainable analysis, produces structured forecasts, anomalies list, and chart descriptors for visualization.",
        capabilities: ["forecasting","anomaly_detection","etl_help","nl_reports","chart_summaries"],
        default_model: "gpt-4",
        model_routing: "{\"analysis\":\"gpt-4\",\"explain\":\"gpt-4\",\"dialog\":\"gpt-3.5-turbo\"}",
        prompt_template_version: "v1.0",
        prompt_templates: `{
          "v1.0": {
            "template_id":"da_v1.0",
            "title":"Data Analysis - Forecast & Anomaly v1.0",
            "description":"Analyze dataset summary and answer queries with forecasts & anomalies",
            "prompt_text":"You are a data analyst. Input: dataset_summary: {{dataset_summary}} and query: {{analysis_query}}. Provide {\\"analysis_steps\\\":[\\"...\\"],\\"results\\":{\\"tables\\\":[],\\"charts\\":[]},\\"anomalies\\\":[],\\"forecast_12m\\\":0.0,\\"confidence\\\":0.0}. Return JSON only. Include clear units and assumptions.",
            "model":"gpt-4",
            "temperature":0.0,
            "max_tokens":1500,
            "variables_schema":{"type":"object","properties":{"dataset_summary":{"type":"object"},"analysis_query":{"type":"string"}}}
          }
        }`,
        input_schema: "{\"type\":\"object\"}",
        output_schema: "{\"type\":\"object\",\"required\":[\"analysis_steps\",\"forecast_12m\",\"confidence\"]}",
        tier_restrictions: [],
        confidence_hint: 0.75,
        active: true
      },
      {
        agent_key: "marketing_automation",
        display_name: "Marketing Automation Agent",
        short_desc: "Designs campaign flows, personalization and budget allocation suggestions.",
        long_desc:
          "Creates multi-touch campaign flows with triggers, KPIs and personalization slots. Integrates with CampaignComposer to seed campaigns.",
        capabilities: ["campaign_design","attribution","personalization","budgeting"],
        default_model: "gpt-4",
        model_routing: "{\"planning\":\"gpt-4\",\"copy\":\"gpt-3.5-turbo\"}",
        prompt_template_version: "v1.0",
        prompt_templates: `{
          "v1.0": {
            "template_id":"ma_v1.0",
            "title":"Marketing Automation - Campaign Planner v1.0",
            "description":"Plan campaign flows and KPIs",
            "prompt_text":"You are a marketing automation planner. Input: campaign_objectives: {{objectives}}, audience_profile: {{audience}}. Output {\\"campaign_flow\\\":[{\\"trigger\\\":\\"\\",\\"action\\\":\\"\\",\\"timing\\\":\\"\\\"}],\\"budget_estimate\\\":0.0,\\"KPIs\\\":[\\"\\"] ,\\"personalization_slots\\\":[],\\"confidence\\\":0.0}. Return JSON only.",
            "model":"gpt-4",
            "temperature":0.35,
            "max_tokens":900,
            "variables_schema":{"type":"object","properties":{"objectives":{"type":"object"},"audience":{"type":"object"}}}
          }
        }`,
        input_schema: "{\"type\":\"object\"}",
        output_schema: "{\"type\":\"object\",\"required\":[\"campaign_flow\",\"budget_estimate\",\"KPIs\"]}",
        tier_restrictions: [],
        confidence_hint: 0.65,
        active: true
      },
      {
        agent_key: "financial_analysis",
        display_name: "Financial Analysis Agent",
        short_desc: "Revenue/cashflow forecasting, scenario analysis and pricing insights.",
        long_desc:
          "Produces P&L and cash-flow forecasts, sensitivity/scenario matrices, and identifies key financial risks for projects and product lines.",
        capabilities: ["pnl_forecast","cash_flow","scenario_modeling","pricing"],
        default_model: "gpt-4",
        model_routing: "{\"modeling\":\"gpt-4\",\"explain\":\"gpt-4\"}",
        prompt_template_version: "v1.0",
        prompt_templates: `{
          "v1.0": {
            "template_id":"fa_v1.0",
            "title":"Financial Analysis - 12m P&L & Scenarios v1.0",
            "description":"Generate income statement, cash flow and scenario analysis",
            "prompt_text":"You are a financial analyst. Input: forecast_inputs: {{inputs}}. Output {\\"income_statement_12m\\\":[],\\"cash_flow_12m\\\":[],\\"scenario_analysis\\":{\\"best\\":{},\\"base\\":{},\\"worst\\":{}},\\"risk_factors\\\":[],\\"confidence\\\":0.0}. Return JSON only with numeric fields.",
            "model":"gpt-4",
            "temperature":0.0,
            "max_tokens":1300,
            "variables_schema":{"type":"object","properties":{"inputs":{"type":"object"}}}
          }
        }`,
        input_schema: "{\"type\":\"object\"}",
        output_schema: "{\"type\":\"object\",\"required\":[\"income_statement_12m\",\"cash_flow_12m\",\"scenario_analysis\",\"confidence\"]}",
        tier_restrictions: ["startup","sme","enterprise"],
        confidence_hint: 0.75,
        active: true
      },
      {
        agent_key: "operations_optimization",
        display_name: "Operations Optimization Agent",
        short_desc: "Process mining, bottleneck analysis and throughput improvements.",
        long_desc:
          "Analyzes process maps and production metrics, prioritizes optimization actions, and returns monitoring KPIs and rollout plans.",
        capabilities: ["process_mining","bottleneck_analysis","throughput","automation_suggestions"],
        default_model: "gpt-4",
        model_routing: "{\"analysis\":\"gpt-4\",\"explain\":\"gpt-3.5-turbo\"}",
        prompt_template_version: "v1.0",
        prompt_templates: `{
          "v1.0": {
            "template_id":"oo_v1.0",
            "title":"Operations Optimization - Bottleneck Finder v1.0",
            "description":"Identify bottlenecks and recommend optimizations",
            "prompt_text":"You are an operations engineer. Input: process_map: {{process_map}}, metrics: {{metrics}}. Output {\\"bottlenecks\\\":[],\\"optimization_actions\\\":[{\\"action\\\":\\"\\",\\"impact_est\\\":0.0,\\"effort_est\\\":\\"low|medium|high\\"}],\\"monitoring_kpis\\\":[],\\"rollout_plan\\\":[],\\"confidence\\\":0.0}. Return JSON only.",
            "model":"gpt-4",
            "temperature":0.2,
            "max_tokens":1000,
            "variables_schema":{"type":"object","properties":{"process_map":{"type":"object"},"metrics":{"type":"object"}}}
          }
        }`,
        input_schema: "{\"type\":\"object\"}",
        output_schema: "{\"type\":\"object\",\"required\":[\"bottlenecks\",\"optimization_actions\",\"confidence\"]}",
        tier_restrictions: ["enterprise","sme"],
        confidence_hint: 0.70,
        active: true
      },
      {
        agent_key: "compliance_risk",
        display_name: "Compliance & Risk Agent",
        short_desc: "Regulatory monitoring, policy validation and remediation steps with citations.",
        long_desc:
          "Evaluates planned activities against jurisdictional regulations, lists issues, and provides remediation steps with referenced source links when available.",
        capabilities: ["regulatory_check","policy_validation","risk_scoring","audit_trail"],
        default_model: "gpt-4",
        model_routing: "{\"validation\":\"gpt-4\",\"citation_helper\":\"gpt-4\"}",
        prompt_template_version: "v1.0",
        prompt_templates: `{
          "v1.0": {
            "template_id":"cr_v1.0",
            "title":"Compliance Check - Jurisdictional Validation v1.0",
            "description":"Validate activity against regulatory constraints and return remediation",
            "prompt_text":"You are a compliance analyst. Input: jurisdiction: {{jurisdiction}}, activity: {{activity}}. Output {\\"compliance_pass\\":true|false,\\"issues\\\":[],\\"remediation_steps\\\":[],\\"reference_links\\\":[],\\"confidence\\\":0.0}. Where possible include citations as reference_links. Return JSON only.",
            "model":"gpt-4",
            "temperature":0.0,
            "max_tokens":1000,
            "variables_schema":{"type":"object","properties":{"jurisdiction":{"type":"string"},"activity":{"type":"string"}}}
          }
        }`,
        input_schema: "{\"type\":\"object\"}",
        output_schema: "{\"type\":\"object\",\"required\":[\"compliance_pass\",\"issues\",\"confidence\"]}",
        tier_restrictions: ["enterprise"],
        confidence_hint: 0.85,
        active: true
      },
      {
        agent_key: "hr_recruitment",
        display_name: "HR & Recruitment Agent",
        short_desc: "Candidate screening, fit scoring, interview questions and retention risk prediction.",
        long_desc:
          "Scores resumes against role specs, suggests interview questions, identifies skills gaps and recommends hiring stage decisions.",
        capabilities: ["resume_screening","fit_scoring","interview_questions","retention_risk"],
        default_model: "gpt-3.5-turbo",
        model_routing: "{\"screening\":\"gpt-3.5-turbo\",\"analysis\":\"gpt-4\"}",
        prompt_template_version: "v1.0",
        prompt_templates: `{
          "v1.0": {
            "template_id":"hr_v1.0",
            "title":"HR Screening - Resume Fit v1.0",
            "description":"Screen resume for role fit and suggest questions",
            "prompt_text":"You are an HR screener. Input: resume_text: {{resume_text}}, role_spec: {{role_spec}}. Output {\\"fit_score\\":0.0,\\"strengths\\\":[],\\"gaps\\\":[],\\"suggested_interview_questions\\\":[],\\"recommended_stage\\":\\"phone_screen|onsite|reject\\",\\"confidence\\\":0.0}. Return JSON only.",
            "model":"gpt-3.5-turbo",
            "temperature":0.3,
            "max_tokens":700,
            "variables_schema":{"type":"object","properties":{"resume_text":{"type":"string"},"role_spec":{"type":"string"}}}
          }
        }`,
        input_schema: "{\"type\":\"object\"}",
        output_schema: "{\"type\":\"object\",\"required\":[\"fit_score\",\"recommended_stage\",\"confidence\"]}",
        tier_restrictions: [],
        confidence_hint: 0.65,
        active: true
      },
    ];

    let upserts = 0;
    for (const r of rows) {
      const existing = await ctx.db
        .query("agentCatalog")
        .withIndex("by_agent_key", (q) => q.eq("agent_key", r.agent_key))
        .unique()
        .catch(() => null);

      if (existing) {
        await ctx.db.patch(existing._id, {
          display_name: r.display_name,
          short_desc: r.short_desc,
          long_desc: r.long_desc,
          capabilities: r.capabilities,
          default_model: r.default_model,
          model_routing: r.model_routing,
          prompt_template_version: r.prompt_template_version,
          prompt_templates: r.prompt_templates,
          input_schema: r.input_schema,
          output_schema: r.output_schema,
          tier_restrictions: r.tier_restrictions,
          confidence_hint: r.confidence_hint,
          active: r.active,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("agentCatalog", {
          ...r,
          createdAt: now,
          updatedAt: now,
        });
      }
      upserts += 1;
    }

    return { message: "Agent catalog seeded", count: upserts, ts: now };
  },
});

export const seedAgentCatalogSafe = action({
  args: {},
  handler: async (ctx) => {
    try {
      // Prefer running internal mutation directly
      return await ctx.runMutation(internal.seed.applyAgentCatalogSeed, {});
    } catch (err) {
      // Fallback: schedule in DB runtime to avoid any ctx.db access issues in Node runtime
      await ctx.scheduler.runAfter(0, internal.seed.applyAgentCatalogSeed, {});
      return { inserted: 0, updated: 0, total: 0, scheduled: true };
    }
  },
});

export const seedAgentCatalog = action({
  args: {},
  handler: async (ctx) => {
    try {
      return await ctx.runMutation(internal.seed.applyAgentCatalogSeed, {});
    } catch (err) {
      await ctx.scheduler.runAfter(0, internal.seed.applyAgentCatalogSeed, {});
      return { inserted: 0, updated: 0, total: 0, scheduled: true };
    }
  },
});

export const applyAgentCatalogSeed = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Define default agents (10)
    const defaults: Array<{
      agent_key: string;
      display_name: string;
      short_desc: string;
      long_desc: string;
      capabilities: string[];
      default_model: string;
      model_routing: string;
      prompt_template_version: string;
      prompt_templates: string;
      input_schema: string;
      output_schema: string;
      tier_restrictions: string[];
      confidence_hint: number;
      active: boolean;
    }> = [
      {
        agent_key: "strategic_planning",
        display_name: "Strategic Planning",
        short_desc: "Creates strategic roadmaps and OKRs.",
        long_desc: "Analyzes business context and drafts clear OKRs and roadmaps.",
        capabilities: ["plan", "prioritize", "okr"],
        default_model: "gpt-4o-mini",
        model_routing: "",
        prompt_template_version: "v1",
        prompt_templates: "",
        input_schema: "{}",
        output_schema: "{}",
        tier_restrictions: [],
        confidence_hint: 0.8,
        active: true,
      },
      {
        agent_key: "customer_support",
        display_name: "Customer Support",
        short_desc: "Drafts helpful, empathetic replies.",
        long_desc: "Summarizes tickets and proposes tiered responses.",
        capabilities: ["summarize", "reply", "triage"],
        default_model: "gpt-4o-mini",
        model_routing: "",
        prompt_template_version: "v1",
        prompt_templates: "",
        input_schema: "{}",
        output_schema: "{}",
        tier_restrictions: [],
        confidence_hint: 0.8,
        active: true,
      },
      {
        agent_key: "sales_intelligence",
        display_name: "Sales Intelligence",
        short_desc: "Discovers leads and crafts outreach.",
        long_desc: "Surfaces ideal prospects and produces tailored messaging.",
        capabilities: ["prospect", "enrich", "outreach"],
        default_model: "gpt-4o-mini",
        model_routing: "",
        prompt_template_version: "v1",
        prompt_templates: "",
        input_schema: "{}",
        output_schema: "{}",
        tier_restrictions: [],
        confidence_hint: 0.8,
        active: true,
      },
      {
        agent_key: "content_creation",
        display_name: "Content Creation",
        short_desc: "Generates posts, emails, and pages.",
        long_desc: "Converts briefs into multi-format marketing content.",
        capabilities: ["draft", "edit", "repurpose"],
        default_model: "gpt-4o-mini",
        model_routing: "",
        prompt_template_version: "v1",
        prompt_templates: "",
        input_schema: "{}",
        output_schema: "{}",
        tier_restrictions: [],
        confidence_hint: 0.8,
        active: true,
      },
      {
        agent_key: "data_analysis",
        display_name: "Data Analysis",
        short_desc: "Explains metrics and trends.",
        long_desc: "Produces narratives for KPI movements with clear takeaways.",
        capabilities: ["analyze", "explain", "visualize"],
        default_model: "gpt-4o-mini",
        model_routing: "",
        prompt_template_version: "v1",
        prompt_templates: "",
        input_schema: "{}",
        output_schema: "{}",
        tier_restrictions: [],
        confidence_hint: 0.8,
        active: true,
      },
      {
        agent_key: "marketing_automation",
        display_name: "Marketing Automation",
        short_desc: "Coordinates campaigns and experiments.",
        long_desc: "Plans multi-step campaigns and suggests experiments.",
        capabilities: ["plan", "schedule", "optimize"],
        default_model: "gpt-4o-mini",
        model_routing: "",
        prompt_template_version: "v1",
        prompt_templates: "",
        input_schema: "{}",
        output_schema: "{}",
        tier_restrictions: [],
        confidence_hint: 0.8,
        active: true,
      },
      {
        agent_key: "financial_analysis",
        display_name: "Financial Analysis",
        short_desc: "Models costs, ROI, and forecasts.",
        long_desc: "Runs scenario planning and returns concise reports.",
        capabilities: ["model", "forecast", "roi"],
        default_model: "gpt-4o-mini",
        model_routing: "",
        prompt_template_version: "v1",
        prompt_templates: "",
        input_schema: "{}",
        output_schema: "{}",
        tier_restrictions: [],
        confidence_hint: 0.8,
        active: true,
      },
      {
        agent_key: "operations_optimization",
        display_name: "Operations Optimization",
        short_desc: "Improves process efficiency.",
        long_desc: "Finds bottlenecks and proposes rollout plans.",
        capabilities: ["diagnose", "optimize", "rollout"],
        default_model: "gpt-4o-mini",
        model_routing: "",
        prompt_template_version: "v1",
        prompt_templates: "",
        input_schema: "{}",
        output_schema: "{}",
        tier_restrictions: [],
        confidence_hint: 0.8,
        active: true,
      },
      {
        agent_key: "compliance_risk",
        display_name: "Compliance & Risk",
        short_desc: "Flags policy and regulatory issues.",
        long_desc: "Validates proposed changes and highlights risk.",
        capabilities: ["validate", "assess", "flag"],
        default_model: "gpt-4o-mini",
        model_routing: "",
        prompt_template_version: "v1",
        prompt_templates: "",
        input_schema: "{}",
        output_schema: "{}",
        tier_restrictions: [],
        confidence_hint: 0.8,
        active: true,
      },
      {
        agent_key: "hr_recruitment",
        display_name: "HR & Recruitment",
        short_desc: "Assists with hiring workflows.",
        long_desc: "Drafts JDs, screens candidates, and suggests questions.",
        capabilities: ["draft", "screen", "recommend"],
        default_model: "gpt-4o-mini",
        model_routing: "",
        prompt_template_version: "v1",
        prompt_templates: "",
        input_schema: "{}",
        output_schema: "{}",
        tier_restrictions: [],
        confidence_hint: 0.8,
        active: true,
      },
    ];

    const now = Date.now();
    const all = await ctx.db.query("agentCatalog").collect();

    let inserted = 0;
    let updated = 0;

    for (const def of defaults) {
      const existing = all.find((a: any) => a.agent_key === def.agent_key);
      if (existing) {
        await ctx.db.patch(existing._id, { ...def, updatedAt: now });
        updated += 1;
      } else {
        await ctx.db.insert("agentCatalog", { ...def, createdAt: now, updatedAt: now });
        inserted += 1;
      }
    }

    return { inserted, updated, total: defaults.length };
  },
});

export const cleanupDuplicateAgents = mutation({
  args: {},
  handler: async (ctx) => {
    const allAgents = await ctx.db.query("agentCatalog").collect();
    
    // Group agents by agent_key
    const agentsByKey = new Map<string, Array<any>>();
    for (const agent of allAgents) {
      const key = agent.agent_key;
      if (!agentsByKey.has(key)) {
        agentsByKey.set(key, []);
      }
      agentsByKey.get(key)!.push(agent);
    }
    
    let deleted = 0;
    
    // For each agent_key with duplicates, keep the one with more capabilities
    for (const [key, agents] of agentsByKey.entries()) {
      if (agents.length > 1) {
        // Sort by number of capabilities (descending) and keep the first one
        agents.sort((a, b) => (b.capabilities?.length || 0) - (a.capabilities?.length || 0));
        
        // Delete all but the first (most detailed) one
        for (let i = 1; i < agents.length; i++) {
          await ctx.db.delete(agents[i]._id);
          deleted++;
        }
      }
    }
    
    return { 
      message: "Duplicate agents cleaned up", 
      deleted,
      remaining: allAgents.length - deleted 
    };
  },
});