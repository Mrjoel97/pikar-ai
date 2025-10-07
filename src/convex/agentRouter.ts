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
      const contextBlocks: string[] = [];
      const sources: any[] = [];

      // Skip agent configuration and context retrieval to avoid type instantiation issues
      // This is a simplified version that focuses on direct response generation

      // Prepare enhanced prompt with context
      const enhancedMessage = contextBlocks.length > 0 
        ? `${args.message}\n\n${contextBlocks.join('\n\n')}`
        : args.message;

      // Generate response using existing OpenAI integration
      // Use direct action call to avoid deep type instantiation
      const response: any = await (ctx as any).runAction(
        "openai:generate" as any,
        {
          prompt: enhancedMessage,
          maxTokens: 500,
        }
      );

      // Audit the context usage
      if (args.businessId && (contextBlocks.length > 0 || sources.length > 0)) {
        await (ctx as any).runMutation(internal.audit.write as any, {
          businessId: args.businessId,
          action: "agent_context_used",
          entityType: "agent",
          entityId: args.agentKey || "",
          details: {
            agentKey: args.agentKey,
            contextBlocksCount: contextBlocks.length,
            sourcesCount: sources.length,
            ragUsed: false,
            kgUsed: false,
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
      profile = await ctx.runQuery(api.agentProfile.getMyAgentProfile, { businessId });
    } catch (_e) {
      // ignore
    }

    // Resolve initiative for this business (first one)
    let initiativeId: any = undefined;
    try {
      const initiatives = (await ctx.runQuery(api.initiatives.getByBusiness, { businessId })) as any[];
      initiativeId = initiatives[0]?._id;
    } catch (_e) {
      // ignore
    }

    // Load recent ideas (brain dumps) tied to initiative
    let recentIdeas: Array<{ content?: string; summary?: string; tags?: string[] }> = [];
    if (initiativeId) {
      try {
        recentIdeas = (await ctx.runQuery(api.initiatives.listBrainDumpsFiltered, {
          initiativeId,
          limit: 10,
        })) as any;
      } catch (_e) {
        // ignore
      }
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

        const prompt: string =
          `Based on these recent ideas: ${JSON.stringify(ideas)}, provide a concise summary of key themes and actionable opportunities.`;

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
        };
      }

      case "proposeNextAction": {
        const goals: string = profile?.businessSummary || "grow business";
        const recentTags: string[] = recentIdeas
          .flatMap((i: { tags?: string[] }) => i.tags || [])
          .slice(0, 10);

        // Upcoming schedule slots for the user/business
        const upcomingSlots: Array<{ label?: string }> = (await ctx.runQuery(api.schedule.listSlots, {
          businessId,
          limit: 3,
        })) as any[];

        const prompt: string = `Given goals: "${goals}", recent focus areas: ${recentTags.join(
          ", "
        )}, and upcoming schedule: ${upcomingSlots.map((s) => s.label).join(
          ", "
        )}, suggest the single most impactful next action.`;

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
        };
      }

      case "planWeek": {
        const goals: string = profile?.businessSummary || "grow business";
        const prompt: string = `Create a focused weekly plan for: "${goals}". Include 3 key priorities, suggested content themes, and optimal posting schedule.`;

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
        };
      }

      case "updateProfile": {
        if (!input) throw new Error("Input required for profile update");

        await ctx.runMutation(api.aiAgents.initSolopreneurAgent, {
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
          // Resolve absolute base URL for server-side fetch
          const baseUrl =
            process.env.VITE_PUBLIC_BASE_URL ||
            process.env.PUBLIC_BASE_URL ||
            process.env.BASE_URL;

          if (!baseUrl) {
            throw new Error("Public base URL not configured (VITE_PUBLIC_BASE_URL / PUBLIC_BASE_URL / BASE_URL)");
          }

          const response = await fetch(`${baseUrl}/api/playbooks/weekly_momentum_capsule/trigger`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ businessId }),
          });

          if (!response.ok) {
            throw new Error(`Playbook failed: ${response.status}`);
          }

          await (ctx as any).runMutation(internal.audit.write as any, {
            businessId,
            action: "win",
            entityType: "productivity",
            entityId: "",
            details: {
              winType: "capsule_created",
              timeSavedMinutes: 45,
              playbook: "weekly_momentum_capsule",
            },
          });

          return {
            success: true,
            message: "Weekly capsule created successfully",
            timeSaved: 45,
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