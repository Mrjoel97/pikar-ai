import { query } from "./_generated/server";

export const envStatus = query({
  args: {},
  handler: async (ctx) => {
    const resendKey = process.env.RESEND_API_KEY;
    const salesInbox = process.env.SALES_INBOX || process.env.PUBLIC_SALES_INBOX;
    const publicBaseUrl = process.env.VITE_PUBLIC_BASE_URL;
    const devSafeEmails = process.env.DEV_SAFE_EMAILS === "true";

    return {
      hasResend: !!resendKey,
      hasSalesInbox: !!salesInbox,
      hasPublicBaseUrl: !!publicBaseUrl,
      devSafeEmails,
    };
  },
});