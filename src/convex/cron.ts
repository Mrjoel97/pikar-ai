import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

const crons = cronJobs();

// Email sweep cron
export const emailSweep = internalAction({
  args: {},
  handler: async (ctx) => {
    // Atomically reserve due campaigns to avoid duplicate sends from overlapping sweeps
    const dueCampaignIds = await ctx.runMutation(
      internal.emails.reserveDueScheduledCampaigns,
      {}
    );
    
    for (const campaignId of dueCampaignIds) {
      await ctx.scheduler.runAfter(0, internal.emailsActions.sendCampaignInternal, { campaignId });
    }
    
    if (dueCampaignIds.length > 0) {
      console.log(`Scheduled ${dueCampaignIds.length} due email campaigns for delivery`);
    }
  },
});

// SLA sweep cron (will be implemented in P2)
export const slaSweep = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Get all overdue approvals (optional ref to avoid compile errors if not defined)
    const listRef = (internal as any).approvals?.listOverdueApprovals;
    const overdueApprovals = listRef ? await ctx.runQuery(listRef, {}) : [];
    
    for (const approval of overdueApprovals) {
      // Notify assignee if present (use optional function ref to avoid compile issues if not defined)
      if (approval.assigneeId) {
        const sendRef = (internal as any).notifications?.sendIfPermitted;
        if (sendRef) {
          await ctx.runMutation(sendRef, {
            userId: approval.assigneeId,
            businessId: approval.businessId,
            type: "sla_overdue",
            title: "Approval Overdue",
            message: `"${approval.title}" is past its SLA deadline`,
            data: { approvalId: approval._id, workflowId: approval.workflowId },
          });
        }
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

      // Escalate priority if not already high (optional ref)
      if (approval.priority !== "high") {
        const updatePriorityRef = (internal as any).approvals?.updateApprovalPriority;
        if (updatePriorityRef) {
          await ctx.runMutation(updatePriorityRef, {
            approvalId: approval._id,
            priority: "high",
          });
        }
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