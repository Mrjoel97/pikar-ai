"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

type RouteResult = {
  summaryText: string;
  data: {
    profile: any;
    uploads: any[];
    analytics: any;
    mode: string;
  };
  provider: "openai" | "none";
};

export const route = action({
  args: {
    message: v.string(),
    businessId: v.optional(v.id("businesses")),
    tools: v.optional(v.array(v.string())), // reserved for future tool routing
  },
  handler: async (ctx, args): Promise<RouteResult> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const bizDoc =
      args.businessId ? null : await ctx.runQuery(api.businesses.currentUserBusiness, {});
    const businessId = args.businessId ?? (bizDoc?._id as any);
    if (!businessId) {
      throw new Error("No business selected");
    }

    const profile =
      (await ctx
        .runQuery(internal.aiAgents.getAgentProfileLite, { businessId })
        .catch(() => null)) ?? null;

    const uploads =
      (await ctx
        .runQuery(api.aiAgents.summarizeUploads as any, { limit: 3 })
        .catch(() => [])) ?? [];

    const analytics =
      (await ctx
        .runQuery(api.aiAgents.runQuickAnalytics as any, { businessId })
        .catch(() => null)) ?? null;

    const hasOpenAI =
      !!process.env.OPENAI_API_KEY || !!process.env.OPENAI_API_KEY?.toString();

    if (hasOpenAI) {
      const parts: Array<string> = [];
      if (profile) {
        parts.push(
          `Agent Profile: industry=${profile.industry || "n/a"}, voice=${profile.brandVoice || "n/a"}, summary="${profile.businessSummary || ""}"`
        );
      }
      if (analytics) {
        parts.push(
          `Analytics: revenue_90d=${analytics.revenue90d}, churnAlert=${
            analytics.churnAlert ? "yes" : "no"
          }, msg="${analytics.churnMessage}"`
        );
      }
      if (Array.isArray(uploads) && uploads.length > 0) {
        const uploadsText = uploads
          .map((u: any) => `${u.filename} (${u.summary || ""})`)
          .slice(0, 3)
          .join("; ");
        parts.push(`Recent Uploads: ${uploadsText}`);
      }
      parts.push(`User request: ${args.message}`);

      const prompt = [
        "You are a helpful business agent for Pikar AI.",
        "Use the context to propose 3 concise, actionable recommendations.",
        "Be concrete and avoid fluff.",
        "",
        "Context:",
        parts.join("\n"),
        "",
        "Output:",
        "- 3 bullets with concrete next actions",
        "- Brief rationale",
        "- If applicable, include simple KPI targets",
      ].join("\n");

      const llm: { text?: string } | null = (await ctx.runAction(api.openai.generate, {
        prompt,
        model: "gpt-4o-mini",
        temperature: 0.3,
        maxTokens: 700,
      })) as any;

      const summaryText = (llm?.text || "").trim();

      return {
        summaryText,
        data: { profile, uploads, analytics, mode: "agent_router" },
        provider: "openai",
      };
    }

    // Fallback if OPENAI_API_KEY is not configured
    const lines: string[] = [
      "OpenAI not configured. Returning context summary.",
      `Message: ${args.message}`,
      profile
        ? `Profile industry=${profile.industry}, voice=${profile.brandVoice}`
        : "No profile",
      analytics
        ? `Revenue90d=${analytics.revenue90d}, churnAlert=${analytics.churnAlert}`
        : "No analytics",
      `Uploads: ${(uploads as any[]).length}`,
    ];

    return {
      summaryText: lines.join(" | "),
      data: { profile, uploads, analytics, mode: "agent_router" },
      provider: "none",
    };
  },
});
