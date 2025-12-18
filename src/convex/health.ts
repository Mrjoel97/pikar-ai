import { query } from "./_generated/server";
import { v } from "convex/values";

export const envStatus = query({
  args: {},
  handler: async (ctx) => {
    const checks: Array<{ name: string; status: "ok" | "warning" | "error"; message?: string }> = [];

    // Check environment variables
    try {
      const requiredEnvVars = ["JWKS", "JWT_PRIVATE_KEY", "SITE_URL"];
      for (const envVar of requiredEnvVars) {
        const value = process.env[envVar];
        if (!value || value === "undefined") {
          checks.push({
            name: `env.${envVar}`,
            status: "error",
            message: `Missing or undefined`,
          });
        } else {
          checks.push({
            name: `env.${envVar}`,
            status: "ok",
          });
        }
      }
    } catch (e) {
      checks.push({ name: "env", status: "error", message: String(e) });
    }

    // Check email queue depth with graceful fallback for backfilling indexes
    try {
      let pendingCount = 0;
      let usedFallback = false;

      try {
        const pendingEmails = await ctx.db
          .query("emails")
          .withIndex("by_status", (q) => q.eq("status", "pending"))
          .take(200);
        pendingCount = pendingEmails.length;
      } catch (innerError: any) {
        const innerMessage = innerError?.message || "";
        if (
          innerMessage.includes("backfilling") ||
          innerMessage.includes("not available") ||
          innerMessage.includes("Index")
        ) {
          const recentEmails = await ctx.db.query("emails").take(200);
          pendingCount = recentEmails.filter((email) => email.status === "pending").length;
          usedFallback = true;
        } else {
          throw innerError;
        }
      }

      checks.push({
        name: "emailQueue",
        status: pendingCount >= 100 ? "warning" : "ok",
        message: `${pendingCount}${pendingCount >= 100 ? "+" : ""} pending${usedFallback ? " (estimating)" : ""}`,
      });
    } catch (error: any) {
      const errorMsg = error?.message || String(error);

      checks.push({
        name: "emailQueue",
        status: "warning",
        message: errorMsg.includes("backfilling") ? "Initializing..." : "Unavailable",
      });
    }

    // Check cron processing (with backfill handling)
    try {
      const recentCronRuns = await ctx.db
        .query("activityFeed")
        .withIndex("by_type", (q) => q.eq("type", "cron"))
        .order("desc")
        .take(1);
      
      if (recentCronRuns.length === 0) {
        checks.push({
          name: "cronProcessing",
          status: "warning",
          message: "No recent cron runs",
        });
      } else {
        const lastRun = recentCronRuns[0];
        const hoursSinceLastRun = (Date.now() - lastRun._creationTime) / (1000 * 60 * 60);
        if (hoursSinceLastRun > 1) {
          checks.push({
            name: "cronProcessing",
            status: "warning",
            message: `Last run ${Math.round(hoursSinceLastRun)}h ago`,
          });
        } else {
          checks.push({
            name: "cronProcessing",
            status: "ok",
          });
        }
      }
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      if (errorMsg.includes("backfilling") || errorMsg.includes("not available") || errorMsg.includes("Index")) {
        checks.push({
          name: "cronProcessing",
          status: "warning",
          message: "Initializing...",
        });
      } else {
        checks.push({
          name: "cronProcessing",
          status: "warning",
          message: "Unavailable",
        });
      }
    }

    // Check overdue approvals (with backfill handling)
    try {
      const overdueApprovals = await ctx.db
        .query("approvals")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .take(50);
      
      const now = Date.now();
      const overdue = overdueApprovals.filter((a) => {
        const deadline = a.deadline ?? now + 86400000;
        return deadline < now;
      });

      if (overdue.length > 10) {
        checks.push({
          name: "overdueApprovals",
          status: "error",
          message: `${overdue.length} overdue`,
        });
      } else if (overdue.length > 0) {
        checks.push({
          name: "overdueApprovals",
          status: "warning",
          message: `${overdue.length} overdue`,
        });
      } else {
        checks.push({
          name: "overdueApprovals",
          status: "ok",
        });
      }
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      if (errorMsg.includes("backfilling") || errorMsg.includes("not available") || errorMsg.includes("Index")) {
        checks.push({
          name: "overdueApprovals",
          status: "warning",
          message: "Initializing...",
        });
      } else {
        checks.push({
          name: "overdueApprovals",
          status: "warning",
          message: "Unavailable",
        });
      }
    }

    return checks;
  },
});