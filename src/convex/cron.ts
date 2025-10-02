import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Process due scheduled campaigns every 2 minutes
crons.interval(
  "process scheduled campaigns",
  { minutes: 2 },
  internal.emails.processDueScheduledCampaigns,
  {}
);

// Process scheduled social posts every 5 minutes
crons.interval(
  "process social posts",
  { minutes: 5 },
  internal.socialPostsCron.processSocialPosts,
  {}
);

// Add SLA sweep cron
crons.interval("approval SLA sweep", { minutes: 10 }, internal.approvals.sweepOverdueApprovals, {});

// Generate scheduled compliance reports daily
crons.interval(
  "generate scheduled compliance reports",
  { hours: 24 },
  internal.complianceReports.generateScheduledReports,
  {}
);

export default crons;