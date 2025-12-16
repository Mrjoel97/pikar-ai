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
    
    // Email queue depth - gracefully handle backfilling index
    let emailQueueDepth = 0;
    try {
      const pendingEmails = await ctx.db
        .query("emails")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .collect();
      emailQueueDepth = pendingEmails.length;
    } catch (error) {
      // Index is backfilling, use fallback: filter without index (less efficient but works)
      const allEmails = await ctx.db.query("emails").take(1000);
      emailQueueDepth = allEmails.filter(e => e.status === "pending").length;
    }
    
    // Cron last processed - compute latest by _creationTime without requiring a custom index
    const lastAudit = await ctx.db
      .query("audit_logs")
      .order("desc")
      .first();

    const cronLastProcessed = lastAudit?._creationTime ?? null;
    
    // Overdue approvals count
    const now = Date.now();
    let overdueApprovalsCount = 0;
    try {
      const overdueApprovals = await ctx.db
        .query("approvalQueue")
        .withIndex("by_sla_deadline", (q) => q.lt("slaDeadline", now))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .collect();
      overdueApprovalsCount = overdueApprovals.length;
    } catch (error) {
      // Index might be backfilling, use fallback
      const allApprovals = await ctx.db.query("approvalQueue").take(1000);
      overdueApprovalsCount = allApprovals.filter(
        a => a.status === "pending" && a.slaDeadline && a.slaDeadline < now
      ).length;
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