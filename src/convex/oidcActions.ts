"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

export const exchangeOIDCCode = action({
  args: {
    code: v.string(),
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    email: string;
    firstName: string;
    lastName: string;
    profile: any;
  }> => {
    const oidcClient = await import("openid-client");

    // Get OIDC config
    const config: any = await ctx.runQuery(internal.oidc.getOIDCConfigInternal, {
      businessId: args.businessId,
    });

    if (!config || !config.active) {
      throw new Error("OIDC not configured or inactive");
    }

    try {
      // Discover OIDC issuer configuration
      const issuerConfig: any = await oidcClient.discovery(
        new URL(config.issuer),
        config.clientId,
        config.clientSecret
      );

      // Build callback URL with code parameter
      const callbackUrl = new URL(config.redirectUri);
      callbackUrl.searchParams.set('code', args.code);

      // Exchange code for tokens
      const tokenSet: any = await oidcClient.authorizationCodeGrant(
        issuerConfig,
        callbackUrl,
        {} // checks - empty for now, can add PKCE/state later
      );

      // Get user info
      const userinfo: any = await oidcClient.fetchUserInfo(
        issuerConfig,
        tokenSet.access_token,
        oidcClient.skipSubjectCheck
      );

      return {
        success: true,
        email: userinfo.email as string,
        firstName: userinfo.given_name as string,
        lastName: userinfo.family_name as string,
        profile: userinfo,
      };
    } catch (error: any) {
      console.error("OIDC exchange error:", error);
      throw new Error(`OIDC code exchange failed: ${error.message}`);
    }
  },
});
