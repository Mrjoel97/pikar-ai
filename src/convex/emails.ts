import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderHtml(params: {
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
    type: v.union(v.literal("campaign"), v.literal("transactional"), v.literal("test")),
    subject: v.string(),
    fromEmail: v.string(),
    fromName: v.optional(v.string()),
    replyTo: v.optional(v.string()),
    previewText: v.optional(v.string()),
    htmlContent: v.string(),
    textContent: v.optional(v.string()),
    recipients: v.array(v.string()),
    audienceType: v.optional(v.union(v.literal("direct"), v.literal("list"))),
    audienceListId: v.optional(v.id("contactLists")),
    scheduledAt: v.optional(v.number()),
    buttons: v.optional(v.array(v.object({
      text: v.string(),
      url: v.string(),
      style: v.optional(v.string()),
    }))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const campaignId = await ctx.db.insert("emails", {
      businessId: args.businessId,
      type: args.type,
      subject: args.subject,
      fromEmail: args.fromEmail,
      fromName: args.fromName,
      replyTo: args.replyTo,
      previewText: args.previewText,
      htmlContent: args.htmlContent,
      textContent: args.textContent,
      recipients: args.recipients,
      audienceType: args.audienceType || "direct",
      audienceListId: args.audienceListId,
      scheduledAt: args.scheduledAt,
      status: args.scheduledAt ? "scheduled" : "draft",
      createdBy: user._id,
      createdAt: Date.now(),
      buttons: args.buttons,
    });

    // If scheduled, trigger the send action
    if (args.scheduledAt && args.scheduledAt <= Date.now() + 60000) { // Within 1 minute
      await ctx.scheduler.runAfter(0, internal.emailsActions.sendCampaignInternal, {
        campaignId,
      });
    }

    return campaignId;
  },
});

// Helper queries/mutations used by action above
 // Removed legacy internalAction getCampaign; use getCampaignQuery instead

export const getCampaignQuery = internalQuery({
  args: { campaignId: v.id("emails") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.campaignId);
  },
});

export const updateCampaignStatus = internalMutation({
  args: {
    campaignId: v.id("emails"),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("sending"),
      v.literal("sent"),
      v.literal("failed")
    ),
    lastError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.campaignId, {
      status: args.status,
      lastError: args.lastError,
      sentAt: args.status === "sent" ? Date.now() : undefined,
    });
  },
});

export const getCampaignById = internalQuery({
  args: { campaignId: v.id("emails") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.campaignId);
  },
});

export const appendSendIdsAndComplete = internalMutation({
  args: {
    campaignId: v.id("emails"),
    sendIds: v.array(v.string()),
    status: v.union(v.literal("sent"), v.literal("failed")),
    lastError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) return;

    const existingSendIds = campaign.sendIds || [];
    
    await ctx.db.patch(args.campaignId, {
      sendIds: [...existingSendIds, ...args.sendIds],
      status: args.status,
      lastError: args.lastError,
      sentAt: args.status === "sent" ? Date.now() : undefined,
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
    const rows = await ctx.db
      .query("emails")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .take(50);

    return rows.filter((r) => r.type === "campaign").slice(0, 10);
  },
});

export const listCampaignsByBusiness = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Use the by_business index and then filter in JS (avoid query-builder filter)
    const rows = await ctx.db
      .query("emails")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .take(50);

    return rows.filter((r) => r.type === "campaign").slice(0, 20);
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