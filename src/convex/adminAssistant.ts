"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Modes dictate whether to execute mutating steps.
// MVP: read-only; future: "confirm" gating for mutating ops.
type AssistantMode = "explain" | "confirm" | "auto";
type ToolName = "health" | "flags" | "alerts";

export const sendMessage = action({
  args: {
    message: v.string(),
    mode: v.union(v.literal("explain"), v.literal("confirm"), v.literal("auto")),
    toolsAllowed: v.array(
      v.union(v.literal("health"), v.literal("flags"), v.literal("alerts"))
    ),
  },
  handler: async (ctx, args) => {
    // Guard: only platform admins may use the assistant.
    const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    const normalized = args.message.trim().toLowerCase();
    const tools: Array<ToolName> = args.toolsAllowed as any;

    const results: Array<{ tool: ToolName; data: any }> = [];

    // Tool: health (env posture, queues, cron)
    if (tools.includes("health") && (normalized.includes("health") || normalized.includes("status"))) {
      try {
        const env = await ctx.runQuery(api.health.envStatus, {});
        results.push({ tool: "health", data: env });
      } catch (e: any) {
        results.push({ tool: "health", data: { error: e?.message || "health failed" } });
      }
    }

    // Tool: flags (list)
    if (tools.includes("flags") && (normalized.includes("flag") || normalized.includes("feature"))) {
      try {
        const flags = await ctx.runQuery(api.featureFlags.getFeatureFlags as any, {});
        results.push({ tool: "flags", data: flags });
      } catch (e: any) {
        results.push({ tool: "flags", data: { error: e?.message || "flags failed" } });
      }
    }

    // Tool: alerts (list)
    if (tools.includes("alerts") && (normalized.includes("alert") || normalized.includes("incident"))) {
      try {
        const alerts = await ctx.runQuery(api.admin.listAlerts as any, { tenantId: undefined });
        results.push({ tool: "alerts", data: alerts });
      } catch (e: any) {
        results.push({ tool: "alerts", data: { error: e?.message || "alerts failed" } });
      }
    }

    // Default/fallback: if no specific cues, provide overview via health + flags summary
    if (results.length === 0) {
      try {
        const env = tools.includes("health") ? await ctx.runQuery(api.health.envStatus, {}) : null;
        const flags = tools.includes("flags")
          ? await ctx.runQuery(api.featureFlags.getFeatureFlags as any, {})
          : [];
        results.push({
          tool: (env ? "health" : "flags") as ToolName,
          data: { env, flags },
        });
      } catch (e: any) {
        results.push({ tool: "health", data: { error: e?.message || "assistant failed" } });
      }
    }

    return {
      mode: args.mode as AssistantMode,
      steps: results.map((r) => ({
        tool: r.tool,
        title:
          r.tool === "health"
            ? "System Health Overview"
            : r.tool === "flags"
            ? "Feature Flags Summary"
            : r.tool === "alerts"
            ? "Open Alerts"
            : "Result",
        data: r.data,
      })),
      notice:
        args.mode !== "explain"
          ? "MVP runs in read-only mode. Mutating actions will be added with confirmation in a later phase."
          : "Read-only analysis complete.",
    };
  },
});