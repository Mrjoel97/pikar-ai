import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Check for scheduled content capsules every 5 minutes and publish them
 */
crons.interval(
  "publish_scheduled_capsules",
  { minutes: 5 },
  internal.contentCapsules.processScheduledCapsules
);

export default crons;