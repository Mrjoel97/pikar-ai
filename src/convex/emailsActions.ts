"use node";

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";
import { renderHtml, escapeHtml } from "./emails";
import { internal, api } from "./_generated/api";

/* using escapeHtml from ./emails */

/* using renderHtml from ./emails */

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
    )}&businessId=${encodeURIComponent(String(args.businessId))}&email=${encodeURIComponent(args.to)}`;

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

    await ctx.runMutation(internal.emails.updateCampaignStatus, {
      campaignId: campaign._id,
      status: "sending",
      lastError: undefined,
    });

    try {
      const sendIds: string[] = [];
      const recipientsSet = new Set<string>();

      // Expand from list if present
      if ((campaign as any).audienceType === "list" && (campaign as any).audienceListId) {
        const listEmails = await ctx.runQuery((internal as any).contacts.getListRecipientEmails, {
          businessId: campaign.businessId,
          listId: (campaign as any).audienceListId,
        });
        for (const e of listEmails) recipientsSet.add(e.trim().toLowerCase());
      }

      // Include any direct recipients defined
      for (const rawEmail of campaign.recipients ?? []) {
        const email = (rawEmail || "").trim().toLowerCase();
        if (!email) continue;
        recipientsSet.add(email);
      }

      for (const email of recipientsSet) {
        // Honor global unsubscribe
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
        )}&businessId=${encodeURIComponent(String(campaign.businessId))}&email=${encodeURIComponent(email)}`;

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
          // continue sending to others; record failure later via lastError
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
      reply_to: args.email,
    });

    if (error) {
      throw new Error(error.message || "Failed to send inquiry");
    }
    return { ok: true as const };
  },
});