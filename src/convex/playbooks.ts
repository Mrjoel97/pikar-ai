import { query, mutation, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { DEFAULT_PLAYBOOKS } from "./data/playbooksSeed";

// Query: list playbooks (optionally active only)
export const list = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (args.activeOnly) {
      const rows = await ctx.db
        .query("playbooks")
        .withIndex("by_active", (q) => q.eq("active", true))
        .order("asc")
        .collect();
      return rows;
    }
    const rows = await ctx.db.query("playbooks").order("asc").collect();
    return rows;
  },
});

// Query: get by key+version
export const getByKey = query({
  args: { playbook_key: v.string(), version: v.string() },
  handler: async (ctx, args) => {
    const found = await ctx.db
      .query("playbooks")
      .withIndex("by_key_and_version", (q) =>
        q.eq("playbook_key", args.playbook_key).eq("version", args.version)
      )
      .unique();
    return found;
  },
});

// Internal upsert for a single playbook (idempotent on key+version)
export const upsertOneInternal = internalMutation({
  args: {
    playbook_key: v.string(),
    display_name: v.string(),
    version: v.string(),
    triggers: v.any(),
    input_schema: v.any(),
    output_schema: v.any(),
    steps: v.any(),
    metadata: v.any(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("playbooks")
      .withIndex("by_key_and_version", (q) =>
        q.eq("playbook_key", args.playbook_key).eq("version", args.version)
      )
      .unique()
      .catch(() => null);

    if (existing) {
      await ctx.db.replace(existing._id, { ...existing, ...args });
      return { updated: true, inserted: false };
    }
    await ctx.db.insert("playbooks", { ...args });
    return { updated: false, inserted: true };
  },
});

// Public mutation to upsert one playbook (useful for admin/editor tooling)
export const upsertPlaybook = mutation({
  args: {
    playbook: v.object({
      playbook_key: v.string(),
      display_name: v.string(),
      version: v.string(),
      triggers: v.any(),
      input_schema: v.any(),
      output_schema: v.any(),
      steps: v.any(),
      metadata: v.any(),
      active: v.optional(v.boolean()),
    }),
  },
  // Avoid referencing `internal` here to prevent circular inference; add explicit return type
  handler: async (ctx, args): Promise<{ updated: boolean; inserted: boolean }> => {
    const p = args.playbook;
    const existing = await ctx.db
      .query("playbooks")
      .withIndex("by_key_and_version", (q) =>
        q.eq("playbook_key", p.playbook_key).eq("version", p.version)
      )
      .unique()
      .catch(() => null as any);

    if (existing) {
      await ctx.db.replace(existing._id, { ...existing, ...p, active: p.active ?? true });
      return { updated: true, inserted: false };
    }

    await ctx.db.insert("playbooks", { ...p, active: p.active ?? true });
    return { updated: false, inserted: true };
  },
});

// Admin-gated: list playbooks with filtering
export const adminListPlaybooks = query({
  args: {
    activeOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
    if (!isAdmin) return [];

    const limit = Math.max(1, Math.min(args.limit ?? 100, 500));
    const base = ctx.db.query("playbooks");

    const rows =
      args.activeOnly !== undefined
        ? await base
            .withIndex("by_active", (q) => q.eq("active", args.activeOnly as boolean))
            .order("desc")
            .take(limit)
        : await base.order("desc").take(limit);

    return rows;
  },
});

// Admin-gated: upsert playbook with audit
export const adminUpsertPlaybook = mutation({
  args: {
    playbook_key: v.string(),
    display_name: v.string(),
    version: v.string(),
    triggers: v.any(),
    input_schema: v.any(),
    output_schema: v.any(),
    steps: v.any(),
    metadata: v.any(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
    if (!isAdmin) throw new Error("Admin access required");

    const existing = await ctx.db
      .query("playbooks")
      .withIndex("by_key_and_version", (q) => 
        q.eq("playbook_key", args.playbook_key).eq("version", args.version)
      )
      .unique();

    const playbookData = {
      playbook_key: args.playbook_key,
      display_name: args.display_name,
      version: args.version,
      triggers: args.triggers,
      input_schema: args.input_schema,
      output_schema: args.output_schema,
      steps: args.steps,
      metadata: args.metadata,
      active: args.active,
    };

    let playbookId: string;
    if (existing) {
      await ctx.db.patch(existing._id, playbookData);
      playbookId = existing._id;
    } else {
      playbookId = await ctx.db.insert("playbooks", playbookData);
    }

    // Audit log
    await ctx.runMutation(api.audit.write as any, {
      action: existing ? "admin_update_playbook" : "admin_create_playbook",
      entityType: "playbooks",
      entityId: playbookId,
      details: {
        playbook_key: args.playbook_key,
        version: args.version,
        display_name: args.display_name,
        active: args.active,
        correlationId: `playbook-admin-${args.playbook_key}-${Date.now()}`,
      },
    });

    return { playbookId, created: !existing };
  },
});

// Admin-gated: toggle playbook active status
export const adminTogglePlaybook = mutation({
  args: {
    playbook_key: v.string(),
    version: v.string(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
    if (!isAdmin) throw new Error("Admin access required");

    const playbook = await ctx.db
      .query("playbooks")
      .withIndex("by_key_and_version", (q) => 
        q.eq("playbook_key", args.playbook_key).eq("version", args.version)
      )
      .unique();

    if (!playbook) throw new Error("Playbook not found");

    await ctx.db.patch(playbook._id, { active: args.active });

    // Audit log
    await ctx.runMutation(api.audit.write as any, {
      action: "admin_toggle_playbook",
      entityType: "playbooks",
      entityId: playbook._id,
      details: {
        playbook_key: args.playbook_key,
        version: args.version,
        active: args.active,
        previous_active: playbook.active,
        correlationId: `playbook-toggle-${args.playbook_key}-${Date.now()}`,
      },
    });

    return { success: true };
  },
});

// Action: seed defaults (idempotent) — can be run via `npx convex run playbooks:seedDefaultPlaybooks`
export const seedDefaultPlaybooks = action({
  args: {},
  handler: async (ctx) => {
    let inserted = 0;
    let updated = 0;
    for (const p of DEFAULT_PLAYBOOKS) {
      const res = await ctx.runMutation(internal.playbooks.upsertOneInternal, p);
      if (res.inserted) inserted += 1;
      if (res.updated) updated += 1;
    }
    return { inserted, updated, total: DEFAULT_PLAYBOOKS.length };
  },
});

export const adminPublishPlaybook = mutation({
  args: {
    playbook_key: v.string(),
    version: v.string(),
  },
  handler: async (ctx, args) => {
    const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
    if (!isAdmin) throw new Error("Admin access required");

    // Gate on evaluations: require allPassing
    const evalSummary = await ctx.runQuery(api.evals.latestSummary, {});
    if (!(evalSummary as any)?.allPassing) {
      throw new Error("Evaluations gate failed: not all passing. Fix failures before publish.");
    }

    const playbook = await ctx.db
      .query("playbooks")
      .withIndex("by_key_and_version", (q) =>
        q.eq("playbook_key", args.playbook_key).eq("version", args.version)
      )
      .unique()
      .catch(() => null as any);
    if (!playbook) throw new Error("Playbook not found");

    if (playbook.active === true) return { success: true, alreadyPublished: true };

    await ctx.db.patch(playbook._id, { active: true });

    // Audit log
    await ctx.runMutation(api.audit.write as any, {
      action: "admin_publish_playbook",
      entityType: "playbooks",
      entityId: playbook._id,
      details: {
        playbook_key: args.playbook_key,
        version: args.version,
        previous_active: playbook.active,
        correlationId: `playbook-publish-${args.playbook_key}-${Date.now()}`,
      },
    });

    return { success: true, alreadyPublished: false };
  },
});

export const adminRollbackPlaybook = mutation({
  args: {
    playbook_key: v.string(),
    version: v.string(),
  },
  handler: async (ctx, args) => {
    const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
    if (!isAdmin) throw new Error("Admin access required");

    const playbook = await ctx.db
      .query("playbooks")
      .withIndex("by_key_and_version", (q) =>
        q.eq("playbook_key", args.playbook_key).eq("version", args.version)
      )
      .unique()
      .catch(() => null as any);
    if (!playbook) throw new Error("Playbook not found");

    if (playbook.active === false) return { success: true, alreadyRolledBack: true };

    await ctx.db.patch(playbook._id, { active: false });

    // Audit log
    await ctx.runMutation(api.audit.write as any, {
      action: "admin_rollback_playbook",
      entityType: "playbooks",
      entityId: playbook._id,
      details: {
        playbook_key: args.playbook_key,
        version: args.version,
        previous_active: playbook.active,
        correlationId: `playbook-rollback-${args.playbook_key}-${Date.now()}`,
      },
    });

    return { success: true, alreadyRolledBack: false };
  },
});