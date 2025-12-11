"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Exchange OAuth authorization code for access tokens
 */
export const exchangeOAuthCode = action({
  args: {
    platform: v.union(v.literal("twitter"), v.literal("linkedin"), v.literal("facebook")),
    code: v.string(),
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    try {
      let result: {
        success: boolean;
        accessToken?: string;
        refreshToken?: string;
        expiresAt?: number;
        accountName?: string;
        accountId?: string;
        error?: string;
      };

      switch (args.platform) {
        case "twitter": {
          const clientId = process.env.TWITTER_CLIENT_ID;
          const clientSecret = process.env.TWITTER_CLIENT_SECRET;
          const redirectUri = `${process.env.CONVEX_SITE_URL}/auth/callback/twitter`;

          if (!clientId || !clientSecret) {
            return { success: false, error: "Twitter API credentials not configured" };
          }

          // Exchange code for token
          const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
            },
            body: new URLSearchParams({
              code: args.code,
              grant_type: "authorization_code",
              redirect_uri: redirectUri,
              code_verifier: "challenge",
            }),
          });

          if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            return { success: false, error: `Twitter token exchange failed: ${error}` };
          }

          const tokenData = await tokenResponse.json();

          // Get user info
          const userResponse = await fetch("https://api.twitter.com/2/users/me", {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
            },
          });

          if (!userResponse.ok) {
            return { success: false, error: "Failed to fetch Twitter user info" };
          }

          const userData = await userResponse.json();

          result = {
            success: true,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresAt: Date.now() + (tokenData.expires_in * 1000),
            accountName: userData.data.username,
            accountId: userData.data.id,
          };
          break;
        }

        case "linkedin": {
          const clientId = process.env.LINKEDIN_CLIENT_ID;
          const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
          const redirectUri = `${process.env.CONVEX_SITE_URL}/auth/callback/linkedin`;

          if (!clientId || !clientSecret) {
            return { success: false, error: "LinkedIn API credentials not configured" };
          }

          // Exchange code for token
          const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              code: args.code,
              redirect_uri: redirectUri,
              client_id: clientId,
              client_secret: clientSecret,
            }),
          });

          if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            return { success: false, error: `LinkedIn token exchange failed: ${error}` };
          }

          const tokenData = await tokenResponse.json();

          // Get user info
          const userResponse = await fetch("https://api.linkedin.com/v2/me", {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
            },
          });

          if (!userResponse.ok) {
            return { success: false, error: "Failed to fetch LinkedIn user info" };
          }

          const userData = await userResponse.json();

          result = {
            success: true,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresAt: Date.now() + (tokenData.expires_in * 1000),
            accountName: `${userData.localizedFirstName} ${userData.localizedLastName}`,
            accountId: userData.id,
          };
          break;
        }

        case "facebook": {
          const appId = process.env.FACEBOOK_APP_ID;
          const appSecret = process.env.FACEBOOK_APP_SECRET;
          const redirectUri = `${process.env.CONVEX_SITE_URL}/auth/callback/facebook`;

          if (!appId || !appSecret) {
            return { success: false, error: "Facebook API credentials not configured" };
          }

          // Exchange code for token
          const tokenResponse = await fetch(
            `https://graph.facebook.com/v18.0/oauth/access_token?` +
            `client_id=${appId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `client_secret=${appSecret}&` +
            `code=${args.code}`
          );

          if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            return { success: false, error: `Facebook token exchange failed: ${error}` };
          }

          const tokenData = await tokenResponse.json();

          // Get user info
          const userResponse = await fetch(
            `https://graph.facebook.com/me?fields=id,name&access_token=${tokenData.access_token}`
          );

          if (!userResponse.ok) {
            return { success: false, error: "Failed to fetch Facebook user info" };
          }

          const userData = await userResponse.json();

          result = {
            success: true,
            accessToken: tokenData.access_token,
            expiresAt: Date.now() + (tokenData.expires_in * 1000),
            accountName: userData.name,
            accountId: userData.id,
          };
          break;
        }

        default:
          return { success: false, error: "Unsupported platform" };
      }

      return result;
    } catch (error: any) {
      console.error(`OAuth code exchange error for ${args.platform}:`, error);
      return { success: false, error: error.message || "Unknown error" };
    }
  },
});

/**
 * Sync platform data (posts, metrics) from social media APIs
 */
export const syncPlatformData = action({
  args: {
    businessId: v.id("businesses"),
    platform: v.union(v.literal("twitter"), v.literal("linkedin"), v.literal("facebook")),
    accountId: v.id("socialAccounts"),
  },
  handler: async (ctx, args) => {
    // Get account with access token
    const account = await ctx.runQuery(internal.socialAnalytics.getAccountByPlatform, {
      businessId: args.businessId,
      platform: args.platform,
    });

    if (!account || !account.isConnected) {
      throw new Error(`${args.platform} account not connected`);
    }

    // Fetch recent posts and metrics from platform API
    // This is a placeholder - actual implementation depends on platform APIs
    console.log(`Syncing data for ${args.platform} account ${account.accountName}`);

    // Update last sync timestamp
    await ctx.runMutation(internal.socialAnalytics.updateLastSync, {
      accountId: args.accountId,
      timestamp: Date.now(),
    });

    return { success: true, syncedAt: Date.now() };
  },
});

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