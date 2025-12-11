"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";

/**
 * Initiate Twitter/X OAuth flow
 */
export const initiateTwitterOAuth = action({
  args: {
    businessId: v.id("businesses"),
    callbackUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;

    if (!clientId) {
      throw new Error("[ERR_MISSING_CONFIG] Twitter API credentials not configured");
    }

    // Twitter OAuth 2.0 PKCE flow
    const state = args.businessId; // Use businessId as state
    const scope = "tweet.read tweet.write users.read offline.access";
    
    const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(args.callbackUrl)}&scope=${encodeURIComponent(scope)}&state=${state}&code_challenge=challenge&code_challenge_method=plain`;

    return { authUrl, state };
  },
});

/**
 * Initiate LinkedIn OAuth flow
 */
export const initiateLinkedInOAuth = action({
  args: {
    businessId: v.id("businesses"),
    callbackUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const clientId = process.env.LINKEDIN_CLIENT_ID;

    if (!clientId) {
      throw new Error("[ERR_MISSING_CONFIG] LinkedIn API credentials not configured");
    }

    const state = args.businessId;
    const scope = "r_liteprofile r_emailaddress w_member_social";
    
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(args.callbackUrl)}&state=${state}&scope=${encodeURIComponent(scope)}`;

    return { authUrl, state };
  },
});

/**
 * Initiate Facebook OAuth flow
 */
export const initiateFacebookOAuth = action({
  args: {
    businessId: v.id("businesses"),
    callbackUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const appId = process.env.FACEBOOK_APP_ID;

    if (!appId) {
      throw new Error("[ERR_MISSING_CONFIG] Facebook API credentials not configured");
    }

    const state = args.businessId;
    const scope = "pages_manage_posts,pages_read_engagement,pages_show_list";
    
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(args.callbackUrl)}&state=${state}&scope=${encodeURIComponent(scope)}`;

    return { authUrl, state };
  },
});