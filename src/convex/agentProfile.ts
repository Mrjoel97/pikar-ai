import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getMyAgentProfile = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("agentProfiles")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .first();
    return profile || null;
  },
});

export const upsertMyAgentProfile = mutation({
  args: {
    businessId: v.id("businesses"),
    tone: v.optional(v.union(v.literal("concise"), v.literal("friendly"), v.literal("premium"))),
    persona: v.optional(v.union(v.literal("maker"), v.literal("coach"), v.literal("executive"))),
    cadence: v.optional(v.union(v.literal("light"), v.literal("standard"), v.literal("aggressive"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("agentProfiles")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...(args.tone !== undefined ? { tone: args.tone } : {}),
        ...(args.persona !== undefined ? { persona: args.persona } : {}),
        ...(args.cadence !== undefined ? { cadence: args.cadence } : {}),
      });
      return { _id: existing._id, updated: true };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email ?? ""))
      .first()
      .catch(() => null);

    const _id = await ctx.db.insert("agentProfiles", {
      businessId: args.businessId,
      userId: user?._id,
      tone: args.tone ?? "friendly",
      persona: args.persona ?? "maker",
      cadence: args.cadence ?? "standard",
      lastUpdated: Date.now(),
    } as any);
    return { _id, created: true };
  },
});