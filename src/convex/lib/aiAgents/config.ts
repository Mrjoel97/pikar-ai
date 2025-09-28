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