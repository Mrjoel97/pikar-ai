import { query } from "./_generated/server";

export const envStatus = query({
  args: {},
  handler: async (ctx) => {
    // Environment variables check
    const hasRESEND = !!process.env.RESEND_API_KEY;
    const hasSALES_INBOX = !!process.env.SALES_INBOX;
    const hasPUBLIC_SALES_INBOX = !!process.env.PUBLIC_SALES_INBOX;
    const hasBASE_URL = !!process.env.VITE_PUBLIC_BASE_URL;
    const devSafeEmailsEnabled = process.env.DEV_SAFE_EMAILS === "true";
    
    // Email queue depth
    const queuedEmails = await ctx.db
      .query("emails")
      .withIndex("by_status", (q) => q.eq("status", "queued"))
      .collect();
    
    const scheduledEmails = await ctx.db
      .query("emails")
      .withIndex("by_status", (q) => q.eq("status", "scheduled"))
      .collect();
    
    const sendingEmails = await ctx.db
      .query("emails")
      .withIndex("by_status", (q) => q.eq("status", "sending"))
      .collect();
    
    const emailQueueDepth = queuedEmails.length + scheduledEmails.length + sendingEmails.length;
    
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
      devSafeEmailsEnabled,
      emailQueueDepth,
      cronLastProcessed,
      overdueApprovalsCount,
    };
  },
});