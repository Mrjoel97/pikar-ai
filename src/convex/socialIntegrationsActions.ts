"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

// Widen platform union to include meta, youtube, google; add explicit types to silence TS7022/TS7023
export const initiateOAuth: any = internalAction({
  args: {
    platform: v.union(
      v.literal("twitter"),
      v.literal("linkedin"),
      v.literal("meta"),
      v.literal("youtube"),
      v.literal("google")
    ),
    businessId: v.id("businesses"),
    redirectUri: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ authUrl: string }> => {
    const config: any = await ctx.runQuery(internal.socialApiConfigs.getConfigForAuth, {
      businessId: args.businessId,
      platform: args.platform,
    });

    if (!config) {
      throw new Error(
        `No active API configuration found for ${args.platform}. Please contact your administrator.`
      );
    }

    const callbackUrl =
      args.redirectUri ||
      config.callbackUrl ||
      `${process.env.CONVEX_SITE_URL}/auth/callback/${args.platform}`;

    let authUrl: string;
    switch (args.platform) {
      case "twitter":
        authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${config.clientId}&redirect_uri=${encodeURIComponent(
          callbackUrl
        )}&scope=tweet.read%20tweet.write%20users.read&state=${args.businessId}`;
        break;
      case "linkedin":
        authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${config.clientId}&redirect_uri=${encodeURIComponent(
          callbackUrl
        )}&scope=w_member_social%20r_liteprofile&state=${args.businessId}`;
        break;
      case "meta":
        authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(
          callbackUrl
        )}&scope=pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish&state=${args.businessId}`;
        break;
      case "youtube":
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(
          callbackUrl
        )}&response_type=code&scope=https://www.googleapis.com/auth/youtube.upload%20https://www.googleapis.com/auth/youtube&state=${args.businessId}`;
        break;
      case "google":
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(
          callbackUrl
        )}&response_type=code&scope=openid%20email%20profile&state=${args.businessId}`;
        break;
      default:
        throw new Error(`Unsupported platform: ${args.platform}`);
    }

    return {
      authUrl,
    };
  },
});

/**
 * Exchange OAuth code for access token
 */
export const exchangeOAuthCode = internalAction({
  args: {
    platform: v.union(
      v.literal("twitter"),
      v.literal("linkedin"),
      v.literal("facebook"),
      v.literal("meta"),
      v.literal("youtube"),
      v.literal("google")
    ),
    code: v.string(),
    businessId: v.id("businesses"),
    redirectUri: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    accountId?: string;
    accountName?: string;
    error?: string;
  }> => {
    const config: any = await ctx.runQuery(internal.socialApiConfigs.getConfigForAuth, {
      businessId: args.businessId,
      platform: args.platform,
    });

    if (!config) {
      return {
        success: false,
        error: `No active API configuration found for ${args.platform}`,
      };
    }

    const callbackUrl =
      args.redirectUri ||
      config.callbackUrl ||
      `${process.env.CONVEX_SITE_URL}/auth/callback/${args.platform}`;

    try {
      let tokenResponse: any;
      
      switch (args.platform) {
        case "twitter": {
          // Twitter OAuth 2.0 token exchange
          const tokenUrl = "https://api.twitter.com/2/oauth2/token";
          const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
          
          const response = await fetch(tokenUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Authorization": `Basic ${basicAuth}`,
            },
            body: new URLSearchParams({
              code: args.code,
              grant_type: "authorization_code",
              redirect_uri: callbackUrl,
              code_verifier: "challenge", // In production, use PKCE
            }),
          });

          if (!response.ok) {
            const error = await response.text();
            throw new Error(`Twitter token exchange failed: ${error}`);
          }

          tokenResponse = await response.json();
          
          // Get user info
          const userResponse = await fetch("https://api.twitter.com/2/users/me", {
            headers: {
              "Authorization": `Bearer ${tokenResponse.access_token}`,
            },
          });
          
          const userData = await userResponse.json();
          
          return {
            success: true,
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            expiresAt: Date.now() + (tokenResponse.expires_in * 1000),
            accountId: userData.data?.id,
            accountName: userData.data?.username,
          };
        }

        case "linkedin": {
          // LinkedIn OAuth 2.0 token exchange
          const tokenUrl = "https://www.linkedin.com/oauth/v2/accessToken";
          
          const response = await fetch(tokenUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              code: args.code,
              redirect_uri: callbackUrl,
              client_id: config.clientId,
              client_secret: config.clientSecret,
            }),
          });

          if (!response.ok) {
            const error = await response.text();
            throw new Error(`LinkedIn token exchange failed: ${error}`);
          }

          tokenResponse = await response.json();
          
          // Get user info
          const userResponse = await fetch("https://api.linkedin.com/v2/me", {
            headers: {
              "Authorization": `Bearer ${tokenResponse.access_token}`,
            },
          });
          
          const userData = await userResponse.json();
          
          return {
            success: true,
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            expiresAt: Date.now() + (tokenResponse.expires_in * 1000),
            accountId: userData.id,
            accountName: `${userData.localizedFirstName} ${userData.localizedLastName}`,
          };
        }

        case "facebook":
        case "meta": {
          // Facebook/Meta OAuth token exchange
          const tokenUrl = "https://graph.facebook.com/v18.0/oauth/access_token";
          
          const response = await fetch(
            `${tokenUrl}?client_id=${config.clientId}&client_secret=${config.clientSecret}&code=${args.code}&redirect_uri=${encodeURIComponent(callbackUrl)}`
          );

          if (!response.ok) {
            const error = await response.text();
            throw new Error(`Facebook token exchange failed: ${error}`);
          }

          tokenResponse = await response.json();
          
          // Get user info
          const userResponse = await fetch(
            `https://graph.facebook.com/me?access_token=${tokenResponse.access_token}`
          );
          
          const userData = await userResponse.json();
          
          return {
            success: true,
            accessToken: tokenResponse.access_token,
            expiresAt: Date.now() + (tokenResponse.expires_in * 1000),
            accountId: userData.id,
            accountName: userData.name,
          };
        }

        case "youtube":
        case "google": {
          // Google OAuth 2.0 token exchange
          const tokenUrl = "https://oauth2.googleapis.com/token";
          
          const response = await fetch(tokenUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              code: args.code,
              client_id: config.clientId,
              client_secret: config.clientSecret,
              redirect_uri: callbackUrl,
              grant_type: "authorization_code",
            }),
          });

          if (!response.ok) {
            const error = await response.text();
            throw new Error(`Google token exchange failed: ${error}`);
          }

          tokenResponse = await response.json();
          
          // Get user info
          const userResponse = await fetch(
            `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenResponse.access_token}`
          );
          
          const userData = await userResponse.json();
          
          return {
            success: true,
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            expiresAt: Date.now() + (tokenResponse.expires_in * 1000),
            accountId: userData.id,
            accountName: userData.email,
          };
        }

        default:
          return {
            success: false,
            error: `Unsupported platform: ${args.platform}`,
          };
      }
    } catch (error: any) {
      console.error(`[${args.platform.toUpperCase()}] OAuth exchange error:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
});

/**
 * Helper function for retry logic with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on authentication errors
      if (lastError.message.includes("401") || lastError.message.includes("403")) {
        throw lastError;
      }

      // Don't retry on non-transient errors
      if (!isTransientError(lastError) && attempt > 0) {
        throw lastError;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error("Max retries exceeded");
}

/**
 * Determine if an error is transient and should be retried
 */
function isTransientError(error: Error): boolean {
  const transientPatterns = [
    "ECONNRESET",
    "ETIMEDOUT",
    "ENOTFOUND",
    "429", // Rate limit
    "500", // Server error
    "502", // Bad gateway
    "503", // Service unavailable
    "504", // Gateway timeout
  ];

  return transientPatterns.some((pattern) => error.message.includes(pattern));
}

/**
 * Post to Twitter with graceful degradation
 */
export const postToTwitter = internalAction({
  args: {
    businessId: v.id("businesses"),
    content: v.string(),
    mediaUrls: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    try {
      return await withRetry(async () => {
        console.log("[TWITTER] Would post:", args.content);
        
        // Simulate potential failures for testing
        // In production, this would be actual Twitter API calls
        
        return {
          success: true,
          postId: `twitter_${Date.now()}`,
          message: "Twitter posting not yet implemented (requires twitter-api-v2)",
        };
      });
    } catch (error) {
      // Graceful degradation: log error but don't crash
      console.error("[TWITTER] Posting failed:", error);
      return {
        success: false,
        postId: null,
        message: `Twitter posting failed: ${(error as Error).message}`,
        error: (error as Error).message,
      };
    }
  },
});

/**
 * Post to LinkedIn with graceful degradation
 */
export const postToLinkedIn = internalAction({
  args: {
    businessId: v.id("businesses"),
    content: v.string(),
    mediaUrls: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    try {
      return await withRetry(async () => {
        console.log("[LINKEDIN] Would post:", args.content);
        
        return {
          success: true,
          postId: `linkedin_${Date.now()}`,
          message: "LinkedIn posting not yet implemented (requires linkedin-api-client)",
        };
      });
    } catch (error) {
      console.error("[LINKEDIN] Posting failed:", error);
      return {
        success: false,
        postId: null,
        message: `LinkedIn posting failed: ${(error as Error).message}`,
        error: (error as Error).message,
      };
    }
  },
});

/**
 * Post to Facebook with graceful degradation
 */
export const postToFacebook = internalAction({
  args: {
    businessId: v.id("businesses"),
    content: v.string(),
    mediaUrls: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    try {
      return await withRetry(async () => {
        console.log("[FACEBOOK] Would post:", args.content);
        
        return {
          success: true,
          postId: `facebook_${Date.now()}`,
          message: "Facebook posting not yet implemented (requires fb-graph-api)",
        };
      });
    } catch (error) {
      console.error("[FACEBOOK] Posting failed:", error);
      return {
        success: false,
        postId: null,
        message: `Facebook posting failed: ${(error as Error).message}`,
        error: (error as Error).message,
      };
    }
  },
});