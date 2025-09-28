import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// Make getFeatureFlags fully guest-safe; never require auth and never throw
export const getFeatureFlags = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    try {
      const allFlags = await ctx.db.query("featureFlags").collect();
      const globalFlags = allFlags.filter((f: any) => f.businessId === undefined);
      const tenantFlags = args.businessId ? allFlags.filter((f: any) => f.businessId === args.businessId) : [];
      return [...globalFlags, ...tenantFlags];
    } catch {
      // Never throw for reads
      return [];
    }
  },
});

// Query to check if a specific feature is enabled
export const isFeatureEnabled = query({
  args: { 
    flagName: v.string(),
    businessId: v.optional(v.id("businesses")),
    userTier: v.optional(v.string()),
    businessTier: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    // Load all flags index-agnostic to avoid schema/index coupling
    const allFlags: any[] = await (ctx.db as any).query("featureFlags" as any).collect();

    const flagNameLc = args.flagName.toLowerCase();
    const businessFlag = args.businessId
      ? allFlags.find(
          (f: any) =>
            String(f.flagName || "").toLowerCase() === flagNameLc &&
            String(f.businessId || "") === String(args.businessId)
        )
      : null;

    const globalFlag = allFlags.find(
      (f: any) => String(f.flagName || "").toLowerCase() === flagNameLc && f.businessId === undefined
    );

    const flag = businessFlag || globalFlag;
    if (!flag || !flag.isEnabled) return false;

    // Rollout percentage (default 100)
    const rollout: number =
      typeof flag.rolloutPercentage === "number" ? flag.rolloutPercentage : 100;
    if (rollout < 100) {
      const basis = identity.subject || identity.email || "anon";
      const hash = Array.from(basis).reduce(
        (a, ch) => ((a << 5) - a + ch.charCodeAt(0)) | 0,
        0
      );
      const pct = Math.abs(hash) % 100;
      if (pct >= rollout) return false;
    }

    // Conditions (optional)
    const cond = flag.conditions || {};
    if (cond.userTier && args.userTier && Array.isArray(cond.userTier)) {
      if (!cond.userTier.includes(args.userTier)) return false;
    }
    if (cond.businessTier && args.businessTier && Array.isArray(cond.businessTier)) {
      if (!cond.businessTier.includes(args.businessTier)) return false;
    }

    return true;
  },
});

// Mutation to create or update a feature flag
export const upsertFeatureFlag = mutation({
  args: {
    businessId: v.optional(v.id("businesses")),
    flagName: v.string(),
    isEnabled: v.boolean(),
    rolloutPercentage: v.number(),
    conditions: v.optional(
      v.object({
        userTier: v.optional(v.array(v.string())),
        businessTier: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    const allFlags: any[] = await (ctx.db as any).query("featureFlags" as any).collect();
    const flagNameLc = args.flagName.toLowerCase();

    const existing = allFlags.find((f: any) => {
      const nameMatch = String(f.flagName || "").toLowerCase() === flagNameLc;
      const scopeMatch = args.businessId
        ? String(f.businessId || "") === String(args.businessId)
        : f.businessId === undefined;
      return nameMatch && scopeMatch;
    });

    if (existing) {
      await (ctx.db as any).patch(existing._id, {
        isEnabled: args.isEnabled,
        rolloutPercentage: args.rolloutPercentage,
        conditions: args.conditions,
        updatedAt: now,
      });
      return existing._id;
    }

    return await (ctx.db as any).insert("featureFlags" as any, {
      businessId: args.businessId,
      flagName: args.flagName,
      isEnabled: args.isEnabled,
      rolloutPercentage: args.rolloutPercentage,
      conditions: args.conditions,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Mutation to toggle a feature flag
export const toggleFeatureFlag = mutation({
  args: { flagId: v.id("featureFlags") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const flag = await ctx.db.get(args.flagId);
    if (!flag) {
      throw new Error("Feature flag not found");
    }

    await ctx.db.patch(args.flagId, {
      isEnabled: !flag.isEnabled,
      updatedAt: Date.now(),
    });

    return !flag.isEnabled;
  },
});

// Ensure analytics is also guest-safe
export const getFeatureFlagAnalytics = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    try {
      const allFlags: any[] = await (ctx.db as any).query("featureFlags" as any).collect();
      const flags = args.businessId
        ? allFlags.filter((f: any) => String(f.businessId || "") === String(args.businessId))
        : allFlags.filter((f: any) => f.businessId === undefined);

      // Avoid typed index coupling; compute usageEvents best-effort
      let usageEvents = 0;
      try {
        const events: any[] = await (ctx.db as any).query("telemetryEvents" as any).collect();
        usageEvents = Array.isArray(events)
          ? events.filter((e: any) => e?.eventName === "feature_flag_check").length
          : 0;
      } catch {
        usageEvents = 0;
      }

      return {
        flags,
        totalFlags: flags.length,
        enabledFlags: flags.filter((f: any) => f.isEnabled).length,
        usageEvents,
      };
    } catch {
      return { flags: [], totalFlags: 0, enabledFlags: 0, usageEvents: 0 };
    }
  },
});

export const updateFeatureFlag = mutation({
  args: {
    flagId: v.id("featureFlags"),
    rolloutPercentage: v.optional(v.number()),
    businessId: v.optional(v.union(v.id("businesses"), v.null())),
    isEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const flag = await ctx.db.get(args.flagId);
    if (!flag) throw new Error("Feature flag not found");

    const patch: Record<string, any> = { updatedAt: Date.now() };

    if (typeof args.rolloutPercentage === "number") {
      const pct = Math.max(0, Math.min(100, args.rolloutPercentage));
      patch.rolloutPercentage = pct;
    }

    if (typeof args.isEnabled === "boolean") {
      patch.isEnabled = args.isEnabled;
    }

    if ("businessId" in args) {
      // Null => make global (remove tenant scope). Otherwise set specific tenant.
      if (args.businessId === null) {
        patch.businessId = undefined;
      } else {
        patch.businessId = args.businessId;
      }
    }

    await ctx.db.patch(args.flagId, patch);
    return true;
  },
});

/**
 * Solopreneur Exec Assistant flag - default ON if not explicitly set.
 * Guest-safe and index-agnostic: returns true when flag is missing or on errors.
 */
export const solopreneurExecAssistantEnabled = query({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    try {
      // Try to find an explicit flag scoped to tenant first
      const flags = await ctx.db.query("featureFlags").collect();
      const tenantScoped = flags.find(
        (f: any) =>
          f.flagName === "solopreneur_exec_assistant" &&
          f.tenantId &&
          args.businessId &&
          String(f.tenantId) === String(args.businessId)
      );
      if (tenantScoped) {
        return !!tenantScoped.isEnabled;
      }

      // Fallback to global flag if present
      const global = flags.find(
        (f: any) =>
          f.flagName === "solopreneur_exec_assistant" && !f.tenantId
      );
      if (global) {
        return !!global.isEnabled;
      }

      // Default ON when flag is absent
      return true;
    } catch {
      // Be permissive if flags cannot be read
      return true;
    }
  },
});

/**
 * Admin-only: set the Solopreneur Exec Assistant toggle (global or tenant-scoped).
 * Creates or updates a feature flag record. Returns the resulting document id.
 */
export const setSolopreneurExecAssistant = mutation({
  args: {
    enabled: v.boolean(),
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    // Admin gate via existing admin getIsAdmin check
    const isAdmin = await ctx.runQuery(api.admin.getIsAdmin as any, {});
    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    // Load all flags; update if existing, else insert
    const flags = await ctx.db.query("featureFlags").collect();
    const existing = flags.find(
      (f: any) =>
        f.flagName === "solopreneur_exec_assistant" &&
        (args.businessId ? String(f.tenantId) === String(args.businessId) : !f.tenantId)
    );

    if (existing) {
      await ctx.db.patch(existing._id, {
        isEnabled: args.enabled,
        tenantId: args.businessId,
      } as any);
      return existing._id;
    }

    const id = await ctx.db.insert("featureFlags", {
      flagName: "solopreneur_exec_assistant",
      isEnabled: args.enabled,
      tenantId: args.businessId,
      rolloutPct: 100,
      createdAt: Date.now(),
    } as any);

    return id;
  },
});