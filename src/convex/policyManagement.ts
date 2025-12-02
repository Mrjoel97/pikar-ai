import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// POLICY CRUD OPERATIONS
// ============================================================================

export const createPolicy = mutation({
  args: {
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    content: v.string(),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("User not found");

    const policyId = await ctx.db.insert("policies", {
      businessId: args.businessId,
      title: args.title,
      description: args.description,
      category: args.category,
      content: args.content,
      version: "1.0",
      status: "draft",
      severity: args.severity,
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create initial version
    await ctx.db.insert("policyVersions", {
      policyId,
      version: "1.0",
      content: args.content,
      changeNotes: "Initial version",
      createdBy: user._id,
      createdAt: Date.now(),
    });

    return policyId;
  },
});

export const updatePolicy = mutation({
  args: {
    policyId: v.id("policies"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    content: v.optional(v.string()),
    severity: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("critical")
      )
    ),
    changeNotes: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("User not found");

    const policy = await ctx.db.get(args.policyId);
    if (!policy) throw new Error("Policy not found");

    const updates: any = { updatedAt: Date.now() };
    if (args.title) updates.title = args.title;
    if (args.description) updates.description = args.description;
    if (args.category) updates.category = args.category;
    if (args.severity) updates.severity = args.severity;

    // If content changed, create new version
    if (args.content && args.content !== policy.content) {
      const versionParts = policy.version.split(".");
      const newVersion = `${versionParts[0]}.${parseInt(versionParts[1]) + 1}`;
      
      updates.content = args.content;
      updates.version = newVersion;

      await ctx.db.insert("policyVersions", {
        policyId: args.policyId,
        version: newVersion,
        content: args.content,
        changeNotes: args.changeNotes || "Updated policy content",
        createdBy: user._id,
        createdAt: Date.now(),
      });
    }

    await ctx.db.patch(args.policyId, updates);
    return args.policyId;
  },
});

export const deletePolicy = mutation({
  args: { policyId: v.id("policies") },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    await ctx.db.delete(args.policyId);
  },
});

// ============================================================================
// POLICY QUERIES
// ============================================================================

export const getPolicies = query({
  args: {
    businessId: v.id("businesses"),
    status: v.optional(v.union(v.literal("draft"), v.literal("active"), v.literal("deprecated"))),
  },
  handler: async (ctx: any, args) => {
    let query = ctx.db
      .query("policies")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId));

    if (args.status) {
      const policies = await query.collect();
      return policies.filter((p: any) => p.status === args.status);
    }

    return await query.collect();
  },
});

export const getPolicy = query({
  args: { policyId: v.id("policies") },
  handler: async (ctx: any, args) => {
    return await ctx.db.get(args.policyId);
  },
});

export const getPolicyVersions = query({
  args: { policyId: v.id("policies") },
  handler: async (ctx: any, args) => {
    return await ctx.db
      .query("policyVersions")
      .withIndex("by_policy", (q: any) => q.eq("policyId", args.policyId))
      .collect();
  },
});

// ============================================================================
// APPROVAL WORKFLOW
// ============================================================================

export const requestApproval = mutation({
  args: {
    businessId: v.id("businesses"),
    policyId: v.id("policies"),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("User not found");

    const approvalId = await ctx.db.insert("policyApprovals", {
      businessId: args.businessId,
      policyId: args.policyId,
      requestedBy: user._id,
      status: "pending",
      createdAt: Date.now(),
    });

    return approvalId;
  },
});

export const approvePolicy = mutation({
  args: {
    approvalId: v.id("policyApprovals"),
    comments: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("User not found");

    const approval = await ctx.db.get(args.approvalId);
    if (!approval) throw new Error("Approval not found");

    await ctx.db.patch(args.approvalId, {
      status: "approved",
      approvedBy: user._id,
      approvedAt: Date.now(),
      comments: args.comments,
    });

    // Activate the policy
    await ctx.db.patch(approval.policyId, {
      status: "active",
      updatedAt: Date.now(),
    });

    return args.approvalId;
  },
});

export const rejectPolicy = mutation({
  args: {
    approvalId: v.id("policyApprovals"),
    comments: v.string(),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.approvalId, {
      status: "rejected",
      approvedBy: user._id,
      approvedAt: Date.now(),
      comments: args.comments,
    });

    return args.approvalId;
  },
});

export const getPendingApprovals = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx: any, args) => {
    const approvals = await ctx.db
      .query("policyApprovals")
      .withIndex("by_business_and_status", (q: any) =>
        q.eq("businessId", args.businessId).eq("status", "pending")
      )
      .collect();

    const enriched = await Promise.all(
      approvals.map(async (approval: any) => {
        const policy = await ctx.db.get(approval.policyId);
        const requester = await ctx.db.get(approval.requestedBy);
        return {
          ...approval,
          policy,
          requester,
        };
      })
    );

    return enriched;
  },
});

// ============================================================================
// DISTRIBUTION & ACKNOWLEDGMENT
// ============================================================================

export const distributePolicy = mutation({
  args: {
    policyId: v.id("policies"),
    userIds: v.array(v.id("users")),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const policy = await ctx.db.get(args.policyId);
    if (!policy) throw new Error("Policy not found");

    // Create acknowledgment records
    const acknowledgmentIds = await Promise.all(
      args.userIds.map((userId) =>
        ctx.db.insert("policyAcknowledgments", {
          policyId: args.policyId,
          userId,
          status: "pending",
          distributedAt: Date.now(),
          dueDate: args.dueDate,
        })
      )
    );

    // Create notifications
    await Promise.all(
      args.userIds.map((userId) =>
        ctx.db.insert("notifications", {
          businessId: policy.businessId,
          userId,
          type: "system_alert",
          title: "New Policy Requires Acknowledgment",
          message: `Please review and acknowledge: ${policy.title}`,
          data: { policyId: args.policyId },
          isRead: false,
          priority: "high",
          createdAt: Date.now(),
        })
      )
    );

    return acknowledgmentIds;
  },
});

export const acknowledgePolicy = mutation({
  args: {
    acknowledgmentId: v.id("policyAcknowledgments"),
    signature: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    await ctx.db.patch(args.acknowledgmentId, {
      status: "acknowledged",
      acknowledgedAt: Date.now(),
      signature: args.signature,
    });

    return args.acknowledgmentId;
  },
});

export const getPolicyAcknowledgments = query({
  args: { policyId: v.id("policies") },
  handler: async (ctx: any, args) => {
    const acknowledgments = await ctx.db
      .query("policyAcknowledgments")
      .withIndex("by_policy", (q: any) => q.eq("policyId", args.policyId))
      .collect();

    const enriched = await Promise.all(
      acknowledgments.map(async (ack: any) => {
        const user = await ctx.db.get(ack.userId);
        return { ...ack, user };
      })
    );

    return enriched;
  },
});

export const getUserPendingAcknowledgments = query({
  args: { userId: v.id("users") },
  handler: async (ctx: any, args) => {
    const acknowledgments = await ctx.db
      .query("policyAcknowledgments")
      .withIndex("by_user_and_status", (q: any) =>
        q.eq("userId", args.userId).eq("status", "pending")
      )
      .collect();

    const enriched = await Promise.all(
      acknowledgments.map(async (ack: any) => {
        const policy = await ctx.db.get(ack.policyId);
        return { ...ack, policy };
      })
    );

    return enriched;
  },
});

// ============================================================================
// EFFECTIVENESS ANALYTICS
// ============================================================================

export const getPolicyEffectiveness = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx: any, args) => {
    const policies = await ctx.db
      .query("policies")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId))
      .collect();

    const analytics = await Promise.all(
      policies.map(async (policy: any) => {
        const acknowledgments = await ctx.db
          .query("policyAcknowledgments")
          .withIndex("by_policy", (q: any) => q.eq("policyId", policy._id))
          .collect();

        const total = acknowledgments.length;
        const acknowledged = acknowledgments.filter(
          (a: any) => a.status === "acknowledged"
        ).length;
        const overdue = acknowledgments.filter(
          (a: any) => a.status === "pending" && a.dueDate && a.dueDate < Date.now()
        ).length;

        const violations = await ctx.db
          .query("governanceViolations")
          .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId))
          .collect();

        const relatedViolations = violations.filter((v: any) =>
          v.reason.toLowerCase().includes(policy.title.toLowerCase())
        ).length;

        return {
          policyId: policy._id,
          title: policy.title,
          category: policy.category,
          status: policy.status,
          version: policy.version,
          acknowledgmentRate: total > 0 ? (acknowledged / total) * 100 : 0,
          totalDistributed: total,
          acknowledged,
          pending: total - acknowledged,
          overdue,
          relatedViolations,
          effectivenessScore:
            total > 0
              ? Math.round(
                  ((acknowledged / total) * 70 +
                    (relatedViolations === 0 ? 30 : Math.max(0, 30 - relatedViolations * 5))) *
                    10
                ) / 10
              : 0,
        };
      })
    );

    return analytics;
  },
});

export const getPolicyComplianceReport = query({
  args: {
    businessId: v.id("businesses"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx: any, args) => {
    const policies = await ctx.db
      .query("policies")
      .withIndex("by_business_and_status", (q: any) =>
        q.eq("businessId", args.businessId).eq("status", "active")
      )
      .collect();

    const report = {
      totalPolicies: policies.length,
      byCategory: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      acknowledgmentStats: {
        total: 0,
        acknowledged: 0,
        pending: 0,
        overdue: 0,
      },
      topPolicies: [] as any[],
    };

    for (const policy of policies) {
      report.byCategory[policy.category] =
        (report.byCategory[policy.category] || 0) + 1;
      report.bySeverity[policy.severity] =
        (report.bySeverity[policy.severity] || 0) + 1;

      const acknowledgments = await ctx.db
        .query("policyAcknowledgments")
        .withIndex("by_policy", (q: any) => q.eq("policyId", policy._id))
        .collect();

      const filtered = acknowledgments.filter(
        (a: any) =>
          a.distributedAt >= args.startDate && a.distributedAt <= args.endDate
      );

      report.acknowledgmentStats.total += filtered.length;
      report.acknowledgmentStats.acknowledged += filtered.filter(
        (a: any) => a.status === "acknowledged"
      ).length;
      report.acknowledgmentStats.pending += filtered.filter(
        (a: any) => a.status === "pending"
      ).length;
      report.acknowledgmentStats.overdue += filtered.filter(
        (a: any) => a.status === "pending" && a.dueDate && a.dueDate < Date.now()
      ).length;
    }

    return report;
  },
});

export const getPolicyTrends = query({
  args: {
    businessId: v.id("businesses"),
    days: v.number(),
  },
  handler: async (ctx: any, args) => {
    const startDate = Date.now() - args.days * 24 * 60 * 60 * 1000;

    const policies = await ctx.db
      .query("policies")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId))
      .collect();

    const recentPolicies = policies.filter((p: any) => p.createdAt >= startDate);

    const acknowledgments = await ctx.db
      .query("policyAcknowledgments")
      .collect();

    const recentAcknowledgments = acknowledgments.filter(
      (a: any) => a.distributedAt >= startDate
    );

    const dailyData: Record<
      string,
      { date: string; created: number; distributed: number; acknowledged: number }
    > = {};

    for (let i = 0; i < args.days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      dailyData[dateStr] = {
        date: dateStr,
        created: 0,
        distributed: 0,
        acknowledged: 0,
      };
    }

    recentPolicies.forEach((p: any) => {
      const dateStr = new Date(p.createdAt).toISOString().split("T")[0];
      if (dailyData[dateStr]) dailyData[dateStr].created++;
    });

    recentAcknowledgments.forEach((a: any) => {
      const distDateStr = new Date(a.distributedAt).toISOString().split("T")[0];
      if (dailyData[distDateStr]) dailyData[distDateStr].distributed++;

      if (a.acknowledgedAt) {
        const ackDateStr = new Date(a.acknowledgedAt).toISOString().split("T")[0];
        if (dailyData[ackDateStr]) dailyData[ackDateStr].acknowledged++;
      }
    });

    return Object.values(dailyData).reverse();
  },
});