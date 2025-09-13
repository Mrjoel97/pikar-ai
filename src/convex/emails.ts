import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Helper: safe HTML escape for text content
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Basic renderer for blocks to HTML email
function renderHtml(params: {
  subject: string;
  previewText?: string;
  blocks: Array<{
    type: "text" | "button" | "footer";
    content?: string;
    label?: string;
    url?: string;
    includeUnsubscribe?: boolean;
  }>;
  unsubscribeUrl?: string | null;
}) {
  const { subject, previewText, blocks, unsubscribeUrl } = params;
  const parts: Array<string> = [];

  parts.push(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(subject)}</title></head><body style="font-family: Arial, sans-serif; background-color:#f7f7f8; color:#0f172a; margin:0; padding:24px;">`);

  if (previewText) {
    parts.push(`<div style="display:none; max-height:0; overflow:hidden; opacity:0;">${escapeHtml(previewText)}</div>`);
  }

  parts.push(`<div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; padding:24px;">`);

  for (const b of blocks) {
    if (b.type === "text" && b.content) {
      parts.push(`<div style="margin-bottom:16px; line-height:1.6; font-size:14px;">${b.content}</div>`);
    } else if (b.type === "button" && b.label && b.url) {
      parts.push(
        `<div style="margin:20px 0;"><a href="${b.url}" style="display:inline-block; background:#111827; color:#ffffff; text-decoration:none; padding:12px 18px; border-radius:8px; font-weight:600;">${escapeHtml(
          b.label
        )}</a></div>`
      );
    } else if (b.type === "footer") {
      const unsubscribe = b.includeUnsubscribe && unsubscribeUrl
        ? `<div style="font-size:12px; color:#6b7280; margin-top:24px;">If you no longer wish to receive these emails, you can <a href="${unsubscribeUrl}" style="color:#111827; text-decoration:underline;">unsubscribe here</a>.</div>`
        : "";
      parts.push(
        `<hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0;" />${unsubscribe}`
      );
    }
  }

  parts.push(`</div></body></html>`);
  return parts.join("");
}

// Mutation: Create a campaign and schedule send
export const createCampaign = mutation({
  args: {
    businessId: v.id("businesses"),
    createdBy: v.id("users"),
    subject: v.string(),
    from: v.string(),
    previewText: v.optional(v.string()),
    blocks: v.array(
      v.object({
        type: v.union(v.literal("text"), v.literal("button"), v.literal("footer")),
        content: v.optional(v.string()),
        label: v.optional(v.string()),
        url: v.optional(v.string()),
        includeUnsubscribe: v.optional(v.boolean()),
      })
    ),
    recipients: v.array(v.string()),
    timezone: v.string(),
    scheduledAt: v.number(), // UTC ms
  },
  handler: async (ctx, args) => {
    const _id = await ctx.db.insert("emailCampaigns", {
      businessId: args.businessId,
      createdBy: args.createdBy,
      subject: args.subject,
      from: args.from,
      previewText: args.previewText,
      blocks: args.blocks,
      recipients: args.recipients,
      timezone: args.timezone,
      scheduledAt: args.scheduledAt,
      status: "scheduled",
      sendIds: [],
    });

    const delayMs = Math.max(0, args.scheduledAt - Date.now());
    await ctx.scheduler.runAfter(delayMs, internal.emailsActions.sendCampaignInternal, { campaignId: _id });

    return _id;
  },
});

// Helper queries/mutations used by action above
 // Removed legacy internalAction getCampaign; use getCampaignQuery instead

export const getCampaignQuery = internalQuery({
  args: { campaignId: v.id("emailCampaigns") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.campaignId);
  },
});

export const updateCampaignStatus = internalMutation({
  args: {
    campaignId: v.id("emailCampaigns"),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("sending"),
      v.literal("sent"),
      v.literal("failed"),
      v.literal("canceled")
    ),
    lastError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.campaignId, {
      status: args.status,
      lastError: args.lastError,
    });
  },
});

export const appendSendIdsAndComplete = internalMutation({
  args: {
    campaignId: v.id("emailCampaigns"),
    sendIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.campaignId);
    if (!existing) return;
    const merged = [ ...(existing.sendIds ?? []), ...args.sendIds ];
    await ctx.db.patch(args.campaignId, {
      sendIds: merged,
      status: "sent",
    });
  },
});

// Public helpers for unsubscribe/token
export const isUnsubscribedQuery = query({
  args: { businessId: v.id("businesses"), email: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("emailUnsubscribes")
      .withIndex("by_business_and_email", (q) => q.eq("businessId", args.businessId).eq("email", args.email))
      .unique()
      .catch(() => null);
    return !!doc && doc.active === true;
  },
});

export const ensureTokenMutation = internalMutation({
  args: { businessId: v.id("businesses"), email: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("emailUnsubscribes")
      .withIndex("by_business_and_email", (q) => q.eq("businessId", args.businessId).eq("email", args.email))
      .unique()
      .catch(() => null);
    if (existing) return existing.token;

    const token = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2,10)}`;
    await ctx.db.insert("emailUnsubscribes", {
      businessId: args.businessId,
      email: args.email,
      token,
      active: false,
      createdAt: Date.now(),
    });
    return token;
  },
});

// Public query: list recent campaigns for a business (for UI)
export const listCampaigns = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const scheduled = await ctx.db
      .query("emailCampaigns")
      .withIndex("by_business_and_status", (q) =>
        q.eq("businessId", args.businessId).eq("status", "scheduled")
      )
      .collect();

    const sending = await ctx.db
      .query("emailCampaigns")
      .withIndex("by_business_and_status", (q) =>
        q.eq("businessId", args.businessId).eq("status", "sending")
      )
      .collect();

    const sent = await ctx.db
      .query("emailCampaigns")
      .withIndex("by_business_and_status", (q) =>
        q.eq("businessId", args.businessId).eq("status", "sent")
      )
      .collect();

    return [...scheduled, ...sending, ...sent].slice(0, 10);
  },
});

export const listCampaignsByBusiness = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const docs = await ctx.db
      .query("emailCampaigns")
      .withIndex("by_business_and_status", (q) => q.eq("businessId", args.businessId).eq("status", "scheduled"))
      .collect();

    // Also fetch sending/sent to show small list
    const sending = await ctx.db
      .query("emailCampaigns")
      .withIndex("by_business_and_status", (q) => q.eq("businessId", args.businessId).eq("status", "sending"))
      .collect();

    const sent = await ctx.db
      .query("emailCampaigns")
      .withIndex("by_business_and_status", (q) => q.eq("businessId", args.businessId).eq("status", "sent"))
      .collect();

    return [...docs, ...sending, ...sent].slice(0, 10);
  },
});

export const setUnsubscribeActive = internalMutation({
  args: { businessId: v.id("businesses"), email: v.string(), token: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("emailUnsubscribes")
      .withIndex("by_business_and_email", (q) => q.eq("businessId", args.businessId).eq("email", args.email))
      .unique()
      .catch(() => null);

    if (!doc) return { ok: false, reason: "not_found" as const };
    if (doc.token !== args.token) return { ok: false, reason: "token_mismatch" as const };

    await ctx.db.patch(doc._id, { active: true });
    return { ok: true as const };
  },
});