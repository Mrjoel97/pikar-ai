import { api } from "../../_generated/api";

export async function getAgentConfig(ctx: any, args: any) {
  const config = await ctx.db
    .query("agentConfigs")
    .withIndex("by_agent_key", (q: any) => q.eq("agent_key", args.agent_key))
    .first();
  
  return config || { 
    agent_key: args.agent_key, 
    useRag: false, 
    useKgraph: false 
  };
}

export async function adminUpdateAgentConfig(ctx: any, args: any) {
  const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
  if (!isAdmin) {
    throw new Error("Admin access required");
  }

  const existing = await ctx.db
    .query("agentConfigs")
    .withIndex("by_agent_key", (q: any) => q.eq("agent_key", args.agent_key))
    .first();

  const now = Date.now();
  
  if (existing) {
    await ctx.db.patch(existing._id, {
      useRag: args.useRag ?? existing.useRag,
      useKgraph: args.useKgraph ?? existing.useKgraph,
      updatedAt: now,
    });
  } else {
    await ctx.db.insert("agentConfigs", {
      agent_key: args.agent_key,
      useRag: args.useRag ?? false,
      useKgraph: args.useKgraph ?? false,
      createdAt: now,
    });
  }

  // Audit log
  await ctx.runMutation(api.audit.write, {
    businessId: "global" as any,
    action: "agent_config_update",
    entityType: "agentConfigs",
    entityId: args.agent_key,
    details: {
      agent_key: args.agent_key,
      useRag: args.useRag,
      useKgraph: args.useKgraph,
    },
  });

  return true;
}

export async function getAgentToolHealth(ctx: any, args: { agent_key: string }): Promise<any> {
  // Load agent (to read active flag)
  const agent = await ctx.db
    .query("agentCatalog")
    .withIndex("by_agent_key", (q: any) => q.eq("agent_key", args.agent_key))
    .unique()
    .catch(() => null);
  const active = !!agent?.active;

  // Eval gate status (best-effort)
  let evalAllPassing = false;
  try {
    const evalSummary: any = await ctx.runQuery(api.evals.latestSummary as any, {});
    evalAllPassing = !!(evalSummary as any)?.allPassing;
  } catch {
    // If evals not available, treat as not passing to surface the gate
    evalAllPassing = false;
  }

  // Agent config (RAG/KG flags)
  const cfg = await getAgentConfig(ctx, { agent_key: args.agent_key });
  const useRag = !!(cfg as any)?.useRag;
  const useKgraph = !!(cfg as any)?.useKgraph;

  // RAG vector chunks existence (only if enabled)
  let hasVectors = true;
  if (useRag) {
    const chunks = await ctx.db
      .query("vectorChunks")
      .withIndex("by_scope", (q: any) => q.eq("scope", "global"))
      .take(1);
    hasVectors = chunks.length > 0;
  }

  // Knowledge graph nodes existence (only if enabled)
  let hasKgraph = true;
  if (useKgraph) {
    const nodes = await ctx.db.query("kgraphNodes").take(1);
    hasKgraph = nodes.length > 0;
  }

  // Dataset linkage (lightweight scan) — treat as helpful signal
  const ds = await ctx.db.query("agentDatasets").take(200);
  const datasetsLinked = ds.some(
    (d: any) => Array.isArray(d.linkedAgentKeys) && d.linkedAgentKeys.includes(args.agent_key)
  );

  // Compile issues list
  const issues: Array<string> = [];
  if (!active) issues.push("Agent is not published (inactive).");
  if (!evalAllPassing) issues.push("Evaluation gate is failing.");
  if (useRag && !hasVectors) issues.push("RAG enabled but no vector chunks found.");
  if (useKgraph && !hasKgraph) issues.push("Knowledge Graph enabled but no nodes found.");
  if ((useRag || useKgraph) && !datasetsLinked) issues.push("No datasets linked to this agent.");

  return {
    agent_key: args.agent_key,
    active,
    evalAllPassing,
    config: { useRag, useKgraph },
    hasVectors,
    hasKgraph,
    datasetsLinked,
    issues,
    ok: issues.length === 0,
    checkedAt: Date.now(),
  };
}