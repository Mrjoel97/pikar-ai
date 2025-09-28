import { internal } from "../../_generated/api";
import { api } from "../../_generated/api";

export async function saveAgentVersionInternal(ctx: any, args: any) {
  const doc = await ctx.db
    .query("agentCatalog")
    .withIndex("by_agent_key", (q: any) => q.eq("agent_key", args.agent_key))
    .unique()
    .catch(() => null);
  if (!doc) return { saved: false };

  const version = `v${(doc as any).prompt_template_version || "1"}-${Date.now()}`;
  await ctx.db.insert("agentVersions", {
    agent_key: args.agent_key,
    version,
    snapshot: {
      agent_key: doc.agent_key,
      display_name: doc.display_name,
      short_desc: doc.short_desc,
      long_desc: doc.long_desc,
      capabilities: doc.capabilities,
      default_model: doc.default_model,
      model_routing: doc.model_routing,
      prompt_template_version: doc.prompt_template_version,
      prompt_templates: doc.prompt_templates,
      input_schema: doc.input_schema,
      output_schema: doc.output_schema,
      tier_restrictions: doc.tier_restrictions,
      confidence_hint: doc.confidence_hint,
      active: doc.active,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    },
    createdAt: Date.now(),
    note: args.note,
  });
  return { saved: true, version };
}

export async function adminListAgentVersions(ctx: any, args: any) {
  const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
  if (!isAdmin) return [];
  const limit = Math.max(1, Math.min(args.limit ?? 25, 100));
  const rows = await ctx.db
    .query("agentVersions")
    .withIndex("by_agent_key", (q: any) => q.eq("agent_key", args.agent_key))
    .order("desc")
    .take(limit);
  return rows;
}

export async function adminRollbackAgentToVersion(ctx: any, args: any) {
  const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
  if (!isAdmin) throw new Error("Admin access required");

  const versionDoc = await ctx.db.get(args.versionId);
  if (!versionDoc || versionDoc.agent_key !== args.agent_key) {
    throw new Error("Version not found");
  }
  const agent = await ctx.db
    .query("agentCatalog")
    .withIndex("by_agent_key", (q: any) => q.eq("agent_key", args.agent_key))
    .unique()
    .catch(() => null);
  if (!agent) throw new Error("Agent not found");

  const s = versionDoc.snapshot as any;
  await ctx.db.patch(agent._id, {
    display_name: s.display_name,
    short_desc: s.short_desc,
    long_desc: s.long_desc,
    capabilities: s.capabilities,
    default_model: s.default_model,
    model_routing: s.model_routing,
    prompt_template_version: s.prompt_template_version,
    prompt_templates: s.prompt_templates,
    input_schema: s.input_schema,
    output_schema: s.output_schema,
    tier_restrictions: s.tier_restrictions,
    confidence_hint: s.confidence_hint,
    active: s.active,
    updatedAt: Date.now(),
  });

  await ctx.runMutation(api.audit.write as any, {
    action: "admin_rollback_agent_to_version",
    entityType: "agentCatalog",
    entityId: agent._id,
    details: {
      agent_key: args.agent_key,
      versionId: String(args.versionId),
      correlationId: `agent-rollback-to-version-${args.agent_key}-${Date.now()}`,
    },
  });

  return { success: true };
}