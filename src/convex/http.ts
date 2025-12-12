import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import Stripe from "stripe";
import { auth } from "./auth";
import { Id } from "./_generated/dataModel";

const http = httpRouter();

// Register auth HTTP routes (CRITICAL: Required for auth to work)
auth.addHttpRoutes(http);

// Add webhook to trigger workflows externally
http.route({
  path: "/api/trigger",
  method: "POST",
  handler: httpAction(async (ctx: any, req) => {
    // Rate limiting: 100 requests per minute per key
    const rateLimitKey = getRateLimitKey(req);
    if (checkRateLimit(rateLimitKey, 100, 60000)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Try again later." }), 
        { 
          status: 429,
          headers: { 
            "Content-Type": "application/json",
            "Retry-After": "60"
          }
        }
      );
    }

    try {
      const body = await req.json();
      const { workflowId, startedBy, params, dryRun } = body || {};
      if (!workflowId || !startedBy) {
        return new Response(JSON.stringify({ error: "workflowId and startedBy are required" }), { status: 400 });
      }

      const { api } = await import("./_generated/api");
      const simulateRef = (api as any).workflows?.simulateWorkflow;
      const runRef = (api as any).workflows?.runWorkflow;

      if (dryRun) {
        if (!simulateRef) {
          return new Response(JSON.stringify({ error: "simulateWorkflow not available" }), { status: 501 });
        }
        const result = await ctx.runAction(simulateRef, { workflowId, params });
        return new Response(JSON.stringify({ ok: true, dryRun: true, result }), { status: 200 });
      }

      if (!runRef) {
        return new Response(JSON.stringify({ error: "runWorkflow not available" }), { status: 501 });
      }
      const runId = await ctx.runAction(runRef, {
        workflowId,
        startedBy,
        dryRun: !!dryRun,
      });
      return new Response(JSON.stringify({ ok: true, runId }), { status: 200 });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e?.message || "Failed to trigger workflow" }), { status: 500 });
    }
  }),
});

// Webhook endpoint for external workflow triggers
http.route({
  path: "/api/workflows/webhook/:eventKey",
  method: "POST",
  handler: httpAction(async (ctx: any, req) => {
    // Rate limiting: 200 requests per minute
    const rateLimitKey = getRateLimitKey(req);
    if (checkRateLimit(rateLimitKey, 200, 60000)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded" }), 
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } }
      );
    }

    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const eventKey = segments[segments.length - 1] || null;
    if (!eventKey) {
      return new Response("Missing event key", { status: 400 });
    }

    try {
      const getRef = (internal as any).workflows?.getWorkflowsByWebhook;
      const workflows = getRef ? await ctx.runQuery(getRef, { eventKey }) : [];

      return new Response(JSON.stringify({
        message: `Matched ${workflows.length} workflow(s) for event`,
        count: workflows.length
      }), {
        status: 202,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Failed to trigger workflows" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }),
});

http.route({
  path: "/api/incidents/report",
  method: "POST",
  handler: httpAction(async (ctx: any, req) => {
    try {
      const body = await req.json();
      const { businessId, reportedBy, type, description, severity, linkedRiskId } = body || {};
      if (!businessId || !reportedBy || !type || !description || !severity) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
      }

      const { api } = await import("./_generated/api");
      const reportRef = (api as any).workflows?.reportIncident;
      if (!reportRef) {
        return new Response(JSON.stringify({ error: "reportIncident not available" }), { status: 501 });
      }

      const incidentId = await ctx.runMutation(reportRef, {
        businessId,
        reportedBy,
        type,
        description,
        severity,
        linkedRiskId: linkedRiskId ?? undefined,
      });
      return new Response(JSON.stringify({ ok: true, incidentId }), { status: 200 });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e?.message || "Failed to report incident" }), { status: 500 });
    }
  }),
});

http.route({
  path: "/api/compliance/scan",
  method: "POST",
  handler: httpAction(async (ctx: any, req) => {
    try {
      const body = await req.json();
      const { businessId, subjectType, subjectId, content, checkedBy } = body || {};
      if (!businessId || !subjectType || !subjectId || !content) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
      }

      const { api } = await import("./_generated/api");
      const checkRef = (api as any).workflows?.checkMarketingCompliance;
      if (!checkRef) {
        return new Response(JSON.stringify({ error: "checkMarketingCompliance not available" }), { status: 501 });
      }

      const result = await ctx.runAction(checkRef, {
        businessId,
        subjectType,
        subjectId,
        content,
        checkedBy: checkedBy ?? undefined,
      });
      return new Response(JSON.stringify({ ok: true, result }), { status: 200 });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e?.message || "Failed to scan compliance" }), { status: 500 });
    }
  }),
});

// Add: Exportable audit logs as CSV for AdminAudit / Reporting
http.route({
  path: "/api/audit/export",
  method: "GET",
  handler: httpAction(async (ctx: any, req) => {
    const url = new URL(req.url);
    const businessId = url.searchParams.get("businessId");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const action = url.searchParams.get("action") || undefined;
    const entityType = url.searchParams.get("entityType") || undefined;
    const limit = Number(url.searchParams.get("limit") || "1000");

    if (!businessId) {
      return new Response("Missing businessId", { status: 400 });
    }

    const args: any = {
      businessId,
      startDate: startDate ? Number(startDate) : undefined,
      endDate: endDate ? Number(endDate) : undefined,
      action,
      entityType,
      limit: isNaN(limit) ? 1000 : Math.min(Math.max(limit, 1), 2000),
    };

    const logs: Array<any> = await (ctx as any).runQuery("audit:searchAuditLogs" as any, args);

    const headers = ["createdAt", "action", "entityType", "entityId", "userId", "details"];
    const esc = (v: any) => {
      const s =
        v === null || v === undefined
          ? ""
          : typeof v === "string"
          ? v
          : typeof v === "number"
          ? String(v)
          : JSON.stringify(v);
      const needsQuotes = s.includes(",") || s.includes('"') || s.includes("\n");
      const doubled = s.replace(/"/g, '""');
      return needsQuotes ? `"${doubled}"` : doubled;
    };

    const lines: string[] = [headers.join(",")];
    for (const r of logs) {
      lines.push(
        [
          r.createdAt,
          r.action,
          r.entityType,
          r.entityId ?? "",
          r.userId ?? "",
          r.details ? JSON.stringify(r.details) : "",
        ]
          .map(esc)
          .join(","),
      );
    }

    const csv = lines.join("\n");
    const disposition = `attachment; filename="audit_${new Date().toISOString().slice(0, 10)}.csv"`;
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": disposition,
        "Cache-Control": "no-store",
      },
    });
  }),
});

// Add: Public unsubscribe endpoint
// GET /api/unsubscribe?token=...&businessId=...&email=...
http.route({
  path: "/api/unsubscribe",
  method: "GET",
  handler: httpAction(async (ctx: any, req) => {
    try {
      const url = new URL(req.url);
      const token = url.searchParams.get("token");
      const email = url.searchParams.get("email"); // optional

      if (!token) {
        return new Response("Missing required parameters.", { status: 400, headers: { "content-type": "text/html" } });
      }

      await ctx.runMutation(internal.emails.setUnsubscribeActive, {
        token,
      });

      return new Response(
        `<html><body style="font-family:Arial,sans-serif;padding:24px;"><h2>You're unsubscribed</h2><p>You will no longer receive emails${email ? ` at <strong>${email}</strong>` : ""}.</p></body></html>`,
        { status: 200, headers: { "content-type": "text/html" } }
      );
    } catch {
      return new Response("Server error.", { status: 500, headers: { "content-type": "text/html" } });
    }
  }),
});

// Manual sweeper endpoint for scheduled email campaigns.
// Tries to reserve due scheduled campaigns and fan out send jobs.
// Optional limit to cap the number processed per call.
http.route({
  path: "/api/cron/sweep-scheduled-campaigns",
  method: "POST",
  handler: httpAction(async (ctx: any, req) => {
    try {
      // Parse optional limit from body or query string
      let limit = 25;
      try {
        const url = new URL(req.url);
        const qsLimit = url.searchParams.get("limit");
        if (qsLimit) limit = Math.max(1, Math.min(100, Number(qsLimit)));
      } catch {
        // ignore
      }
      try {
        const body = await req.json().catch(() => null);
        if (body && typeof body.limit === "number") {
          limit = Math.max(1, Math.min(100, Number(body.limit)));
        }
      } catch {
        // ignore body parse errors, default limit applies
      }

      // Reserve campaigns atomically to avoid duplicate pickups
      const reservedIds = await ctx.runMutation(internal.emails.reserveDueScheduledCampaigns, {});
      const slice = reservedIds.slice(0, limit);

      let scheduled = 0;
      for (const campaignId of slice) {
        try {
          await ctx.scheduler.runAfter(
            0,
            internal.emailsActions.sendCampaignInternal,
            { campaignId }
          );
          scheduled++;
        } catch {
          // If scheduling fails for a single campaign, continue others
        }
      }

      return new Response(
        JSON.stringify({
          ok: true,
          reserved: reservedIds.length,
          scheduled,
          processedIds: slice.map((id: unknown) => String(id)),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (e: any) {
      return new Response(
        JSON.stringify({ error: e?.message || "Failed to sweep scheduled campaigns" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

/**
 * Helper: Map a Stripe price ID back to a tier using env vars.
 */
function priceIdToTier(priceId?: string | null) {
  if (!priceId) return null;
  const map: Record<string, "solopreneur" | "startup" | "sme" | "enterprise" | null> = {
    [String(process.env.STRIPE_PRICE_ID_SOLOPRENEUR)]: "solopreneur",
    [String(process.env.STRIPE_PRICE_ID_STARTUP)]: "startup",
    [String(process.env.STRIPE_PRICE_ID_SME)]: "sme",
    [String(process.env.STRIPE_PRICE_ID_ENTERPRISE)]: "enterprise",
  };
  return map[priceId] ?? null;
}

/**
 * Stripe webhook: Receives subscription lifecycle events.
 * Path: /api/stripe/webhook
 */
http.route({
  path: "/api/stripe/webhook",
  method: "POST",
  handler: httpAction(async (ctx: any, req) => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return new Response("Missing STRIPE_SECRET_KEY", { status: 500 });
    }
    const stripe = new Stripe(secretKey);

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
    const sig = req.headers.get("stripe-signature");
    const bodyBytes = await req.arrayBuffer();
    const buf = Buffer.from(bodyBytes);

    let event: any;
    try {
      if (webhookSecret && sig) {
        event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
      } else {
        // Fallback: accept JSON without signature verification (dev)
        event = JSON.parse(Buffer.from(bodyBytes).toString("utf8"));
      }
    } catch (err) {
      console.error("Stripe webhook signature verification failed:", err);
      return new Response("Bad signature", { status: 400 });
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const tier =
            (session.metadata?.tier as "solopreneur" | "startup" | "sme" | "enterprise" | undefined) ||
            (session.subscription && typeof session.subscription !== "string"
              ? (session.subscription as any)?.metadata?.tier
              : undefined);

          const businessIdStr =
            session.metadata?.businessId ||
            (session.subscription && typeof session.subscription !== "string"
              ? (session.subscription as any)?.metadata?.businessId
              : undefined);

          const customerId =
            typeof session.customer === "string" ? session.customer : session.customer?.id;
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : (session.subscription as any)?.id;

          if (tier && businessIdStr) {
            await ctx.runMutation(internal.billingInternal.applyCheckoutResult, {
              businessId: businessIdStr as any,
              tier,
              stripeCustomerId: customerId ?? null,
              stripeSubscriptionId: subscriptionId ?? null,
            });
          }
          break;
        }

        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const sub = event.data.object as Stripe.Subscription;
          const businessIdStr = (sub.metadata?.businessId as string | undefined) || undefined;
          const priceId = sub.items?.data?.[0]?.price?.id;
          const tier = priceIdToTier(priceId);
          const status = sub.status; // active | trialing | past_due | canceled | etc.

          if (businessIdStr) {
            await ctx.runMutation(internal.billingInternal.updateSubscriptionStatus, {
              businessId: businessIdStr as any,
              status,
              plan: tier ?? undefined,
              stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
              stripeSubscriptionId: sub.id,
            });
          }
          break;
        }

        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          const businessIdStr = (sub.metadata?.businessId as string | undefined) || undefined;
          if (businessIdStr) {
            await ctx.runMutation(internal.billingInternal.updateSubscriptionStatus, {
              businessId: businessIdStr as any,
              status: "canceled",
              stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
              stripeSubscriptionId: sub.id,
            });
          }
          break;
        }

        default: {
          // Ignore other events
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Stripe webhook handling error:", err);
      return new Response("Webhook handling error", { status: 500 });
    }
  }),
});

// PayPal webhook handler
http.route({
  path: "/api/webhooks/paypal",
  method: "POST",
  handler: httpAction(async (ctx: any, req) => {
    try {
      const body = await req.json();
      const eventType = body.event_type;

      // Handle PayPal invoice events
      if (eventType === "INVOICING.INVOICE.PAID") {
        const invoiceId = body.resource?.reference;
        if (invoiceId) {
          await ctx.runMutation(internal.invoices.markInvoicePaid, {
            invoiceId: invoiceId as any,
            paidAt: Date.now(),
          });
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error("PayPal webhook error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

/**
 * OAuth callback handler for social platforms
 */
http.route({
  path: "/auth/callback/twitter",
  method: "GET",
  handler: httpAction(async (ctx: any, req) => {
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
  }),
});

http.route({
  path: "/auth/callback/linkedin",
  method: "GET",
  handler: httpAction(async (ctx: any, req) => {
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
  }),
});

http.route({
  path: "/auth/callback/facebook",
  method: "GET",
  handler: httpAction(async (ctx: any, req) => {
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
  }),
});

/**
 * SCIM 2.0 Endpoints
 */
http.route({
  path: "/scim/v2/Users",
  method: "GET",
  handler: httpAction(async (ctx: any, req) => {
    // Authenticate via Bearer token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // In production, validate token against stored API keys
    const token = authHeader.substring(7);
    
    // Return SCIM user list (simplified)
    return new Response(
      JSON.stringify({
        schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
        totalResults: 0,
        Resources: [],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/scim+json" },
      }
    );
  }),
});

http.route({
  path: "/scim/v2/Users",
  method: "POST",
  handler: httpAction(async (ctx: any, req) => {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    
    // Create user via SCIM
    const scimId = `scim_user_${Date.now()}`;
    
    return new Response(
      JSON.stringify({
        schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
        id: scimId,
        userName: body.userName,
        active: body.active ?? true,
        meta: {
          resourceType: "User",
          created: new Date().toISOString(),
          lastModified: new Date().toISOString(),
        },
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/scim+json" },
      }
    );
  }),
});

http.route({
  path: "/scim/v2/Groups",
  method: "GET",
  handler: httpAction(async (ctx: any, req) => {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
        totalResults: 0,
        Resources: [],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/scim+json" },
      }
    );
  }),
});

http.route({
  path: "/scim/v2/Groups",
  method: "POST",
  handler: httpAction(async (ctx: any, req) => {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const scimId = `scim_group_${Date.now()}`;
    
    return new Response(
      JSON.stringify({
        schemas: ["urn:ietf:params:scim:schemas:core:2.0:Group"],
        id: scimId,
        displayName: body.displayName,
        members: body.members || [],
        meta: {
          resourceType: "Group",
          created: new Date().toISOString(),
          lastModified: new Date().toISOString(),
        },
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/scim+json" },
      }
    );
  }),
});

// Email tracking: 1x1 open pixel
http.route({
  path: "/api/email/track/open",
  method: "GET",
  handler: httpAction(async (ctx: any, req) => {
    try {
      const url = new URL(req.url);
      const c = url.searchParams.get("c"); // campaign id (emailCampaigns)
      const e = url.searchParams.get("e"); // base64 recipient email
      if (c && e) {
        const recipientEmail = Buffer.from(e, "base64").toString("utf8");
        // Record open (best-effort; don't block pixel)
        await ctx.runMutation("emailTracking:recordEmailEvent" as any, {
          campaignId: c,
          recipientEmail,
          eventType: "opened",
          metadata: {
            userAgent: req.headers.get("user-agent"),
          },
        });
      }

      // Transparent 1x1 GIF
      const pixel = Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
      );
      return new Response(pixel, {
        status: 200,
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      });
    } catch (err) {
      // Always return a pixel
      const pixel = Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
      );
      return new Response(pixel, { status: 200, headers: { "Content-Type": "image/gif" } });
    }
  }),
});

// Email tracking: click redirect
http.route({
  path: "/api/email/track/click",
  method: "GET",
  handler: httpAction(async (ctx: any, req) => {
    try {
      const url = new URL(req.url);
      const c = url.searchParams.get("c"); // campaign id (emailCampaigns)
      const e = url.searchParams.get("e"); // base64 recipient email
      const u = url.searchParams.get("u"); // target URL
      if (c && e && u) {
        const recipientEmail = Buffer.from(e, "base64").toString("utf8");
        await ctx.runMutation("emailTracking:recordEmailEvent" as any, {
          campaignId: c,
          recipientEmail,
          eventType: "clicked",
          metadata: {
            targetUrl: u,
            userAgent: req.headers.get("user-agent"),
          },
        });
      }

      // Redirect to target
      return new Response(null, {
        status: 302,
        headers: { Location: u || "/" },
      });
    } catch {
      return new Response(null, { status: 302, headers: { Location: "/" } });
    }
  }),
});

// Resend webhook: delivered/bounced/opened/clicked
http.route({
  path: "/api/resend/webhook",
  method: "POST",
  handler: httpAction(async (ctx: any, req) => {
    try {
      const body = await req.json();
      const event = body?.type;
      const data = body?.data;

      // Expect campaign id in tags: [{ name: "campaign_id", value: "<id>" }]
      const tags: Array<{ name: string; value: string }> = data?.tags || [];
      const campaignTag = tags.find((t) => t.name === "campaign_id");
      const campaignId = campaignTag?.value;
      const recipientEmail: string | undefined = data?.to?.[0] || data?.email;

      if (!campaignId || !recipientEmail) {
        // Accept but ignore if missing identifiers
        return new Response(JSON.stringify({ received: true, ignored: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Map Resend events -> our normalized events
      const mapped =
        event === "email.delivered"
          ? "sent"
          : event === "email.bounced"
            ? "bounced"
            : event === "email.opened"
              ? "opened"
              : event === "email.clicked"
                ? "clicked"
                : null;

      if (mapped) {
        await ctx.runMutation("emailTracking:recordEmailEvent" as any, {
          campaignId,
          recipientEmail,
          eventType: mapped,
          metadata: {
            resendEvent: event,
            resendId: data?.id,
          },
        });
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err?.message || "webhook_error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// SAML Assertion Consumer Service
http.route({
  path: "/auth/saml/acs",
  method: "POST",
  handler: httpAction(async (ctx: any, req) => {
    try {
      const formData = await req.formData();
      const samlResponse = formData.get("SAMLResponse") as string;
      const relayState = formData.get("RelayState") as string;

      if (!samlResponse) {
        return new Response("Missing SAML response", { status: 400 });
      }

      // Extract businessId from relay state
      const businessId = relayState as any;

      const { api } = await import("./_generated/api");
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
  }),
});

// OIDC Callback
http.route({
  path: "/auth/oidc/callback",
  method: "GET",
  handler: httpAction(async (ctx: any, req) => {
    try {
      const url = new URL(req.url);
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");

      if (!code) {
        return new Response("Missing authorization code", { status: 400 });
      }

      // Extract businessId from state
      const businessId = state as any;

      const { api } = await import("./_generated/api");
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
  }),
});

export default http;

// Add rate limiting helper at the top of the file after imports
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Rate limiting middleware
 * @param key - Unique identifier for rate limit (e.g., IP, API key, user ID)
 * @param limit - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if rate limit exceeded, false otherwise
 */
function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (record.count >= limit) {
    return true; // Rate limit exceeded
  }

  record.count++;
  return false;
}

/**
 * Extract rate limit key from request
 * Priority: API key > User ID > IP address
 */
function getRateLimitKey(req: Request, userId?: string): string {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey) return `api:${apiKey}`;
  
  if (userId) return `user:${userId}`;
  
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  return `ip:${ip}`;
}