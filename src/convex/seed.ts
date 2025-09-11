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