import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

/**
 * Authorization: ensure the current user belongs to the business (owner or team member).
 */
async function assertCanManageBusiness(ctx: any, businessId: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.email) throw new Error("Forbidden");

  const email = identity.email.toLowerCase();
  const user = await ctx.db
    .query("users")
    .withIndex("email", (q: any) => q.eq("email", email))
    .unique();
  if (!user?._id) throw new Error("Forbidden");

  const biz = await ctx.db.get(businessId);
  if (!biz) throw new Error("Business not found");

  const isOwner = biz.ownerId === user._id;
  const isMember = Array.isArray(biz.teamMembers) && biz.teamMembers.some((id: any) => id === user._id);
  if (!isOwner && !isMember) throw new Error("Forbidden");

  return { userId: user._id, business: biz };
}

type WorkspaceEmailSummary = {
  hasResendKey: boolean;
  salesInbox: string | null;
  publicBaseUrl: string | null;
  fromEmail: string | null;
  fromName: string | null;
  replyTo: string | null;
  updatedAt: number | null;
};

/**
 * Public: Get a safe summary of the workspace email config for the current user's business.
 * No args required; derives business via currentUserBusiness. Guest-safe (returns null).
 */
export const getForBusinessSummary = query({
  args: {},
  handler: async (ctx): Promise<WorkspaceEmailSummary | null> => {
    // Derive business from the signed-in user; guest-safe (returns null if none)
    const business: any = await ctx.runQuery("businesses:currentUserBusiness" as any, {});
    const businessId: any = business?._id;
    if (!businessId) return null;

    const existing: any = await ctx.db
      .query("emailConfigs")
      .withIndex("by_business", (q: any) => q.eq("businessId", businessId))
      .unique();

    return existing
      ? {
          hasResendKey: !!existing.resendApiKey,
          salesInbox: existing.salesInbox ?? null,
          publicBaseUrl: existing.publicBaseUrl ?? null,
          fromEmail: existing.fromEmail ?? null,
          fromName: existing.fromName ?? null,
          replyTo: existing.replyTo ?? null,
          updatedAt: existing.updatedAt ?? null,
        }
      : {
          hasResendKey: false,
          salesInbox: null,
          publicBaseUrl: null,
          fromEmail: null,
          fromName: null,
          replyTo: null,
          updatedAt: null,
        };
  },
});

/**
 * Public: Save (upsert) workspace email config for a business.
 * Passing null clears a field; omitting a field leaves it unchanged.
 */
export const saveForBusiness = mutation({
  args: {
    businessId: v.id("businesses"),
    resendApiKey: v.optional(v.union(v.string(), v.null())),
    salesInbox: v.optional(v.union(v.string(), v.null())),
    publicBaseUrl: v.optional(v.union(v.string(), v.null())),
    fromEmail: v.optional(v.union(v.string(), v.null())),
    fromName: v.optional(v.union(v.string(), v.null())),
    replyTo: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    await assertCanManageBusiness(ctx, args.businessId);
    const now = Date.now();

    const existing = await ctx.db
      .query("emailConfigs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .unique();

    const patch: Record<string, any> = { updatedAt: now };
    // Apply only provided fields; null explicitly clears; undefined leaves unchanged.
    if ("resendApiKey" in args) patch.resendApiKey = args.resendApiKey ?? undefined;
    if ("salesInbox" in args) patch.salesInbox = args.salesInbox ?? undefined;
    if ("publicBaseUrl" in args) patch.publicBaseUrl = args.publicBaseUrl ?? undefined;
    if ("fromEmail" in args) patch.fromEmail = args.fromEmail ?? undefined;
    if ("fromName" in args) patch.fromName = args.fromName ?? undefined;
    if ("replyTo" in args) patch.replyTo = args.replyTo ?? undefined;

    // Remove undefined keys to prevent accidental clearing via patch
    for (const k of Object.keys(patch)) {
      if (patch[k] === undefined) delete patch[k];
    }

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    } else {
      // Explicitly include updatedAt to satisfy table schema typing
      return await ctx.db.insert("emailConfigs", {
        businessId: args.businessId,
        provider: "resend",
        fromName: patch.fromName || "Default",
        fromEmail: patch.fromEmail || "default@example.com",
        isVerified: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        resendApiKey: patch.resendApiKey,
        salesInbox: patch.salesInbox,
        publicBaseUrl: patch.publicBaseUrl,
        replyTo: patch.replyTo,
      });
    }
  },
});

/**
 * Internal: Fetch full config for a business (includes Resend API key).
 */
export const getByBusiness = internalQuery({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    const cfg = await ctx.db
      .query("emailConfigs")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .unique();
    return cfg || null;
  },
});