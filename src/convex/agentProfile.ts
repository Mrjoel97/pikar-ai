import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
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