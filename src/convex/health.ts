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
    
    // Email queue depth - use take() without index to avoid backfilling issues
    let emailQueueDepth = 0;
    try {
      // We take the latest 1000 emails and check their status in memory
      // This avoids using the "by_status" index which might be backfilling
      const allEmails = await ctx.db.query("emails").order("desc").take(1000);
      emailQueueDepth = allEmails.filter((e: any) => e.status === "pending").length;
    } catch (error) {
      console.warn("Unable to query emails table:", error);
      emailQueueDepth = 0;
    }
    
    // Cron last processed - compute latest by _creationTime without requiring a custom index
    let cronLastProcessed = null;
    try {
      const lastAudit = await ctx.db
        .query("audit_logs")
        .order("desc")
        .take(1);
      
      if (lastAudit.length > 0) {
        cronLastProcessed = lastAudit[0]._creationTime;
      }
    } catch (error) {
      console.warn("Unable to query audit_logs table:", error);
    }
    
    // Overdue approvals count - use take() without index to avoid backfilling issues
    let overdueApprovalsCount = 0;
    try {
      const now = Date.now();
      const allApprovals = await ctx.db.query("approvalQueue").take(100);
      // Use explicit any cast if needed, or rely on inference
      overdueApprovalsCount = allApprovals.filter(
        (a: any) => a.status === "pending" && a.slaDeadline < now
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