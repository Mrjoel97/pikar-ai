import { cronJobs } from "convex/server";

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

export default crons;