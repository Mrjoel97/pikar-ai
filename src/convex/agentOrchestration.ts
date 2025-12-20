"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Agent-to-Agent Communication: Send message from one agent to another
 */
export const sendAgentMessage: any = action({
  args: {
    fromAgentKey: v.string(),
    toAgentKey: v.string(),
    message: v.string(),
    context: v.optional(v.any()),
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    // Record the message
    const messageId = await ctx.runMutation(internal.agentOrchestrationData.recordAgentMessage, {
      fromAgentKey: args.fromAgentKey,
      toAgentKey: args.toAgentKey,
      message: args.message,
      context: args.context,
      businessId: args.businessId,
      status: "pending",
    }) as any;

    // Route to target agent
    const response: any = await ctx.runAction(internal.agentRouter.execRouter as any, {
      mode: "proposeNextAction",
      businessId: args.businessId,
      input: `Message from ${args.fromAgentKey}: ${args.message}`,
      context: args.context,
    });

    // Update message with response
    await ctx.runMutation(internal.agentOrchestrationData.updateAgentMessage, {
      messageId,
      response: response,
      status: "completed",
    });

    return { messageId, response };
  },
});

/**
 * Parallel Agent Execution: Execute multiple agents concurrently
 */
export const executeParallel: any = action({
  args: {
    agents: v.array(v.object({
      agentKey: v.string(),
      mode: v.string(),
      input: v.optional(v.string()),
      context: v.optional(v.any()),
    })),
    businessId: v.id("businesses"),
    orchestrationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    
    // Create orchestration record
    const orchId = (args.orchestrationId || await ctx.runMutation(
      internal.agentOrchestrationData.createOrchestration,
      {
        businessId: args.businessId,
        type: "parallel",
        agentCount: args.agents.length,
        status: "running",
      }
    )) as any;

    // Execute all agents in parallel
    const results = await Promise.allSettled(
      args.agents.map(async (agent) => {
        const agentStart = Date.now();
        try {
          const result: any = await ctx.runAction(internal.agentRouter.execRouter as any, {
            mode: agent.mode as any,
            businessId: args.businessId,
            input: agent.input,
            context: agent.context,
          });
          
          const duration = Date.now() - agentStart;
          
          // Record agent execution
          await ctx.runMutation(internal.agentOrchestrationData.recordAgentExecution, {
            orchestrationId: orchId,
            agentKey: agent.agentKey,
            status: "success",
            duration,
            result,
          });
          
          return { agentKey: agent.agentKey, success: true, result, duration };
        } catch (error: any) {
          const duration = Date.now() - agentStart;
          
          await ctx.runMutation(internal.agentOrchestrationData.recordAgentExecution, {
            orchestrationId: orchId,
            agentKey: agent.agentKey,
            status: "failed",
            duration,
            error: error.message,
          });
          
          return { agentKey: agent.agentKey, success: false, error: error.message, duration };
        }
      })
    );

    const totalDuration = Date.now() - startTime;
    const successful = results.filter(r => r.status === "fulfilled" && (r.value as any).success).length;
    
    // Update orchestration status
    await ctx.runMutation(internal.agentOrchestrationData.updateOrchestration, {
      orchestrationId: orchId,
      status: "completed",
      duration: totalDuration,
      successCount: successful,
      failureCount: results.length - successful,
    });

    return {
      orchestrationId: orchId,
      results: results.map(r => r.status === "fulfilled" ? r.value : { error: (r as any).reason }),
      totalDuration,
      successRate: successful / results.length,
    };
  },
});

/**
 * Dynamic Agent Composition: Chain agents at runtime
 */
export const chainAgents: any = action({
  args: {
    chain: v.array(v.object({
      agentKey: v.string(),
      mode: v.string(),
      inputTransform: v.optional(v.string()), // JS expression to transform previous output
    })),
    initialInput: v.string(),
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    
    const orchId = await ctx.runMutation(internal.agentOrchestrationData.createOrchestration, {
      businessId: args.businessId,
      type: "chain",
      agentCount: args.chain.length,
      status: "running",
    }) as any;

    let currentInput = args.initialInput;
    const chainResults: any[] = [];

    for (const [index, agent] of args.chain.entries()) {
      const agentStart = Date.now();
      
      try {
        // Transform input if specified
        if (agent.inputTransform && chainResults.length > 0) {
          const prevResult = chainResults[chainResults.length - 1].result;
          // Simple transformation: extract specific fields
          if (agent.inputTransform === "summary") {
            currentInput = prevResult?.summary || prevResult?.text || JSON.stringify(prevResult);
          } else if (agent.inputTransform === "action") {
            currentInput = prevResult?.action || prevResult?.text || JSON.stringify(prevResult);
          }
        }

        const result: any = await ctx.runAction(internal.agentRouter.execRouter as any, {
          mode: agent.mode as any,
          businessId: args.businessId,
          input: currentInput,
          context: { chainIndex: index, previousResults: chainResults },
        });

        const duration = Date.now() - agentStart;
        
        await ctx.runMutation(internal.agentOrchestrationData.recordAgentExecution, {
          orchestrationId: orchId,
          agentKey: agent.agentKey,
          status: "success",
          duration,
          result,
        });

        chainResults.push({ agentKey: agent.agentKey, result, duration });
        
        // Update input for next agent
        currentInput = result?.text || result?.summary || JSON.stringify(result);
        
      } catch (error: any) {
        const duration = Date.now() - agentStart;
        
        await ctx.runMutation(internal.agentOrchestrationData.recordAgentExecution, {
          orchestrationId: orchId,
          agentKey: agent.agentKey,
          status: "failed",
          duration,
          error: error.message,
        });

        // Stop chain on failure
        await ctx.runMutation(internal.agentOrchestrationData.updateOrchestration, {
          orchestrationId: orchId,
          status: "failed",
          duration: Date.now() - startTime,
          error: `Chain failed at step ${index + 1}: ${error.message}`,
        });

        return {
          orchestrationId: orchId,
          success: false,
          failedAt: index,
          error: error.message,
          partialResults: chainResults,
        };
      }
    }

    const totalDuration = Date.now() - startTime;
    
    await ctx.runMutation(internal.agentOrchestrationData.updateOrchestration, {
      orchestrationId: orchId,
      status: "completed",
      duration: totalDuration,
      successCount: args.chain.length,
      failureCount: 0,
    });

    return {
      orchestrationId: orchId,
      success: true,
      results: chainResults,
      finalOutput: chainResults[chainResults.length - 1]?.result,
      totalDuration,
    };
  },
});

/**
 * Conflict Resolution: Multi-agent consensus
 */
export const resolveWithConsensus: any = action({
  args: {
    agents: v.array(v.string()), // agent keys
    question: v.string(),
    businessId: v.id("businesses"),
    consensusThreshold: v.optional(v.number()), // 0.0 to 1.0, default 0.6
  },
  handler: async (ctx, args) => {
    const threshold = args.consensusThreshold || 0.6;
    const startTime = Date.now();
    
    const orchId = await ctx.runMutation(internal.agentOrchestrationData.createOrchestration, {
      businessId: args.businessId,
      type: "consensus",
      agentCount: args.agents.length,
      status: "running",
    }) as any;

    // Get responses from all agents
    const responses = await Promise.allSettled(
      args.agents.map(async (agentKey) => {
        const result: any = await ctx.runAction(internal.agentRouter.execRouter as any, {
          mode: "proposeNextAction",
          businessId: args.businessId,
          input: args.question,
        });
        
        await ctx.runMutation(internal.agentOrchestrationData.recordAgentExecution, {
          orchestrationId: orchId,
          agentKey,
          status: "success",
          duration: 0,
          result,
        });
        
        return { agentKey, response: result };
      })
    );

    // Analyze responses for consensus
    const validResponses = responses
      .filter(r => r.status === "fulfilled")
      .map(r => (r as any).value);

    // Simple consensus: look for common keywords/themes
    const allText = validResponses
      .map(r => JSON.stringify(r.response))
      .join(" ")
      .toLowerCase();
    
    const keywords = allText.split(/\s+/).filter(w => w.length > 4);
    const keywordCounts: Record<string, number> = {};
    
    keywords.forEach(word => {
      keywordCounts[word] = (keywordCounts[word] || 0) + 1;
    });

    const topKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    // Calculate consensus score based on keyword overlap
    const consensusScore = validResponses.length > 0 
      ? Math.min(1.0, topKeywords.length / 5) 
      : 0;

    const hasConsensus = consensusScore >= threshold;
    const totalDuration = Date.now() - startTime;

    await ctx.runMutation(internal.agentOrchestrationData.updateOrchestration, {
      orchestrationId: orchId,
      status: "completed",
      duration: totalDuration,
      successCount: validResponses.length,
      failureCount: responses.length - validResponses.length,
    });

    return {
      orchestrationId: orchId,
      hasConsensus,
      consensusScore,
      threshold,
      responses: validResponses,
      commonThemes: topKeywords,
      recommendation: hasConsensus 
        ? "Agents reached consensus" 
        : "No clear consensus - human review recommended",
      totalDuration,
    };
  },
});