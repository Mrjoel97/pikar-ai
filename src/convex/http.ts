import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

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
  handler: httpAction(async (ctx, req) => {
    try {
      const url = new URL(req.url);
      const businessId = url.searchParams.get("businessId");
      // Remove unsupported filter in current audit API
      // const action = url.searchParams.get("action") ?? undefined;

      if (!businessId) {
        return new Response(JSON.stringify({ error: "businessId is required" }), { status: 400 });
      }

      // Use the correct function reference from audit.ts
      const logs = await ctx.runQuery(api.audit.listForBusiness, {
        businessId: businessId as any, // Convex will validate as Id<"businesses">
        // Optional: could take a limit in the future
      });

      // Align CSV to audit log structure
      const header = ["createdAt", "businessId", "actorUserId", "type", "message", "data"];
      const rows = logs.map((l: any) => [
        new Date(l.createdAt).toISOString(),
        l.businessId ?? "",
        l.actorUserId ?? "",
        l.type ?? "",
        l.message ?? "",
        JSON.stringify(l.data ?? {}),
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
    try {
      const url = new URL(req.url);
      const token = url.searchParams.get("token");
      const businessId = url.searchParams.get("businessId");
      const email = url.searchParams.get("email");

      if (!token || !businessId || !email) {
        return new Response("Missing required parameters.", { status: 400, headers: { "content-type": "text/html" } });
      }

      const result = await ctx.runMutation(internal.emails.setUnsubscribeActive, {
        businessId: businessId as Id<"businesses">,
        email,
        token,
      });

      if (!result?.ok) {
        const reason =
          (result as any)?.reason === "not_found"
            ? "We could not find a matching subscription."
            : (result as any)?.reason === "token_mismatch"
            ? "The unsubscribe link is invalid or has expired."
            : "Unable to process your request.";
        return new Response(
          `<html><body style="font-family:Arial,sans-serif;padding:24px;"><h2>Unsubscribe</h2><p>${reason}</p></body></html>`,
          { status: 400, headers: { "content-type": "text/html" } }
        );
      }

      return new Response(
        `<html><body style="font-family:Arial,sans-serif;padding:24px;"><h2>You're unsubscribed</h2><p>You will no longer receive emails from us at <strong>${email}</strong>.</p></body></html>`,
        { status: 200, headers: { "content-type": "text/html" } }
      );
    } catch {
      return new Response("Server error.", { status: 500, headers: { "content-type": "text/html" } });
    }
  }),
});

export default http;