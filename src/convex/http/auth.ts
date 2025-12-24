import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";

export const twitterCallback = httpAction(async (ctx: any, req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // businessId
  const error = url.searchParams.get("error");

  if (error) {
    return new Response(
      `<html><body><script>window.opener.postMessage({type:'oauth_error',platform:'twitter',error:'${error}'},'*');window.close();</script></body></html>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  }

  if (!code || !state) {
    return new Response("Missing code or state", { status: 400 });
  }

  try {
    const result = await ctx.runAction(internal.socialIntegrationsActions.exchangeOAuthCode, {
      platform: "twitter",
      code,
      businessId: state as any,
    });

    if (result.success) {
      // Store the connection
      await ctx.runMutation(internal.socialIntegrations.connectSocialAccount, {
        businessId: state as any,
        platform: "twitter",
        accountName: result.accountName!,
        accountId: result.accountId!,
        accessToken: result.accessToken!,
        refreshToken: result.refreshToken,
        tokenExpiresAt: result.expiresAt,
      });

      return new Response(
        `<html><body><script>window.opener.postMessage({type:'oauth_success',platform:'twitter'},'*');window.close();</script></body></html>`,
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    } else {
      return new Response(
        `<html><body><script>window.opener.postMessage({type:'oauth_error',platform:'twitter',error:'${result.error}'},'*');window.close();</script></body></html>`,
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    }
  } catch (error: any) {
    return new Response(
      `<html><body><script>window.opener.postMessage({type:'oauth_error',platform:'twitter',error:'${error.message}'},'*');window.close();</script></body></html>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  }
});

export const linkedinCallback = httpAction(async (ctx: any, req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return new Response(
      `<html><body><script>window.opener.postMessage({type:'oauth_error',platform:'linkedin',error:'${error}'},'*');window.close();</script></body></html>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  }

  if (!code || !state) {
    return new Response("Missing code or state", { status: 400 });
  }

  try {
    const result = await ctx.runAction(internal.socialIntegrationsActions.exchangeOAuthCode, {
      platform: "linkedin",
      code,
      businessId: state as any,
    });

    if (result.success) {
      await ctx.runMutation(internal.socialIntegrations.connectSocialAccount, {
        businessId: state as any,
        platform: "linkedin",
        accountName: result.accountName!,
        accountId: result.accountId!,
        accessToken: result.accessToken!,
        refreshToken: result.refreshToken,
        tokenExpiresAt: result.expiresAt,
      });

      return new Response(
        `<html><body><script>window.opener.postMessage({type:'oauth_success',platform:'linkedin'},'*');window.close();</script></body></html>`,
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    } else {
      return new Response(
        `<html><body><script>window.opener.postMessage({type:'oauth_error',platform:'linkedin',error:'${result.error}'},'*');window.close();</script></body></html>`,
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    }
  } catch (error: any) {
    return new Response(
      `<html><body><script>window.opener.postMessage({type:'oauth_error',platform:'linkedin',error:'${error.message}'},'*');window.close();</script></body></html>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  }
});

export const facebookCallback = httpAction(async (ctx: any, req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return new Response(
      `<html><body><script>window.opener.postMessage({type:'oauth_error',platform:'facebook',error:'${error}'},'*');window.close();</script></body></html>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  }

  if (!code || !state) {
    return new Response("Missing code or state", { status: 400 });
  }

  try {
    const result = await ctx.runAction(internal.socialIntegrationsActions.exchangeOAuthCode, {
      platform: "facebook",
      code,
      businessId: state as any,
    });

    if (result.success) {
      await ctx.runMutation(internal.socialIntegrations.connectSocialAccount, {
        businessId: state as any,
        platform: "facebook",
        accountName: result.accountName!,
        accountId: result.accountId!,
        accessToken: result.accessToken!,
        refreshToken: result.refreshToken,
        tokenExpiresAt: result.expiresAt,
      });

      return new Response(
        `<html><body><script>window.opener.postMessage({type:'oauth_success',platform:'facebook'},'*');window.close();</script></body></html>`,
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    } else {
      return new Response(
        `<html><body><script>window.opener.postMessage({type:'oauth_error',platform:'facebook',error:'${result.error}'},'*');window.close();</script></body></html>`,
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    }
  } catch (error: any) {
    return new Response(
      `<html><body><script>window.opener.postMessage({type:'oauth_error',platform:'facebook',error:'${error.message}'},'*');window.close();</script></body></html>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  }
});

export const samlAcs = httpAction(async (ctx: any, req) => {
  try {
    const formData = await req.formData();
    const samlResponse = formData.get("SAMLResponse") as string;
    const relayState = formData.get("RelayState") as string;

    if (!samlResponse) {
      return new Response("Missing SAML response", { status: 400 });
    }

    // Extract businessId from relay state
    const businessId = relayState as any;

    const { api } = await import("../_generated/api");
    // Validate SAML assertion
    const result = await ctx.runAction(api.saml.validateSAMLAssertion, {
      samlResponse,
      businessId,
    });

    if (result.success) {
      // Create or update user session
      // Redirect to dashboard with success
      return new Response(
        `<html><body><script>window.location.href='/dashboard?sso=success&email=${encodeURIComponent(result.email)}';</script></body></html>`,
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    }

    return new Response("SAML validation failed", { status: 401 });
  } catch (error: any) {
    console.error("SAML ACS error:", error);
    return new Response(`SAML error: ${error.message}`, { status: 500 });
  }
});

export const oidcCallback = httpAction(async (ctx: any, req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code) {
      return new Response("Missing authorization code", { status: 400 });
    }

    // Extract businessId from state
    const businessId = state as any;

    const { api } = await import("../_generated/api");
    // Exchange code for tokens
    const result = await ctx.runAction(api.oidc.exchangeOIDCCode, {
      code,
      businessId,
    });

    if (result.success) {
      // Create or update user session
      // Redirect to dashboard with success
      return new Response(
        `<html><body><script>window.location.href='/dashboard?sso=success&email=${encodeURIComponent(result.email)}';</script></body></html>`,
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    }

    return new Response("OIDC validation failed", { status: 401 });
  } catch (error: any) {
    console.error("OIDC callback error:", error);
    return new Response(`OIDC error: ${error.message}`, { status: 500 });
  }
});
