"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

/**
 * Setup social listening for keywords across platforms
 */
export const setupSocialListening = action({
  args: {
    businessId: v.id("businesses"),
    keywords: v.array(v.string()),
    platforms: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // In production, this would integrate with social listening APIs
    // For now, we'll create listening configurations
    
    const configs = args.keywords.map(keyword => ({
      businessId: args.businessId,
      keyword,
      platforms: args.platforms,
      isActive: true,
      createdAt: Date.now(),
    }));

    // Store configurations
    await ctx.runMutation(internal.socialAnalyticsAdvanced.listening.storeListeningConfigs, {
      configs,
    });

    return {
      success: true,
      configuredKeywords: args.keywords.length,
      platforms: args.platforms,
    };
  },
});

/**
 * Get listening keywords for a business
 */
export const getListeningKeywords = action({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    // Simulate fetching keywords
    return {
      keywords: [
        { keyword: "brand name", platforms: ["twitter", "facebook"], mentions: 234 },
        { keyword: "product name", platforms: ["twitter", "instagram"], mentions: 156 },
        { keyword: "competitor", platforms: ["twitter", "linkedin"], mentions: 89 },
      ],
    };
  },
});

/**
 * Get real-time mentions
 */
export const getRealTimeMentions = action({
  args: {
    businessId: v.id("businesses"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    // In production, this would fetch from social listening APIs
    // Simulating real-time mentions
    const mentions = Array.from({ length: Math.min(limit, 20) }, (_, i) => ({
      id: `mention_${i}`,
      platform: ["twitter", "facebook", "instagram", "linkedin"][Math.floor(Math.random() * 4)],
      author: `user_${Math.floor(Math.random() * 1000)}`,
      content: `Sample mention content about the brand ${i}`,
      sentiment: ["positive", "neutral", "negative"][Math.floor(Math.random() * 3)],
      engagement: Math.floor(Math.random() * 500),
      timestamp: Date.now() - Math.floor(Math.random() * 3600000),
      url: `https://example.com/post/${i}`,
    }));

    return {
      mentions,
      total: mentions.length,
      lastUpdated: Date.now(),
    };
  },
});
