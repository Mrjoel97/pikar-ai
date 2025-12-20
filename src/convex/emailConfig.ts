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
  invoicePrefix: string | null;
  invoiceNumberStart: number | null;
  invoiceCurrency: string | null;
  invoicePaymentTerms: string | null;
  invoiceNotes: string | null;
  businessLegalName: string | null;
  businessAddress: string | null;
  businessPhone: string | null;
  businessTaxId: string | null;
  businessWebsite: string | null;
  updatedAt: number | null;
};

/**
 * Public: Get a safe summary of the workspace email config for the current user's business.
 * No args required; derives business via currentUserBusiness. Guest-safe (returns null).
 */
export const getForBusinessSummary = query({
  args: {},
  handler: async (ctx): Promise<WorkspaceEmailSummary | null> => {
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
          invoicePrefix: existing.invoicePrefix ?? null,
          invoiceNumberStart: existing.invoiceNumberStart ?? null,
          invoiceCurrency: existing.invoiceCurrency ?? null,
          invoicePaymentTerms: existing.invoicePaymentTerms ?? null,
          invoiceNotes: existing.invoiceNotes ?? null,
          businessLegalName: existing.businessLegalName ?? null,
          businessAddress: existing.businessAddress ?? null,
          businessPhone: existing.businessPhone ?? null,
          businessTaxId: existing.businessTaxId ?? null,
          businessWebsite: existing.businessWebsite ?? null,
          updatedAt: existing.updatedAt ?? null,
        }
      : {
          hasResendKey: false,
          salesInbox: null,
          publicBaseUrl: null,
          fromEmail: null,
          fromName: null,
          replyTo: null,
          invoicePrefix: null,
          invoiceNumberStart: null,
          invoiceCurrency: null,
          invoicePaymentTerms: null,
          invoiceNotes: null,
          businessLegalName: null,
          businessAddress: null,
          businessPhone: null,
          businessTaxId: null,
          businessWebsite: null,
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
    invoicePrefix: v.optional(v.union(v.string(), v.null())),
    invoiceNumberStart: v.optional(v.union(v.number(), v.null())),
    invoiceCurrency: v.optional(v.union(v.string(), v.null())),
    invoicePaymentTerms: v.optional(v.union(v.string(), v.null())),
    invoiceNotes: v.optional(v.union(v.string(), v.null())),
    businessLegalName: v.optional(v.union(v.string(), v.null())),
    businessAddress: v.optional(v.union(v.string(), v.null())),
    businessPhone: v.optional(v.union(v.string(), v.null())),
    businessTaxId: v.optional(v.union(v.string(), v.null())),
    businessWebsite: v.optional(v.union(v.string(), v.null())),
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
    if ("invoicePrefix" in args) patch.invoicePrefix = args.invoicePrefix ?? undefined;
    if ("invoiceNumberStart" in args) patch.invoiceNumberStart = args.invoiceNumberStart ?? undefined;
    if ("invoiceCurrency" in args) patch.invoiceCurrency = args.invoiceCurrency ?? undefined;
    if ("invoicePaymentTerms" in args) patch.invoicePaymentTerms = args.invoicePaymentTerms ?? undefined;
    if ("invoiceNotes" in args) patch.invoiceNotes = args.invoiceNotes ?? undefined;
    if ("businessLegalName" in args) patch.businessLegalName = args.businessLegalName ?? undefined;
    if ("businessAddress" in args) patch.businessAddress = args.businessAddress ?? undefined;
    if ("businessPhone" in args) patch.businessPhone = args.businessPhone ?? undefined;
    if ("businessTaxId" in args) patch.businessTaxId = args.businessTaxId ?? undefined;
    if ("businessWebsite" in args) patch.businessWebsite = args.businessWebsite ?? undefined;

    // Remove undefined keys to prevent accidental clearing via patch
    for (const k of Object.keys(patch)) {
      if (patch[k] === undefined) delete patch[k];
    }

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    } else {
      return await ctx.db.insert("emailConfigs", {
        businessId: args.businessId,
        provider: "resend",
        fromName: patch.fromName || "Default",
        fromEmail: patch.fromEmail || "default@example.com",
        isVerified: false,
        createdAt: now,
        updatedAt: now,
        ...(patch.resendApiKey !== undefined && { resendApiKey: patch.resendApiKey }),
        ...(patch.salesInbox !== undefined && { salesInbox: patch.salesInbox }),
        ...(patch.publicBaseUrl !== undefined && { publicBaseUrl: patch.publicBaseUrl }),
        ...(patch.replyTo !== undefined && { replyTo: patch.replyTo }),
        ...(patch.invoicePrefix !== undefined && { invoicePrefix: patch.invoicePrefix }),
        ...(patch.invoiceNumberStart !== undefined && { invoiceNumberStart: patch.invoiceNumberStart }),
        ...(patch.invoiceCurrency !== undefined && { invoiceCurrency: patch.invoiceCurrency }),
        ...(patch.invoicePaymentTerms !== undefined && { invoicePaymentTerms: patch.invoicePaymentTerms }),
        ...(patch.invoiceNotes !== undefined && { invoiceNotes: patch.invoiceNotes }),
        ...(patch.businessLegalName !== undefined && { businessLegalName: patch.businessLegalName }),
        ...(patch.businessAddress !== undefined && { businessAddress: patch.businessAddress }),
        ...(patch.businessPhone !== undefined && { businessPhone: patch.businessPhone }),
        ...(patch.businessTaxId !== undefined && { businessTaxId: patch.businessTaxId }),
        ...(patch.businessWebsite !== undefined && { businessWebsite: patch.businessWebsite }),
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