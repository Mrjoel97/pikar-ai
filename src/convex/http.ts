import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal, api } from "./_generated/api";

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

      // Use optional function references to avoid compile-time errors if missing
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
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const eventKey = segments[segments.length - 1] || null;
    if (!eventKey) {
      return new Response("Missing event key", { status: 400 });
    }

    try {
      // Optional function reference
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
  handler: httpAction(async (ctx, req) => {
    try {
      const body = await req.json();
      const { businessId, reportedBy, type, description, severity, linkedRiskId } = body || {};
      if (!businessId || !reportedBy || !type || !description || !severity) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
      }

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
  handler: httpAction(async (ctx, req) => {
    try {
      const body = await req.json();
      const { businessId, subjectType, subjectId, content, checkedBy } = body || {};
      if (!businessId || !subjectType || !subjectId || !content) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
      }

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
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const businessId = url.searchParams.get("businessId");
    
    if (!businessId) {
      return new Response("Missing businessId parameter", { status: 400 });
    }

    const logs = await ctx.runQuery(internal.audit.listForBusiness, { 
      businessId: businessId as any 
    });

    // Enhanced CSV with both legacy and structured fields
    const csvLines = [
      // Header with both legacy and new structured fields
      "timestamp,user,action,details,entityType,entityId,structured_details"
    ];

    for (const log of logs) {
      const timestamp = new Date(log._creationTime).toISOString();
      const user = log.userId || "system";
      const action = log.action || "unknown";
      const legacyDetails = typeof log.details === "string" ? log.details : JSON.stringify(log.details || {});
      const entityType = log.entityType || "";
      const entityId = log.entityId || "";
      const structuredDetails = JSON.stringify(log.details || {});
      
      // CSV escape function
      const csvEscape = (str: string) => `"${str.replace(/"/g, '""')}"`;
      
      csvLines.push([
        csvEscape(timestamp),
        csvEscape(user),
        csvEscape(action),
        csvEscape(legacyDetails),
        csvEscape(entityType),
        csvEscape(entityId),
        csvEscape(structuredDetails),
      ].join(","));
    }

    const csv = csvLines.join("\n");
    
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="audit_export_${businessId}_${Date.now()}.csv"`,
      },
    });
  }),
});

// Add: Public unsubscribe endpoint
// GET /api/unsubscribe?token=...&businessId=...&email=...
http.route({
  path: "/api/unsubscribe",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
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

export default http;