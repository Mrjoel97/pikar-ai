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

// Process due scheduled campaigns every 2 minutes
crons.interval(
  "approval SLA sweep",
  { minutes: 10 },
  internal.approvals.sweepOverdueApprovals,
  {}
);

export default crons;