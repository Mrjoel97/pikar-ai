// @ts-nocheck

import { Id } from "./_generated/dataModel";
import { action, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

// Re-export modular seed functions
export { applyAgentCatalogSeed } from "./seed/agentCatalog";
export { seedDemoDataForBusiness } from "./seed/demoData";
export { seedFeatureFlagsForBusiness } from "./seed/featureFlags";

// Main orchestration actions
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

    // Seed AI agents
    if (seeded?.businessId) {
      try {
        await ctx.runMutation(internal.aiAgents.seedForBusinessInternal, {
          businessId: seeded.businessId,
        });
      } catch {
        // ignore
      }
    }

    // Seed demo data
    if (seeded?.businessId) {
      const business = await ctx.runQuery(api.businesses.get, { id: seeded.businessId });
      if (business?.ownerId) {
        await ctx.runMutation(internal.seed.seedDemoDataForBusiness, {
          businessId: seeded.businessId,
          ownerId: business.ownerId,
        });
      }
    }

    return {
      message: "Seeded demo data for current user",
      ...seeded,
    };
  },
});

export const seedAllDemo = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Ensure user
    await ctx.runMutation(api.users.ensureSeedUser, { email: args.email });

    // Create business + initiative
    const seeded: {
      businessId?: Id<"businesses">;
      initiativeId?: Id<"initiatives">;
      diagnosticId?: Id<"diagnostics">;
    } = await ctx.runMutation(api.initiatives.seedForEmail, {
      email: args.email,
    });

    // Seed AI agents
    if (seeded?.businessId) {
      try {
        await ctx.runMutation(internal.aiAgents.seedForBusinessInternal, {
          businessId: seeded.businessId,
        });
      } catch {
        // ignore
      }
    }

    // Seed demo data
    if (seeded?.businessId) {
      const business = await ctx.runQuery(api.businesses.get, { id: seeded.businessId });
      if (business?.ownerId) {
        await ctx.runMutation(internal.seed.seedDemoDataForBusiness, {
          businessId: seeded.businessId,
          ownerId: business.ownerId,
        });
      }
    }

    // Seed global feature flags
    const globalFlags = await ctx.runMutation(internal.seed.seedFeatureFlagsForBusiness, {});

    // Seed business-scoped flags
    let businessFlags = null;
    if (seeded?.businessId) {
      businessFlags = await ctx.runMutation(internal.seed.seedFeatureFlagsForBusiness, {
        businessId: seeded.businessId,
      });
    }

    return {
      message: "All demo data + flags seeded",
      email: args.email,
      businessId: seeded?.businessId,
      globalFlags,
      businessFlags,
    };
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

export const seedDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    const business = await ctx.runQuery(api.businesses.currentUserBusiness, {});
    if (!business?._id) {
      throw new Error("No business found for current user. Complete onboarding first.");
    }

    return await ctx.runMutation(internal.seed.seedDemoDataForBusiness, {
      businessId: business._id,
      ownerId: business.ownerId,
    });
  },
});

export const cleanupDuplicateAgents = mutation({
  args: {},
  handler: async (ctx) => {
    const allAgents = await ctx.db.query("agentCatalog").collect();
    
    const agentsByKey = new Map<string, Array<any>>();
    for (const agent of allAgents) {
      const key = agent.agent_key;
      if (!agentsByKey.has(key)) {
        agentsByKey.set(key, []);
      }
      agentsByKey.get(key)!.push(agent);
    }
    
    let deleted = 0;
    
    for (const [key, agents] of agentsByKey.entries()) {
      if (agents.length > 1) {
        agents.sort((a, b) => (b.capabilities?.length || 0) - (a.capabilities?.length || 0));
        
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