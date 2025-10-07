import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// Query to get approval queue items
export const getApprovalQueue = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    assigneeId: v.optional(v.id("users")),
    status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"))
    ),
  },
  handler: async (ctx, args) => {
    // If there's no business context (public/guest), return an empty list
    if (!args.businessId) {
      return [];
    }

    const businessId = args.businessId as Id<"businesses">;

    let q = ctx.db
      .query("approvalQueue")
      .withIndex("by_business", (iq) => iq.eq("businessId", businessId));

    if (args.status) {
      q = q.filter((qq) => qq.eq(qq.field("status"), args.status));
    }
    if (args.priority) {
      q = q.filter((qq) => qq.eq(qq.field("priority"), args.priority));
    }
    if (args.assigneeId) {
      q = q.filter((qq) => qq.eq(qq.field("assigneeId"), args.assigneeId));
    }

    return await q.order("desc").take(50);
  },
});

// Query to get pending approvals for a user
export const getPendingApprovals = query({
  args: { 
    assigneeId: v.id("users"),
    businessId: v.optional(v.id("businesses")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    let dbQuery = ctx.db
      .query("approvalQueue")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", args.assigneeId))
      .filter((q) => q.eq(q.field("status"), "pending"));

    let approvals = await dbQuery.collect();

    // Filter by business if provided
    if (args.businessId) {
      approvals = approvals.filter(approval => approval.businessId === args.businessId);
    }

    // Sort by SLA deadline (most urgent first)
    approvals.sort((a, b) => {
      if (a.slaDeadline && b.slaDeadline) {
        return a.slaDeadline - b.slaDeadline;
      }
      if (a.slaDeadline && !b.slaDeadline) return -1;
      if (!a.slaDeadline && b.slaDeadline) return 1;
      return a._creationTime - b._creationTime;
    });

    // Apply limit if provided
    if (args.limit) {
      approvals = approvals.slice(0, args.limit);
    }

    return approvals;
  },
});

// Mutation to create an approval request
export const createApproval = mutation({
  args: {
    businessId: v.id("businesses"),
    workflowId: v.id("workflows"),
    workflowRunId: v.id("workflowRuns"),
    stepIndex: v.number(),
    assigneeId: v.optional(v.id("users")),
    assigneeRole: v.optional(v.string()),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("urgent")
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get business tier for SLA calculation
    const business = await ctx.db.get(args.businessId);
    const tier = business?.tier || "startup";
    const slaMs = getSlaMsForTier(tier);
    const slaDeadline = Date.now() + slaMs;

    const approvalId = await ctx.db.insert("approvalQueue", {
      businessId: args.businessId,
      workflowId: args.workflowId,
      workflowRunId: args.workflowRunId,
      stepIndex: args.stepIndex,
      assigneeId: args.assigneeId,
      assigneeRole: args.assigneeRole,
      title: args.title,
      description: args.description || "",
      status: "pending",
      priority: args.priority || "medium",
      slaDeadline,
      createdBy: identity.subject,
    });

    return approvalId;
  },
});

// Mutation to approve or reject an approval request
export const processApproval = mutation({
  args: {
    approvalId: v.id("approvalQueue"),
    action: v.union(v.literal("approve"), v.literal("reject")),
    comments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const approval = await ctx.db.get(args.approvalId);
    if (!approval) {
      throw new Error("Approval request not found");
    }

    // Authorization
    if (approval.assigneeId !== user._id) {
      throw new Error("Not authorized to process this approval");
    }
    if (approval.status !== "pending") {
      throw new Error("Approval request has already been processed");
    }

    const now = Date.now();

    // Only patch schema-supported fields
    await ctx.db.patch(args.approvalId, {
      status: args.action === "approve" ? "approved" : "rejected",
      comments: args.comments,
      reviewedBy: identity.subject,
      reviewedAt: now,
    });

    // Notification for the assignee (or requester); keep type safe
    await ctx.db.insert("notifications", {
      businessId: approval.businessId,
      userId: approval.assigneeId!,
      type: "approval",
      title: `Approval ${args.action === "approve" ? "Approved" : "Rejected"}`,
      message: `Your approval request has been ${args.action}d by ${user.name || user.email}.`,
      data: {
        approvalId: args.approvalId,
        workflowId: approval.workflowId,
        stepIndex: approval.stepIndex,
        action: args.action,
        comments: args.comments,
      },
      isRead: false,
      priority: args.action === "reject" ? "high" : "medium",
      createdAt: now,
      expiresAt: now + 7 * 24 * 60 * 60 * 1000,
    });

    // Telemetry
    await ctx.db.insert("telemetryEvents", {
      businessId: approval.businessId,
      userId: user._id,
      eventName: `approval_${args.action}d`,
      eventData: {
        approvalId: args.approvalId,
        workflowId: approval.workflowId,
        stepIndex: approval.stepIndex,
        processingTime: now - approval._creationTime,
        comments: args.comments,
      },
      timestamp: now,
      source: "system",
    });

    return args.approvalId;
  },
});

// Query to get approval analytics
export const getApprovalAnalytics = query({
  args: { 
    businessId: v.id("businesses"),
    timeRange: v.optional(v.number()), // days
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const timeRange = args.timeRange || 30; // Default 30 days
    const startTime = Date.now() - (timeRange * 24 * 60 * 60 * 1000);

    const approvals = await ctx.db
      .query("approvalQueue")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gt(q.field("_creationTime"), startTime))
      .collect();

    const totalApprovals = approvals.length;
    const pendingApprovals = approvals.filter(a => a.status === "pending").length;
    const approvedApprovals = approvals.filter(a => a.status === "approved").length;
    const rejectedApprovals = approvals.filter(a => a.status === "rejected").length;

    // Calculate SLA compliance
    const processedApprovals = approvals.filter(a => a.status !== "pending");
    const slaBreaches = processedApprovals.filter(a => {
      if (!a.slaDeadline) return false;
      const processedAt = Date.now();
      return processedAt > a.slaDeadline;
    }).length;

    // Calculate average processing time
    const avgProcessingTime = processedApprovals.length > 0
      ? processedApprovals.reduce((sum, a) => {
          const processedAt = Date.now();
          return sum + (processedAt - a._creationTime);
        }, 0) / processedApprovals.length
      : 0;

    // Group by priority
    const priorityStats = {
      urgent: approvals.filter(a => a.priority === "urgent").length,
      high: approvals.filter(a => a.priority === "high").length,
      medium: approvals.filter(a => a.priority === "medium").length,
      low: approvals.filter(a => a.priority === "low").length,
    };

    // Group by assignee
    const assigneeStats: Record<string, { pending: number; approved: number; rejected: number }> = {};
    approvals.forEach(approval => {
      // Use string key to satisfy TS index type
      const key = String(approval.assigneeId);
      if (!assigneeStats[key]) {
        assigneeStats[key] = { pending: 0, approved: 0, rejected: 0 };
      }
      if (approval.status === "pending") assigneeStats[key].pending++;
      else if (approval.status === "approved") assigneeStats[key].approved++;
      else if (approval.status === "rejected") assigneeStats[key].rejected++;
    });

    return {
      totalApprovals,
      pendingApprovals,
      approvedApprovals,
      rejectedApprovals,
      approvalRate: totalApprovals > 0 ? (approvedApprovals / totalApprovals) * 100 : 0,
      rejectionRate: totalApprovals > 0 ? (rejectedApprovals / totalApprovals) * 100 : 0,
      slaBreaches,
      slaComplianceRate: processedApprovals.length > 0 ? ((processedApprovals.length - slaBreaches) / processedApprovals.length) * 100 : 100,
      avgProcessingTimeHours: avgProcessingTime / (1000 * 60 * 60),
      priorityStats,
      assigneeStats,
      timeRange,
    };
  },
});

// Query to get overdue approvals
export const getOverdueApprovals = query({
  args: { 
    businessId: v.id("businesses"),
    assigneeId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    // Rename to avoid shadowing the imported `query`
    let dbQuery = ctx.db
      .query("approvalQueue")
      .withIndex("by_sla_deadline", (q) => q.lt("slaDeadline", now))
      .filter((q) => q.eq(q.field("status"), "pending"));

    let approvals = await dbQuery.collect();

    // Filter by business
    approvals = approvals.filter(approval => approval.businessId === args.businessId);

    // Filter by assignee if provided
    if (args.assigneeId) {
      approvals = approvals.filter(approval => approval.assigneeId === args.assigneeId);
    }

    return approvals.sort((a, b) => (a.slaDeadline || 0) - (b.slaDeadline || 0));
  },
});

// Scheduled function to send SLA breach notifications
export const checkApprovalSLABreaches = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const warningThreshold = now + (2 * 60 * 60 * 1000); // 2 hours from now

    // Get approvals that are approaching SLA deadline
    const upcomingBreaches = await ctx.db
      .query("approvalQueue")
      .withIndex("by_sla_deadline", (q) => q.lt("slaDeadline", warningThreshold))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const approvalsNeedingWarning = upcomingBreaches.filter(approval => 
      approval.slaDeadline && approval.slaDeadline > now
    );

    for (const approval of approvalsNeedingWarning) {
      // Check if we already sent a warning for this approval
      const userWarnings = await ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("userId", approval.assigneeId!))
        .filter((q) => q.eq(q.field("type"), "sla_warning"))
        .collect();

      const existingWarning = userWarnings.find(n => (n as any).data?.approvalId === approval._id);

      if (!existingWarning) {
        await ctx.db.insert("notifications", {
          businessId: approval.businessId,
          userId: approval.assigneeId!,
          type: "sla_warning",
          title: "Approval SLA Warning",
          message: `Approval request is approaching SLA deadline in less than 2 hours.`,
          data: {
            approvalId: approval._id,
            workflowId: approval.workflowId,
            // Fix: use stepIndex to match stored field
            stepIndex: approval.stepIndex,
            slaDeadline: approval.slaDeadline,
          },
          isRead: false,
          priority: "high",
          createdAt: now,
          expiresAt: now + (7 * 24 * 60 * 60 * 1000),
        });
      }
    }

    return approvalsNeedingWarning.length;
  },
});

// Add: Lightweight pending approvals query
export const pendingByUser = query({
  args: {
    userId: v.id("users"),
    businessId: v.optional(v.id("businesses")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5;
    // Use index by_assignee to fetch requests assigned to user
    const q = ctx.db
      .query("approvalQueue")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", args.userId));

    const rows: Array<any> = [];
    for await (const row of q) {
      if (row.status !== "pending") continue;
      if (args.businessId && row.businessId !== args.businessId) continue;
      rows.push(row);
      if (rows.length >= limit) break;
    }
    return rows;
  },
});

// Add: Approve action
export const approve = mutation({
  args: {
    id: v.id("approvalQueue"),
    approvedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    await ctx.db.patch(args.id, {
      status: "approved",
      reviewedBy: identity.subject,
      reviewedAt: Date.now(),
    });
    return true;
  },
});

// Add: Reject action
export const reject = mutation({
  args: {
    id: v.id("approvalQueue"),
    rejectedBy: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    await ctx.db.patch(args.id, {
      status: "rejected",
      comments: args.reason,
      reviewedBy: identity.subject,
      reviewedAt: Date.now(),
    });
    return true;
  },
});

// Add: Self-service approve mutation deriving user from identity
export const approveSelf = mutation({
  args: {
    id: v.id("approvalQueue"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) {
      throw new Error("User not found");
    }
    await ctx.db.patch(args.id, {
      status: "approved",
      reviewedBy: identity.subject,
      reviewedAt: Date.now(),
    });
    return true;
  },
});

// Add: Self-service reject mutation deriving user from identity
export const rejectSelf = mutation({
  args: {
    id: v.id("approvalQueue"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) {
      throw new Error("User not found");
    }
    await ctx.db.patch(args.id, {
      status: "rejected",
      comments: args.reason,
      reviewedBy: identity.subject,
      reviewedAt: Date.now(),
    });
    return true;
  },
});

export const pendingForBusiness = query({
  args: {
    businessId: v.id("businesses"),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    // Return the most recent pending approvals for a business (max: args.limit)
    const rows = await ctx.db
      .query("approvalQueue")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .order("desc")
      .take(Math.max(1, Math.min(50, args.limit)));

    return rows;
  },
});

// Add: SLA summary for dashboards (overdue and due soon within 2h)
export const getSlaSummary = query({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    // Guest-safe default if no tenant context is available
    if (!args.businessId) {
      return { overdue: 0, dueSoon: 0 };
    }

    // Narrow type for index usage after guard above
    const businessId: Id<"businesses"> = args.businessId;

    const now = Date.now();
    // Query approvals for this business and compute SLA counts
    const approvals = await ctx.db
      .query("approvalQueue")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .take(500);

    let overdue = 0;
    let dueSoon = 0;

    for (const a of approvals) {
      const deadline = (a as any).slaDeadline as number | undefined;
      if (typeof deadline === "number") {
        if (deadline < now) {
          overdue++;
        } else if (deadline - now <= 24 * 60 * 60 * 1000) {
          dueSoon++;
        }
      }
    }

    return { overdue, dueSoon };
  },
});

// Add helper function
const getSlaMsForTier = (tier: string): number => {
  switch (tier) {
    case "enterprise":
      return 12 * 60 * 60 * 1000; // 12 hours
    case "sme":
      return 24 * 60 * 60 * 1000; // 24 hours
    case "startup":
      return 48 * 60 * 60 * 1000; // 48 hours
    case "solopreneur":
      return 72 * 60 * 60 * 1000; // 72 hours
    default:
      return 48 * 60 * 60 * 1000; // Default 48 hours
  }
};

export const listOverdueApprovals = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const approvals = await ctx.db
      .query("approvalQueue")
      .withIndex("by_sla_deadline")
      .collect();
    
    return approvals.filter(a => 
      a.status === "pending" && 
      a.slaDeadline && 
      a.slaDeadline < now
    );
  },
});

export const updateApprovalPriority = internalMutation({
  args: {
    approvalId: v.id("approvalQueue"),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
  },
  handler: async (ctx, { approvalId, priority }) => {
    await ctx.db.patch(approvalId, { priority });
  },
});

// Add: sweep overdue approvals, notify and audit
export const sweepOverdueApprovals = internalMutation({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const limit = args.limit || 50;
    
    const overdueApprovals = await ctx.db
      .query("approvalQueue")
      .withIndex("by_sla_deadline", (q) => q.lt("slaDeadline", now))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .take(limit);
    
    let notifiedCount = 0;
    
    for (const approval of overdueApprovals) {
      // Notify assignee
      if (approval.assigneeId) {
        const result = await (ctx as any).runMutation("notifications:sendIfPermitted" as any, {
          userId: approval.assigneeId,
          businessId: approval.businessId,
          type: "sla_warning",
          title: "Overdue Approval",
          message: `Approval for workflow step is overdue`,
          link: `/workflows/${approval.workflowId}`,
          priority: "urgent",
        });
        
        if (result.sent) {
          notifiedCount++;
        }
      }
      
      // Audit overdue item
      await (ctx as any).runMutation("audit:write" as any, {
        businessId: approval.businessId,
        action: "approval_overdue",
        entityType: "approval",
        entityId: approval._id as any, // keep as any to match string-typed entityId
        details: {
          workflowId: approval.workflowId,
          assigneeId: approval.assigneeId,
          overdueBy: approval.slaDeadline ? now - approval.slaDeadline : 0, // handle possibly undefined
          businessId: approval.businessId,
        },
      });
    }
    
    return { overdueCount: overdueApprovals.length, notifiedCount };
  },
});