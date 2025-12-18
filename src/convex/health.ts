import { query } from "./_generated/server";
import { v } from "convex/values";

export const envStatus = query({
  args: {},
  handler: async (ctx) => {
    const checks: Array<{ name: string; status: "ok" | "warning" | "error"; message?: string }> = [];

    // Check environment variables
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

    // Check email queue depth (with backfill handling)
    try {
      const pendingEmailsQuery = ctx.db
        .query("emails")
        .withIndex("by_status", (q) => q.eq("status", "pending"));
      
      const pendingEmails = await pendingEmailsQuery.take(100);
      
      if (pendingEmails.length >= 100) {
        checks.push({
          name: "emailQueue",
          status: "warning",
          message: `${pendingEmails.length}+ pending emails`,
        });
      } else {
        checks.push({
          name: "emailQueue",
          status: "ok",
          message: `${pendingEmails.length} pending`,
        });
      }
    } catch (error: any) {
      // Handle index backfilling or any query errors gracefully
      const errorMsg = error?.message || String(error);
      if (errorMsg.includes("backfilling")) {
        checks.push({
          name: "emailQueue",
          status: "warning",
          message: "Index backfilling",
        });
      } else {
        checks.push({
          name: "emailQueue",
          status: "warning",
          message: "Temporarily unavailable",
        });
      }
    }

    // Check cron processing (with backfill handling)
    try {
      const recentCronRunsQuery = ctx.db
        .query("activityFeed")
        .withIndex("by_type", (q) => q.eq("type", "cron"))
        .order("desc");
      
      const recentCronRuns = await recentCronRunsQuery.take(1);
      
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
      // Handle index backfilling or any query errors gracefully
      const errorMsg = error?.message || String(error);
      if (errorMsg.includes("backfilling")) {
        checks.push({
          name: "cronProcessing",
          status: "warning",
          message: "Index backfilling",
        });
      } else {
        checks.push({
          name: "cronProcessing",
          status: "warning",
          message: "Temporarily unavailable",
        });
      }
    }

    // Check overdue approvals (with backfill handling)
    try {
      const overdueApprovalsQuery = ctx.db
        .query("approvals")
        .withIndex("by_status", (q) => q.eq("status", "pending"));
      
      const overdueApprovals = await overdueApprovalsQuery.take(50);
      
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
      // Handle index backfilling or any query errors gracefully
      const errorMsg = error?.message || String(error);
      if (errorMsg.includes("backfilling")) {
        checks.push({
          name: "overdueApprovals",
          status: "warning",
          message: "Index backfilling",
        });
      } else {
        checks.push({
          name: "overdueApprovals",
          status: "warning",
          message: "Temporarily unavailable",
        });
      }
    }

    return checks;
  },
});