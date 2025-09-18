"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

type AssistantMode = "explain" | "confirm" | "auto";
type ToolKey = "health" | "flags" | "alerts";
type AssistantStep = { tool: ToolKey; title: string; data: any };
type SendMessageResult = { notice: string; steps: AssistantStep[]; summaryText?: string };

export const sendMessage = action({
  args: {
    message: v.string(),
    mode: v.union(v.literal("explain"), v.literal("confirm"), v.literal("auto")),
    toolsAllowed: v.array(v.union(v.literal("health"), v.literal("flags"), v.literal("alerts"))),
    adminToken: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<SendMessageResult> => {
    // Gate: allow via independent Admin Portal session OR user-based admin
    let allowed = false;
    try {
      if (args.adminToken) {
        const res = await ctx.runQuery(api.adminAuthData.validateSession as any, { token: args.adminToken } as any);
        allowed = !!(res && (res as any).valid);
      }
    } catch {}
    if (!allowed) {
      try {
        const isAdmin = await ctx.runQuery(api.admin.getIsAdmin as any, {} as any);
        allowed = !!isAdmin;
      } catch {}
    }
    if (!allowed) {
      return { notice: "Unauthorized", steps: [] };
    }

    const steps: AssistantStep[] = [];
    const q = args.message.toLowerCase();

    // Health tool
    if (args.toolsAllowed.includes("health")) {
      try {
        const env = await ctx.runQuery(api.health.envStatus as any, {} as any);
        steps.push({ tool: "health", title: "Environment & System Health", data: env });
      } catch (e: any) {
        steps.push({ tool: "health", title: "Health check failed", data: { error: e?.message || String(e) } });
      }
    }

    // Flags tool
    if (args.toolsAllowed.includes("flags")) {
      try {
        const flags = await ctx.runQuery(api.featureFlags.getFeatureFlags as any, {} as any);
        steps.push({ tool: "flags", title: "Feature Flags", data: flags });
      } catch (e: any) {
        steps.push({ tool: "flags", title: "Failed to load flags", data: { error: e?.message || String(e) } });
      }

      if (args.mode !== "explain") {
        // naive parse: "toggle flag <name>"
        const m = q.match(/toggle\s+flag\s+([a-z0-9_\-\.]+)/i);
        if (m?.[1]) {
          try {
            const flagName = m[1];
            const all = (await ctx.runQuery(api.featureFlags.getFeatureFlags as any, {} as any)) as any[];
            const match = all.find((f) => String(f.flagName).toLowerCase() === flagName.toLowerCase());
            if (match?._id) {
              const toggled = await ctx.runMutation(api.featureFlags.toggleFeatureFlag as any, { flagId: match._id } as any);
              steps.push({ tool: "flags", title: `Toggled flag "${match.flagName}"`, data: { nowEnabled: !!toggled } });
            } else {
              steps.push({ tool: "flags", title: `Flag not found: ${flagName}`, data: {} });
            }
          } catch (e: any) {
            steps.push({ tool: "flags", title: "Toggle flag failed", data: { error: e?.message || String(e) } });
          }
        }
      }
    }

    // Alerts tool
    if (args.toolsAllowed.includes("alerts")) {
      try {
        const alerts = await ctx.runQuery(api.admin.listAlerts as any, {} as any);
        steps.push({ tool: "alerts", title: "Open Alerts", data: alerts });
      } catch (e: any) {
        steps.push({ tool: "alerts", title: "Failed to list alerts", data: { error: e?.message || String(e) } });
      }

      if (args.mode !== "explain") {
        // create alert: "create alert <severity>: <title>"
        const createMatch = q.match(/create\s+alert\s+(low|medium|high)\s*:\s*(.+)$/i);
        if (createMatch) {
          const severity = createMatch[1] as "low" | "medium" | "high";
          const title = createMatch[2].trim();
          try {
            const created = await ctx.runMutation(api.admin.createAlert as any, {
              title,
              severity,
            } as any);
            steps.push({ tool: "alerts", title: "Created alert", data: created });
          } catch (e: any) {
            steps.push({ tool: "alerts", title: "Create alert failed", data: { error: e?.message || String(e) } });
          }
        }

        // resolve alert: "resolve alert <id>"
        const resolveMatch = q.match(/resolve\s+alert\s+([a-z0-9]{10,})/i);
        if (resolveMatch) {
          const alertId = resolveMatch[1];
          try {
            const res = await ctx.runMutation(api.admin.resolveAlert as any, { alertId } as any);
            steps.push({ tool: "alerts", title: `Resolved alert ${alertId}`, data: res });
          } catch (e: any) {
            steps.push({ tool: "alerts", title: "Resolve alert failed", data: { error: e?.message || String(e) } });
          }
        }
      }
    }

    // LLM summary (optional)
    let summaryText: string | undefined;
    try {
      const prompt = [
        "You are an admin assistant. Summarize these tool results concisely for an admin.",
        `Mode: ${args.mode}`,
        `User prompt: ${args.message}`,
        "Steps JSON:",
        JSON.stringify(steps).slice(0, 12000),
        "Provide at most 4 bullet points."
      ].join("\n");
      const llm = (await ctx.runAction(api.openai.generate as any, { prompt } as any)) as any;
      const text = llm?.text || llm?.content || llm?.output;
      if (typeof text === "string" && text.trim()) {
        summaryText = text.trim();
      }
    } catch {}

    // Audit (best-effort, non-blocking)
    try {
      await ctx.runMutation(api.audit.write as any, {
        action: "admin_assistant_run",
        entityType: "admin_assistant",
        entityId: "assistant",
        details: {
          mode: args.mode,
          tools: args.toolsAllowed,
          message: args.message,
          steps,
          summaryText,
        },
      } as any);
    } catch {}

    return {
      notice: "Assistant processed your request.",
      steps,
      summaryText,
    };
  },
});