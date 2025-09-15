import { query } from "./_generated/server";

export const envStatus = query({
  args: {},
  handler: async (ctx) => {
    const resendKey = process.env.RESEND_API_KEY;
    const salesInbox = process.env.SALES_INBOX || process.env.PUBLIC_SALES_INBOX;
    const publicBaseUrl = process.env.VITE_PUBLIC_BASE_URL;
    const devSafeEmails = process.env.DEV_SAFE_EMAILS === "true";

    // Add: queue depth visibility for scheduled/queued campaigns
    const now = Date.now();
    const scheduled = await ctx.db
      .query("emails")
      .withIndex("by_status", (q) => q.eq("status", "scheduled"))
      .filter((q) => q.lte(q.field("scheduledAt"), now))
      .take(200);
    const queued = await ctx.db
      .query("emails")
      .withIndex("by_status", (q) => q.eq("status", "queued"))
      .take(200);

    return {
      hasResend: !!resendKey,
      hasSalesInbox: !!salesInbox,
      hasPublicBaseUrl: !!publicBaseUrl,
      devSafeEmails,
      queue: {
        scheduledDue: scheduled.length,
        queued: queued.length,
      },
    };
  },
});