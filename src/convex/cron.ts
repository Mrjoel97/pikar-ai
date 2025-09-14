import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

const crons = cronJobs();

// Email sweep cron
const emailSweep = internalAction({
  args: {},
  handler: async (ctx) => {
    const dueCampaignIds = await ctx.runQuery(internal.emails.listDueScheduledCampaigns, {});
    
    for (const campaignId of dueCampaignIds) {
      await ctx.scheduler.runAfter(0, internal.emailsActions.sendCampaignInternal, { campaignId });
    }
    
    if (dueCampaignIds.length > 0) {
      console.log(`Scheduled ${dueCampaignIds.length} due email campaigns for delivery`);
    }
  },
});

// SLA sweep cron (will be implemented in P2)
const slaSweep = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Get all overdue approvals
    const overdueApprovals = await ctx.runQuery(internal.approvals.listOverdueApprovals, {});
    
    for (const approval of overdueApprovals) {
      // Notify assignee if present
      if (approval.assigneeId) {
        await ctx.runMutation(internal.notifications.sendIfPermitted, {
          userId: approval.assigneeId,
          businessId: approval.businessId,
          type: "sla_overdue",
          title: "Approval Overdue",
          message: `"${approval.title}" is past its SLA deadline`,
          data: { approvalId: approval._id, workflowId: approval.workflowId },
        });
      }

      // Write audit log
      await ctx.runMutation(internal.audit.write, {
        businessId: approval.businessId,
        action: "sla_overdue",
        entityType: "approval",
        entityId: approval._id,
        details: {
          title: approval.title,
          slaDeadline: approval.slaDeadline,
          overdueMs: now - (approval.slaDeadline || now),
        },
      });

      // Escalate priority if not already high
      if (approval.priority !== "high") {
        await ctx.runMutation(internal.approvals.updateApprovalPriority, {
          approvalId: approval._id,
          priority: "high",
        });
      }
    }

    if (overdueApprovals.length > 0) {
      console.log(`Processed ${overdueApprovals.length} overdue approvals`);
    }
  },
});

crons.interval("send scheduled email sweep", { minutes: 1 }, internal.cron.emailSweep, {});
crons.interval("approval SLA sweep", { minutes: 5 }, internal.cron.slaSweep, {});

export default crons;