import { internalMutation, query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

/**
 * Internal writer for audit logs. Use from other mutations:
 * await ctx.runMutation(internal.audit.write, { ... })
 */
export const write = internalMutation({
  args: {
    businessId: v.id("businesses"),
    action: v.string(),
    entityType: v.string(),
    entityId: v.optional(v.string()),
    details: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      action: args.action,
      entityType: args.entityType,
      // Ensure non-optional string
      entityId: args.entityId ?? "",
      details: {
        ...args.details,
        correlationId: args.details?.correlationId,
        businessId: args.businessId,
      },
      createdAt: Date.now(),
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
 * Public mutation: Log a "win" event with time saved, scoped to a business with RBAC
 */
export const logWin = mutation({
  args: {
    businessId: v.id("businesses"),
    winType: v.string(), // e.g., "workflow_created_from_idea", "template_used"
    timeSavedMinutes: v.number(),
    details: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("[ERR_NOT_AUTHENTICATED] You must be signed in.");
    }
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
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

    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      userId: user._id,
      action: "win",
      entityType: "productivity",
      entityId: "",
      details: {
        winType: args.winType,
        timeSavedMinutes: args.timeSavedMinutes,
        ...(args.details ?? {}),
      },
      createdAt: Date.now(),
    });

    return true;
  },
});

/**
 * Guest-safe audit list: returns [] when no businessId (public/guest views),
 * avoiding ArgumentValidationError on pages without tenant context.
 */
export const listForBusiness = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    limit: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    // Guest-safe early return
    if (!args.businessId) {
      return [];
    }

    // Narrow for index usage without adding new imports
    const businessId = args.businessId!;

    const takeLimit =
      Math.max(1, Math.min((args.limit as number | undefined) ?? 50, 200));

    const logs = await ctx.db
      .query("audit_logs")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .order("desc")
      .take(takeLimit);

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
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) {
      throw new Error("[ERR_USER_NOT_FOUND] User not found.");
    }

    const business = await ctx.db.get(args.businessId);
    if (!business) {
      throw new Error("[ERR_BUSINESS_NOT_FOUND] Business not found.");
    }
    if (
      business.ownerId !== user._id &&
      !business.teamMembers.includes(user._id)
    ) {
      throw new Error("[ERR_FORBIDDEN] Not authorized.");
    }

    const pageLimit = Math.max(1, Math.min(args.limit ?? 50, 200));

    // Query by business via index, then filter in memory for the target workflow.
    const logs = await ctx.db
      .query("audit_logs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .take(200);

    const filtered = logs.filter(
      (l) => l.entityType === "workflow" && l.entityId === args.workflowId
    );

    return filtered.slice(0, pageLimit);
  },
});

export const winsSummary = query({
  args: {
    businessId: v.id("businesses"),
    // Optional time window in ms (default: last 30 days)
    windowMs: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("[ERR_NOT_AUTHENTICATED] You must be signed in.");
    }
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
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

    const now = Date.now();
    const windowMs = Math.max(1, args.windowMs ?? 30 * 24 * 60 * 60 * 1000); // 30d
    const since = now - windowMs;

    // Pull recent logs by business and aggregate "win" events
    const take = Math.max(10, Math.min(args.limit ?? 500, 1000));
    const logs = await ctx.db
      .query("audit_logs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .take(take);

    let wins = 0;
    let totalTimeSavedMinutes = 0;
    const recent: Array<{ at: number; winType?: string; timeSavedMinutes?: number }> = [];
    for (const l of logs) {
      if (l.createdAt < since) break;
      if (l.action === "win") {
        wins += 1;
        const ts = Number(l.details?.timeSavedMinutes ?? 0) || 0;
        totalTimeSavedMinutes += ts;
        recent.push({
          at: l.createdAt,
          winType: typeof l.details?.winType === "string" ? l.details.winType : undefined,
          timeSavedMinutes: ts,
        });
      }
    }

    return {
      wins,
      totalTimeSavedMinutes,
      windowMs,
      recent: recent.slice(0, 10),
      generatedAt: now,
    };
  },
});

/**
 * Admin-only: list most recent audit events across all tenants.
 * Guest-safe: returns [] if no admin session or user-based admin authorization fails.
 */
export const listRecent = query({
  args: {
    limit: v.optional(v.number()),
    // Add: optional admin token to support independent Admin Portal sessions
    adminToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // If an adminToken is provided, validate it via the independent Admin Portal
    if (args.adminToken) {
      try {
        const res = await ctx.runQuery(
          api.adminAuthData.validateSession as any,
          { token: args.adminToken }
        );
        if (res?.valid === true) {
          const pageLimit = Math.max(1, Math.min(args.limit ?? 100, 500));
          const logs = await ctx.db
            .query("audit_logs")
            .order("desc")
            .take(pageLimit);
          return logs;
        }
      } catch {
        // fall through to user-based auth checks
      }
    }

    // Fallback: user-based admin authorization; make guest-safe by returning [] instead of throwing
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) {
      // Guest-safe: no admin session and not signed in => return empty list
      return [];
    }
    const email = identity.email.toLowerCase();

    const admin = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    const allowlist = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const isAllowedByEnv = allowlist.includes(email);
    const hasAdminRole = !!admin && admin.role !== "pending_senior";

    if (!hasAdminRole && !isAllowedByEnv) {
      // Guest-safe: signed-in but not an admin => return empty list
      return [];
    }

    const pageLimit = Math.max(1, Math.min(args.limit ?? 100, 500));
    const logs = await ctx.db
      .query("audit_logs")
      .order("desc")
      .take(pageLimit);

    return logs;
  },
});