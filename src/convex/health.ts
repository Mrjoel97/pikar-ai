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
    
    // Email queue depth - use collect() without index to avoid backfilling issues
    let emailQueueDepth = 0;
    try {
      const allEmails = await ctx.db.query("emails").collect();
      emailQueueDepth = allEmails.filter(e => e.status === "pending").length;
    } catch (error) {
      console.warn("Unable to query emails table:", error);
      emailQueueDepth = 0;
    }
    
    // Cron last processed - compute latest by _creationTime without requiring a custom index
    const lastAudit = await ctx.db
      .query("audit_logs")
      .order("desc")
      .first();

    const cronLastProcessed = lastAudit?._creationTime ?? null;
    
    // Overdue approvals count - use collect() without index to avoid backfilling issues
    let overdueApprovalsCount = 0;
    try {
      const now = Date.now();
      const allApprovals = await ctx.db.query("approvalQueue").collect();
      overdueApprovalsCount = allApprovals.filter(
        a => a.status === "pending" && a.slaDeadline < now
      ).length;
    } catch (error) {
      console.warn("Unable to query approvalQueue table:", error);
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