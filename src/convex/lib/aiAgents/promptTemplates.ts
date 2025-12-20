import { v } from "convex/values";

/**
 * Prompt template management for agents
 */

export async function getAgentPromptTemplates(ctx: any, args: { agent_key: string }) {
  const agent = await ctx.db
    .query("agentCatalog")
    .withIndex("by_agent_key", (q: any) => q.eq("agent_key", args.agent_key))
    .unique();

  if (!agent) return [];

  return agent.prompt_templates || [];
}

export async function updateAgentPromptTemplates(ctx: any, args: {
  agent_key: string;
  templates: Array<{
    id: string;
    name: string;
    description: string;
    template: string;
    variables?: string[];
    category?: string;
  }>;
}) {
  const isAdmin = await (ctx as any).runQuery("admin:getIsAdmin" as any, {});
  if (!isAdmin) throw new Error("Admin access required");

  const agent = await ctx.db
    .query("agentCatalog")
    .withIndex("by_agent_key", (q: any) => q.eq("agent_key", args.agent_key))
    .unique();

  if (!agent) throw new Error("Agent not found");

  await ctx.db.patch(agent._id, {
    prompt_templates: args.templates,
    updatedAt: Date.now(),
  });

  return { success: true };
}

export async function addPromptTemplate(ctx: any, args: {
  agent_key: string;
  template: {
    id: string;
    name: string;
    description: string;
    template: string;
    variables?: string[];
    category?: string;
  };
}) {
  const isAdmin = await (ctx as any).runQuery("admin:getIsAdmin" as any, {});
  if (!isAdmin) throw new Error("Admin access required");

  const agent = await ctx.db
    .query("agentCatalog")
    .withIndex("by_agent_key", (q: any) => q.eq("agent_key", args.agent_key))
    .unique();

  if (!agent) throw new Error("Agent not found");

  const existingTemplates = agent.prompt_templates || [];
  const updatedTemplates = [...existingTemplates, args.template];

  await ctx.db.patch(agent._id, {
    prompt_templates: updatedTemplates,
    updatedAt: Date.now(),
  });

  return { success: true };
}

export async function deletePromptTemplate(ctx: any, args: {
  agent_key: string;
  templateId: string;
}) {
  const isAdmin = await (ctx as any).runQuery("admin:getIsAdmin" as any, {});
  if (!isAdmin) throw new Error("Admin access required");

  const agent = await ctx.db
    .query("agentCatalog")
    .withIndex("by_agent_key", (q: any) => q.eq("agent_key", args.agent_key))
    .unique();

  if (!agent) throw new Error("Agent not found");

  const existingTemplates = agent.prompt_templates || [];
  const updatedTemplates = existingTemplates.filter((t: any) => t.id !== args.templateId);

  await ctx.db.patch(agent._id, {
    prompt_templates: updatedTemplates,
    updatedAt: Date.now(),
  });

  return { success: true };
}
