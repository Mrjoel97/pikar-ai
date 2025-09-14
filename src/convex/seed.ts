// @ts-nocheck

import { Id } from "./_generated/dataModel";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { mutation } from "./_generated/server";

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