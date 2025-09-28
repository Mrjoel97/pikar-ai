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

export const execRouter = action({
  args: {
    mode: v.union(
      v.literal("summarizeIdeas"),
      v.literal("proposeNextAction"), 
      v.literal("planWeek"),
      v.literal("updateProfile"),
      v.literal("createCapsule")
    ),
    businessId: v.id("businesses"),
    userId: v.optional(v.id("users")),
    input: v.optional(v.string()),
    context: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    const { mode, businessId, userId, input, context } = args;
    
    // Get agent profile for context
    const profile = await ctx.runQuery(internal.agentProfile.getByBusiness, { businessId });
    
    // Get recent brain dumps for context
    const recentIdeas = await ctx.runQuery(api.initiatives.listBrainDumpsFiltered, {
      businessId,
      limit: 10
    });
    
    switch (mode) {
      case "summarizeIdeas": {
        const ideas = recentIdeas.map(dump => ({
          content: dump.content,
          summary: dump.summary,
          tags: dump.tags || []
        }));
        
        const prompt = `Based on these recent ideas: ${JSON.stringify(ideas)}, provide a concise summary of key themes and actionable opportunities.`;
        
        const response = await ctx.runAction(api.openai.generate, {
          messages: [{ role: "user", content: prompt }],
          model: "gpt-4o-mini"
        });
        
        return {
          summary: response.content,
          keyThemes: ideas.flatMap(i => i.tags).slice(0, 5),
          actionableCount: ideas.length
        };
      }
      
      case "proposeNextAction": {
        const goals = profile?.businessSummary || "grow business";
        const recentTags = recentIdeas.flatMap(i => i.tags || []).slice(0, 10);
        
        // Get upcoming schedule slots
        const upcomingSlots = await ctx.runQuery(api.schedule.listSlots, {
          userId: userId!,
          limit: 3
        });
        
        const prompt = `Given goals: "${goals}", recent focus areas: ${recentTags.join(", ")}, and upcoming schedule: ${upcomingSlots.map(s => s.label).join(", ")}, suggest the single most impactful next action.`;
        
        const response = await ctx.runAction(api.openai.generate, {
          messages: [{ role: "user", content: prompt }],
          model: "gpt-4o-mini"
        });
        
        return {
          action: response.content,
          priority: "high",
          estimatedTime: "15-30 min",
          category: recentTags[0] || "general"
        };
      }
      
      case "planWeek": {
        const goals = profile?.businessSummary || "grow business";
        
        const prompt = `Create a focused weekly plan for: "${goals}". Include 3 key priorities, suggested content themes, and optimal posting schedule.`;
        
        const response = await ctx.runAction(api.openai.generate, {
          messages: [{ role: "user", content: prompt }],
          model: "gpt-4o-mini"
        });
        
        return {
          weeklyPlan: response.content,
          priorities: ["Content creation", "Audience engagement", "Business development"],
          suggestedSlots: 3
        };
      }
      
      case "updateProfile": {
        if (!input) throw new Error("Input required for profile update");
        
        await ctx.runMutation(api.aiAgents.initSolopreneurAgent, {
          businessId,
          businessSummary: input,
          brandVoice: profile?.brandVoice,
          timezone: profile?.timezone
        });
        
        return {
          success: true,
          message: "Profile updated successfully",
          updatedAt: Date.now()
        };
      }
      
      case "createCapsule": {
        // Trigger Weekly Momentum playbook
        try {
          const response = await fetch(`/api/playbooks/weekly_momentum_capsule/trigger`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ businessId })
          });
          
          if (!response.ok) {
            throw new Error(`Playbook failed: ${response.status}`);
          }
          
          // Log win
          await ctx.runMutation(api.audit.logWin, {
            businessId,
            winType: "capsule_created",
            timeSavedMinutes: 45,
            details: { playbook: "weekly_momentum_capsule" }
          });
          
          return {
            success: true,
            message: "Weekly capsule created successfully",
            timeSaved: 45
          };
        } catch (error) {
          return {
            success: false,
            message: `Failed to create capsule: ${error.message}`
          };
        }
      }
      
      default:
        throw new Error(`Unknown exec mode: ${mode}`);
    }
  }
});