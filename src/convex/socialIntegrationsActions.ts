"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Publish a post to social media platforms
 * This is a Node.js action that makes external API calls
 */
export const publishPost = action({
  args: {
    postId: v.id("socialPosts"),
    platforms: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the post details
    const post = await ctx.runQuery(internal.socialPosts.getPostById, {
      postId: args.postId,
    });

    if (!post) {
      throw new Error("Post not found");
    }

    const results: Array<{ platform: string; success: boolean; error?: string }> = [];

    // Publish to each platform
    for (const platform of args.platforms) {
      try {
        // Get platform credentials
        const account = await ctx.runMutation(
          internal.socialIntegrations.getAccountByPlatform,
          {
            businessId: post.businessId,
            platform: platform as any,
          }
        );

        if (!account) {
          results.push({
            platform,
            success: false,
            error: "Account not connected",
          });
          continue;
        }

        // In production, this would make actual API calls to Twitter, LinkedIn, etc.
        // For now, we'll simulate success
        console.log(`Publishing to ${platform}:`, post.content);

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        results.push({
          platform,
          success: true,
        });

        // Update post status
        await ctx.runMutation(internal.socialPosts.updatePostStatus, {
          postId: args.postId,
          status: "posted",
        });
      } catch (error: any) {
        results.push({
          platform,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      postId: args.postId,
      results,
      allSuccessful: results.every((r) => r.success),
    };
  },
});

/**
 * Fetch analytics from social platforms
 */
export const fetchPlatformAnalytics = action({
  args: {
    businessId: v.id("businesses"),
    platform: v.string(),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    // Get platform credentials
    const account = await ctx.runMutation(
      internal.socialIntegrations.getAccountByPlatform,
      {
        businessId: args.businessId,
        platform: args.platform as any,
      }
    );

    if (!account) {
      throw new Error("Platform not connected");
    }

    // In production, this would fetch real analytics from the platform API
    // For now, return mock data
    const mockAnalytics = {
      platform: args.platform,
      period: {
        start: args.startDate,
        end: args.endDate,
      },
      metrics: {
        impressions: Math.floor(Math.random() * 10000) + 1000,
        engagements: Math.floor(Math.random() * 1000) + 100,
        clicks: Math.floor(Math.random() * 500) + 50,
        followers: Math.floor(Math.random() * 5000) + 500,
        followerGrowth: Math.floor(Math.random() * 100) - 50,
      },
      topPosts: [],
    };

    // Store analytics in database
    await ctx.runMutation(internal.socialAnalytics.recordPlatformMetrics, {
      businessId: args.businessId,
      platform: args.platform,
      metrics: mockAnalytics.metrics,
      timestamp: Date.now(),
    });

    return mockAnalytics;
  },
});