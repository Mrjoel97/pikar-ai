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
    
    // Email queue depth - handle backfilling index gracefully
    let emailQueueDepth = 0;
    try {
      const pendingEmails = await ctx.db
        .query("emails")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .collect();
      emailQueueDepth = pendingEmails.length;
    } catch (error) {
      // Index is backfilling or not available yet, return 0
      console.warn("emails.by_status index not available yet:", error);
      emailQueueDepth = 0;
    }
    
    // Cron last processed - compute latest by _creationTime without requiring a custom index
    const lastAudit = await ctx.db
      .query("audit_logs")
      .order("desc")
      .first();

    const cronLastProcessed = lastAudit?._creationTime ?? null;
    
    // Overdue approvals count - handle potential index issues
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
      // Index is backfilling or not available yet, return 0
      console.warn("approvalQueue.by_sla_deadline index not available yet:", error);
      overdueApprovalsCount = 0;
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