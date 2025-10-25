import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// Enhanced connection mutation with webhook setup
export const connectCRM = mutation({
  args: {
    businessId: v.id("businesses"),
    platform: v.union(v.literal("salesforce"), v.literal("hubspot"), v.literal("pipedrive")),
    accountName: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const connectionId = await ctx.db.insert("crmConnections", {
      businessId: args.businessId,
      userId: (await ctx.auth.getUserIdentity())?._id as Id<"users">,
      platform: args.platform,
      accountName: args.accountName,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      tokenExpiresAt: args.tokenExpiresAt,
      isActive: true,
      connectedAt: Date.now(),
    });

    // Schedule webhook registration
    await ctx.scheduler.runAfter(0, internal.crmIntegrations.registerWebhooks, {
      connectionId,
    });

    return connectionId;
  },
});

// Internal mutation to register webhooks with CRM platform
export const registerWebhooks = internalMutation({
  args: { connectionId: v.id("crmConnections") },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) return;

    // In production, this would call the CRM API to register webhooks
    // For now, we'll just log the registration
    console.log(`Registering webhooks for ${connection.platform} connection ${args.connectionId}`);
  },
});

// Webhook handler for incoming CRM events
export const handleWebhook = mutation({
  args: {
    connectionId: v.id("crmConnections"),
    eventType: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection || !connection.isActive) {
      throw new Error("Invalid or inactive connection");
    }

    // Schedule sync based on event type
    if (args.eventType.includes("contact")) {
      await ctx.scheduler.runAfter(0, internal.crmIntegrations.syncContactFromWebhook, {
        connectionId: args.connectionId,
        payload: args.payload,
      });
    } else if (args.eventType.includes("deal")) {
      await ctx.scheduler.runAfter(0, internal.crmIntegrations.syncDealFromWebhook, {
        connectionId: args.connectionId,
        payload: args.payload,
      });
    }

    return { success: true };
  },
});

// Internal mutation to sync contact from webhook
export const syncContactFromWebhook = internalMutation({
  args: {
    connectionId: v.id("crmConnections"),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) return;

    const email = args.payload.email;
    const existingContact = await ctx.db
      .query("contacts")
      .withIndex("by_business_and_email", (q) =>
        q.eq("businessId", connection.businessId).eq("email", email)
      )
      .first();

    if (existingContact) {
      // Check for conflicts
      const hasConflict = existingContact.name !== args.payload.name;
      
      if (hasConflict) {
        await ctx.db.insert("crmSyncConflicts", {
          businessId: connection.businessId,
          connectionId: args.connectionId,
          contactEmail: email,
          conflictType: "name_mismatch",
          localData: { name: existingContact.name },
          remoteData: { name: args.payload.name },
          status: "pending",
          createdAt: Date.now(),
        });
      } else {
        // Update contact
        await ctx.db.patch(existingContact._id, {
          name: args.payload.name,
          lastEngagedAt: Date.now(),
        });
      }
    } else {
      // Create new contact
      await ctx.db.insert("contacts", {
        businessId: connection.businessId,
        email: email,
        name: args.payload.name,
        tags: [],
        status: "subscribed",
        source: `crm_${connection.platform}`,
        createdBy: connection.userId,
        createdAt: Date.now(),
      });
    }

    // Update last sync time
    await ctx.db.patch(args.connectionId, {
      lastSyncAt: Date.now(),
    });
  },
});

// Internal mutation to sync deal from webhook
export const syncDealFromWebhook = internalMutation({
  args: {
    connectionId: v.id("crmConnections"),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) return;

    await ctx.db.insert("crmDeals", {
      businessId: connection.businessId,
      connectionId: args.connectionId,
      name: args.payload.name,
      value: args.payload.value,
      stage: args.payload.stage,
      contactName: args.payload.contactName,
      contactEmail: args.payload.contactEmail,
      closeDate: args.payload.closeDate,
      probability: args.payload.probability,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.patch(args.connectionId, {
      lastSyncAt: Date.now(),
    });
  },
});

// Enhanced trigger sync with error handling and retry
export const triggerSync = mutation({
  args: { connectionId: v.id("crmConnections") },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      throw new Error("Connection not found");
    }

    if (!connection.isActive) {
      throw new Error("Connection is not active");
    }

    // Schedule bidirectional sync
    await ctx.scheduler.runAfter(0, internal.crmIntegrations.performBidirectionalSync, {
      connectionId: args.connectionId,
    });

    return { success: true, message: "Sync initiated" };
  },
});

// Internal mutation for bidirectional sync
export const performBidirectionalSync = internalMutation({
  args: { connectionId: v.id("crmConnections") },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) return;

    try {
      // Update sync status
      await ctx.db.patch(args.connectionId, {
        lastSyncAt: Date.now(),
      });

      // In production, this would call external CRM APIs
      console.log(`Performing bidirectional sync for ${connection.platform}`);
    } catch (error: any) {
      console.error("Sync error:", error);
      // Retry logic would go here
    }
  },
});

// Disconnect CRM
export const disconnectCRM = mutation({
  args: { connectionId: v.id("crmConnections") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.connectionId, {
      isActive: false,
    });
    return { success: true };
  },
});

// List connections
export const listConnections = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("crmConnections")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
  },
});

// Get sync conflicts
export const getSyncConflicts = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("crmSyncConflicts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
  },
});

// Resolve sync conflict
export const resolveConflict = mutation({
  args: {
    conflictId: v.id("crmSyncConflicts"),
    resolution: v.union(v.literal("keep_local"), v.literal("keep_remote"), v.literal("merge")),
  },
  handler: async (ctx, args) => {
    const conflict = await ctx.db.get(args.conflictId);
    if (!conflict) {
      throw new Error("Conflict not found");
    }

    await ctx.db.patch(args.conflictId, {
      status: "resolved",
      resolution: args.resolution,
      resolvedAt: Date.now(),
    });

    // Apply resolution
    if (args.resolution === "keep_remote") {
      const contact = await ctx.db
        .query("contacts")
        .withIndex("by_business_and_email", (q) =>
          q.eq("businessId", conflict.businessId).eq("email", conflict.contactEmail)
        )
        .first();

      if (contact && conflict.remoteData) {
        await ctx.db.patch(contact._id, {
          name: conflict.remoteData.name,
        });
      }
    }

    return { success: true };
  },
});

// Get sync status
export const getSyncStatus = query({
  args: { connectionId: v.id("crmConnections") },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) return null;

    const conflicts = await ctx.db
      .query("crmSyncConflicts")
      .withIndex("by_connection", (q) => q.eq("connectionId", args.connectionId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    return {
      connection,
      pendingConflicts: conflicts.length,
      lastSyncAt: connection.lastSyncAt,
      isActive: connection.isActive,
    };
  },
});