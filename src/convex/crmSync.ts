"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal, api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// Bidirectional contact sync action
export const syncContacts = action({
  args: {
    connectionId: v.id("crmConnections"),
    direction: v.union(v.literal("push"), v.literal("pull"), v.literal("both")),
  },
  handler: async (ctx, args): Promise<{ success: boolean; synced: number; errors: number }> => {
    const connection = await ctx.runQuery(api.crmIntegrations.getSyncStatus, {
      connectionId: args.connectionId,
    });

    if (!connection || !connection.connection) {
      throw new Error("Connection not found");
    }

    let synced = 0;
    let errors = 0;

    try {
      if (args.direction === "pull" || args.direction === "both") {
        // Pull contacts from CRM
        const remoteContacts = await fetchRemoteContacts(
          connection.connection.platform,
          connection.connection.accessToken
        );

        for (const remoteContact of remoteContacts) {
          try {
            await ctx.runMutation(internal.crmIntegrations.syncContactFromWebhook, {
              connectionId: args.connectionId,
              payload: remoteContact,
            });
            synced++;
          } catch (error) {
            console.error("Error syncing contact:", error);
            errors++;
          }
        }
      }

      if (args.direction === "push" || args.direction === "both") {
        // Push local contacts to CRM
        // Implementation would fetch local contacts and push to CRM API
        console.log("Pushing contacts to CRM...");
      }

      return { success: true, synced, errors };
    } catch (error: any) {
      console.error("Sync error:", error);
      return { success: false, synced, errors: errors + 1 };
    }
  },
});

// Bidirectional deal sync action
export const syncDeals = action({
  args: {
    connectionId: v.id("crmConnections"),
    direction: v.union(v.literal("push"), v.literal("pull"), v.literal("both")),
  },
  handler: async (ctx, args): Promise<{ success: boolean; synced: number; errors: number }> => {
    const connection = await ctx.runQuery(api.crmIntegrations.getSyncStatus, {
      connectionId: args.connectionId,
    });

    if (!connection || !connection.connection) {
      throw new Error("Connection not found");
    }

    let synced = 0;
    let errors = 0;

    try {
      if (args.direction === "pull" || args.direction === "both") {
        // Pull deals from CRM
        const remoteDeals = await fetchRemoteDeals(
          connection.connection.platform,
          connection.connection.accessToken
        );

        for (const remoteDeal of remoteDeals) {
          try {
            await ctx.runMutation(internal.crmIntegrations.syncDealFromWebhook, {
              connectionId: args.connectionId,
              payload: remoteDeal,
            });
            synced++;
          } catch (error) {
            console.error("Error syncing deal:", error);
            errors++;
          }
        }
      }

      return { success: true, synced, errors };
    } catch (error: any) {
      console.error("Sync error:", error);
      return { success: false, synced, errors: errors + 1 };
    }
  },
});

// Activity sync action
export const syncActivities = action({
  args: {
    connectionId: v.id("crmConnections"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; synced: number }> => {
    const connection = await ctx.runQuery(api.crmIntegrations.getSyncStatus, {
      connectionId: args.connectionId,
    });

    if (!connection || !connection.connection) {
      throw new Error("Connection not found");
    }

    // Fetch and sync activities (calls, emails, meetings)
    const activities = await fetchRemoteActivities(
      connection.connection.platform,
      connection.connection.accessToken
    );

    console.log(`Synced ${activities.length} activities`);

    return { success: true, synced: activities.length };
  },
});

// Conflict resolution action
export const resolveConflictBatch = action({
  args: {
    conflictIds: v.array(v.id("crmSyncConflicts")),
    resolution: v.union(v.literal("keep_local"), v.literal("keep_remote"), v.literal("merge")),
  },
  handler: async (ctx, args): Promise<{ resolved: number; failed: number }> => {
    let resolved = 0;
    let failed = 0;

    for (const conflictId of args.conflictIds) {
      try {
        await ctx.runMutation(api.crmIntegrations.resolveConflict, {
          conflictId,
          resolution: args.resolution,
        });
        resolved++;
      } catch (error) {
        console.error("Error resolving conflict:", error);
        failed++;
      }
    }

    return { resolved, failed };
  },
});

// Get comprehensive sync status
export const getComprehensiveSyncStatus = action({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args): Promise<{
    connections: any[];
    totalConflicts: number;
    lastSyncTimes: any[];
  }> => {
    const connections: any[] = await ctx.runQuery(api.crmIntegrations.listConnections, {
      businessId: args.businessId,
    });

    const statuses: any[] = await Promise.all(
      connections.map(async (conn: any) => {
        const status = await ctx.runQuery(api.crmIntegrations.getSyncStatus, {
          connectionId: conn._id,
        });
        return status;
      })
    );

    const conflicts: any[] = await ctx.runQuery(api.crmIntegrations.getSyncConflicts, {
      businessId: args.businessId,
    });

    return {
      connections: statuses,
      totalConflicts: conflicts.length,
      lastSyncTimes: statuses.map((s: any) => s?.lastSyncAt).filter(Boolean),
    };
  },
});

// Helper functions for CRM API calls (mock implementations)
async function fetchRemoteContacts(platform: string, accessToken: string) {
  // In production, this would call the actual CRM API
  console.log(`Fetching contacts from ${platform}`);
  return [
    { email: "john@example.com", name: "John Doe" },
    { email: "jane@example.com", name: "Jane Smith" },
  ];
}

async function fetchRemoteDeals(platform: string, accessToken: string) {
  // In production, this would call the actual CRM API
  console.log(`Fetching deals from ${platform}`);
  return [
    {
      name: "Enterprise Deal",
      value: 50000,
      stage: "negotiation",
      contactEmail: "john@example.com",
      contactName: "John Doe",
      probability: 75,
      closeDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
    },
  ];
}

async function fetchRemoteActivities(platform: string, accessToken: string) {
  // In production, this would call the actual CRM API
  console.log(`Fetching activities from ${platform}`);
  return [];
}
