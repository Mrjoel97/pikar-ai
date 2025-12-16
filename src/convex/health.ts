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
    // FIX: Temporarily disabled to prevent "index backfilling" errors during deployment
    let emailQueueDepth = 0;
    /*
    try {
      const recentEmails = await ctx.db
        .query("emails")
        .order("desc")
        .take(50);
      
      const queued = recentEmails.filter((e: any) => e.status === "queued").length;
      const scheduled = recentEmails.filter((e: any) => e.status === "scheduled").length;
      const sending = recentEmails.filter((e: any) => e.status === "sending").length;
      
      emailQueueDepth = queued + scheduled + sending;
    } catch (e) {
      console.error("Failed to query emails for health check:", e);
      // Default to 0 if query fails
    }
    */
    
    // Cron last processed - compute latest by _creationTime without requiring a custom index
    let cronLastProcessed = null;
    try {
      const lastAudit = await ctx.db
        .query("audit_logs")
        .order("desc")
        .first();
      cronLastProcessed = lastAudit?._creationTime ?? null;
    } catch (e) {
      console.error("Failed to query audit_logs for health check:", e);
    }
    
    // Overdue approvals count
    const now = Date.now();
    let overdueApprovalsCount = 0;
    /*
    try {
      // FIX: Avoid using "by_sla_deadline" index if it might be backfilling
      const recentApprovals = await ctx.db
        .query("approvalQueue")
        .order("desc")
        .take(50);
        
      overdueApprovalsCount = recentApprovals.filter((q: any) => 
        q.status === "pending" && q.slaDeadline < now
      ).length;
    } catch (e) {
      console.error("Failed to query approvalQueue for health check:", e);
    }
    */
    
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