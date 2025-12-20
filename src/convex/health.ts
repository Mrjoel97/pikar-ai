import { query } from "./_generated/server";
import { v } from "convex/values";

export const envStatus = query({
  args: {},
  handler: async (ctx) => {
    const checks = {
      resendApiKey: !!process.env.RESEND_API_KEY,
      openaiApiKey: !!process.env.OPENAI_API_KEY,
      convexUrl: !!process.env.CONVEX_URL,
      salesInbox: !!process.env.SALES_INBOX,
      publicSalesInbox: !!process.env.PUBLIC_SALES_INBOX,
      baseUrl: !!process.env.VITE_PUBLIC_BASE_URL,
      devSafeEmails: process.env.DEV_SAFE_EMAILS === "true",
    };

    // Email queue check with graceful backfilling handling
    let emailQueueDepth = 0;
    let emailQueueStatus = "healthy";
    try {
      const pendingEmails = await ctx.db
        .query("emails")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .take(100);
      emailQueueDepth = pendingEmails.length;
      emailQueueStatus = emailQueueDepth > 50 ? "warning" : "healthy";
    } catch (error: any) {
      if (error?.message?.includes("backfilling")) {
        // Index is backfilling, fall back to unindexed query
        const allEmails = await ctx.db.query("emails").take(100);
        const pendingEmails = allEmails.filter(e => e.status === "pending");
        emailQueueDepth = pendingEmails.length;
        emailQueueStatus = "backfilling";
      } else {
        emailQueueStatus = "error";
      }
    }

    // Cron health check with graceful handling
    let cronStatus = "healthy";
    let lastCronRun = 0;
    try {
      const recentNotifications = await ctx.db
        .query("notifications")
        .withIndex("by_business")
        .order("desc")
        .take(100);
      
      const cronNotifications = recentNotifications.filter(n => 
        n.type === "system_alert" && 
        n.message?.includes("cron")
      );
      
      if (cronNotifications.length > 0) {
        lastCronRun = cronNotifications[0].createdAt;
        const hoursSinceLastRun = (Date.now() - lastCronRun) / (1000 * 60 * 60);
        cronStatus = hoursSinceLastRun > 2 ? "warning" : "healthy";
      }
    } catch (error: any) {
      if (error?.message?.includes("backfilling")) {
        cronStatus = "backfilling";
      } else {
        cronStatus = "unknown";
      }
    }

    // Approval queue check with graceful handling
    let overdueApprovals = 0;
    let approvalStatus = "healthy";
    try {
      const now = Date.now();
      const pendingApprovals = await ctx.db
        .query("approvalQueue")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .take(100);

      overdueApprovals = pendingApprovals.filter(a => {
        const deadline = a.slaDeadline ?? now + 86400000;
        return deadline < now;
      }).length;

      approvalStatus = overdueApprovals > 5 ? "warning" : "healthy";
    } catch (error: any) {
      if (error?.message?.includes("backfilling")) {
        approvalStatus = "backfilling";
      } else {
        approvalStatus = "unknown";
      }
    }

    const allHealthy = 
      checks.resendApiKey && 
      checks.openaiApiKey && 
      emailQueueStatus === "healthy" &&
      cronStatus === "healthy" &&
      approvalStatus === "healthy";

    return {
      status: allHealthy ? "healthy" : "degraded",
      checks,
      metrics: {
        emailQueueDepth,
        emailQueueStatus,
        cronStatus,
        lastCronRun,
        overdueApprovals,
        approvalStatus,
      },
      timestamp: Date.now(),
    };
  },
});

export const testResendKey = query({
  args: {},
  handler: async (ctx) => {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      return { success: false, message: "RESEND_API_KEY not configured" };
    }
    // Basic validation - key should start with "re_"
    if (!key.startsWith("re_")) {
      return { success: false, message: "Invalid Resend API key format" };
    }
    return { success: true, message: "Resend API key is configured and format is valid" };
  },
});

export const testPublicBaseUrl = query({
  args: {},
  handler: async (ctx) => {
    const url = process.env.VITE_PUBLIC_BASE_URL;
    if (!url) {
      return { success: false, message: "VITE_PUBLIC_BASE_URL not configured" };
    }
    // Basic URL validation
    try {
      const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
      return { success: true, message: `Public Base URL is configured: ${parsed.href}` };
    } catch {
      return { success: false, message: "Invalid URL format" };
    }
  },
});

export const getStripeConfig = query({
  args: {},
  handler: async (ctx) => {
    return {
      hasPublishableKey: !!process.env.STRIPE_PUBLISHABLE_KEY,
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    };
  },
});

export const systemHealth = query({
  args: {},
  handler: async (ctx) => {
    // Directly call the envStatus logic instead of runQuery
    const checks = {
      resendApiKey: !!process.env.RESEND_API_KEY,
      openaiApiKey: !!process.env.OPENAI_API_KEY,
      convexUrl: !!process.env.CONVEX_URL,
      salesInbox: !!process.env.SALES_INBOX,
      publicSalesInbox: !!process.env.PUBLIC_SALES_INBOX,
      baseUrl: !!process.env.VITE_PUBLIC_BASE_URL,
      devSafeEmails: process.env.DEV_SAFE_EMAILS === "true",
    };

    let emailQueueDepth = 0;
    let emailQueueStatus = "healthy";
    try {
      const pendingEmails = await ctx.db
        .query("emails")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .take(100);
      emailQueueDepth = pendingEmails.length;
      emailQueueStatus = emailQueueDepth > 50 ? "warning" : "healthy";
    } catch (error: any) {
      if (error?.message?.includes("backfilling")) {
        const allEmails = await ctx.db.query("emails").take(100);
        const pendingEmails = allEmails.filter(e => e.status === "pending");
        emailQueueDepth = pendingEmails.length;
        emailQueueStatus = "backfilling";
      } else {
        emailQueueStatus = "error";
      }
    }

    let cronStatus = "healthy";
    let lastCronRun = 0;
    try {
      const recentNotifications = await ctx.db
        .query("notifications")
        .order("desc")
        .take(100);
      
      const cronNotifications = recentNotifications.filter(n => 
        n.type === "system_alert" && 
        n.message?.includes("cron")
      );
      
      if (cronNotifications.length > 0) {
        lastCronRun = cronNotifications[0].createdAt;
        const hoursSinceLastRun = (Date.now() - lastCronRun) / (1000 * 60 * 60);
        cronStatus = hoursSinceLastRun > 2 ? "warning" : "healthy";
      }
    } catch (error: any) {
      if (error?.message?.includes("backfilling")) {
        cronStatus = "backfilling";
      } else {
        cronStatus = "unknown";
      }
    }

    let overdueApprovals = 0;
    let approvalStatus = "healthy";
    try {
      const now = Date.now();
      const pendingApprovals = await ctx.db
        .query("approvalQueue")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .take(100);

      overdueApprovals = pendingApprovals.filter(a => {
        const deadline = a.slaDeadline ?? now + 86400000;
        return deadline < now;
      }).length;

      approvalStatus = overdueApprovals > 5 ? "warning" : "healthy";
    } catch (error: any) {
      if (error?.message?.includes("backfilling")) {
        approvalStatus = "backfilling";
      } else {
        approvalStatus = "unknown";
      }
    }

    const allHealthy = 
      checks.resendApiKey && 
      checks.openaiApiKey && 
      emailQueueStatus === "healthy" &&
      cronStatus === "healthy" &&
      approvalStatus === "healthy";

    return {
      status: allHealthy ? "healthy" : "degraded",
      checks,
      metrics: {
        emailQueueDepth,
        emailQueueStatus,
        cronStatus,
        lastCronRun,
        overdueApprovals,
        approvalStatus,
      },
      timestamp: Date.now(),
    };
  },
});