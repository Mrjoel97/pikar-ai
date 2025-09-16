import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

// List pinned templates for the current user (optionally scoped by tier or search in UI later)
export const listPinned = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    // Allow guests: return empty list instead of throwing
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const userId = await getAuthUserId(ctx);
    // Allow guests: return empty list instead of throwing
    if (!userId) {
      return [];
    }

    const limit = Math.min(Math.max(args.limit ?? 50, 1), 200);

    const pins = await ctx.db
      .query("templatePins")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    // Hydrate minimal template info for UI convenience (best-effort)
    const items: Array<{
      _id: Id<"templatePins">;
      templateId: Id<"workflowTemplates">;
      pinnedAt: number;
      template?: {
        _id: Id<"workflowTemplates">;
        name: string;
        description?: string;
        tier?: string;
        tags?: Array<string>;
      } | null;
    }> = [];

    for (const p of pins) {
      let template: any = null;
      try {
        const t = await ctx.db.get(p.templateId);
        if (t) {
          template = {
            _id: t._id,
            name: t.name,
            description: t.description,
            tier: (t as any).tier,
            tags: (t as any).tags,
          };
        }
      } catch {
        // ignore hydration failure
      }
      items.push({
        _id: p._id,
        templateId: p.templateId,
        pinnedAt: p.pinnedAt,
        template,
      });
    }
    return items;
  },
});

// Toggle pin/unpin a template for the current user
export const togglePin = mutation({
  args: {
    templateId: v.id("workflowTemplates"),
    pin: v.optional(v.boolean()), // if omitted, will toggle
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if already pinned
    const existing = await ctx.db
      .query("templatePins")
      .withIndex("by_user_and_template", (q) =>
        q.eq("userId", userId).eq("templateId", args.templateId),
      )
      .unique()
      .catch(() => null);

    const now = Date.now();

    if (existing) {
      // Decide action based on explicit pin flag or toggle default
      const shouldUnpin = args.pin === undefined ? true : !args.pin;
      if (shouldUnpin) {
        await ctx.db.delete(existing._id);
        return { ok: true as const, pinned: false };
      } else {
        // already pinned; bump pinnedAt for recency
        await ctx.db.patch(existing._id, { pinnedAt: now });
        return { ok: true as const, pinned: true };
      }
    } else {
      // Not pinned yet
      const shouldPin = args.pin === undefined ? true : args.pin;
      if (!shouldPin) {
        return { ok: true as const, pinned: false };
      }
      await ctx.db.insert("templatePins", {
        userId,
        templateId: args.templateId,
        pinnedAt: now,
      });
      return { ok: true as const, pinned: true };
    }
  },
});