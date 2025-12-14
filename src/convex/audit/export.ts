import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

/**
 * Export audit logs to CSV format
 */
export const exportAuditLogs = action({
  args: {
    businessId: v.id("businesses"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    format: v.optional(v.union(v.literal("csv"), v.literal("json"))),
  },
  handler: async (ctx, args) => {
    const logs: any[] = await ctx.runQuery(api.audit.search.searchAuditLogs, {
      businessId: args.businessId,
      startDate: args.startDate,
      endDate: args.endDate,
      limit: 10000,
    });

    const format = args.format || "csv";

    if (format === "json") {
      return {
        format: "json",
        data: JSON.stringify(logs, null, 2),
        filename: `audit-logs-${Date.now()}.json`,
      };
    }

    // CSV format
    const headers = ["Timestamp", "Action", "Entity Type", "Entity ID", "User ID", "IP Address", "Details"];
    const rows = logs.map((log: any) => [
      new Date(log.createdAt || log._creationTime).toISOString(),
      log.action,
      log.entityType,
      log.entityId,
      log.userId || "system",
      log.ipAddress || "N/A",
      JSON.stringify(log.details),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row: any[]) => row.map((cell: any) => `"${String(cell).replace(/\"/g, '\"\"')}\"`).join(",")),
    ].join("\n");

    return {
      format: "csv",
      data: csv,
      filename: `audit-logs-${Date.now()}.csv`,
    };
  },
});

/**
 * Schedule automated audit log exports
 */
export const scheduleExport = action({
  args: {
    businessId: v.id("businesses"),
    frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    format: v.union(v.literal("csv"), v.literal("json")),
    recipients: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // This would integrate with email service to send scheduled exports
    // For now, return configuration
    return {
      businessId: args.businessId,
      frequency: args.frequency,
      format: args.format,
      recipients: args.recipients,
      nextExport: Date.now() + (args.frequency === "daily" ? 86400000 : args.frequency === "weekly" ? 604800000 : 2592000000),
    };
  },
});