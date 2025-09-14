import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

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
    subject: v.string(),
    body: v.string(),
    fromName: v.optional(v.string()),
    fromEmail: v.optional(v.string()),
    audienceType: v.union(v.literal("direct"), v.literal("list")),
    recipients: v.optional(v.array(v.string())),
    audienceListId: v.optional(v.id("contactLists")),
    buttons: v.optional(v.array(v.object({
      text: v.string(),
      url: v.string(),
    }))),
    scheduledAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Basic size guard for direct recipients
    let recipients = args.recipients;
    if (args.audienceType === "direct" && recipients && recipients.length > 5000) {
      recipients = recipients.slice(0, 5000);
      console.warn("Recipients list capped to 5000 for direct campaign");
    }

    // Add entitlement guard for per-campaign recipients
    if (args.audienceType === "direct" && recipients && recipients.length > 0) {
      const gate = await ctx.runQuery(internal.entitlements.checkEntitlement, {
        businessId: args.businessId,
        action: "emails.createCampaign",
        context: { recipientsCount: recipients.length },
      });
      if (!gate.allowed) {
        await ctx.runMutation(internal.audit.write, {
          businessId: args.businessId,
          action: "entitlement_block",
          entityType: "email_campaign",
          entityId: "new",
          details: {
            reason: gate.reason,
            recipientsCount: recipients.length,
            tier: gate.tier,
            limit: gate.limit,
          },
        });
        throw new Error(gate.reason || "Action not permitted by your plan");
      }
    }

    const campaignId = await ctx.db.insert("emails", {
      businessId: args.businessId,
      type: "campaign",
      subject: args.subject,
      body: args.body,
      fromName: args.fromName || "Pikar AI",
      fromEmail: args.fromEmail || "noreply@resend.dev",
      audienceType: args.audienceType,
      recipients,
      audienceListId: args.audienceListId,
      buttons: args.buttons,
      scheduledAt: args.scheduledAt || Date.now(),
      status: args.scheduledAt && args.scheduledAt > Date.now() + 60000 ? "scheduled" : "queued",
      sendIds: [],
      createdAt: Date.now(),
    });

    if (!args.scheduledAt || args.scheduledAt <= Date.now() + 60000) {
      await ctx.scheduler.runAfter(0, internal.emailsActions.sendCampaignInternal, { campaignId });
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
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const unsubscribe = await ctx.db
      .query("emailUnsubscribes")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();

    if (!unsubscribe) {
      throw new Error("Invalid unsubscribe token");
    }

    await ctx.db.patch(unsubscribe._id, { active: true });

    // Sync contact status to unsubscribed if contact exists
    const contact = await ctx.db
      .query("contacts")
      .withIndex("by_business_and_email", (q) => 
        q.eq("businessId", unsubscribe.businessId).eq("email", unsubscribe.email))
      .first();

    if (contact && contact.status !== "unsubscribed") {
      await ctx.db.patch(contact._id, { status: "unsubscribed" });
    }

    // Write audit log for unsubscribe
    const details = {
      email: unsubscribe.email,
      token: unsubscribe.token,
      contactId: contact ? String(contact._id) : null,
    };
    await ctx.runMutation(internal.audit.write, {
      businessId: unsubscribe.businessId,
      action: "email_unsubscribe",
      entityType: contact ? "contact" : "email",
      entityId: contact ? String(contact._id) : unsubscribe.email,
      details,
    });

    return { success: true };
  },
});

export const listDueScheduledCampaigns = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const due: Array<Id<"emails">> = [];

    const query = ctx.db
      .query("emails")
      .withIndex("by_status", (q) => q.eq("status", "scheduled"))
      .order("asc");

    for await (const c of query) {
      if (!c.scheduledAt || c.scheduledAt > now) continue;
      due.push(c._id);
      if (due.length >= 50) break; // Cap to prevent overload
    }

    return due;
  },
});

export const reserveDueScheduledCampaigns = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const reservedIds: Array<Id<"emails">> = [];

    // Fetch scheduled campaigns using the status index, then filter by scheduledAt
    const query = ctx.db
      .query("emails")
      .withIndex("by_status", (q) => q.eq("status", "scheduled"))
      .order("asc");

    for await (const c of query) {
      if (!c.scheduledAt || c.scheduledAt > now) continue;
      // Reserve by transitioning to "queued" to avoid duplicate pickup
      await ctx.db.patch(c._id, { status: "queued" });
      reservedIds.push(c._id);

      if (reservedIds.length >= 50) break; // Cap to avoid long transactions
    }

    return reservedIds;
  },
});