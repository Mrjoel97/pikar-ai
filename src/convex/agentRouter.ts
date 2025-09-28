"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

export const route = action({
  args: {
    message: v.string(),
    businessId: v.optional(v.id("businesses")),
    agentKey: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ response: string; sources?: any[] }> => {
    try {
      let contextBlocks = [];
      let sources = [];

      // Get agent configuration if specified
      if (args.agentKey) {
        try {
          const config = await ctx.runQuery(api.aiAgents.getAgentConfig, {
            agent_key: args.agentKey
          });

          // RAG retrieval if enabled
          if (config.useRag) {
            try {
              const retrieval = await ctx.runQuery(api.vectors.retrieve, {
                query: args.message,
                agent_key: args.agentKey,
                businessId: args.businessId,
                topK: 5,
              });

              if (retrieval.chunks && retrieval.chunks.length > 0) {
                const ragContext = retrieval.chunks
                  .map((chunk: any, i: number) => 
                    `[Source ${i + 1}]: ${chunk.content.slice(0, 500)}...`
                  )
                  .join('\n\n');
                
                contextBlocks.push(`## Retrieved Context:\n${ragContext}`);
                sources.push(...retrieval.chunks.map((chunk: any) => ({
                  type: 'vector',
                  content: chunk.content.slice(0, 200),
                  score: chunk.score,
                  datasetId: chunk.datasetId,
                })));
              }
            } catch (ragError) {
              // Continue without RAG on error
              contextBlocks.push(`## RAG Error: ${String(ragError).slice(0, 100)}`);
            }
          }

          // Knowledge Graph retrieval if enabled
          if (config.useKgraph && args.businessId) {
            try {
              // Simple heuristic: use business name or message keywords as node key
              const business = await ctx.runQuery(api.businesses.getById, { 
                businessId: args.businessId 
              });
              
              if (business?.name) {
                const neighborhood = await ctx.runQuery(api.kgraph.neighborhood, {
                  type: "dataset",
                  key: business.name,
                  businessId: args.businessId,
                  depth: 1,
                  limit: 10,
                });

                if (neighborhood.nodes && neighborhood.nodes.length > 0) {
                  const kgContext = neighborhood.nodes
                    .map((node: any) => `${node.type}:${node.key} - ${node.summary || ''}`)
                    .join('\n');
                  
                  contextBlocks.push(`## Knowledge Graph:\n${kgContext}`);
                  sources.push(...neighborhood.nodes.map((node: any) => ({
                    type: 'kgraph',
                    nodeType: node.type,
                    key: node.key,
                    summary: node.summary,
                  })));
                }
              }
            } catch (kgError) {
              // Continue without KG on error
              contextBlocks.push(`## KG Error: ${String(kgError).slice(0, 100)}`);
            }
          }
        } catch (configError) {
          // Continue without enhanced context on config error
        }
      }

      // Prepare enhanced prompt with context
      const enhancedMessage = contextBlocks.length > 0 
        ? `${args.message}\n\n${contextBlocks.join('\n\n')}`
        : args.message;

      // Generate response using existing OpenAI integration
      const response = await ctx.runAction(api.openai.generate, {
        prompt: enhancedMessage,
        maxTokens: 500,
      });

      // Audit the context usage
      if (args.businessId && (contextBlocks.length > 0 || sources.length > 0)) {
        await ctx.runMutation(api.audit.write, {
          businessId: args.businessId,
          action: "agent_context_used",
          entityType: "agentRouter",
          entityId: args.agentKey || "",
          details: {
            agentKey: args.agentKey,
            contextBlocksCount: contextBlocks.length,
            sourcesCount: sources.length,
            ragUsed: sources.some(s => s.type === 'vector'),
            kgUsed: sources.some(s => s.type === 'kgraph'),
          },
        });
      }

      return { 
        response: response.text || "I apologize, but I couldn't generate a response.", 
        sources: sources.length > 0 ? sources : undefined 
      };
    } catch (error) {
      return { 
        response: `I encountered an error: ${String(error).slice(0, 200)}. Please try again.` 
      };
    }
  },
});