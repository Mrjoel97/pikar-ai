"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

type AssistantMode = "explain" | "confirm" | "auto";
type ToolKey = "health" | "flags" | "alerts";
type AssistantStep = { tool: ToolKey; title: string; data: any };
type SendMessageResult = { notice: string; steps: AssistantStep[]; summaryText?: string };

const RATE_WINDOW_MS = 60_000; // 1 minute
const RATE_MAX_CALLS = 10; // max per window
const recentRuns: Map<string, number[]> = new Map();

type UndoEntry = { at: number; flagName: string; previousEnabled: boolean };
const UNDO_WINDOW_MS = 15 * 60_000; // 15 minutes
const flagUndoStacks: Map<string, UndoEntry[]> = new Map();

function recordRun(key: string) {
  const now = Date.now();
  const arr = (recentRuns.get(key) ?? []).filter((t) => now - t <= RATE_WINDOW_MS);
  arr.push(now);
  recentRuns.set(key, arr);
}
function isRateLimited(key: string): { limited: boolean; remaining: number } {
  const now = Date.now();
  const arr = (recentRuns.get(key) ?? []).filter((t) => now - t <= RATE_WINDOW_MS);
  return { limited: arr.length >= RATE_MAX_CALLS, remaining: Math.max(0, RATE_MAX_CALLS - arr.length) };
}

function canUseToolAction(role: "superadmin" | "senior" | "admin", tool: ToolKey, action: "read" | "toggle" | "create" | "resolve"): boolean {
  // Granular permissions per role and tool/action
  // - superadmin: full
  // - senior: full for health read; flags toggle allowed; alerts create/resolve allowed
  // - admin: read-only for all tools by default; may use confirm/auto to request actions but blocked here
  if (role === "superadmin") return true;

  if (role === "senior") {
    if (action === "read") return true;
    if (tool === "flags" && action === "toggle") return true;
    if (tool === "alerts" && (action === "create" || action === "resolve")) return true;
    return false;
  }

  // role === "admin"
  return action === "read";
}

export const sendMessage = action({
  args: {
    message: v.string(),
    mode: v.union(v.literal("explain"), v.literal("confirm"), v.literal("auto")),
    toolsAllowed: v.array(v.union(v.literal("health"), v.literal("flags"), v.literal("alerts"))),
    adminToken: v.optional(v.string()),
    // Add: dry-run simulation to preview actions without execution
    dryRun: v.optional(v.boolean()),
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

    // Identify caller key for rate limiting and role guardrails
    const identity = await ctx.auth.getUserIdentity().catch(() => null);
    const callerKey =
      (args.adminToken && String(args.adminToken)) ||
      (identity?.email && identity.email.toLowerCase()) ||
      "anonymous";

    // Rate limiting (per-process, best effort)
    const rl = isRateLimited(callerKey);
    if (rl.limited) {
      return { notice: `Rate limit: Too many requests. Try again later.`, steps: [{ tool: "health", title: "Rate limit", data: { windowMs: RATE_WINDOW_MS, max: RATE_MAX_CALLS } }] };
    }
    recordRun(callerKey);

    // Basic role guardrails: treat env allowlist as superadmin, otherwise admin
    let role: "superadmin" | "admin" = "admin";
    try {
      const email = identity?.email?.toLowerCase();
      const envAllowlist = (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      if (email && envAllowlist.includes(email)) {
        role = "superadmin";
      }
      // Refine: if present in admins table as superadmin, elevate
      try {
        const admins: any[] = (await ctx.runQuery(api.admin.listAdmins as any, {} as any)) as any[];
        const mine = (admins || []).find((a: any) => String(a.email || "").toLowerCase() === email);
        if (mine?.role === "superadmin") role = "superadmin";
      } catch {}
    } catch {}

    const steps: AssistantStep[] = [];
    const q = args.message.toLowerCase();

    // Health tool (read-only)
    if (args.toolsAllowed.includes("health")) {
      try {
        const env = await ctx.runQuery(api.health.envStatus as any, {} as any);
        steps.push({ tool: "health", title: "Environment & System Health", data: env });
      } catch (e: any) {
        steps.push({ tool: "health", title: "Health check failed", data: { error: e?.message || String(e) } });
      }

      // Optional self-test instruction: "self test" or "self-test"
      if (/\bself[-\s]?test\b/i.test(q)) {
        steps.push({
          tool: "health",
          title: "Assistant Self-Test",
          data: {
            checks: [
              "envStatus reachable",
              "featureFlags.getFeatureFlags reachable",
              "admin.listAlerts reachable",
              "rateLimiter active",
              "dryRun available",
              "undo window (flags) active",
            ],
            notes: "This is a lightweight readiness probe from the assistant.",
          },
        });
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
        const m = q.match(/toggle\s+flag\s+([a-z0-9_\-\.]+)/i);
        if (m?.[1]) {
          const flagName = m[1];
          const permitted = canUseToolAction(role, "flags", "toggle");
          if (!permitted) {
            steps.push({ tool: "flags", title: `Toggle blocked by permissions`, data: { flagName, role } });
          } else if (args.dryRun === true) {
            steps.push({ tool: "flags", title: `Dry Run: would toggle "${flagName}"`, data: { flagName } });
          } else {
            try {
              const all = (await ctx.runQuery(api.featureFlags.getFeatureFlags as any, {} as any)) as any[];
              const match = all.find((f) => String(f.flagName).toLowerCase() === flagName.toLowerCase());
              if (match?._id) {
                const prev = !!match.isEnabled;
                const stack = flagUndoStacks.get(callerKey) ?? [];
                stack.push({ at: Date.now(), flagName: match.flagName, previousEnabled: prev });
                flagUndoStacks.set(
                  callerKey,
                  stack.filter((e) => Date.now() - e.at <= UNDO_WINDOW_MS).slice(-50)
                );
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

        // Undo flag toggle
        const undoMatch = q.match(/undo\s+flag\s+([a-z0-9_\-\.]+)/i);
        if (undoMatch?.[1]) {
          const uName = undoMatch[1];
          const permitted = canUseToolAction(role, "flags", "toggle");
          if (!permitted) {
            steps.push({ tool: "flags", title: `Undo blocked by permissions`, data: { flagName: uName, role } });
          } else if (args.dryRun === true) {
            const stack = (flagUndoStacks.get(callerKey) ?? []).filter((e) => Date.now() - e.at <= UNDO_WINDOW_MS);
            const last = [...stack].reverse().find((e) => e.flagName.toLowerCase() === uName.toLowerCase());
            steps.push({ tool: "flags", title: `Dry Run: would undo "${uName}"`, data: { to: last?.previousEnabled } });
          } else {
            try {
              const stack = (flagUndoStacks.get(callerKey) ?? []).filter((e) => Date.now() - e.at <= UNDO_WINDOW_MS);
              const last = [...stack].reverse().find((e) => e.flagName.toLowerCase() === uName.toLowerCase());
              if (!last) {
                steps.push({ tool: "flags", title: `No undo available for "${uName}"`, data: {} });
              } else {
                const all = (await ctx.runQuery(api.featureFlags.getFeatureFlags as any, {} as any)) as any[];
                const match = all.find((f) => String(f.flagName).toLowerCase() === uName.toLowerCase());
                if (match?._id) {
                  if (!!match.isEnabled !== !!last.previousEnabled) {
                    await ctx.runMutation(api.featureFlags.toggleFeatureFlag as any, { flagId: match._id } as any);
                  }
                  steps.push({ tool: "flags", title: `Undid flag "${match.flagName}"`, data: { nowEnabled: last.previousEnabled } });
                } else {
                  steps.push({ tool: "flags", title: `Flag not found for undo: ${uName}`, data: {} });
                }
              }
            } catch (e: any) {
              steps.push({ tool: "flags", title: "Undo flag failed", data: { error: e?.message || String(e) } });
            }
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
        const tenantScopeMatch = q.match(/for\s+tenant\s+([a-z0-9]{10,})/i);
        const scopedTenantId = tenantScopeMatch ? tenantScopeMatch[1] : undefined;

        // create alert
        const createMatch = q.match(/create\s+alert\s+(low|medium|high)\s*:\s*(.+)$/i);
        if (createMatch) {
          const severity = createMatch[1] as "low" | "medium" | "high";
          const title = createMatch[2].trim();
          const permitted = canUseToolAction(role, "alerts", "create");
          if (!permitted) {
            steps.push({ tool: "alerts", title: "Create alert blocked by permissions", data: { severity, title, role } });
          } else if (args.dryRun === true) {
            steps.push({ tool: "alerts", title: "Dry Run: would create alert", data: { severity, title, tenantId: scopedTenantId ?? null } });
          } else {
            try {
              const created = await ctx.runMutation(api.admin.createAlert as any, {
                title,
                severity,
                tenantId: scopedTenantId,
              } as any);
              steps.push({ tool: "alerts", title: "Created alert", data: created });
            } catch (e: any) {
              steps.push({ tool: "alerts", title: "Create alert failed", data: { error: e?.message || String(e) } });
            }
          }
        }

        // resolve alert
        const resolveMatch = q.match(/resolve\s+alert\s+([a-z0-9]{10,})/i);
        if (resolveMatch) {
          const alertId = resolveMatch[1];
          const permitted = canUseToolAction(role, "alerts", "resolve");
          if (!permitted) {
            steps.push({ tool: "alerts", title: "Resolve alert blocked by permissions", data: { alertId, role } });
          } else if (args.dryRun === true) {
            steps.push({ tool: "alerts", title: "Dry Run: would resolve alert", data: { alertId } });
          } else {
            try {
              const res = await ctx.runMutation(api.admin.resolveAlert as any, { alertId } as any);
              steps.push({ tool: "alerts", title: `Resolved alert ${alertId}`, data: res });
            } catch (e: any) {
              steps.push({ tool: "alerts", title: "Resolve alert failed", data: { error: e?.message || String(e) } });
            }
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
      // Attach to current user's business if available
      const biz = await ctx.runQuery(api.businesses.currentUserBusiness as any, {} as any);
      if (biz?._id) {
        await ctx.runMutation(internal.audit.write as any, {
          businessId: biz._id,
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
      }
    } catch {}

    return {
      notice: "Assistant processed your request.",
      steps,
      summaryText,
    };
  },
});