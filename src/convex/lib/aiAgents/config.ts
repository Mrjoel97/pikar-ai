import { api } from "../../_generated/api";

// Returns a concise health summary for an agent's tooling readiness
export async function getAgentToolHealth(
  ctx: any,
  args: { agent_key: string }
): Promise<{ ok: boolean; issues: string[]; summary: any }> {
  const issues: Array<string> = [];
  let agent: any | null = null;

  // Try indexed lookup first; fallback to a safe scan if index name differs
  try {
    agent = await ctx.db
      .query("agentCatalog")
      .withIndex("by_agent_key", (q: any) => q.eq("agent_key", args.agent_key))
      .unique();
  } catch {
    // Fallback: safe async scan
    for await (const row of ctx.db.query("agentCatalog")) {
      if ((row as any).agent_key === args.agent_key) {
        agent = row as any;
        break;
      }
    }
  }

  if (!agent) {
    issues.push("missing_agent");
    return {
      ok: false,
      issues,
      summary: { agent_key: args.agent_key, active: false, reason: "missing_agent" },
    };
  }

  if (!agent.active) {
    issues.push("not_published");
  }

  // Evaluate the global evaluation gate (if enabled)
  let evalSummary: any = null;
  try {
    evalSummary = await ctx.runQuery(api.evals.latestSummary as any, {});
    if (evalSummary?.gateRequired && evalSummary?.allPassing === false) {
      issues.push("evals_failing");
    }
  } catch {
    // Non-fatal; just include a hint
    issues.push("evals_unknown");
  }

  // Summarize minimal info; expandable later with RAG/KG checks
  const summary = {
    agent_key: args.agent_key,
    active: !!agent.active,
    evalGate: evalSummary
      ? { required: !!evalSummary.gateRequired, allPassing: !!evalSummary.allPassing }
      : { required: false, allPassing: true },
  };

  return { ok: issues.length === 0, issues, summary };
}

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