import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

export const listIntegrations = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    if (!args.businessId) return [];
    
    return await ctx.db
      .query("calendarIntegrations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .collect();
  },
});

export const getIntegration = query({
  args: { integrationId: v.id("calendarIntegrations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.integrationId);
  },
});

export const storeIntegration = mutation({
  args: {
    businessId: v.id("businesses"),
    userId: v.optional(v.id("users")),
    provider: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("calendarIntegrations")
      .withIndex("by_business_and_provider", (q) => 
        q.eq("businessId", args.businessId).eq("provider", args.provider)
      )
      .first();

    if (existing) {
      return await ctx.db.patch(existing._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        email: args.email,
        isActive: true,
        lastSyncAt: Date.now(),
        userId: args.userId,
      });
    }

    return await ctx.db.insert("calendarIntegrations", {
      businessId: args.businessId,
      userId: args.userId,
      provider: args.provider,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      expiresAt: args.expiresAt,
      email: args.email,
      isActive: true,
      lastSyncAt: Date.now(),
    });
  },
});