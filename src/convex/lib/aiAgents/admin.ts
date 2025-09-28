import { api } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";

export async function adminAgentSummary(ctx: any, args: any) {
  const isAdmin = await ctx.runQuery((api as any).admin.getIsAdmin, {});
  if (!isAdmin) return { total: 0, byTenant: [] as Array<{ businessId: Id<"businesses">; count: number }> };

  const byTenantMap = new Map<string, number>();
  let total = 0;

  if (args.tenantId) {
    const rows = await ctx.db
      .query("agentProfiles")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.tenantId!))
      .take(1000);
    total = rows.length;
    // Fix: ensure map key is a string
    byTenantMap.set(String(args.tenantId), rows.length);
  } else {
    // iterate all agentProfiles in chunks (Convex scans; keep bounded)
    // fetch by known businesses via index with no eq is not supported; fallback to take batches
    const batch = await ctx.db.query("agentProfiles").take(1000);
    total = batch.length;
    for (const r of batch) {
      const key = String(r.businessId);
      byTenantMap.set(key, (byTenantMap.get(key) ?? 0) + 1);
    }
  }

  const byTenant: Array<{ businessId: Id<"businesses">; count: number }> = Array.from(
    byTenantMap.entries(),
  ).map(([k, count]) => ({ businessId: k as unknown as Id<"businesses">, count }));

  return { total, byTenant };
}

export async function adminListAgents(ctx: any, args: any) {
  const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
  if (!isAdmin) return [];

  const limit = Math.max(1, Math.min(args.limit ?? 100, 500));
  const base = ctx.db.query("agentCatalog");

  const rows =
    args.activeOnly !== undefined
      ? await base
          .withIndex("by_active", (q: any) => q.eq("active", args.activeOnly as boolean))
          .order("desc")
          .take(limit)
      : await base.order("desc").take(limit);

  if (args.tier) {
    return rows.filter((agent: any) => {
      const tiers = (agent as any).tier_restrictions || [];
      return tiers.length === 0 || tiers.includes(args.tier as string);
    });
  }

  return rows;
}

export async function adminGetAgent(ctx: any, args: any) {
  const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
  if (!isAdmin) throw new Error("Admin access required");

  const agent = await ctx.db
    .query("agentCatalog")
    .withIndex("by_agent_key", (q: any) => q.eq("agent_key", args.agent_key))
    .unique();

  if (!agent) throw new Error("Agent not found");
  return agent;
}

export async function adminUpsertAgent(ctx: any, args: any) {
  const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
  if (!isAdmin) throw new Error("Admin access required");

  const existing = await ctx.db
    .query("agentCatalog")
    .withIndex("by_agent_key", (q: any) => q.eq("agent_key", args.agent_key))
    .unique();

  const now = Date.now();
  const agentData = {
    agent_key: args.agent_key,
    display_name: args.display_name,
    short_desc: args.short_desc,
    long_desc: args.long_desc,
    capabilities: args.capabilities,
    default_model: args.default_model,
    model_routing: args.model_routing,
    prompt_template_version: args.prompt_template_version,
    prompt_templates: args.prompt_templates,
    input_schema: args.input_schema,
    output_schema: args.output_schema,
    tier_restrictions: args.tier_restrictions,
    confidence_hint: args.confidence_hint,
    active: args.active,
    updatedAt: now,
  };

  let agentId: string;
  if (existing) {
    await ctx.db.patch(existing._id, agentData);
    agentId = existing._id;
  } else {
    agentId = await ctx.db.insert("agentCatalog", {
      ...agentData,
      createdAt: now,
    });
  }

  // Audit log
  await ctx.runMutation(api.audit.write as any, {
    action: existing ? "admin_update_agent" : "admin_create_agent",
    entityType: "agentCatalog",
    entityId: agentId,
    details: {
      agent_key: args.agent_key,
      display_name: args.display_name,
      active: args.active,
      correlationId: `agent-admin-${args.agent_key}-${now}`,
    },
  });

  return { agentId, created: !existing };
}

export async function adminToggleAgent(ctx: any, args: any) {
  const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
  if (!isAdmin) throw new Error("Admin access required");

  const agent = await ctx.db
    .query("agentCatalog")
    .withIndex("by_agent_key", (q: any) => q.eq("agent_key", args.agent_key))
    .unique();

  if (!agent) throw new Error("Agent not found");

  await ctx.db.patch(agent._id, {
    active: args.active,
    updatedAt: Date.now(),
  });

  // Audit log
  await ctx.runMutation(api.audit.write as any, {
    action: "admin_toggle_agent",
    entityType: "agentCatalog",
    entityId: agent._id,
    details: {
      agent_key: args.agent_key,
      active: args.active,
      previous_active: agent.active,
      correlationId: `agent-toggle-${args.agent_key}-${Date.now()}`,
    },
  });

  return { success: true };
}

export async function adminUpdateAgentProfile(ctx: any, args: any) {
  const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
  if (isAdmin !== true) {
    throw new Error("Forbidden: admin privileges required");
  }

  const doc = await ctx.db.get(args.profileId);
  if (!doc) throw new Error("Profile not found");

  const patch: Record<string, unknown> = {};
  if (typeof args.trainingNotes === "string") patch.trainingNotes = args.trainingNotes;
  if (typeof args.brandVoice === "string") patch.brandVoice = args.brandVoice;
  if (Object.keys(patch).length === 0) return { updated: false };

  patch.lastUpdated = Date.now();
  await ctx.db.patch(args.profileId, patch);

  try {
    await ctx.runMutation(api.audit.write as any, {
      action: "admin_update_agent_profile",
      entityType: "agent_profile",
      entityId: args.profileId,
      details: {
        // minimal snapshot
        fieldsUpdated: Object.keys({ brandVoice: args.brandVoice, trainingNotes: args.trainingNotes }).filter(
          (k) => (args as any)[k] !== undefined
        ),
        correlationId: `agent-admin-${args.profileId}-${Date.now()}`,
      },
    });
  } catch {
    // swallow audit errors to avoid blocking admin action
  }

  return { updated: true };
}

export async function adminMarkAgentDisabled(ctx: any, args: any) {
  const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
  if (isAdmin !== true) {
    throw new Error("Forbidden: admin privileges required");
  }

  const profile = await ctx.db.get(args.profileId);
  if (!profile) throw new Error("Agent profile not found");
  const tn = (profile as any).trainingNotes || "";
  const alreadyDisabled = typeof tn === "string" && tn.includes("[DISABLED]");

  if (!alreadyDisabled) {
    await ctx.db.patch(args.profileId, { trainingNotes: `${tn}\n[DISABLED]${args.reason ? ` Reason: ${args.reason}` : ""}`, lastUpdated: Date.now() });
  }

  try {
    await ctx.runMutation(api.audit.write as any, {
      action: "admin_disable_agent",
      entityType: "agent_profile",
      entityId: args.profileId,
      details: {
        reason: args.reason || "",
        alreadyDisabled,
        correlationId: `agent-admin-disable-${args.profileId}-${Date.now()}`,
      },
    });
  } catch {
    // swallow audit errors to avoid blocking admin action
  }

  return { disabled: true };
}