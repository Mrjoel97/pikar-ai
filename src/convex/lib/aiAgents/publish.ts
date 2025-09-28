import { api } from "../../_generated/api";
import { internal } from "../../_generated/api";

export async function adminPublishAgent(ctx: any, args: any) {
  const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
  if (!isAdmin) throw new Error("Admin access required");

  // Gate on evaluations: require allPassing
  const evalSummary = await ctx.runQuery(api.evals.latestSummary, {});
  if (!(evalSummary as any)?.allPassing) {
    throw new Error("Evaluations gate failed: not all passing. Fix failures before publish.");
  }

  const agent = await ctx.db
    .query("agentCatalog")
    .withIndex("by_agent_key", (q: any) => q.eq("agent_key", args.agent_key))
    .unique()
    .catch(() => null);
  if (!agent) throw new Error("Agent not found");

  if (agent.active === true) return { success: true, alreadyPublished: true };

  await ctx.db.patch(agent._id, { active: true, updatedAt: Date.now() });
  // Save version snapshot after publish
  await ctx.runMutation(internal.aiAgents.saveAgentVersionInternal, {
    agent_key: args.agent_key,
    note: "Published",
  });

  try {
    await ctx.runMutation(api.audit.write as any, {
      action: "admin_publish_agent",
      entityType: "agentCatalog",
      entityId: agent._id,
      details: {
        agent_key: args.agent_key,
        previous_active: agent.active,
        correlationId: `agent-publish-${args.agent_key}-${Date.now()}`,
      },
    });
  } catch {}

  return { success: true, alreadyPublished: false };
}

export async function adminRollbackAgent(ctx: any, args: any) {
  const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
  if (!isAdmin) throw new Error("Admin access required");

  const agent = await ctx.db
    .query("agentCatalog")
    .withIndex("by_agent_key", (q: any) => q.eq("agent_key", args.agent_key))
    .unique()
    .catch(() => null);
  if (!agent) throw new Error("Agent not found");

  if (agent.active === false) return { success: true, alreadyRolledBack: true };

  await ctx.db.patch(agent._id, { active: false, updatedAt: Date.now() });

  try {
    await ctx.runMutation(api.audit.write as any, {
      action: "admin_rollback_agent",
      entityType: "agentCatalog",
      entityId: agent._id,
      details: {
        agent_key: args.agent_key,
        previous_active: agent.active,
        correlationId: `agent-rollback-${args.agent_key}-${Date.now()}`,
      },
    });
  } catch {}

  return { success: true, alreadyRolledBack: false };
}

export async function adminPublishAgentEnhanced(ctx: any, args: any) {
  const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
  if (!isAdmin) {
    throw new Error("Admin access required");
  }

  // Check evaluation gate
  const evalSummary = await ctx.runQuery(api.evals.latestSummary, {});
  if (!(evalSummary as any)?.allPassing) {
    throw new Error("Evaluations gate failed: not all passing. Fix failures before publish.");
  }

  // Check agent config prerequisites
  const config = await ctx.runQuery(api.aiAgents.getAgentConfig, { 
    agent_key: args.agent_key 
  });

  if (config.useRag) {
    // Ensure some vector chunks exist
    const chunks = await ctx.db
      .query("vectorChunks")
      .withIndex("by_scope", (q: any) => q.eq("scope", "global"))
      .take(1);
    
    if (chunks.length === 0) {
      throw new Error("RAG enabled but no vector chunks found. Ingest some datasets first.");
    }
  }

  if (config.useKgraph) {
    // Ensure some graph nodes exist
    const nodes = await ctx.db
      .query("kgraphNodes")
      .take(1);
    
    if (nodes.length === 0) {
      throw new Error("Knowledge Graph enabled but no nodes found. Ingest some datasets first.");
    }
  }

  // Proceed with normal publish
  return await ctx.runMutation(api.aiAgents.adminPublishAgent, { 
    agent_key: args.agent_key 
  });
}