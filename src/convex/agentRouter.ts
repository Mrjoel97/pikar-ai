"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

export const route = action({
  args: {
    message: v.string(),
    businessId: v.optional(v.id("businesses")),
    agentKey: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ response: string; sources?: any[] }> => {
    try {
      // Check for OpenAI API key
      if (!process.env.OPENAI_API_KEY) {
        return {
          response: "AI features require OpenAI API key. Please configure OPENAI_API_KEY in your environment variables.",
        };
      }

      const contextBlocks: string[] = [];
      const sources: any[] = [];

      // Perform semantic search to retrieve relevant context
      if (args.businessId) {
        try {
          const searchResults: any = await ctx.runAction("knowledge:semanticSearch" as any, {
            text: args.message,
            matchThreshold: 0.7,
            matchCount: 5,
            agentType: args.agentKey || "executive",
            businessId: args.businessId,
          });

          if (searchResults && Array.isArray(searchResults) && searchResults.length > 0) {
            for (const result of searchResults) {
              contextBlocks.push(`[Context from ${result.documentId || "knowledge base"}]: ${result.preview}`);
              sources.push({
                documentId: result.documentId,
                preview: result.preview,
                score: result.score,
              });
            }
          }
        } catch (searchError) {
          console.warn("Vector search failed, continuing without context:", searchError);
        }
      }

      // Prepare enhanced prompt with context
      const enhancedMessage = contextBlocks.length > 0 
        ? `${args.message}\n\nRelevant context:\n${contextBlocks.join('\n\n')}`
        : args.message;

      // Generate response using OpenAI integration
      const response: any = await ctx.runAction(
        "openai:generate" as any,
        {
          prompt: enhancedMessage,
          maxTokens: 500,
        }
      );

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

export const execRouter: any = action({
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
    context: v.optional(v.any()),
  },
  handler: async (ctx, args): Promise<any> => {
    const { mode, businessId, userId, input } = args;

    // Load agent profile (guest-safe)
    let profile: any = null;
    try {
      profile = await (ctx as any).runQuery("agentProfile:getMyAgentProfile" as any, { businessId });
    } catch (_e) {
      // ignore
    }

    // Resolve initiative for this business (first one)
    let initiativeId: any = undefined;
    try {
      const initiatives = (await (ctx as any).runQuery("initiatives:getByBusiness" as any, { businessId })) as any[];
      initiativeId = initiatives[0]?._id;
    } catch (_e) {
      // ignore
    }

    // Load recent ideas (brain dumps) tied to initiative
    let recentIdeas: Array<{ content?: string; summary?: string; tags?: string[] }> = [];
    if (initiativeId) {
      try {
        recentIdeas = (await (ctx as any).runQuery("initiatives:listBrainDumpsFiltered" as any, {
          initiativeId,
          limit: 10,
        })) as any;
      } catch (_e) {
        // ignore
      }
    }

    // Perform vector search for relevant context based on mode
    let vectorContext: string[] = [];
    try {
      const searchQuery = input || `${mode} for business goals`;
      const searchResults: any = await ctx.runAction("knowledge:semanticSearch" as any, {
        text: searchQuery,
        matchThreshold: 0.65,
        matchCount: 3,
        agentType: "executive",
        businessId,
      });

      if (searchResults && Array.isArray(searchResults)) {
        vectorContext = searchResults.map((r: any) => r.preview || "").filter(Boolean);
      }
    } catch (_e) {
      // Continue without vector context
    }

    switch (mode) {
      case "summarizeIdeas": {
        const ideas: Array<{ content?: string; summary?: string; tags?: string[] }> = recentIdeas.map(
          (dump: any) => ({
            content: dump?.content,
            summary: dump?.summary,
            tags: (dump?.tags as string[]) || [],
          })
        );

        const contextStr = vectorContext.length > 0 
          ? `\n\nAdditional context: ${vectorContext.join("; ")}`
          : "";

        const prompt: string =
          `Based on these recent ideas: ${JSON.stringify(ideas)}, provide a concise summary of key themes and actionable opportunities.${contextStr}`;

        const response: any = await (ctx as any).runAction(
          "openai:generate" as any,
          {
            prompt,
            model: "gpt-4o-mini",
          }
        );

        return {
          summary: response?.text,
          keyThemes: ideas.flatMap((i: { tags?: string[] }) => i.tags || []).slice(0, 5),
          actionableCount: ideas.length,
          contextUsed: vectorContext.length,
        };
      }

      case "proposeNextAction": {
        const goals: string = profile?.businessSummary || "grow business";
        const recentTags: string[] = recentIdeas
          .flatMap((i: { tags?: string[] }) => i.tags || [])
          .slice(0, 10);

        // Upcoming schedule slots for the user/business
        const upcomingSlots: Array<{ label?: string }> = (await (ctx as any).runQuery("schedule:listSlots" as any, {
          businessId,
          limit: 3,
        })) as any[];

        const contextStr = vectorContext.length > 0 
          ? `\n\nRelevant knowledge: ${vectorContext.join("; ")}`
          : "";

        const prompt: string = `Given goals: "${goals}", recent focus areas: ${recentTags.join(
          ", "
        )}, and upcoming schedule: ${upcomingSlots.map((s) => s.label).join(
          ", "
        )}, suggest the single most impactful next action.${contextStr}`;

        const response: any = await (ctx as any).runAction(
          "openai:generate" as any,
          {
            prompt,
            model: "gpt-4o-mini",
          }
        );

        return {
          action: response?.text,
          priority: "high",
          estimatedTime: "15-30 min",
          category: recentTags[0] || "general",
          contextUsed: vectorContext.length,
        };
      }

      case "planWeek": {
        const goals: string = profile?.businessSummary || "grow business";
        
        const contextStr = vectorContext.length > 0 
          ? `\n\nRelevant insights: ${vectorContext.join("; ")}`
          : "";

        const prompt: string = `Create a focused weekly plan for: "${goals}". Include 3 key priorities, suggested content themes, and optimal posting schedule.${contextStr}`;

        const response: any = await (ctx as any).runAction(
          "openai:generate" as any,
          {
            prompt,
            model: "gpt-4o-mini",
          }
        );

        return {
          weeklyPlan: response?.text,
          priorities: ["Content creation", "Audience engagement", "Business development"],
          suggestedSlots: 3,
          contextUsed: vectorContext.length,
        };
      }

      case "updateProfile": {
        if (!input) throw new Error("Input required for profile update");

        await (ctx as any).runMutation("aiAgents:initSolopreneurAgent" as any, {
          businessId,
          businessSummary: input,
          brandVoice: profile?.brandVoice,
          timezone: profile?.timezone,
        });

        return {
          success: true,
          message: "Profile updated successfully",
          updatedAt: Date.now(),
        };
      }

      case "createCapsule": {
        try {
          // Create execution record first
          const executionRecord = await (ctx as any).runMutation(
            "playbookExecutions:createExecution" as any,
            {
              businessId,
              playbookKey: "weekly_momentum_capsule",
              playbookVersion: "v1.0",
              triggeredBy: userId,
            }
          );

          const executionId = executionRecord.executionId;

          // Record initial step
          await (ctx as any).runMutation(
            "playbookExecutions:addExecutionStep" as any,
            {
              executionId,
              stepName: "Execution initialized",
              stepStatus: "completed",
            }
          );

          // Update status to running
          await (ctx as any).runMutation(
            "playbookExecutions:updateExecutionStatus" as any,
            {
              executionId,
              status: "running",
            }
          );

          // Resolve absolute base URL for server-side fetch
          const baseUrl =
            process.env.VITE_PUBLIC_BASE_URL ||
            process.env.PUBLIC_BASE_URL ||
            process.env.BASE_URL;

          if (!baseUrl) {
            await (ctx as any).runMutation(
              "playbookExecutions:addExecutionStep" as any,
              {
                executionId,
                stepName: "Configuration error",
                stepStatus: "failed",
                stepError:
                  "Public base URL not configured (VITE_PUBLIC_BASE_URL / PUBLIC_BASE_URL / BASE_URL)",
              }
            );
            await (ctx as any).runMutation(
              "playbookExecutions:updateExecutionStatus" as any,
              {
                executionId,
                status: "failed",
                error:
                  "Public base URL not configured (VITE_PUBLIC_BASE_URL / PUBLIC_BASE_URL / BASE_URL)",
              }
            );
            throw new Error(
              "Public base URL not configured (VITE_PUBLIC_BASE_URL / PUBLIC_BASE_URL / BASE_URL)"
            );
          }

          await (ctx as any).runMutation(
            "playbookExecutions:addExecutionStep" as any,
            {
              executionId,
              stepName: "Triggering playbook",
              stepStatus: "running",
            }
          );

          const response = await fetch(
            `${baseUrl}/api/playbooks/weekly_momentum_capsule/trigger`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ businessId }),
            }
          );

          if (!response.ok) {
            const errorText = await response.text().catch(() => "Unknown error");

            await (ctx as any).runMutation(
              "playbookExecutions:addExecutionStep" as any,
              {
                executionId,
                stepName: "Playbook error",
                stepStatus: "failed",
                stepError: `HTTP ${response.status}: ${errorText}`,
              }
            );

            await (ctx as any).runMutation(
              "playbookExecutions:updateExecutionStatus" as any,
              {
                executionId,
                status: "failed",
                error: `Playbook failed: ${response.status} - ${errorText}`,
              }
            );
            throw new Error(`Playbook failed: ${response.status}`);
          }

          const result = await response.json().catch(() => ({}));

          // Record success step
          await (ctx as any).runMutation(
            "playbookExecutions:addExecutionStep" as any,
            {
              executionId,
              stepName: "Playbook completed",
              stepStatus: "completed",
              stepResult:
                typeof result === "object"
                  ? { ok: true, ...result }
                  : { ok: true, result },
            }
          );

          // Update status to completed
          await (ctx as any).runMutation(
            "playbookExecutions:updateExecutionStatus" as any,
            {
              executionId,
              status: "completed",
              result,
            }
          );

          return {
            success: true,
            message: "Weekly capsule created successfully",
            timeSaved: 45,
            executionId,
          };
        } catch (error: unknown) {
          return {
            success: false,
            message: `Failed to create capsule: ${
              error instanceof Error ? error.message : String(error)
            }`,
          };
        }
      }

      default:
        throw new Error(`Unknown exec mode: ${mode}`);
    }
  },
});