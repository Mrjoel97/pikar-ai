"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Modes dictate whether to execute mutating steps.
// MVP: read-only; future: "confirm" gating for mutating ops.
type AssistantMode = "explain" | "confirm" | "auto";
type ToolName = "health" | "flags" | "alerts";

// Add an explicit return type for the assistant action to satisfy TS
type SendMessageResult = {
  mode: AssistantMode;
  toolsUsed: ToolName[];
  steps: Array<string>;
  data: { results: Array<{ tool: ToolName; data: any }> };
  notices: Array<string>;
  summaryText: string | null;
};

export const sendMessage = action({
  args: {
    message: v.string(),
    mode: v.union(v.literal("explain"), v.literal("confirm"), v.literal("auto")),
    toolsAllowed: v.array(
      v.union(v.literal("health"), v.literal("flags"), v.literal("alerts"))
    ),
  },
  handler: async (ctx, args): Promise<SendMessageResult> => {
    // Guard: only platform admins may use the assistant.
    const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    const normalized = args.message.trim().toLowerCase();
    const tools: Array<ToolName> = args.toolsAllowed as any;

    const results: Array<{ tool: ToolName; data: any }> = [];

    // Add: tracking state for transcript + context used by LLM summary
    const mode = args.mode as AssistantMode;
    const userMessage = args.message;
    const steps: Array<string> = [];
    const notices: Array<string> = [];
    const toolsUsedSet = new Set<ToolName>();

    // Tool: health (env posture, queues, cron)
    if (tools.includes("health") && (normalized.includes("health") || normalized.includes("status"))) {
      try {
        const env = await ctx.runQuery(api.health.envStatus, {});
        results.push({ tool: "health", data: env });
        // New: record usage + transcript step
        toolsUsedSet.add("health");
        steps.push("Queried environment status");
      } catch (e: any) {
        results.push({ tool: "health", data: { error: e?.message || "health failed" } });
      }
    }

    // Tool: flags (list)
    if (tools.includes("flags") && (normalized.includes("flag") || normalized.includes("feature"))) {
      try {
        const flags = await ctx.runQuery(api.featureFlags.getFeatureFlags as any, {});
        results.push({ tool: "flags", data: flags });
        // New
        toolsUsedSet.add("flags");
        steps.push("Listed feature flags");
      } catch (e: any) {
        results.push({ tool: "flags", data: { error: e?.message || "flags failed" } });
      }
    }

    // Tool: alerts (list)
    if (tools.includes("alerts") && (normalized.includes("alert") || normalized.includes("incident"))) {
      try {
        const alerts = await ctx.runQuery(api.admin.listAlerts as any, { tenantId: undefined });
        results.push({ tool: "alerts", data: alerts });
        // New
        toolsUsedSet.add("alerts");
        steps.push("Listed alerts");
      } catch (e: any) {
        results.push({ tool: "alerts", data: { error: e?.message || "alerts failed" } });
      }
    }

    // READ-ONLY tools (health, flags, alerts) already implemented above.
    // Phase 2: Enable safe execution in "confirm" or "auto" modes.
    const canExecute = args.mode !== "explain";
    // New: mode notice
    notices.push(canExecute ? "Executing allowed operations (confirm/auto)" : "Explain mode: read-only");

    if (canExecute) {
      // 1) Toggle feature flag by name:
      if (normalized.includes("toggle flag")) {
        try {
          const match = normalized.match(/toggle flag\s+["']?([a-z0-9_\-\. \s]+)["']?/i);
          if (match && match[1]) {
            const name = match[1].trim().toLowerCase();
            const flags = await ctx.runQuery(api.featureFlags.getFeatureFlags as any, {});
            const found = (flags || []).find((f: any) => String(f.flagName || "").toLowerCase() === name);
            if (!found) {
              results.push({
                tool: "flags",
                data: { error: `Flag "${name}" not found`, available: (flags || []).map((f: any) => f.flagName) },
              });
            } else {
              const before = !!found.isEnabled;
              const after = await ctx.runMutation(api.featureFlags.toggleFeatureFlag as any, { flagId: found._id });
              results.push({
                tool: "flags",
                data: { action: "toggleFlag", flagId: found._id, flagName: found.flagName, before, after },
              });
              // New: record step
              steps.push(`Toggled feature flag ${name}`);
              toolsUsedSet.add("flags");
            }
          } else {
            results.push({
              tool: "flags",
              data: { error: 'Could not parse flag name. Try: toggle flag "my_flag_name"' },
            });
          }
        } catch (e: any) {
          results.push({ tool: "flags", data: { error: e?.message || "toggle flag failed" } });
        }
      }

      // 2) Create alert:
      if (normalized.includes("create alert")) {
        try {
          const sevMatch = normalized.match(/\b(low|medium|high)\b/);
          const severity = (sevMatch?.[1] as "low" | "medium" | "high" | undefined) || undefined;
          let title = "";
          const titleAfterColon = args.message.split(":").slice(1).join(":").trim();
          if (titleAfterColon) title = titleAfterColon;
          if (!title) {
            title = args.message.replace(/create alert/i, "").replace(/\b(low|medium|high)\b/i, "").replace(/:/g, "").trim();
          }

          if (!severity || !title) {
            results.push({
              tool: "alerts",
              data: { error: 'Usage: create alert <low|medium|high>: <title>' },
            });
          } else {
            const created = await ctx.runMutation(api.admin.createAlert as any, {
              severity,
              title,
              description: undefined,
              tenantId: undefined,
            });
            results.push({
              tool: "alerts",
              data: { action: "createAlert", severity, title, created },
            });
            // New: record step
            steps.push(`Created alert (${severity}): ${title}`);
            toolsUsedSet.add("alerts");
          }
        } catch (e: any) {
          results.push({ tool: "alerts", data: { error: e?.message || "create alert failed" } });
        }
      }

      // 3) Resolve alert by id:
      if (normalized.includes("resolve alert")) {
        try {
          let id = "";
          const quoted = args.message.match(/resolve alert\s+["']([^"']+)["']/i);
          if (quoted?.[1]) {
            id = quoted[1].trim();
          } else {
            const parts = args.message.trim().split(/\s+/);
            id = parts[parts.length - 1];
          }
          if (!id || /resolve/i.test(id)) {
            results.push({
              tool: "alerts",
              data: { error: 'Usage: resolve alert "<alertId>"' },
            });
          } else {
            const res = await ctx.runMutation(api.admin.resolveAlert as any, { alertId: id });
            results.push({
              tool: "alerts",
              data: { action: "resolveAlert", alertId: id, result: res ?? "ok" },
            });
            // New: record step
            steps.push(`Resolved alert ${id}`);
            toolsUsedSet.add("alerts");
          }
        } catch (e: any) {
          results.push({ tool: "alerts", data: { error: e?.message || "resolve alert failed" } });
        }
      }

      // 4) Check base URL posture (server-side view via envStatus)
      if (normalized.includes("check base url")) {
        try {
          const env = await ctx.runQuery(api.health.envStatus, {});
          results.push({
            tool: "health",
            data: {
              action: "checkBaseUrl",
              hasBASE_URL: !!env?.hasBASE_URL,
              note: "Frontend can open Settings or the base URL for further verification.",
            },
          });
          // New: record step
          steps.push("Checked base URL posture");
          toolsUsedSet.add("health");
        } catch (e: any) {
          results.push({ tool: "health", data: { error: e?.message || "check base url failed" } });
        }
      }

      // 5) Open settings (instruction only; frontend should handle navigation)
      if (normalized.includes("open settings")) {
        results.push({
          tool: "health",
          data: { action: "openSettings", instruction: "Client should navigate to /settings" },
        });
        // New: record step
        steps.push("Requested to open settings UI");
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
        // New: record usage + step
        if (env) toolsUsedSet.add("health");
        if (Array.isArray(flags)) toolsUsedSet.add("flags");
        steps.push("Provided overview of health and flags");
      } catch (e: any) {
        results.push({ tool: "health", data: { error: e?.message || "assistant failed" } });
      }
    }

    // New: finalize structured result for LLM prompt and response payload
    const toolsUsed: Array<ToolName> = Array.from(toolsUsedSet);
    const data = { results };

    let summaryText: string | null = null;
    try {
      const hasOpenAI =
        !!process.env.OPENAI_API_KEY || !!process.env.OPENAI_API_KEY?.toString();
      if (hasOpenAI) {
        const compactSteps = Array.isArray(steps)
          ? steps.map((s: any, i: number) => `Step ${i + 1}: ${typeof s === "string" ? s : JSON.stringify(s)}`).join("\n")
          : "";
        const compactData = data
          ? JSON.stringify(data, (_k, v) => (typeof v === "string" && v.length > 500 ? v.slice(0, 500) + "…" : v), 2)
          : "";
        const compactTools = Array.isArray(toolsUsed) ? toolsUsed.join(", ") : String(toolsUsed || "");

        const prompt = [
          "You are the Admin Copilot for Pikar AI.",
          "Summarize the results clearly for an admin. Be concise, actionable, and accurate.",
          `Mode: ${mode || "explain"}`,
          `Tools Used: ${compactTools || "none"}`,
          compactSteps ? `Actions/Steps:\n${compactSteps}` : "",
          compactData ? `Structured Data:\n${compactData}` : "",
          userMessage ? `User Prompt:\n${userMessage}` : "",
          "Output format:",
          "- 1–3 bullet summary",
          "- Key findings",
          "- Next best actions (if any)",
        ]
          .filter(Boolean)
          .join("\n\n");

        const llm: { text?: string } | null = (await ctx.runAction(api.openai.generate, {
          prompt,
          model: "gpt-4o-mini",
          temperature: 0.2,
          maxTokens: 600,
        })) as any;
        if (llm?.text && typeof llm.text === "string") {
          summaryText = llm.text.trim();
        }
      }
    } catch (e) {
      console.error("AdminAssistant LLM summarization failed:", (e as any)?.message || e);
      summaryText = null;
    }

    return {
      mode: args.mode as AssistantMode,
      toolsUsed,
      steps,
      data,
      notices,
      summaryText,
    };
  },
});