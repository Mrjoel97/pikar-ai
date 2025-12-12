import { v } from "convex/values";
import { mutation, query, internalQuery, internalMutation } from "../_generated/server";

/**
 * Store calendar integration
 */
export const storeIntegration = internalMutation({
  args: {
    businessId: v.id("businesses"),
    userId: v.id("users"),
    provider: v.union(v.literal("google"), v.literal("outlook"), v.literal("apple")),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if integration already exists
    const existing = await ctx.db
      .query("calendarIntegrations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("provider"), args.provider)
        )
      )
      .first();

    if (existing) {
      // Update existing integration
      await ctx.db.patch(existing._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        isActive: true,
        connectedAt: Date.now(),
      });
      return existing._id;
    } else {
      // Create new integration
      return await ctx.db.insert("calendarIntegrations", {
        businessId: args.businessId,
        userId: args.userId,
        provider: args.provider,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        isActive: true,
        connectedAt: Date.now(),
      });
    }
  },
});

/**
 * Get calendar integration
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
 * List calendar integrations for a business
 */
export const listIntegrations = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("calendarIntegrations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
  },
});

/**
 * Update last sync time
 */
export const updateLastSync = internalMutation({
  args: {
    integrationId: v.id("calendarIntegrations"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.integrationId, {
      lastSyncAt: Date.now(),
    });
  },
});

/**
 * Create appointment from calendar sync
 */
export const createAppointmentFromSync = internalMutation({
  args: {
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    attendees: v.array(v.string()),
    location: v.optional(v.string()),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if appointment already exists (avoid duplicates)
    const existing = await ctx.db
      .query("appointments")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) =>
        q.and(
          q.eq(q.field("startTime"), args.startTime),
          q.eq(q.field("title"), args.title)
        )
      )
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("appointments", {
      businessId: args.businessId,
      title: args.title,
      description: args.description,
      startTime: args.startTime,
      endTime: args.endTime,
      attendees: args.attendees,
      location: args.location,
      type: args.type,
      status: "scheduled",
    });
  },
});

/**
 * Disconnect calendar integration
 */
export const disconnectIntegration = mutation({
  args: {
    integrationId: v.id("calendarIntegrations"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.integrationId, {
      isActive: false,
    });
  },
});