"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Social Media Content Generation Agent
 * Integrates with the content_creator agent to provide platform-specific optimization
 */

// Platform-specific constraints and best practices
const PLATFORM_SPECS = {
  twitter: {
    maxLength: 280,
    hashtagLimit: 2,
    emojiDensity: "moderate",
    tone: "concise and punchy",
    bestPractices: "Use line breaks, keep it scannable, front-load key message",
  },
  linkedin: {
    maxLength: 3000,
    hashtagLimit: 5,
    emojiDensity: "minimal",
    tone: "professional and insightful",
    bestPractices: "Use paragraphs, include call-to-action, add value for professionals",
  },
  facebook: {
    maxLength: 63206,
    hashtagLimit: 3,
    emojiDensity: "moderate",
    tone: "conversational and engaging",
    bestPractices: "Ask questions, encourage comments, use storytelling",
  },
} as const;

type Platform = keyof typeof PLATFORM_SPECS;

/**
 * Generate social media content optimized for specific platforms
 */
export const generateSocialContent = action({
  args: {
    businessId: v.id("businesses"),
    platforms: v.array(v.union(v.literal("twitter"), v.literal("linkedin"), v.literal("facebook"))),
    topic: v.string(),
    tone: v.optional(v.union(v.literal("professional"), v.literal("casual"), v.literal("humorous"), v.literal("inspirational"))),
    includeHashtags: v.optional(v.boolean()),
    includeEmojis: v.optional(v.boolean()),
    targetAudience: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { platforms, topic, tone = "professional", includeHashtags = true, includeEmojis = true, targetAudience } = args;

    // Get business context for personalization
    let businessContext = "";
    try {
      const business = await ctx.runQuery(api.businesses.getById, { businessId: args.businessId });
      if (business) {
        businessContext = `Business: ${business.name}, Industry: ${business.industry || "general"}`;
      }
    } catch (e) {
      // Continue without business context
    }

    // Generate content for each platform
    const results: Record<string, { content: string; hashtags: string[]; characterCount: number }> = {};

    for (const platform of platforms) {
      const spec = PLATFORM_SPECS[platform as Platform];
      
      // Build platform-specific prompt
      const prompt = `
You are a social media content expert specializing in ${platform} content.

${businessContext ? `Context: ${businessContext}` : ""}
Topic: ${topic}
Tone: ${tone}
Target Audience: ${targetAudience || "general audience"}

Platform Guidelines for ${platform}:
- Maximum length: ${spec.maxLength} characters
- Tone: ${spec.tone}
- Best practices: ${spec.bestPractices}
- Hashtag limit: ${spec.hashtagLimit}
- Emoji usage: ${spec.emojiDensity}

Create engaging ${platform} content that:
1. Captures attention in the first line
2. Provides value to the audience
3. Encourages engagement (likes, comments, shares)
4. Stays within character limits
5. ${includeHashtags ? `Includes ${spec.hashtagLimit} relevant hashtags` : "Does not include hashtags"}
6. ${includeEmojis ? `Uses emojis appropriately (${spec.emojiDensity} density)` : "Does not use emojis"}

Return ONLY the post content, followed by hashtags on a new line if requested.
Format: 
[Post content]

[#hashtag1 #hashtag2 ...]
`.trim();

      try {
        // Generate content using OpenAI
        const response = await ctx.runAction(api.openai.generate, {
          prompt,
          model: "gpt-4o-mini",
          maxTokens: 500,
        });

        const generatedText = (response as any)?.text || "";
        
        // Parse content and hashtags
        const lines = generatedText.split("\n").filter(l => l.trim());
        const hashtagLine = lines.find(l => l.includes("#"));
        const contentLines = lines.filter(l => !l.includes("#") || l.indexOf("#") > 10);
        
        const content = contentLines.join("\n").trim();
        const hashtags = hashtagLine 
          ? hashtagLine.match(/#\w+/g)?.map(h => h.slice(1)) || []
          : [];

        results[platform] = {
          content,
          hashtags: hashtags.slice(0, spec.hashtagLimit),
          characterCount: content.length,
        };

        // Track AI generation usage
        await ctx.runMutation(api.telemetry.logEvent, {
          businessId: args.businessId,
          eventName: "ai_generation_used",
          metadata: {
            platform,
            topic,
            characterCount: content.length,
          },
        });
      } catch (error) {
        results[platform] = {
          content: `Error generating content for ${platform}: ${String(error).slice(0, 100)}`,
          hashtags: [],
          characterCount: 0,
        };
      }
    }

    return results;
  },
});

/**
 * Generate hashtag suggestions for a given topic
 */
export const generateHashtags = action({
  args: {
    businessId: v.id("businesses"),
    topic: v.string(),
    platform: v.union(v.literal("twitter"), v.literal("linkedin"), v.literal("facebook")),
    count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { topic, platform, count = 5 } = args;
    const spec = PLATFORM_SPECS[platform as Platform];
    const maxHashtags = Math.min(count, spec.hashtagLimit);

    const prompt = `
Generate ${maxHashtags} relevant, trending hashtags for ${platform} about: ${topic}

Requirements:
- Hashtags should be popular and searchable
- Mix of broad and specific tags
- Appropriate for ${platform} audience
- No spaces, use camelCase for multi-word tags

Return ONLY the hashtags, one per line, without the # symbol.
`.trim();

    try {
      const response = await ctx.runAction(api.openai.generate, {
        prompt,
        model: "gpt-4o-mini",
        maxTokens: 150,
      });

      const text = (response as any)?.text || "";
      const hashtags = text
        .split("\n")
        .map(line => line.trim().replace(/^#/, ""))
        .filter(tag => tag.length > 0)
        .slice(0, maxHashtags);

      return { hashtags };
    } catch (error) {
      return { 
        hashtags: [],
        error: String(error).slice(0, 200),
      };
    }
  },
});

/**
 * Suggest emojis for content
 */
export const suggestEmojis = action({
  args: {
    content: v.string(),
    platform: v.union(v.literal("twitter"), v.literal("linkedin"), v.literal("facebook")),
    count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { content, platform, count = 3 } = args;
    const spec = PLATFORM_SPECS[platform as Platform];

    const prompt = `
Suggest ${count} relevant emojis for this ${platform} post:

"${content}"

Platform emoji density: ${spec.emojiDensity}

Return ONLY the emojis, separated by spaces, that would enhance this post's engagement.
Consider the tone and context of the message.
`.trim();

    try {
      const response = await ctx.runAction(api.openai.generate, {
        prompt,
        model: "gpt-4o-mini",
        maxTokens: 50,
      });

      const text = (response as any)?.text || "";
      const emojis = text
        .split(/\s+/)
        .filter(char => /\p{Emoji}/u.test(char))
        .slice(0, count);

      return { emojis };
    } catch (error) {
      return { 
        emojis: [],
        error: String(error).slice(0, 200),
      };
    }
  },
});

/**
 * Optimize existing content for a specific platform
 */
export const optimizeForPlatform = action({
  args: {
    content: v.string(),
    sourcePlatform: v.union(v.literal("twitter"), v.literal("linkedin"), v.literal("facebook")),
    targetPlatform: v.union(v.literal("twitter"), v.literal("linkedin"), v.literal("facebook")),
  },
  handler: async (ctx, args) => {
    const { content, sourcePlatform, targetPlatform } = args;
    
    if (sourcePlatform === targetPlatform) {
      return { optimizedContent: content, changes: [] };
    }

    const sourceSpec = PLATFORM_SPECS[sourcePlatform as Platform];
    const targetSpec = PLATFORM_SPECS[targetPlatform as Platform];

    const prompt = `
Adapt this ${sourcePlatform} post for ${targetPlatform}:

Original post:
"${content}"

Source platform (${sourcePlatform}):
- Tone: ${sourceSpec.tone}
- Max length: ${sourceSpec.maxLength}

Target platform (${targetPlatform}):
- Tone: ${targetSpec.tone}
- Max length: ${targetSpec.maxLength}
- Best practices: ${targetSpec.bestPractices}

Rewrite the content to be optimized for ${targetPlatform} while maintaining the core message.
Return ONLY the optimized content.
`.trim();

    try {
      const response = await ctx.runAction(api.openai.generate, {
        prompt,
        model: "gpt-4o-mini",
        maxTokens: 500,
      });

      const optimizedContent = (response as any)?.text || content;

      return {
        optimizedContent,
        changes: [
          `Adapted from ${sourcePlatform} to ${targetPlatform}`,
          `Character count: ${content.length} → ${optimizedContent.length}`,
        ],
      };
    } catch (error) {
      return {
        optimizedContent: content,
        changes: [],
        error: String(error).slice(0, 200),
      };
    }
  },
});
