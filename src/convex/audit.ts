import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Internal writer for audit logs. Use from other mutations:
 * await ctx.runMutation(internal.audit.write, { ... })
 */
export const write = internalMutation({
  args: {
    businessId: v.id("businesses"),

    // Legacy caller shape (e.g., businesses.ts)
    type: v.optional(v.string()),
    message: v.optional(v.string()),
    actorUserId: v.optional(v.id("users")),
    data: v.optional(v.any()),

    // Newer, structured shape
    action: v.optional(v.string()),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    details: v.optional(v.any()),
    // Add: optional correlation id (stored inside details for flexibility)
    correlationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = args.userId ?? args.actorUserId;
    if (!userId) {
      throw new Error("[ERR_USER_REQUIRED] Either userId or actorUserId must be provided.");
    }

    const action = args.action ?? args.type ?? "log";
    const entityType = args.entityType ?? "business";
    const entityId = args.entityId ?? String(args.businessId);

    // Prefer structured details; fall back to legacy data or message
    const details =
      args.details ??
      args.data ??
      (args.message ? { message: args.message } : {});

    const mergedDetails = args.correlationId ? { ...details, correlationId: args.correlationId } : details;

    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      userId,
      action,
      entityType,
      entityId,
      details: mergedDetails,
      createdAt: Date.now(),
      // ipAddress and userAgent can be appended by callers if available
    });
  },
});

// Add a convenience helper specifically for governance-related workflow events
export const logGovernanceEvent = internalMutation({
  args: {
    businessId: v.id("businesses"),
    workflowId: v.string(), // store as string in entityId
    userId: v.id("users"),
    action: v.string(), // e.g. "governance_violation_blocked", "governance_passed"
    details: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      userId: args.userId,
      action: args.action,
      entityType: "workflow",
      entityId: args.workflowId,
      details: args.details ?? {},
      createdAt: Date.now(),
    });
  },
});

/**
 * Read audit logs for a business with RBAC check.
 */
export const listForBusiness = query({
  args: {
    businessId: v.id("businesses"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("[ERR_NOT_AUTHENTICATED] You must be signed in.");
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) {
      throw new Error("[ERR_USER_NOT_FOUND] User not found.");
    }

    const business = await ctx.db.get(args.businessId);
    if (!business) {
      throw new Error("[ERR_BUSINESS_NOT_FOUND] Business not found.");
    }
    if (business.ownerId !== user._id && !business.teamMembers.includes(user._id)) {
      throw new Error("[ERR_FORBIDDEN] Not authorized.");
    }

    const limit = Math.max(1, Math.min(args.limit ?? 50, 200));

    const logs = await ctx.db
      .query("audit_logs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .take(limit);

    return logs;
  },
});

/**
 * Read audit logs for a specific workflow (entityType="workflow") under a business with RBAC check.
 */
export const listForWorkflow = query({
  args: {
    businessId: v.id("businesses"),
    workflowId: v.string(), // stored in audit_logs.entityId
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("[ERR_NOT_AUTHENTICATED] You must be signed in.");
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) {
      throw new Error("[ERR_USER_NOT_FOUND] User not found.");
    }

    const business = await ctx.db.get(args.businessId);
    if (!business) {
      throw new Error("[ERR_BUSINESS_NOT_FOUND] Business not found.");
    }
    if (business.ownerId !== user._id && !business.teamMembers.includes(user._id)) {
      throw new Error("[ERR_FORBIDDEN] Not authorized.");
    }

    const limit = Math.max(1, Math.min(args.limit ?? 50, 200));

    // Query by business via index, then filter in memory for the target workflow.
    const logs = await ctx.db
      .query("audit_logs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .take(200);

    const filtered = logs.filter(
      (l) => l.entityType === "workflow" && l.entityId === args.workflowId
    );

    return filtered.slice(0, limit);
  },
});