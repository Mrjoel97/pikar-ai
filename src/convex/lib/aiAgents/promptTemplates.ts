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

  // Return templates with enhanced variable metadata
  const templates = agent.prompt_templates || [];
  return templates.map((template: any) => ({
    ...template,
    variableMetadata: generateVariableMetadata(template.variables || []),
  }));
}

// Helper to generate metadata for variables
function generateVariableMetadata(variables: string[]) {
  const metadata: Record<string, { type: string; description: string; placeholder: string }> = {};
  
  variables.forEach(variable => {
    const varLower = variable.toLowerCase();
    
    // Infer variable type and provide helpful metadata
    if (varLower.includes('tone') || varLower.includes('style')) {
      metadata[variable] = {
        type: 'select',
        description: 'Communication tone or style',
        placeholder: 'e.g., professional, casual, friendly',
      };
    } else if (varLower.includes('date') || varLower.includes('time')) {
      metadata[variable] = {
        type: 'date',
        description: 'Date or time value',
        placeholder: 'e.g., 2024-01-15',
      };
    } else if (varLower.includes('number') || varLower.includes('count') || varLower.includes('amount')) {
      metadata[variable] = {
        type: 'number',
        description: 'Numeric value',
        placeholder: 'e.g., 100',
      };
    } else if (varLower.includes('list') || varLower.includes('items')) {
      metadata[variable] = {
        type: 'textarea',
        description: 'List of items (one per line)',
        placeholder: 'Enter items, one per line',
      };
    } else if (varLower.includes('email') || varLower.includes('contact')) {
      metadata[variable] = {
        type: 'email',
        description: 'Email address',
        placeholder: 'e.g., user@example.com',
      };
    } else if (varLower.includes('url') || varLower.includes('link')) {
      metadata[variable] = {
        type: 'url',
        description: 'Web URL',
        placeholder: 'e.g., https://example.com',
      };
    } else {
      metadata[variable] = {
        type: 'text',
        description: `Value for ${variable.replace(/_/g, ' ')}`,
        placeholder: `Enter ${variable.replace(/_/g, ' ')}`,
      };
    }
  });
  
  return metadata;
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