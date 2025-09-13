import { Id } from "./_generated/dataModel";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import type { FullAppInspectionReport } from "./inspector";

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