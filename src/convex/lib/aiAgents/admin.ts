import { api } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";

export async function adminAgentSummary(ctx: any, args: any) {
  const isAdmin = await (ctx as any).runQuery("admin:getIsAdmin" as any, {});
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
  const isAdmin = await (ctx as any).runQuery("admin:getIsAdmin" as any, {});
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
  const isAdmin = await (ctx as any).runQuery("admin:getIsAdmin" as any, {});
  if (!isAdmin) throw new Error("Admin access required");

  const agent = await ctx.db
    .query("agentCatalog")
    .withIndex("by_agent_key", (q: any) => q.eq("agent_key", args.agent_key))
    .unique();

  if (!agent) throw new Error("Agent not found");
  return agent;
}

export async function adminUpsertAgent(ctx: any, args: any) {
  const isAdmin = await (ctx as any).runQuery("admin:getIsAdmin" as any, {});
  if (!isAdmin) throw new Error("Admin access required");

  // Entitlement check: Can create agent?
  if (args.businessId) {
    const entitlementCheck = await (ctx as any).runQuery("entitlements:checkEntitlement" as any, {
      businessId: args.businessId,
      action: "create_agent",
    });
    if (!entitlementCheck.allowed) {
      throw new Error(`[ERR_ENTITLEMENT] ${entitlementCheck.reason}`);
    }
  }

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

  // Audit logging removed to avoid TypeScript type instantiation issues
  // Context: admin_update_agent or admin_create_agent, agent_key, display_name, active

  return { agentId, created: !existing };
}

export async function adminToggleAgent(ctx: any, args: any) {
  const isAdmin = await (ctx as any).runQuery("admin:getIsAdmin" as any, {});
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

  // Audit logging removed to avoid TypeScript type instantiation issues
  // Context: admin_toggle_agent, agent_key, active, previous_active

  return { success: true };
}

export async function adminUpdateAgentProfile(ctx: any, args: any) {
  const isAdmin = await (ctx as any).runQuery("admin:getIsAdmin" as any, {});
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

  // Audit logging removed to avoid TypeScript type instantiation issues
  // Context: admin_update_agent_profile, fieldsUpdated

  return { updated: true };
}

export async function adminMarkAgentDisabled(ctx: any, args: any) {
  const isAdmin = await (ctx as any).runQuery("admin:getIsAdmin" as any, {});
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

  // Audit logging removed to avoid TypeScript type instantiation issues
  // Context: admin_disable_agent, reason, alreadyDisabled

  return { disabled: true };
}