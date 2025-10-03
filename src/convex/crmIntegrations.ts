import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Connect a CRM account
export const connectCRM = mutation({
  args: {
    businessId: v.id("businesses"),
    platform: v.union(
      v.literal("salesforce"),
      v.literal("hubspot"),
      v.literal("pipedrive")
    ),
    accountName: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email ?? ""))
      .first();
    if (!user) throw new Error("User not found");

    const connectionId = await ctx.db.insert("crmConnections", {
      businessId: args.businessId,
      userId: user._id,
      platform: args.platform,
      accountName: args.accountName,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      tokenExpiresAt: args.tokenExpiresAt,
      isActive: true,
      connectedAt: Date.now(),
      lastSyncAt: undefined,
    });

    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      userId: user._id,
      action: "crm_connected",
      entityType: "crmConnection",
      entityId: connectionId,
      details: { platform: args.platform },
      createdAt: Date.now(),
    });

    return connectionId;
  },
});

// Disconnect a CRM account
export const disconnectCRM = mutation({
  args: {
    connectionId: v.id("crmConnections"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const connection = await ctx.db.get(args.connectionId);
    if (!connection) throw new Error("Connection not found");

    await ctx.db.patch(args.connectionId, {
      isActive: false,
    });

    await ctx.db.insert("audit_logs", {
      businessId: connection.businessId,
      userId: connection.userId,
      action: "crm_disconnected",
      entityType: "crmConnection",
      entityId: args.connectionId,
      details: { platform: connection.platform },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Refresh CRM token
export const refreshCRMToken = mutation({
  args: {
    connectionId: v.id("crmConnections"),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(args.connectionId, {
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      tokenExpiresAt: args.tokenExpiresAt,
    });

    return { success: true };
  },
});

// List CRM connections for a business (guest-safe)
export const listConnections = query({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    // Return empty list if no businessId provided (guest/public views)
    if (!args.businessId) {
      return [];
    }

    const businessId = args.businessId as Id<"businesses">;

    const connections = await ctx.db
      .query("crmConnections")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .collect();

    return connections;
  },
});

// Get sync status for a business
export const getSyncStatus = query({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    // Return empty status if no businessId provided (guest/public views)
    if (!args.businessId) {
      return {
        connections: 0,
        lastSync: undefined,
        pendingConflicts: 0,
      };
    }

    const businessId = args.businessId as Id<"businesses">;

    const connections = await ctx.db
      .query("crmConnections")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const conflicts = await ctx.db
      .query("crmSyncConflicts")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    return {
      connections: connections.length,
      lastSync: connections[0]?.lastSyncAt,
      pendingConflicts: conflicts.length,
    };
  },
});

// Trigger manual sync
export const triggerSync = mutation({
  args: {
    connectionId: v.id("crmConnections"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const connection = await ctx.db.get(args.connectionId);
    if (!connection) throw new Error("Connection not found");

    await ctx.db.patch(args.connectionId, {
      lastSyncAt: Date.now(),
    });

    await ctx.db.insert("audit_logs", {
      businessId: connection.businessId,
      userId: connection.userId,
      action: "crm_sync_triggered",
      entityType: "crmConnection",
      entityId: args.connectionId,
      details: { platform: connection.platform },
      createdAt: Date.now(),
    });

    return { success: true, syncedAt: Date.now() };
  },
});

// Resolve sync conflict
export const resolveConflict = mutation({
  args: {
    conflictId: v.id("crmSyncConflicts"),
    resolution: v.union(v.literal("keep_local"), v.literal("keep_remote"), v.literal("merge")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const conflict = await ctx.db.get(args.conflictId);
    if (!conflict) throw new Error("Conflict not found");

    await ctx.db.patch(args.conflictId, {
      status: "resolved",
      resolution: args.resolution,
      resolvedAt: Date.now(),
    });

    return { success: true };
  },
});

// List sync conflicts (guest-safe)
export const listConflicts = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Return empty list if no businessId provided (guest/public views)
    if (!args.businessId) {
      return [];
    }

    const businessId = args.businessId as Id<"businesses">;

    const conflicts = await ctx.db
      .query("crmSyncConflicts")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    return conflicts;
  },
});

// List deals for pipeline view
export const listDeals = query({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    // Return empty list if no businessId provided (guest/public views)
    if (!args.businessId) {
      return [];
    }

    const businessId = args.businessId as Id<"businesses">;

    const deals = await ctx.db
      .query("crmDeals")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .collect();

    return deals;
  },
});

// Update deal stage
export const updateDealStage = mutation({
  args: {
    dealId: v.id("crmDeals"),
    stage: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const deal = await ctx.db.get(args.dealId);
    if (!deal) throw new Error("Deal not found");

    await ctx.db.patch(args.dealId, {
      stage: args.stage,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("audit_logs", {
      businessId: deal.businessId,
      action: "deal_stage_updated",
      entityType: "crmDeal",
      entityId: args.dealId,
      details: { oldStage: deal.stage, newStage: args.stage },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});