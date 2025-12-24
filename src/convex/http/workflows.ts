import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { checkRateLimit, getRateLimitKey } from "./utils";

export const triggerWorkflow = httpAction(async (ctx: any, req) => {
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

    const { api } = await import("../_generated/api");
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
});

export const workflowWebhook = httpAction(async (ctx: any, req) => {
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
});

export const reportIncident = httpAction(async (ctx: any, req) => {
  try {
    const body = await req.json();
    const { businessId, reportedBy, type, description, severity, linkedRiskId } = body || {};
    if (!businessId || !reportedBy || !type || !description || !severity) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    const { api } = await import("../_generated/api");
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
});

export const scanCompliance = httpAction(async (ctx: any, req) => {
  try {
    const body = await req.json();
    const { businessId, subjectType, subjectId, content, checkedBy } = body || {};
    if (!businessId || !subjectType || !subjectId || !content) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    const { api } = await import("../_generated/api");
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
});
