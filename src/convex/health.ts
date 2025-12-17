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
    
    // Email queue depth - use simple query without index to avoid backfilling issues
    let emailQueueDepth = 0;

    try {
      // Use order("desc") to get most recent emails without requiring an index
      const emailSample = await ctx.db
        .query("emails")
        .order("desc")
        .take(200);
      const queueStatuses = ["pending", "queued", "scheduled", "sending"];
      emailQueueDepth = emailSample.filter(email => 
        queueStatuses.includes(String(email.status))
      ).length;
    } catch (error) {
      // Silently fail during index backfilling or if table doesn't exist yet
      console.warn("health.envStatus: unable to sample emails table", error);
      emailQueueDepth = 0;
    }
    
    // Cron last processed - compute latest by _creationTime without requiring a custom index
    let cronLastProcessed: number | null = null;
    try {
      const lastAudit = await ctx.db
        .query("audit_logs")
        .order("desc")
        .first();
      cronLastProcessed = lastAudit?._creationTime ?? null;
    } catch (error) {
      console.warn("health.envStatus: unable to query audit_logs", error);
    }
    
    // Overdue approvals count - wrap in try-catch to handle index backfilling
    let overdueApprovalsCount = 0;
    try {
      const now = Date.now();
      const overdueApprovals = await ctx.db
        .query("approvalQueue")
        .withIndex("by_sla_deadline", (q) => q.lt("slaDeadline", now))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .collect();
      overdueApprovalsCount = overdueApprovals.length;
    } catch (error) {
      console.warn("health.envStatus: unable to query approvalQueue", error);
    }
    
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