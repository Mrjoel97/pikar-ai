import { v } from "convex/values";

/**
 * Prompt template management for agents
 */

export async function getAgentPromptTemplates(ctx: any, args: { agent_key: string }) {
  // Use collect() and filter instead of withIndex to avoid index issues
  const agents = await ctx.db.query("agentCatalog").collect();
  const agent = agents.find((a: any) => a.agent_key === args.agent_key);

  if (!agent) return [];

  // Return templates with enhanced variable metadata
  const templates = agent.prompt_templates || [];
  return templates.map((template: any) => ({
    ...template,
    variableMetadata: generateVariableMetadata(template.variables || []),
  }));
}

// Helper to generate metadata for variables with enhanced types
function generateVariableMetadata(variables: string[]) {
  const metadata: Record<string, { type: string; description: string; placeholder: string; options?: string[] }> = {};
  
  variables.forEach(variable => {
    const varLower = variable.toLowerCase();
    
    // Enhanced variable type inference with more options
    if (varLower.includes('tone') || varLower.includes('style')) {
      metadata[variable] = {
        type: 'select',
        description: 'Communication tone or style',
        placeholder: 'Select tone...',
        options: ['professional', 'casual', 'friendly', 'formal', 'enthusiastic', 'empathetic', 'authoritative', 'conversational'],
      };
    } else if (varLower.includes('priority') || varLower.includes('urgency')) {
      metadata[variable] = {
        type: 'select',
        description: 'Priority or urgency level',
        placeholder: 'Select priority...',
        options: ['low', 'medium', 'high', 'critical'],
      };
    } else if (varLower.includes('language') || varLower.includes('locale')) {
      metadata[variable] = {
        type: 'select',
        description: 'Language or locale',
        placeholder: 'Select language...',
        options: ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'],
      };
    } else if (varLower.includes('sentiment') || varLower.includes('emotion')) {
      metadata[variable] = {
        type: 'select',
        description: 'Sentiment or emotional tone',
        placeholder: 'Select sentiment...',
        options: ['positive', 'neutral', 'negative', 'mixed'],
      };
    } else if (varLower.includes('length') || varLower.includes('size')) {
      metadata[variable] = {
        type: 'select',
        description: 'Content length',
        placeholder: 'Select length...',
        options: ['brief', 'short', 'medium', 'long', 'detailed'],
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
    } else if (varLower.includes('percentage') || varLower.includes('percent')) {
      metadata[variable] = {
        type: 'number',
        description: 'Percentage value (0-100)',
        placeholder: 'e.g., 75',
      };
    } else if (varLower.includes('list') || varLower.includes('items') || varLower.includes('points')) {
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
    } else if (varLower.includes('url') || varLower.includes('link') || varLower.includes('website')) {
      metadata[variable] = {
        type: 'url',
        description: 'Web URL',
        placeholder: 'e.g., https://example.com',
      };
    } else if (varLower.includes('description') || varLower.includes('details') || varLower.includes('content')) {
      metadata[variable] = {
        type: 'textarea',
        description: `Detailed ${variable.replace(/_/g, ' ')}`,
        placeholder: `Enter ${variable.replace(/_/g, ' ')}`,
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

  const agents = await ctx.db.query("agentCatalog").collect();
  const agent = agents.find((a: any) => a.agent_key === args.agent_key);

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

  const agents = await ctx.db.query("agentCatalog").collect();
  const agent = agents.find((a: any) => a.agent_key === args.agent_key);

  if (!agent) throw new Error("Agent not found");

  const existingTemplates = agent.prompt_templates || [];
  const updatedTemplates = [...existingTemplates, args.template];

  await ctx.db.patch(agent._id, {
    prompt_templates: updatedTemplates,
    updatedAt: Date.now(),
  });

  return { success: true };
}

export async function updatePromptTemplate(ctx: any, args: {
  agent_key: string;
  templateId: string;
  template: {
    name: string;
    description: string;
    template: string;
    variables?: string[];
    category?: string;
  };
}) {
  const isAdmin = await (ctx as any).runQuery("admin:getIsAdmin" as any, {});
  if (!isAdmin) throw new Error("Admin access required");

  const agents = await ctx.db.query("agentCatalog").collect();
  const agent = agents.find((a: any) => a.agent_key === args.agent_key);

  if (!agent) throw new Error("Agent not found");

  const existingTemplates = agent.prompt_templates || [];
  const templateIndex = existingTemplates.findIndex((t: any) => t.id === args.templateId);
  
  if (templateIndex === -1) throw new Error("Template not found");

  // Update the template while preserving the ID
  const updatedTemplates = [...existingTemplates];
  updatedTemplates[templateIndex] = {
    id: args.templateId,
    ...args.template,
  };

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

  const agents = await ctx.db.query("agentCatalog").collect();
  const agent = agents.find((a: any) => a.agent_key === args.agent_key);

  if (!agent) throw new Error("Agent not found");

  const existingTemplates = agent.prompt_templates || [];
  const updatedTemplates = existingTemplates.filter((t: any) => t.id !== args.templateId);

  await ctx.db.patch(agent._id, {
    prompt_templates: updatedTemplates,
    updatedAt: Date.now(),
  });

  return { success: true };
}