import { v } from "convex/values";
import { mutation, query, internalQuery, internalMutation } from "../_generated/server";

/**
 * Connect Google Calendar
 */
export const connectGoogleCalendar = mutation({
  args: {
    businessId: v.id("businesses"),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if integration already exists
    const existing = await ctx.db
      .query("calendarIntegrations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.eq(q.field("provider"), "google"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        isActive: true,
        lastSyncAt: Date.now(),
      });
      return existing._id;
    }

    const integrationId = await ctx.db.insert("calendarIntegrations", {
      businessId: args.businessId,
      userId: user._id,
      provider: "google",
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      expiresAt: args.expiresAt,
      isActive: true,
      connectedAt: Date.now(),
    });

    return integrationId;
  },
});

/**
 * Disconnect calendar integration
 */
export const disconnectCalendar = mutation({
  args: {
    integrationId: v.id("calendarIntegrations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(args.integrationId, {
      isActive: false,
    });

    return true;
  },
});

/**
 * List calendar integrations
 */
export const listCalendarIntegrations = query({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return [];
    }

    const integrations = await ctx.db
      .query("calendarIntegrations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return integrations.map((int) => ({
      _id: int._id,
      provider: int.provider,
      connectedAt: int.connectedAt,
      lastSyncAt: int.lastSyncAt,
      expiresAt: int.expiresAt,
    }));
  },
});

/**
 * Get integration (internal)
 */
export const getIntegration = internalQuery({
  args: {
    integrationId: v.id("calendarIntegrations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.integrationId);
  },
});

/**
 * Update last sync timestamp (internal)
 */
export const updateLastSync = internalMutation({
  args: {
    integrationId: v.id("calendarIntegrations"),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.integrationId, {
      lastSyncAt: args.timestamp,
    });
  },
});