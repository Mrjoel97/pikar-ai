"use node";

import { internalAction } from "./_generated/server";
import { Resend } from "resend";

// Build CSV content from audit logs
function toCsv(rows: Array<any>): string {
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
  for (const r of rows) {
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
  return lines.join("\n");
}

export const processAuditSchedules = internalAction({
  args: {},
  handler: async (ctx) => {
    const DEV_SAFE = process.env.DEV_SAFE_EMAILS === "true";

    // Fetch due schedules
    const due: Array<any> = await ctx.runQuery("audit:listDueSchedules" as any, {});
    if (!due || due.length === 0) return;

    for (const sched of due) {
      try {
        // Fetch logs using filters; cap at 1000 rows to keep reports lightweight
        const logs: Array<any> = await ctx.runQuery("audit:searchAuditLogs" as any, {
          businessId: sched.businessId,
          startDate: sched.filters?.startDate,
          endDate: sched.filters?.endDate,
          action: sched.filters?.action,
          entityType: sched.filters?.entityType,
          limit: 1000,
        });

        const csv = toCsv(logs);

        // Store CSV to Convex storage and generate a signed URL
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const fileId = await ctx.storage.store(blob);
        const signedUrl = await ctx.storage.getUrl(fileId);

        // Resolve workspace email config & Resend key
        const cfg: any = await ctx.runQuery("emailConfig:getByBusiness" as any, {
          businessId: sched.businessId,
        });
        const RESEND_KEY: string | undefined =
          (cfg?.resendApiKey as string | undefined) || process.env.RESEND_API_KEY;

        // Compose email
        const fromEmail = cfg?.fromEmail || "reports@pikar.ai";
        const subject = `Audit Report ${new Date().toISOString().slice(0, 10)} (${(sched.format || "csv").toUpperCase()})`;
        const html = `
          <div style="font-family: ui-sans-serif, system-ui; color:#0f172a;">
            <h2 style="margin:0 0 12px 0;">Your Scheduled Audit Report</h2>
            <p style="margin:0 0 8px 0;">Business: <code>${String(sched.businessId)}</code></p>
            <p style="margin:0 0 8px 0;">Rows: <strong>${logs.length}</strong></p>
            <p style="margin:0 0 8px 0;">Format: <strong>${(sched.format || "csv").toUpperCase()}</strong></p>
            ${
              signedUrl
                ? `<p><a href="${signedUrl}" target="_blank" rel="noopener" style="color:#2563eb;">Download CSV</a></p>`
                : `<p>Download URL not available. Please re-run the report.</p>`
            }
            <p style="margin-top:12px; font-size:12px; color:#64748b;">This link is time-limited.</p>
          </div>
        `;

        if (!RESEND_KEY) {
          if (DEV_SAFE) {
            console.warn("[AUDIT][STUB] No RESEND_API_KEY. Stubbed scheduled audit email.", {
              businessId: String(sched.businessId),
              recipients: sched.recipients,
            });
            await ctx.runMutation("audit:write" as any, {
              businessId: sched.businessId,
              action: "audit_report_email_stubbed",
              entityType: "audit_report_schedule",
              entityId: String(sched._id),
              details: { recipients: sched.recipients, rows: logs.length, fileId },
            });
          } else {
            await ctx.runMutation("audit:write" as any, {
              businessId: sched.businessId,
              action: "audit_report_email_failed",
              entityType: "audit_report_schedule",
              entityId: String(sched._id),
              details: { error: "RESEND_API_KEY not configured" },
            });
          }
        } else {
          const resend = new Resend(RESEND_KEY);
          const { error } = await resend.emails.send({
            from: fromEmail,
            to: Array.isArray(sched.recipients) ? sched.recipients : [String(sched.recipients || "")].filter(Boolean),
            subject,
            html,
          });

          if (error) {
            await ctx.runMutation("audit:write" as any, {
              businessId: sched.businessId,
              action: "audit_report_email_failed",
              entityType: "audit_report_schedule",
              entityId: String(sched._id),
              details: { error: error.message },
            });
          } else {
            await ctx.runMutation("audit:write" as any, {
              businessId: sched.businessId,
              action: "audit_report_sent",
              entityType: "audit_report_schedule",
              entityId: String(sched._id),
              details: { recipients: sched.recipients, rows: logs.length, fileId, url: signedUrl },
            });
          }
        }
      } catch (err: any) {
        await ctx.runMutation("audit:write" as any, {
          businessId: sched.businessId,
          action: "audit_report_processing_error",
          entityType: "audit_report_schedule",
          entityId: String(sched._id),
          details: { error: err?.message || String(err) },
        });
      } finally {
        // Update schedule timing
        await ctx.runMutation("audit:markScheduleRun" as any, { scheduleId: sched._id });
      }
    }
  },
});
