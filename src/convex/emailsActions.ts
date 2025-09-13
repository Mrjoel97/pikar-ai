"use node";

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";
import { internal, api } from "./_generated/api";

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

const resend = new Resend(process.env.RESEND_API_KEY || "");

// Action: Send a test email (does not create campaign)
export const sendTestEmail = action({
  args: {
    from: v.string(),
    to: v.string(),
    subject: v.string(),
    previewText: v.optional(v.string()),
    businessId: v.id("businesses"),
    blocks: v.array(
      v.object({
        type: v.union(v.literal("text"), v.literal("button"), v.literal("footer")),
        content: v.optional(v.string()),
        label: v.optional(v.string()),
        url: v.optional(v.string()),
        includeUnsubscribe: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const token = await ctx.runMutation(internal.emails.ensureTokenMutation, {
      businessId: args.businessId,
      email: args.to,
    });

    const unsubscribeUrl = `${process.env.VITE_PUBLIC_BASE_URL || ""}/api/unsubscribe?token=${encodeURIComponent(
      token
    )}&businessId=${encodeURIComponent(args.businessId)}&email=${encodeURIComponent(args.to)}`;

    const html = renderHtml({
      subject: args.subject,
      previewText: args.previewText,
      blocks: args.blocks,
      unsubscribeUrl,
    });

    const { data, error } = await resend.emails.send({
      from: args.from,
      to: [args.to],
      subject: args.subject,
      html,
    });

    if (error) {
      throw new Error(`Test send failed: ${error.message || String(error)}`);
    }
    return { id: data?.id ?? null };
  },
});

// Internal action: Perform campaign send
export const sendCampaignInternal = internalAction({
  args: {
    campaignId: v.id("emailCampaigns"),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.runQuery(internal.emails.getCampaignQuery, { campaignId: args.campaignId });

    if (!campaign) return;
    if (campaign.status !== "scheduled") return;

    // mark sending
    await ctx.runMutation(internal.emails.updateCampaignStatus, {
      campaignId: campaign._id,
      status: "sending",
      lastError: undefined,
    });

    try {
      const sendIds: string[] = [];
      for (const rawEmail of campaign.recipients) {
        const email = rawEmail.trim();
        if (!email) continue;

        const unsub = await ctx.runQuery(api.emails.isUnsubscribedQuery, {
          businessId: campaign.businessId,
          email,
        });
        if (unsub) continue;

        const token = await ctx.runMutation(internal.emails.ensureTokenMutation, {
          businessId: campaign.businessId,
          email,
        });

        const unsubscribeUrl = `${process.env.VITE_PUBLIC_BASE_URL || ""}/api/unsubscribe?token=${encodeURIComponent(
          token
        )}&businessId=${encodeURIComponent(campaign.businessId)}&email=${encodeURIComponent(email)}`;

        const html = renderHtml({
          subject: campaign.subject,
          previewText: campaign.previewText || undefined,
          blocks: campaign.blocks as any,
          unsubscribeUrl,
        });

        const { data, error } = await resend.emails.send({
          from: campaign.from,
          to: [email],
          subject: campaign.subject,
          html,
        });

        if (error) {
          // continue sending to others; record error later
          continue;
        }
        if (data?.id) sendIds.push(data.id);
      }

      await ctx.runMutation(internal.emails.appendSendIdsAndComplete, {
        campaignId: campaign._id,
        sendIds,
      });
    } catch (e: any) {
      await ctx.runMutation(internal.emails.updateCampaignStatus, {
        campaignId: campaign._id,
        status: "failed",
        lastError: e?.message || String(e),
      });
      return;
    }
  },
});

// Add: Public action to send Sales inquiry via Resend
export const sendSalesInquiry = action({
  args: {
    name: v.string(),
    email: v.string(),
    company: v.optional(v.string()),
    plan: v.optional(v.string()),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const inbox = process.env.SALES_INBOX || process.env.PUBLIC_SALES_INBOX || "";
    if (!process.env.RESEND_API_KEY) {
      throw new Error("Email service not configured");
    }
    if (!inbox) {
      throw new Error("Sales inbox not configured");
    }

    const subject = `Sales Inquiry${args.plan ? ` - ${args.plan}` : ""} from ${args.name}`;
    const html = `
      <div style="font-family: Arial, sans-serif; font-size:14px; color:#0f172a;">
        <h2 style="margin:0 0 8px 0;">New Sales Inquiry</h2>
        <p><strong>Name:</strong> ${escapeHtml(args.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(args.email)}</p>
        ${args.company ? `<p><strong>Company:</strong> ${escapeHtml(args.company)}</p>` : ""}
        ${args.plan ? `<p><strong>Plan:</strong> ${escapeHtml(args.plan)}</p>` : ""}
        <p style="margin-top:12px;"><strong>Message:</strong></p>
        <div style="white-space:pre-wrap; line-height:1.6; border:1px solid #e5e7eb; padding:12px; border-radius:8px;">
          ${escapeHtml(args.message)}
        </div>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: inbox, // Resend requires verified from; often same as inbox
      to: [inbox],
      subject,
      html,
      replyTo: args.email,
    });

    if (error) {
      throw new Error(error.message || "Failed to send inquiry");
    }
    return { ok: true as const };
  },
});