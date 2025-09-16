import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getMy = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, { businessId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Use existing index by_business then filter by userId
    const rows = await ctx.db
      .query("agentProfiles")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .take(100);

    const doc = rows.find((r) => r.userId === userId) ?? null;
    return doc;
  },
});

export const upsert = mutation({
  args: {
    businessId: v.id("businesses"),
    businessSummary: v.optional(v.string()),
    industry: v.optional(v.string()),
    brandVoice: v.optional(v.string()),
    timezone: v.optional(v.string()),
    preferences: v.optional(
      v.object({
        automations: v.object({
          invoicing: v.optional(v.boolean()),
          emailDrafts: v.optional(v.boolean()),
          socialPosts: v.optional(v.boolean()),
        }),
      }),
    ),
    docRefs: v.optional(v.array(v.id("_storage"))),
    trainingNotes: v.optional(v.string()),
    onboardingScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { businessId, ...rest } = args;
    const now = Date.now();

    // Use existing index by_business then filter by userId
    const rows = await ctx.db
      .query("agentProfiles")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .take(100);

    const existing = rows.find((r) => r.userId === userId) ?? null;

    if (existing) {
      await ctx.db.patch(existing._id, { ...rest, lastUpdated: now });
      return existing._id;
    }

    const _id = await ctx.db.insert("agentProfiles", {
      userId,
      businessId,
      ...rest,
      lastUpdated: now,
    });
    return _id;
  },
});

// Add: Load current user's Agent Profile (tone/persona/cadence) if present
export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Expect one profile per user; if multiple ever exist, take most recent
    const rows = await ctx.db
      .query("agentProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(1);

    const doc = rows[0] || null;
    if (!doc) return null;

    // Return only the v2 fields we care about plus _id for potential future edits
    return {
      _id: doc._id,
      tone: (doc as any).tone ?? null,
      persona: (doc as any).persona ?? null,
      cadence: (doc as any).cadence ?? null,
    };
  },
});

// Add: Upsert current user's Agent Profile v2 fields
export const upsertMyProfile = mutation({
  args: {
    tone: v.union(v.literal("concise"), v.literal("friendly"), v.literal("premium")),
    persona: v.union(v.literal("maker"), v.literal("coach"), v.literal("executive")),
    cadence: v.union(v.literal("light"), v.literal("standard"), v.literal("aggressive")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const rows = await ctx.db
      .query("agentProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(1);

    const now = Date.now();
    if (rows.length > 0) {
      const doc = rows[0];
      await ctx.db.patch(doc._id, {
        tone: args.tone,
        persona: args.persona,
        cadence: args.cadence,
        lastUpdated: now,
      } as any);
      return { ok: true as const, _id: doc._id };
    } else {
      // Create a new profile; find a business for this user
      // Prefer owned business; fallback to team membership
      const owned = await ctx.db
        .query("businesses")
        .withIndex("by_owner", (q) => q.eq("ownerId", userId))
        .take(1);

      let businessId = owned[0]?._id;
      if (!businessId) {
        const member = await ctx.db
          .query("businesses")
          .withIndex("by_team_member", (q) => q.eq("teamMembers", userId as any))
          .take(1);
        businessId = member[0]?._id;
      }

      if (!businessId) {
        throw new Error("No business found for current user to attach agent profile");
      }

      const _id = await ctx.db.insert("agentProfiles", {
        userId,
        businessId,
        lastUpdated: now,
        // v2 fields
        tone: args.tone,
        persona: args.persona,
        cadence: args.cadence,
      } as any);
      return { ok: true as const, _id };
    }
  },
});