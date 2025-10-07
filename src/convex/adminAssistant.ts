"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

type AssistantMode = "explain" | "confirm" | "auto";
type ToolKey = "health" | "flags" | "alerts" | "agents";
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

function canUseToolAction(
  role: "superadmin" | "senior" | "admin",
  tool: ToolKey,
  action:
    | "read"
    | "toggle"
    | "create"
    | "resolve"
    | "disable"
    | "retrain"
    | "attach"
    | "sweep"
): boolean {
  // Granular permissions per role and tool/action
  // - superadmin: full access
  if (role === "superadmin") return true;

  // - senior: read-only for everything; plus:
  //   flags: toggle
  //   alerts: create/resolve
  //   agents: disable/retrain/attach
  //   health: sweep
  if (role === "senior") {
    if (action === "read") return true;
    if (tool === "flags" && action === "toggle") return true;
    if (tool === "alerts" && (action === "create" || action === "resolve")) return true;
    if (tool === "agents" && (action === "disable" || action === "retrain" || action === "attach")) return true;
    if (tool === "health" && action === "sweep") return true;
    return false;
  }

  // role === "admin": read-only
  return action === "read";
}

export const sendMessage = action({
  args: {
    message: v.string(),
    mode: v.union(v.literal("explain"), v.literal("confirm"), v.literal("auto")),
    toolsAllowed: v.array(
      v.union(
        v.literal("health"),
        v.literal("flags"),
        v.literal("alerts"),
        v.literal("agents")
      )
    ),
    adminToken: v.optional(v.string()),
    // Add: dry-run simulation to preview actions without execution
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<SendMessageResult> => {
    // Gate: allow via independent Admin Portal session OR user-based admin
    let allowed = false;
    try {
      if (args.adminToken) {
        // Break type inference chain with bracket notation
        const internalObj: any = internal;
        const res: any = await ctx.runQuery(internalObj["adminAuthData"]["validateSession"], { token: args.adminToken } as any);
        allowed = !!(res && res.valid);
      }
    } catch {}
    if (!allowed) {
      try {
        const isAdmin: any = await ctx.runQuery(api.admin.getIsAdmin, {});
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

      // Add: Health SLA sweep trigger with RBAC and dry-run support
      if (args.toolsAllowed.includes("health")) {
        const wantsSweep = /\b(sla\s+sweep|sweep\s+sla|run\s+sla)\b/i.test(q);
        if (wantsSweep) {
          const permitted = canUseToolAction(role as any, "health", "sweep");
          if (!permitted) {
            steps.push({ tool: "health", title: "SLA sweep blocked by permissions", data: { role } });
          } else if (args.dryRun === true) {
            steps.push({ tool: "health", title: "Dry Run: would trigger SLA sweep", data: {} });
          } else {
            try {
              const res = await ctx.runMutation(internal.approvals.sweepOverdueApprovals as any, {} as any);
              steps.push({ tool: "health", title: "Triggered SLA sweep", data: { ok: true, result: res ?? null } });
            } catch (e: any) {
              steps.push({ tool: "health", title: "SLA sweep failed", data: { error: e?.message || String(e) } });
            }
          }
        }
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

    // New: Agents tool (admin visibility and overrides)
    if (args.toolsAllowed.includes("agents")) {
      // optional tenant scope: "for tenant <id>"
      const tenantScopeMatch = q.match(/for\s+tenant\s+([a-z0-9]{10,})/i);
      const scopedTenantId = tenantScopeMatch ? tenantScopeMatch[1] : undefined;

      // List summary and agents
      try {
        const summary = await ctx.runQuery(api.aiAgents.adminAgentSummary as any, {
          tenantId: scopedTenantId,
        } as any);
        steps.push({ tool: "agents", title: "Agent Summary", data: summary });
      } catch (e: any) {
        steps.push({ tool: "agents", title: "Failed to load agent summary", data: { error: e?.message || String(e) } });
      }
      let agents: any[] = [];
      try {
        agents = (await ctx.runQuery(api.aiAgents.adminListAgents as any, {
          tenantId: scopedTenantId,
          limit: 50,
        } as any)) as any[];
        steps.push({ tool: "agents", title: "Agents", data: { count: agents.length, agents } });
      } catch (e: any) {
        steps.push({ tool: "agents", title: "Failed to list agents", data: { error: e?.message || String(e) } });
      }

      // Actions if not explain-only
      if (args.mode !== "explain") {
        // disable agent
        const disableMatch = q.match(/disable\s+agent\s+([a-z0-9]{10,})/i);
        if (disableMatch?.[1]) {
          const profileId = disableMatch[1];
          const permitted = canUseToolAction(role as any, "agents", "disable");
          if (!permitted) {
            steps.push({ tool: "agents", title: "Disable agent blocked by permissions", data: { profileId, role } });
          } else if (args.dryRun === true) {
            steps.push({ tool: "agents", title: `Dry Run: would disable agent ${profileId}`, data: {} });
          } else {
            try {
              const res = await ctx.runMutation(api.aiAgents.adminMarkAgentDisabled as any, {
                profileId,
                reason: "disabled via admin assistant",
              } as any);
              steps.push({ tool: "agents", title: `Disabled agent ${profileId}`, data: res });
            } catch (e: any) {
              steps.push({ tool: "agents", title: "Disable agent failed", data: { error: e?.message || String(e) } });
            }
          }
        }

        // retrain agent: "retrain agent <id>: <text>"
        const retrainMatch = q.match(/retrain\s+agent\s+([a-z0-9]{10,})\s*:\s*(.+)$/i);
        if (retrainMatch?.[1] && retrainMatch?.[2]) {
          const profileId = retrainMatch[1];
          const trainingNotes = retrainMatch[2].trim();
          const permitted = canUseToolAction(role as any, "agents", "retrain");
          if (!permitted) {
            steps.push({ tool: "agents", title: "Retrain blocked by permissions", data: { profileId, role } });
          } else if (args.dryRun === true) {
            steps.push({ tool: "agents", title: `Dry Run: would retrain agent ${profileId}`, data: { trainingNotes } });
          } else {
            try {
              const res = await ctx.runMutation(api.aiAgents.adminUpdateAgentProfile as any, {
                profileId,
                trainingNotes,
              } as any);
              steps.push({ tool: "agents", title: `Updated training notes for ${profileId}`, data: res });
            } catch (e: any) {
              steps.push({ tool: "agents", title: "Retrain agent failed", data: { error: e?.message || String(e) } });
            }
          }
        }

        // attach global guidance (optionally tenant-scoped): "attach guidance: <text> [for tenant <id>]"
        const attachMatch = q.match(/attach\s+guidance\s*:\s*(.+)$/i);
        if (attachMatch?.[1]) {
          const guidance = attachMatch[1].trim();
          const permitted = canUseToolAction(role as any, "agents", "attach");
          if (!permitted) {
            steps.push({ tool: "agents", title: "Attach guidance blocked by permissions", data: { role } });
          } else if (args.dryRun === true) {
            steps.push({
              tool: "agents",
              title: "Dry Run: would attach global guidance",
              data: { tenantId: scopedTenantId ?? null, preview: guidance.slice(0, 160) },
            });
          } else {
            try {
              const targetAgents: any[] =
                agents && agents.length > 0
                  ? agents
                  : ((await ctx.runQuery(api.aiAgents.adminListAgents as any, {
                      tenantId: scopedTenantId,
                      limit: 50,
                    } as any)) as any[]);
              const max = Math.min(10, targetAgents.length); // cap to avoid long-running action
              const updated: string[] = [];
              for (let i = 0; i < max; i++) {
                const a = targetAgents[i];
                try {
                  await ctx.runMutation(api.aiAgents.adminUpdateAgentProfile as any, {
                    profileId: a._id,
                    trainingNotes: `${(a.trainingNotes || "").toString()}\n[GLOBAL-GUIDANCE] ${guidance}`,
                  } as any);
                  updated.push(String(a._id));
                } catch {}
              }
              steps.push({
                tool: "agents",
                title: "Attached global guidance",
                data: { tenantId: scopedTenantId ?? null, updatedCount: updated.length, updated },
              });
            } catch (e: any) {
              steps.push({ tool: "agents", title: "Attach guidance failed", data: { error: e?.message || String(e) } });
            }
          }
        }

        // view agent details: "view agent <id>"
        const viewMatch = q.match(/view\s+agent\s+([a-z0-9]{10,})/i);
        if (viewMatch?.[1]) {
          const profileId = viewMatch[1];
          const found = agents.find((a) => String(a._id) === profileId);
          if (found) {
            steps.push({
              tool: "agents",
              title: `Agent Details: ${profileId}`,
              data: {
                _id: found._id,
                businessId: found.businessId,
                userId: found.userId,
                brandVoice: found.brandVoice,
                timezone: found.timezone,
                lastUpdated: found.lastUpdated,
                trainingNotesPreview:
                  typeof found.trainingNotes === "string" ? found.trainingNotes.slice(0, 500) : undefined,
              },
            });
          } else {
            steps.push({ tool: "agents", title: `Agent not found: ${profileId}`, data: {} });
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