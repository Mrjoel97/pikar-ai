import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Internal writer for audit logs. Use from other mutations:
 * await ctx.runMutation(internal.audit.write, { ... })
 */
export const write = internalMutation({
  args: {
    businessId: v.id("businesses"),
    type: v.string(),
    message: v.string(),
    actorUserId: v.id("users"),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      type: args.type,
      message: args.message,
      actorUserId: args.actorUserId,
      data: args.data ?? {},
      createdAt: Date.now(),
    } as any);
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

    const limit = Math.max(1, Math.min(args.limit ?? 50, 200));

    const logs = await ctx.db
      .query("audit_logs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .take(limit);

    return logs;
  },
});
