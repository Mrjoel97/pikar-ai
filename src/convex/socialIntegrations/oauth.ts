"use node";
import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * OAuth flow for Twitter/X API
 */
export const initiateTwitterOAuth = action({
  args: {
    businessId: v.id("businesses"),
    callbackUrl: v.string(),
  },
  handler: async (ctx, args) => {
    // Generate OAuth URL for Twitter
    const state = Math.random().toString(36).substring(7);
    const clientId = process.env.TWITTER_CLIENT_ID;
    
    if (!clientId) {
      throw new Error("TWITTER_CLIENT_ID not configured");
    }

    const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(args.callbackUrl)}&scope=tweet.read%20tweet.write%20users.read%20offline.access&state=${state}`;

    return { authUrl, state };
  },
});

export const completeTwitterOAuth = action({
  args: {
    businessId: v.id("businesses"),
    code: v.string(),
    callbackUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Twitter OAuth credentials not configured");
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        code: args.code,
        grant_type: "authorization_code",
        redirect_uri: args.callbackUrl,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange Twitter OAuth code");
    }

    const tokens = await tokenResponse.json();

    // Store encrypted tokens
    await ctx.runMutation(internal.socialIntegrations.oauth.storeTokens, {
      businessId: args.businessId,
      platform: "twitter",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + (tokens.expires_in * 1000),
    });

    return { success: true };
  },
});

/**
 * OAuth flow for LinkedIn API
 */
export const initiateLinkedInOAuth = action({
  args: {
    businessId: v.id("businesses"),
    callbackUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const state = Math.random().toString(36).substring(7);
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    
    if (!clientId) {
      throw new Error("LINKEDIN_CLIENT_ID not configured");
    }

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(args.callbackUrl)}&state=${state}&scope=w_member_social%20r_liteprofile%20r_emailaddress`;

    return { authUrl, state };
  },
});

export const completeLinkedInOAuth = action({
  args: {
    businessId: v.id("businesses"),
    code: v.string(),
    callbackUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("LinkedIn OAuth credentials not configured");
    }

    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: args.code,
        redirect_uri: args.callbackUrl,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange LinkedIn OAuth code");
    }

    const tokens = await tokenResponse.json();

    await ctx.runMutation(internal.socialIntegrations.oauth.storeTokens, {
      businessId: args.businessId,
      platform: "linkedin",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || "",
      expiresAt: Date.now() + (tokens.expires_in * 1000),
    });

    return { success: true };
  },
});

/**
 * OAuth flow for Facebook/Meta API
 */
export const initiateFacebookOAuth = action({
  args: {
    businessId: v.id("businesses"),
    callbackUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const state = Math.random().toString(36).substring(7);
    const appId = process.env.FACEBOOK_APP_ID;
    
    if (!appId) {
      throw new Error("FACEBOOK_APP_ID not configured");
    }

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(args.callbackUrl)}&state=${state}&scope=pages_manage_posts,pages_read_engagement,pages_show_list`;

    return { authUrl, state };
  },
});

export const completeFacebookOAuth = action({
  args: {
    businessId: v.id("businesses"),
    code: v.string(),
    callbackUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    if (!appId || !appSecret) {
      throw new Error("Facebook OAuth credentials not configured");
    }

    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(args.callbackUrl)}&client_secret=${appSecret}&code=${args.code}`
    );

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange Facebook OAuth code");
    }

    const tokens = await tokenResponse.json();

    await ctx.runMutation(internal.socialIntegrations.oauth.storeTokens, {
      businessId: args.businessId,
      platform: "facebook",
      accessToken: tokens.access_token,
      refreshToken: "",
      expiresAt: Date.now() + (tokens.expires_in * 1000),
    });

    return { success: true };
  },
});

/**
 * Internal mutation to store OAuth tokens
 */
export const storeTokens = action({
  args: {
    businessId: v.id("businesses"),
    platform: v.union(v.literal("twitter"), v.literal("linkedin"), v.literal("facebook")),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.socialIntegrations.oauth.saveTokens, args);
  },
});

export const saveTokens = action({
  args: {
    businessId: v.id("businesses"),
    platform: v.union(v.literal("twitter"), v.literal("linkedin"), v.literal("facebook")),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    // In production, encrypt tokens before storing
    // For now, store directly (add encryption layer later)
    const existing = await ctx.runQuery(internal.socialIntegrations.oauth.findAccount, {
      businessId: args.businessId,
      platform: args.platform,
    });

    if (existing) {
      await ctx.runMutation(internal.socialIntegrations.oauth.updateAccount, {
        accountId: existing._id,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
      });
    } else {
      await ctx.runMutation(internal.socialIntegrations.oauth.createAccount, args);
    }
  },
});
