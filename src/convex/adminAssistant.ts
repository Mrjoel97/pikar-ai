"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { internal } from "./_generated/api";

async function validateAdminAccess(ctx: any, args: any) {
  if (args.adminToken) {
    try {
      const session = await ctx.db
        .query("adminSessions")
        .withIndex("by_token", (q: any) => q.eq("token", args.adminToken))
        .first();
      
      if (session && session.expiresAt > Date.now()) {
        return { isAdmin: true, adminId: session.adminId };
      }
    } catch (err) {
      console.error("Admin token validation failed:", err);
    }
  }
  return { isAdmin: false, adminId: null };
}

/**
 * Admin Assistant - AI-powered admin support with tool execution
 */
export const sendMessage = action({
  args: {
    message: v.string(),
    mode: v.optional(v.union(
      v.literal("explain"),
      v.literal("confirm"),
      v.literal("auto")
    )),
    toolsAllowed: v.optional(v.array(v.string())),
    dryRun: v.optional(v.boolean()),
    adminToken: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{
    summaryText: string;
    notice?: string;
    steps: Array<{ tool: string; title: string; data: any }>;
    mode?: string;
    dryRun?: boolean;
  }> => {
    const { message, mode = "explain", toolsAllowed = [], dryRun = false, adminToken } = args;

    // Validate admin access
    const { isAdmin } = await validateAdminAccess(ctx, { adminToken });

    // System prompt for admin assistant
    const systemPrompt = `You are an AI admin assistant for Pikar AI platform.

Your capabilities:
- Check system health and environment status
- List and explain feature flags
- Review alerts and notifications
- Provide agent configuration insights

Mode: ${mode}
- "explain": Provide read-only analysis and recommendations
- "confirm": Suggest actions but require confirmation
- "auto": Execute actions automatically (use cautiously)

Available tools: ${toolsAllowed.join(", ")}
Dry run: ${dryRun ? "Yes (no actual changes)" : "No (live mode)"}
Admin access: ${isAdmin ? "Verified" : "Limited"}

Provide clear, actionable responses. If suggesting changes, explain the impact.`;

    try {
      // Check for OpenAI API key
      if (!process.env.OPENAI_API_KEY) {
        return {
          summaryText: "OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables.",
          notice: "AI features require OpenAI API key configuration.",
          steps: [],
        };
      }

      // Gather context based on allowed tools
      const steps: Array<{ tool: string; title: string; data: any }> = [];

      if (toolsAllowed.includes("health")) {
        try {
          const healthStatus = await ctx.runQuery(api.health.envStatus);
          steps.push({
            tool: "health",
            title: "System Health Check",
            data: healthStatus,
          });
        } catch (err) {
          steps.push({
            tool: "health",
            title: "Health Check Failed",
            data: { error: String(err).slice(0, 200) },
          });
        }
      }

      if (toolsAllowed.includes("flags")) {
        try {
          const flags = await ctx.runQuery(api.featureFlags.getFeatureFlags as any, {});
          steps.push({
            tool: "flags",
            title: "Feature Flags",
            data: { count: flags?.length || 0, flags: flags?.slice(0, 5) },
          });
        } catch (err) {
          steps.push({
            tool: "flags",
            title: "Feature Flags Check Failed",
            data: { error: String(err).slice(0, 200) },
          });
        }
      }

      // Build context for AI
      const contextStr = steps.map(s => 
        `[${s.tool}] ${s.title}: ${JSON.stringify(s.data)}`
      ).join("\n\n");

      const fullPrompt = `${systemPrompt}\n\nUser query: ${message}\n\nCurrent system context:\n${contextStr || "No context available"}\n\nProvide a helpful response based on the query and context.`;

      // Generate AI response
      const response: any = await ctx.runAction(api.openai.generate, {
        prompt: fullPrompt,
        model: "gpt-4o-mini",
        temperature: 0.7,
        maxTokens: 500,
      });

      const summaryText: string = (response as any)?.text || "I'm here to help with admin tasks. What would you like to know?";

      return {
        summaryText,
        steps,
        mode,
        dryRun,
      };
    } catch (error) {
      console.error("Admin assistant error:", error);
      
      return {
        summaryText: `Error: ${String(error).slice(0, 200)}. Please check system configuration.`,
        notice: "AI assistant encountered an error. Falling back to basic mode.",
        steps: [],
      };
    }
  },
});

export const chat = action({
  args: {
    message: v.string(),
    conversationHistory: v.optional(v.array(v.any())),
    mode: v.optional(v.union(
      v.literal("explain"),
      v.literal("confirm"),
      v.literal("auto")
    )),
    toolsAllowed: v.optional(v.array(v.string())),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{
    summaryText: string;
    notice?: string;
    steps: Array<{ tool: string; title: string; data: any }>;
    mode?: string;
    dryRun?: boolean;
  }> => {
    const { message, mode = "explain", toolsAllowed = [], dryRun = false } = args;
    const startTime = Date.now();
    
    // System prompt for admin assistant
    const systemPrompt = `You are an AI admin assistant for Pikar AI platform.

Your capabilities:
- Check system health and environment status
- List and explain feature flags
- Review alerts and notifications
- Provide agent configuration insights

Mode: ${mode}
- "explain": Provide read-only analysis and recommendations
- "confirm": Suggest actions but require confirmation
- "auto": Execute actions automatically (use cautiously)

Available tools: ${toolsAllowed.join(", ")}
Dry run: ${dryRun ? "Yes (no actual changes)" : "No (live mode)"}

Provide clear, actionable responses. If suggesting changes, explain the impact.`;
    
    try {
      // Check for OpenAI API key
      if (!process.env.OPENAI_API_KEY) {
        return {
          summaryText: "OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables.",
          notice: "AI features require OpenAI API key configuration.",
          steps: [],
        };
      }

      // Gather context based on allowed tools
      const steps: Array<{ tool: string; title: string; data: any }> = [];

      if (toolsAllowed.includes("health")) {
        try {
          const healthStatus = await ctx.runQuery(api.health.envStatus);
          steps.push({
            tool: "health",
            title: "System Health Check",
            data: healthStatus,
          });
        } catch (err) {
          steps.push({
            tool: "health",
            title: "Health Check Failed",
            data: { error: String(err).slice(0, 200) },
          });
        }
      }

      if (toolsAllowed.includes("flags")) {
        try {
          const flags = await ctx.runQuery(api.featureFlags.listFlags as any);
          steps.push({
            tool: "flags",
            title: "Feature Flags",
            data: { count: flags?.length || 0, flags: flags?.slice(0, 5) },
          });
        } catch (err) {
          steps.push({
            tool: "flags",
            title: "Feature Flags Check Failed",
            data: { error: String(err).slice(0, 200) },
          });
        }
      }

      // Build context for AI
      const contextStr = steps.map(s => 
        `[${s.tool}] ${s.title}: ${JSON.stringify(s.data)}`
      ).join("\n\n");

      const fullPrompt = `${systemPrompt}\n\nUser query: ${message}\n\nCurrent system context:\n${contextStr || "No context available"}\n\nProvide a helpful response based on the query and context.`;

      // Generate AI response
      const response: any = await ctx.runAction(api.openai.generate, {
        prompt: fullPrompt,
        model: "gpt-4o-mini",
        temperature: 0.7,
        maxTokens: 500,
      });

      const summaryText: string = (response as any)?.text || "I'm here to help with admin tasks. What would you like to know?";

      const responseTime = Date.now() - startTime;
      
      // Record successful execution
      await ctx.runMutation(internal.agentPerformance.recordExecution, {
        agentKey: "admin_assistant",
        status: "success" as const,
        responseTime,
      });

      return {
        summaryText,
        steps,
        mode,
        dryRun,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      // Record failed execution
      await ctx.runMutation(internal.agentPerformance.recordExecution, {
        agentKey: "admin_assistant",
        status: "failure" as const,
        responseTime,
        errorMessage: error.message,
      });

      throw error;
    }
  },
});

export { validateAdminAccess };