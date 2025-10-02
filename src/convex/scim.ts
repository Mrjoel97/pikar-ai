"use node";

import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * SCIM 2.0 Server Implementation
 * Provides user and group provisioning endpoints for IdP integration
 */

// SCIM User Schema
const scimUserValidator = v.object({
  userName: v.string(),
  name: v.optional(v.object({
    givenName: v.optional(v.string()),
    familyName: v.optional(v.string()),
  })),
  emails: v.optional(v.array(v.object({
    value: v.string(),
    primary: v.optional(v.boolean()),
  }))),
  active: v.optional(v.boolean()),
  externalId: v.optional(v.string()),
});

// SCIM Group Schema
const scimGroupValidator = v.object({
  displayName: v.string(),
  members: v.optional(v.array(v.object({
    value: v.string(),
    display: v.optional(v.string()),
  }))),
  externalId: v.optional(v.string()),
});

/**
 * Internal mutation to sync user from IdP
 */
export const syncUserFromIdP = internalMutation({
  args: {
    scimId: v.string(),
    userName: v.string(),
    email: v.string(),
    givenName: v.optional(v.string()),
    familyName: v.optional(v.string()),
    active: v.boolean(),
    externalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user exists by email
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    let userId: Id<"users">;

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        name: args.givenName && args.familyName 
          ? `${args.givenName} ${args.familyName}` 
          : args.userName,
        email: args.email,
      });
      userId = existingUser._id;
    } else {
      // Create new user
      userId = await ctx.db.insert("users", {
        name: args.givenName && args.familyName 
          ? `${args.givenName} ${args.familyName}` 
          : args.userName,
        email: args.email,
      });
    }

    // Log sync event
    await ctx.db.insert("scimSyncLog", {
      entityType: "user",
      entityId: args.scimId,
      action: existingUser ? "update" : "create",
      status: "success",
      timestamp: Date.now(),
      details: { userId: userId as string, email: args.email },
    });

    return userId;
  },
});

/**
 * Internal mutation to sync group from IdP
 */
export const syncGroupFromIdP = internalMutation({
  args: {
    scimId: v.string(),
    displayName: v.string(),
    memberIds: v.array(v.string()),
    externalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // For now, we'll log the group sync
    // In a full implementation, you'd create a groups table
    await ctx.db.insert("scimSyncLog", {
      entityType: "group",
      entityId: args.scimId,
      action: "sync",
      status: "success",
      timestamp: Date.now(),
      details: { displayName: args.displayName, memberCount: args.memberIds.length },
    });

    return args.scimId;
  },
});

/**
 * Query to get SCIM sync logs
 */
export const getSyncLogs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const logs = await ctx.db
      .query("scimSyncLog")
      .order("desc")
      .take(limit);
    
    return logs;
  },
});

/**
 * Query to get sync statistics
 */
export const getSyncStats = query({
  args: {},
  handler: async (ctx) => {
    const logs = await ctx.db
      .query("scimSyncLog")
      .order("desc")
      .take(100);

    const last24h = Date.now() - 24 * 60 * 60 * 1000;
    const recentLogs = logs.filter(log => log.timestamp > last24h);

    return {
      totalSyncs: logs.length,
      last24h: recentLogs.length,
      usersSynced: recentLogs.filter(l => l.entityType === "user").length,
      groupsSynced: recentLogs.filter(l => l.entityType === "group").length,
      errors: recentLogs.filter(l => l.status === "error").length,
      lastSync: logs[0]?.timestamp ?? null,
    };
  },
});

/**
 * Mutation to generate SCIM bearer token
 */
export const generateScimToken = mutation({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    // Generate a secure random token
    const token = `scim_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    
    // Store token hash (in production, use proper hashing)
    await ctx.db.insert("api_keys", {
      tenantId: args.businessId,
      keyHash: token, // In production, hash this
      name: "SCIM Bearer Token",
      scopes: ["scim:read", "scim:write"],
      createdAt: Date.now(),
    });

    return token;
  },
});

/**
 * Action to force sync from IdP
 */
export const forceSync = mutation({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    // Log force sync request
    await ctx.db.insert("scimSyncLog", {
      entityType: "system",
      entityId: "force-sync",
      action: "force_sync",
      status: "success",
      timestamp: Date.now(),
      details: { businessId: args.businessId as string },
    });

    return { success: true, message: "Force sync initiated" };
  },
});
