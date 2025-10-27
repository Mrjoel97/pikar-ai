import { cronJobs } from "convex/server";
import { api } from "./_generated/api";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Process due scheduled campaigns every 2 minutes
crons.interval(
  "process scheduled campaigns",
  { minutes: 2 },
  "emails:processDueScheduledCampaigns" as any,
  {}
);

// Process scheduled social posts every 5 minutes
crons.interval(
  "process social posts",
  { minutes: 5 },
  "socialPostsCron:processSocialPosts" as any,
  {}
);

// Sweep overdue approvals every 10 minutes
crons.interval("approval SLA sweep", { minutes: 10 }, "approvals:sweepOverdueApprovals" as any, {});

// Generate scheduled compliance reports daily at 2 AM
crons.interval(
  "generate scheduled reports",
  { hours: 24 },
  "complianceReports:generateScheduledReports" as any,
  {}
);

// Collect department KPIs daily at 3 AM (1 hour after compliance reports)
crons.interval(
  "collect department KPIs",
  { hours: 24 },
  "departmentKpis:collectAllBusinessKpis" as any,
  {}
);

// Auto-detect and create crisis alerts every 15 minutes
crons.interval(
  "auto-detect crisis alerts",
  { minutes: 15 },
  "crisisManagement:autoCreateCrisisAlertsForAll" as any,
  {}
);

// Collect enterprise metrics hourly for Global Command Center
crons.interval(
  "collect enterprise metrics",
  { hours: 1 },
  "enterpriseMetrics:collectAllBusinessMetrics" as any,
  {}
);

// Add auto-segmentation job to run daily
crons.interval(
  "auto-segment contacts",
  { hours: 24 },
  "contactsActions:autoSegmentAll" as any,
  {}
);

/* Auto-advance customer journeys daily */
crons.interval(
  "auto-advance-journeys",
  { hours: 24 },
  "customerJourney:autoAdvanceJourneys" as any,
  {}
);

// Add auto-escalation check to existing cron jobs
crons.interval(
  "governance-auto-escalation",
  { hours: 1 }, // Run every hour
  "governanceAutomation:checkAndAutoEscalate" as any,
  {}
);

crons.interval(
  "audit report scheduler",
  { hours: 1 },
  "auditActions:processAuditSchedules" as any,
  {}
);

// Add vendor renewal alerts check (daily)
crons.interval(
  "vendor-renewal-alerts",
  { hours: 24 },
  "vendors:checkRenewalAlerts" as any,
  {}
);

// Data Warehouse: Check for due syncs every hour
crons.interval(
  "data-warehouse-sync-check",
  { hours: 1 },
  "dataWarehouse:checkDueSyncs" as any,
  {}
);

// Security: Threat detection every 15 minutes
crons.interval(
  "security-threat-detection",
  { minutes: 15 },
  "enterpriseSecurity:detectThreats" as any,
  {}
);

// Security: Check certification expiry daily
crons.interval(
  "security-cert-expiry-check",
  { hours: 24 },
  "enterpriseSecurity:checkCertificationExpiry" as any,
  {}
);

// Update portfolio metrics hourly
crons.interval(
  "update-portfolio-metrics",
  { hours: 1 },
  "portfolioManagement:updatePortfolioMetrics" as any,
  {}
);

// Add digest email notifications (daily at 8 AM)
crons.interval(
  "send-digest-emails",
  { hours: 24 },
  "notifications:sendDigestEmails" as any,
  {}
);

// Cleanup old auth refresh tokens every 6 hours to prevent accumulation
crons.interval(
  "cleanup-auth-tokens",
  { hours: 6 },
  internal.authCleanup.cleanupOldTokens,
  { batchSize: 500, olderThanDays: 7 }
);

export default crons;