"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

export const generateDefaultContent = action({
  args: {
    businessId: v.id("businesses"),
    contentType: v.union(
      v.literal("bio"),
      v.literal("tagline"),
      v.literal("mission"),
      v.literal("social-post")
    ),
    context: v.object({
      businessName: v.optional(v.string()),
      industry: v.optional(v.string()),
      targetAudience: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args): Promise<{ content: string; contentType: string }> => {
    const prompts = {
      bio: `Write a professional bio for ${args.context.businessName || "a business"} in the ${args.context.industry || "industry"} targeting ${args.context.targetAudience || "customers"}. Keep it under 150 words.`,
      tagline: `Create a catchy tagline for ${args.context.businessName || "a business"} in the ${args.context.industry || "industry"}. Make it memorable and under 10 words.`,
      mission: `Write a mission statement for ${args.context.businessName || "a business"} in the ${args.context.industry || "industry"} serving ${args.context.targetAudience || "customers"}. Keep it inspiring and under 100 words.`,
      "social-post": `Write an engaging social media post introducing ${args.context.businessName || "a business"} in the ${args.context.industry || "industry"}. Make it friendly and include a call to action.`,
    };

    try {
      const result: any = await ctx.runAction(internal.openai.generateCompletion, {
        messages: [
          {
            role: "system",
            content: "You are a professional copywriter helping businesses create compelling content.",
          },
          {
            role: "user",
            content: prompts[args.contentType],
          },
        ],
        model: "gpt-4o-mini",
        temperature: 0.8,
        maxTokens: 300,
      });

      return {
        content: result.content,
        contentType: args.contentType,
      };
    } catch (error: any) {
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  },
});