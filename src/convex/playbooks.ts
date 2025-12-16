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

// Relax internal upsert to accept optional fields and provide safe defaults
export const upsertOneInternal = internalMutation({
  args: {
    businessId: v.id("businesses"),
    playbook_key: v.string(),
    display_name: v.string(),
    version: v.string(),
    // Make all content fields optional and default in handler
    triggers: v.optional(v.any()),
    input_schema: v.optional(v.any()),
    output_schema: v.optional(v.any()),
    steps: v.optional(v.any()),
    metadata: v.optional(v.any()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Normalize and default payload
    const doc = {
      playbook_key: args.playbook_key,
      display_name: args.display_name,
      version: args.version,
      steps: Array.isArray(args.steps) ? args.steps : args.steps ?? [],
      triggers: Array.isArray(args.triggers) ? args.triggers : args.triggers ?? [],
      input_schema: args.input_schema ?? {},
      output_schema: args.output_schema ?? {},
      metadata: args.metadata ?? {},
      active: args.active ?? true,
    };

    const existing = await ctx.db
      .query("playbooks")
      .withIndex("by_key_and_version", (q) =>
        q.eq("playbook_key", doc.playbook_key).eq("version", doc.version)
      )
      .unique()
      .catch(() => null);

    if (existing) {
      // Replace preserves other fields while ensuring normalized doc fields
      await ctx.db.replace(existing._id, { ...existing, ...doc });
      return { updated: true, inserted: false };
    }
    await ctx.db.insert("playbooks", { 
      ...doc,
      name: doc.display_name,
      businessId: args.businessId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      trigger: "manual",
      isActive: doc.active ?? true, // Added
      createdBy: (await ctx.auth.getUserIdentity())?.subject as any, // Added placeholder, should be Id<"users">
    });
    return { updated: false, inserted: true };
  },
});

// Public mutation to upsert one playbook (useful for admin/editor tooling)
export const upsertPlaybook = mutation({
  args: {
    businessId: v.id("businesses"),
    playbook_key: v.string(),
    display_name: v.string(),
    version: v.string(),
    steps: v.any(),
    triggers: v.any(),
    // Relax these to optional and default in handler
    input_schema: v.optional(v.any()),
    output_schema: v.optional(v.any()),
    metadata: v.optional(v.any()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Defaults for optional fields to satisfy schema at rest
    const doc = {
      playbook_key: args.playbook_key,
      display_name: args.display_name,
      version: args.version,
      steps: Array.isArray(args.steps) ? args.steps : args.steps ?? [],
      triggers: Array.isArray(args.triggers) ? args.triggers : args.triggers ?? [],
      input_schema: args.input_schema ?? {},
      output_schema: args.output_schema ?? {},
      metadata: args.metadata ?? {},
      active: args.active ?? true,
    };

    const existing = await ctx.db
      .query("playbooks")
      .withIndex("by_key_and_version", (q) =>
        q.eq("playbook_key", doc.playbook_key).eq("version", doc.version)
      )
      .unique()
      .catch(() => null as any);

    if (existing) {
      await ctx.db.replace(existing._id, { ...existing, ...doc, active: doc.active ?? true });
      return { updated: true, inserted: false };
    }

    await ctx.db.insert("playbooks", { 
      ...doc, 
      active: doc.active ?? true,
      name: doc.display_name,
      businessId: args.businessId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      trigger: "manual",
      isActive: doc.active ?? true, // Added
      createdBy: (await ctx.auth.getUserIdentity())?.subject as any, // Added placeholder
    });
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
    steps: v.any(),
    triggers: v.any(),
    input_schema: v.optional(v.any()),
    output_schema: v.optional(v.any()),
    metadata: v.optional(v.any()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
    if (!isAdmin) throw new Error("Admin access required");

    const doc = {
      playbook_key: args.playbook_key,
      display_name: args.display_name,
      version: args.version,
      steps: Array.isArray(args.steps) ? args.steps : args.steps ?? [],
      triggers: Array.isArray(args.triggers) ? args.triggers : args.triggers ?? [],
      input_schema: args.input_schema ?? {},
      output_schema: args.output_schema ?? {},
      metadata: args.metadata ?? {},
      active: args.active ?? true,
    };

    const existing =
      (await ctx.db
        .query("playbooks")
        .withIndex("by_key_and_version", (q) =>
          q.eq("playbook_key", doc.playbook_key).eq("version", doc.version)
        )
        .unique()
        .catch(() => null as any)) || null;

    const playbookData = {
      playbook_key: doc.playbook_key,
      display_name: doc.display_name,
      version: doc.version,
      triggers: doc.triggers,
      input_schema: doc.input_schema,
      output_schema: doc.output_schema,
      steps: doc.steps,
      metadata: doc.metadata,
      active: doc.active,
    };

    let playbookId: string;
    if (existing) {
      await ctx.db.patch(existing._id, playbookData);
      playbookId = existing._id;
    } else {
      playbookId = await ctx.db.insert("playbooks", {
        // businessId: args.businessId as any, // Removed as it's not in schema
        playbook_key: args.key,
        display_name: args.name,
        description: args.description,
        version: "1.0.0",
        active: true,
        triggers: [],
        steps: [],
        input_schema: {},
        output_schema: {},
        metadata: {
            category: args.category,
            author: identity.email,
        },
      });
    }

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
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    // When calling upsert, ensure defaults are provided:
    const toUpsert = (p: any) => ({
      businessId: args.businessId,
      playbook_key: p.playbook_key,
      display_name: p.display_name,
      version: p.version ?? "v1.0",
      steps: Array.isArray(p.steps) ? p.steps : p.steps ?? [],
      triggers: Array.isArray(p.triggers) ? p.triggers : p.triggers ?? [],
      input_schema: p.input_schema ?? {},
      output_schema: p.output_schema ?? {},
      metadata: p.metadata ?? {},
      active: p.active ?? true,
    });

    let inserted = 0;
    let updated = 0;
    for (const p of DEFAULT_PLAYBOOKS) {
      const res = await ctx.runMutation(internal.playbooks.upsertOneInternal, toUpsert(p));
      if (res.inserted) inserted += 1;
      if (res.updated) updated += 1;
    }
    return { inserted, updated, total: DEFAULT_PLAYBOOKS.length };
  },
});

// Internal save version snapshot (called on publish)
export const savePlaybookVersionInternal = internalMutation({
  args: {
    playbook_key: v.string(),
    version: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const pb = await ctx.db
      .query("playbooks")
      .withIndex("by_key_and_version", (q) =>
        q.eq("playbook_key", args.playbook_key).eq("version", args.version)
      )
      .unique()
      .catch(() => null as any);
    if (!pb) return { saved: false };

    await ctx.db.insert("playbookVersions", {
      playbook_key: args.playbook_key,
      version: args.version,
      snapshot: {
        playbook_key: pb.playbook_key,
        display_name: pb.display_name,
        version: pb.version,
        triggers: pb.triggers,
        input_schema: pb.input_schema,
        output_schema: pb.output_schema,
        steps: pb.steps,
        metadata: pb.metadata,
        active: pb.active,
      },
      createdAt: Date.now(),
      // note: args.note,
    });
    return { saved: true };
  },
});

// Admin: list playbook versions (make playbook_key optional and safely no-op)
export const adminListPlaybookVersions = query({
  args: { playbook_key: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
    if (!isAdmin) return [];

    const key = (args.playbook_key || "").trim();
    if (!key) {
      // Gracefully return empty list if no key provided (initial load / nothing selected)
      return [];
    }

    const limit = Math.max(1, Math.min(args.limit ?? 25, 100));
    const rows = await ctx.db
      .query("playbookVersions")
      .withIndex("by_playbook_key", (q) => q.eq("playbook_key", key))
      .order("desc")
      .take(limit);
    return rows;
  },
});

// Admin: rollback playbook to specific version
export const adminRollbackPlaybookToVersion = mutation({
  args: { playbook_key: v.string(), versionId: v.id("playbookVersions") },
  handler: async (ctx, args) => {
    const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
    if (!isAdmin) throw new Error("Admin access required");

    const vdoc = await ctx.db.get(args.versionId);
    if (!vdoc || vdoc.playbook_key !== args.playbook_key) throw new Error("Version not found");

    const pb = await ctx.db
      .query("playbooks")
      .withIndex("by_key_and_version", (q) =>
        q.eq("playbook_key", args.playbook_key).eq("version", vdoc.snapshot.version)
      )
      .unique()
      .catch(() => null as any);

    if (!pb) throw new Error("Playbook not found");

    const s = vdoc.snapshot as any;
    await ctx.db.patch(pb._id, {
      display_name: s.display_name,
      // triggers: s.triggers,
      input_schema: s.input_schema,
      output_schema: s.output_schema,
      steps: s.steps,
      metadata: s.metadata,
      active: s.active,
    });

    await ctx.runMutation(api.audit.write as any, {
      action: "admin_rollback_playbook_to_version",
      entityType: "playbooks",
      entityId: pb._id,
      details: {
        playbook_key: args.playbook_key,
        versionId: String(args.versionId),
        correlationId: `playbook-rollback-to-version-${args.playbook_key}-${Date.now()}`,
      },
    });

    return { success: true };
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

    // Save version snapshot once (avoid duplicate insert)
    await ctx.runMutation(internal.playbooks.savePlaybookVersionInternal, {
      playbook_key: args.playbook_key,
      version: args.version,
      note: `Published by admin on ${new Date().toISOString()}`,
    });

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