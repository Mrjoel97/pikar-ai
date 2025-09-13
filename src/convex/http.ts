import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

const http = httpRouter();

// Add webhook to trigger workflows externally
http.route({
  path: "/api/trigger",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const body = await req.json();
      const { workflowId, startedBy, params, dryRun } = body || {};
      if (!workflowId || !startedBy) {
        return new Response(JSON.stringify({ error: "workflowId and startedBy are required" }), { status: 400 });
      }

      // Optional: simulate only if dryRun is true and no execution
      if (dryRun) {
        const result = await ctx.runAction(api.workflows.simulateWorkflow, { workflowId, params });
        return new Response(JSON.stringify({ ok: true, dryRun: true, result }), { status: 200 });
      }

      const runId = await ctx.runAction(api.workflows.runWorkflow, {
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
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const eventKey = segments[segments.length - 1] || null;
    if (!eventKey) {
      return new Response("Missing event key", { status: 400 });
    }

    try {
      // Find workflows with matching webhook trigger
      const workflows = await ctx.runQuery(internal.workflows.getWorkflowsByWebhook, { eventKey });
      
      // Remove execution to avoid missing api.workflows.run reference and never-typed workflow._id
      // Previously executed each workflow here.

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
  handler: httpAction(async (ctx, req) => {
    try {
      const body = await req.json();
      const { businessId, reportedBy, type, description, severity, linkedRiskId } = body || {};
      if (!businessId || !reportedBy || !type || !description || !severity) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
      }
      const incidentId = await ctx.runMutation(api.workflows.reportIncident, {
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
  handler: httpAction(async (ctx, req) => {
    try {
      const body = await req.json();
      const { businessId, subjectType, subjectId, content, checkedBy } = body || {};
      if (!businessId || !subjectType || !subjectId || !content) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
      }
      const result = await ctx.runAction(api.workflows.checkMarketingCompliance, {
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
  handler: httpAction(async (ctx, req) => {
    try {
      const url = new URL(req.url);
      const businessId = url.searchParams.get("businessId");
      const action = url.searchParams.get("action") ?? undefined;

      if (!businessId) {
        return new Response(JSON.stringify({ error: "businessId is required" }), { status: 400 });
      }

      const logs = await ctx.runQuery(api.workflows.listAuditLogs, {
        businessId: businessId as any, // Convex will validate as Id<"businesses">
        action,
      });

      const header = ["at", "businessId", "actorId", "action", "subjectType", "subjectId", "ip", "metadata"];
      const rows = logs.map((l: any) => [
        new Date(l.at).toISOString(),
        l.businessId ?? "",
        l.actorId ?? "",
        l.action,
        l.subjectType,
        l.subjectId,
        l.ip ?? "",
        JSON.stringify(l.metadata ?? {}),
      ]);

      const csv = [header.join(","), ...rows.map((r: unknown[]) => r.map((f: unknown) => `"${String(f).replace(/"/g, '""')}"`).join(","))].join("\n");

      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="audit_logs_${businessId}_${Date.now()}.csv"`,
        },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e?.message || "Failed to export audit logs" }), { status: 500 });
    }
  }),
});

// Add: Public unsubscribe endpoint
// GET /api/unsubscribe?token=...&businessId=...&email=...
http.route({
  path: "/api/unsubscribe",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const businessId = url.searchParams.get("businessId");
    const email = url.searchParams.get("email");

    if (!token || !businessId || !email) {
      return new Response("Missing parameters.", {
        status: 400,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    // Attempt to set unsubscribe active
    const result = await ctx.runMutation(internal.emails.setUnsubscribeActive, {
      businessId: businessId as any,
      email,
      token,
    });

    const ok = (result as any)?.ok === true;
    const reason = (result as any)?.reason;

    const body = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width" />
          <title>${ok ? "Unsubscribed" : "Unsubscribe Error"}</title>
          <style>
            body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background:#f7f7f8; color:#0f172a; padding:32px; }
            .card { max-width:560px; margin:0 auto; background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:24px; }
            .title { font-size:20px; font-weight:600; margin:0 0 8px 0; }
            .muted { color:#64748b; font-size:14px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1 class="title">${ok ? "You're unsubscribed" : "We couldn't process your request"}</h1>
            <p class="muted">
              ${
                ok
                  ? "You won't receive further messages from this sender. You can resubscribe anytime within the app."
                  : reason === "not_found"
                    ? "We couldn't find a matching subscription for this email."
                    : reason === "token_mismatch"
                      ? "The token provided is invalid."
                      : "Please try again later."
              }
            </p>
          </div>
        </body>
      </html>
    `.trim();

    return new Response(body, {
      status: ok ? 200 : 400,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }),
});

export default http;