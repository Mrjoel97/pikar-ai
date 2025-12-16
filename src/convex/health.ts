import { query } from "./_generated/server";

export const envStatus = query({
  args: {},
  handler: async (ctx) => {
    // Environment variables check
    const hasRESEND = !!process.env.RESEND_API_KEY;
    const hasSALES_INBOX = !!process.env.SALES_INBOX;
    const hasPUBLIC_SALES_INBOX = !!process.env.PUBLIC_SALES_INBOX;
    const hasBASE_URL = !!process.env.VITE_PUBLIC_BASE_URL;
    const hasOPENAI = !!process.env.OPENAI_API_KEY;
    const devSafeEmailsEnabled = process.env.DEV_SAFE_EMAILS === "true";
    
    // Email queue depth
    const queueStatuses = ["queued", "scheduled", "sending"] as const;
    let emailQueueDepth = 0;

    try {
      const statusDocs = await Promise.all(
        queueStatuses.map((status) =>
          ctx.db
            .query("emails")
            .withIndex("by_status", (q) => q.eq("status", status as any))
            .take(200)
        )
      );

      emailQueueDepth = statusDocs.reduce((total, docs) => total + docs.length, 0);
    } catch (error) {
      console.warn("health.envStatus: falling back without emails.by_status index", error);
      const fallbackSample = await ctx.db.query("emails").take(200);
      emailQueueDepth = fallbackSample.reduce((total, email) => {
        const status = String(email.status);
        return queueStatuses.includes(status as (typeof queueStatuses)[number]) ? total + 1 : total;
      }, 0);
    }
    
    // Cron last processed - compute latest by _creationTime without requiring a custom index
    const lastAudit = await ctx.db
      .query("audit_logs")
      .order("desc")
      .first();

    const cronLastProcessed = lastAudit?._creationTime ?? null;
    
    // Overdue approvals count
    const now = Date.now();
    const overdueApprovals = await ctx.db
      .query("approvalQueue")
      .withIndex("by_sla_deadline", (q) => q.lt("slaDeadline", now))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
    
    const overdueApprovalsCount = overdueApprovals.length;
    
    return {
      hasRESEND,
      hasSALES_INBOX,
      hasPUBLIC_SALES_INBOX,
      hasBASE_URL,
      hasOPENAI,
      devSafeEmailsEnabled,
      emailQueueDepth,
      cronLastProcessed,
      overdueApprovalsCount,
    };
  },
});