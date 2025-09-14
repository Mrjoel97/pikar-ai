import { query } from "./_generated/server";

export const envStatus = query({
  args: {},
  handler: async () => {
    const hasResend =
      typeof process.env.RESEND_API_KEY === "string" &&
      process.env.RESEND_API_KEY.trim().length > 0;

    const hasSalesInbox =
      typeof process.env.SALES_INBOX === "string" &&
      process.env.SALES_INBOX.trim().length > 0;

    const hasPublicBaseUrl =
      typeof process.env.VITE_PUBLIC_BASE_URL === "string" &&
      process.env.VITE_PUBLIC_BASE_URL.trim().length > 0;

    const devSafeRaw = String(process.env.DEV_SAFE_EMAILS ?? "").toLowerCase();
    const devSafeEmails = devSafeRaw === "true" || devSafeRaw === "1";

    if (!hasResend) console.warn("[config] RESEND_API_KEY is missing");
    if (!hasSalesInbox) console.warn("[config] SALES_INBOX is missing");
    if (!hasPublicBaseUrl) console.warn("[config] VITE_PUBLIC_BASE_URL is missing");
    if (devSafeEmails) console.info("[config] DEV_SAFE_EMAILS enabled (email sends stubbed in dev)");

    return {
      hasResend,
      hasSalesInbox,
      hasPublicBaseUrl,
      devSafeEmails,
    };
  },
});
