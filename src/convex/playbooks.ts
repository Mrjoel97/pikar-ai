import { query, mutation, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
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