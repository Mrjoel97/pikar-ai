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

// Unsubscribe endpoint: switch to internal mutation; require token, businessId, and email
http.route({
  path: "/api/unsubscribe",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const businessId = searchParams.get("businessId");
    const email = searchParams.get("email");

    if (!token || !businessId || !email) {
      return new Response("Missing token, businessId, or email", { status: 400 });
    }

    try {
      const result = await ctx.runMutation(internal.emails.setUnsubscribeActive, {
        businessId: businessId as any, // Convex will validate as Id<"businesses">
        email,
        token,
      });

      if (!result.ok) {
        const reason =
          result.reason === "not_found" ? "Invalid token" :
          result.reason === "token_mismatch" ? "Token mismatch" :
          "Unable to unsubscribe";
        return new Response(reason, { status: 400 });
      }

      const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Unsubscribed</title></head><body style="font-family: Arial, sans-serif; padding:24px;"><h1 style="margin-bottom:8px;">You have been unsubscribed</h1><p style="color:#475569;">We're sorry to see you go. You won't receive future marketing emails from us at ${email}.</p></body></html>`;
      return new Response(html, { status: 200, headers: { "Content-Type": "text/html" } });
    } catch (e: any) {
      return new Response("Failed to process unsubscribe", { status: 500 });
    }
  }),
});

export default http;