import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Query: List policies for a business
export const listPolicies = query({
  args: { 
    businessId: v.optional(v.id("businesses")),
    status: v.optional(v.union(v.literal("draft"), v.literal("active"), v.literal("deprecated"))),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) return [];
    
    let query = ctx.db
      .query("policies")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!));
    
    const policies = await query.collect();
    
    if (args.status) {
      return policies.filter(p => p.status === args.status);
    }
    
    return policies;
  },
});

// Query: Get policy by ID with version history
export const getPolicyWithVersions = query({
  args: { policyId: v.id("policies") },
  handler: async (ctx, args) => {
    const policy = await ctx.db.get(args.policyId);
    if (!policy) return null;
    
    const versions = await ctx.db
      .query("policyVersions")
      .withIndex("by_policy", (q) => q.eq("policyId", args.policyId))
      .order("desc")
      .collect();
    
    return { policy, versions };
  },
});

// Query: Get pending policy approvals
export const getPendingApprovals = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    if (!args.businessId) return [];
    
    return await ctx.db
      .query("policyApprovals")
      .withIndex("by_business_and_status", (q) => 
        q.eq("businessId", args.businessId!).eq("status", "pending")
      )
      .collect();
  },
});

// Query: Get policy compliance status
export const getPolicyCompliance = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    if (!args.businessId) return { compliant: 0, nonCompliant: 0, exceptions: 0 };
    
    const policies = await ctx.db
      .query("policies")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    
    const exceptions = await ctx.db
      .query("policyExceptions")
      .withIndex("by_business_and_status", (q) => 
        q.eq("businessId", args.businessId!).eq("status", "active")
      )
      .collect();
    
    let compliant = 0;
    let nonCompliant = 0;
    
    for (const policy of policies) {
      const hasException = exceptions.some(e => e.policyId === policy._id);
      if (hasException) {
        nonCompliant++;
      } else {
        compliant++;
      }
    }
    
    return { compliant, nonCompliant, exceptions: exceptions.length };
  },
});

// Mutation: Create policy
export const createPolicy = mutation({
  args: {
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    content: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    requiresApproval: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("User not found");
    
    const policyId = await ctx.db.insert("policies", {
      businessId: args.businessId,
      title: args.title,
      description: args.description,
      category: args.category,
      content: args.content,
      version: "1.0",
      status: args.requiresApproval ? "draft" : "active",
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
    
    // Create approval request if required
    if (args.requiresApproval) {
      await ctx.db.insert("policyApprovals", {
        businessId: args.businessId,
        policyId,
        requestedBy: user._id,
        status: "pending",
        createdAt: Date.now(),
      });
    }
    
    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      userId: user._id,
      action: "policy_created",
      entityType: "policy",
      entityId: policyId,
      details: { title: args.title, version: "1.0" },
      createdAt: Date.now(),
    });
    
    return policyId;
  },
});

// Mutation: Update policy (creates new version)
export const updatePolicy = mutation({
  args: {
    policyId: v.id("policies"),
    content: v.string(),
    changeNotes: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("User not found");
    
    const policy = await ctx.db.get(args.policyId);
    if (!policy) throw new Error("Policy not found");
    
    // Parse version and increment
    const [major, minor] = policy.version.split(".").map(Number);
    const newVersion = `${major}.${minor + 1}`;
    
    // Update policy
    await ctx.db.patch(args.policyId, {
      content: args.content,
      version: newVersion,
      updatedAt: Date.now(),
    });
    
    // Create version record
    await ctx.db.insert("policyVersions", {
      policyId: args.policyId,
      version: newVersion,
      content: args.content,
      changeNotes: args.changeNotes,
      createdBy: user._id,
      createdAt: Date.now(),
    });
    
    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: policy.businessId,
      userId: user._id,
      action: "policy_updated",
      entityType: "policy",
      entityId: args.policyId,
      details: { version: newVersion, changeNotes: args.changeNotes },
      createdAt: Date.now(),
    });
    
    return newVersion;
  },
});

// Mutation: Approve policy
export const approvePolicy = mutation({
  args: {
    approvalId: v.id("policyApprovals"),
    comments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("User not found");
    
    const approval = await ctx.db.get(args.approvalId);
    if (!approval) throw new Error("Approval not found");
    
    // Update approval
    await ctx.db.patch(args.approvalId, {
      status: "approved",
      approvedBy: user._id,
      approvedAt: Date.now(),
      comments: args.comments,
    });
    
    // Activate policy
    await ctx.db.patch(approval.policyId, {
      status: "active",
      updatedAt: Date.now(),
    });
    
    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: approval.businessId,
      userId: user._id,
      action: "policy_approved",
      entityType: "policy",
      entityId: approval.policyId,
      details: { comments: args.comments },
      createdAt: Date.now(),
    });
    
    return approval.policyId;
  },
});

// Mutation: Reject policy
export const rejectPolicy = mutation({
  args: {
    approvalId: v.id("policyApprovals"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("User not found");
    
    const approval = await ctx.db.get(args.approvalId);
    if (!approval) throw new Error("Approval not found");
    
    // Update approval
    await ctx.db.patch(args.approvalId, {
      status: "rejected",
      approvedBy: user._id,
      approvedAt: Date.now(),
      comments: args.reason,
    });
    
    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: approval.businessId,
      userId: user._id,
      action: "policy_rejected",
      entityType: "policy",
      entityId: approval.policyId,
      details: { reason: args.reason },
      createdAt: Date.now(),
    });
    
    return approval.policyId;
  },
});

// Mutation: Create policy exception
export const createException = mutation({
  args: {
    businessId: v.id("businesses"),
    policyId: v.id("policies"),
    reason: v.string(),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("User not found");
    
    const exceptionId = await ctx.db.insert("policyExceptions", {
      businessId: args.businessId,
      policyId: args.policyId,
      reason: args.reason,
      status: "active",
      createdBy: user._id,
      createdAt: Date.now(),
      expiresAt: args.expiresAt,
    });
    
    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      userId: user._id,
      action: "policy_exception_created",
      entityType: "policy_exception",
      entityId: exceptionId,
      details: { policyId: args.policyId, reason: args.reason },
      createdAt: Date.now(),
    });
    
    return exceptionId;
  },
});

// Query: Get policy exceptions
export const getExceptions = query({
  args: { 
    businessId: v.optional(v.id("businesses")),
    policyId: v.optional(v.id("policies")),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) return [];
    
    let query = ctx.db
      .query("policyExceptions")
      .withIndex("by_business_and_status", (q) => 
        q.eq("businessId", args.businessId!).eq("status", "active")
      );
    
    const exceptions = await query.collect();
    
    if (args.policyId) {
      return exceptions.filter(e => e.policyId === args.policyId);
    }
    
    return exceptions;
  },
});
