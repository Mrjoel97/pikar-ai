"use node";

import { Resend } from "resend";
import { internalAction, action } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { renderHtml, escapeHtml } from "./emails";
import { v } from "convex/values";

// Config constants
const EMAILS_BATCH_SIZE = parseInt(process.env.EMAILS_BATCH_SIZE || "100");
const EMAILS_BATCH_DELAY_MS = parseInt(process.env.EMAILS_BATCH_DELAY_MS || "500");
const EMAILS_MAX_RECIPIENTS_PER_JOB = parseInt(process.env.EMAILS_MAX_RECIPIENTS_PER_JOB || "5000");

/**
 * Resend client is instantiated per handler to avoid stale API keys.
 * This ensures email delivery works immediately after saving RESEND_API_KEY.
 */

// Action: Send a test email (does not create campaign)
export const sendTestEmail = action({
  args: {
    businessId: v.id("businesses"),
    to: v.string(),
    subject: v.string(),
    fromEmail: v.string(),
    fromName: v.optional(v.string()),
    replyTo: v.optional(v.string()),
    previewText: v.optional(v.string()),
    htmlContent: v.string(),
    buttons: v.optional(
      v.array(
        v.object({
          text: v.string(),
          url: v.string(),
          style: v.optional(v.string()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const DEV_SAFE = process.env.DEV_SAFE_EMAILS === "true";

    // Safe stub if not configured and DEV_SAFE_EMAILS enabled
    if (!process.env.RESEND_API_KEY) {
      if (DEV_SAFE) {
        console.warn("[EMAIL][STUB] RESEND_API_KEY missing. Stubbing test email send.", {
          to: args.to,
          subject: args.subject,
        });

        // Still record unsubscribe token for link generation parity
        await ctx.runMutation(internal.emails.ensureTokenMutation, {
          businessId: args.businessId,
          email: args.to,
        });

        return { id: `stub_${Date.now()}` };
      }
      throw new Error("RESEND_API_KEY not configured");
    }

    // Instantiate Resend per-call to pick up latest key
    const resend = new Resend(process.env.RESEND_API_KEY!);

    // Generate (or reuse) unsubscribe token for recipient
    const token = await ctx.runMutation(internal.emails.ensureTokenMutation, {
      businessId: args.businessId,
      email: args.to,
    });

    const unsubscribeUrl = `${process.env.VITE_PUBLIC_BASE_URL || ""}/api/unsubscribe?token=${encodeURIComponent(
      token
    )}&businessId=${encodeURIComponent(String(args.businessId))}&email=${encodeURIComponent(args.to)}`;

    // Build blocks from provided content and buttons
    const blocks: Array<{
      type: "text" | "button" | "footer";
      content?: string;
      label?: string;
      url?: string;
      includeUnsubscribe?: boolean;
    }> = [
      { type: "text", content: args.htmlContent },
      ...(args.buttons || []).map((b) => ({
        type: "button" as const,
        label: b.text,
        url: b.url,
      })),
      { type: "footer", includeUnsubscribe: true },
    ];

    const html = renderHtml({
      subject: args.subject,
      previewText: args.previewText,
      blocks,
      unsubscribeUrl,
    });

    const { data, error } = await resend.emails.send({
      from: args.fromName ? `${args.fromName} <${args.fromEmail}>` : args.fromEmail,
      to: [args.to],
      subject: args.subject,
      html,
      reply_to: args.replyTo,
    });

    if (error) {
      throw new Error(`Test send failed: ${error.message || String(error)}`);
    }
    return { id: data?.id ?? null };
  },
});

// Internal action: Perform campaign send
export const sendCampaignInternal = internalAction({
  args: { campaignId: v.id("emails") },
  handler: async (ctx, { campaignId }) => {
    const RESEND_KEY = process.env.RESEND_API_KEY;
    const DEV_SAFE = process.env.DEV_SAFE_EMAILS === "true";

    const campaign = await ctx.runQuery(internal.emails.getCampaignById, { campaignId });
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    if (campaign.status !== "scheduled" && campaign.status !== "queued") {
      return;
    }

    if (!RESEND_KEY && DEV_SAFE) {
      console.warn("[EMAIL][STUB] RESEND_API_KEY missing. Stubbing campaign send.", {
        campaignId: String(campaignId),
        subject: campaign.subject,
      });

      let recipients: string[] = [];
      if (campaign.audienceType === "direct") {
        recipients = campaign.recipients || [];
      } else if (campaign.audienceType === "list" && campaign.audienceListId) {
        const getListRecipientsRef =
          (internal as any).contacts?.getListRecipientEmails ||
          (api as any).contacts?.getListRecipientEmails;
        recipients = getListRecipientsRef
          ? await ctx.runQuery(getListRecipientsRef, { listId: campaign.audienceListId })
          : [];
      }

      // Entitlements guard even in stub mode
      const entStub = await ctx.runQuery(internal.entitlements.checkEntitlement, {
        businessId: campaign.businessId,
        action: "emails.sendCampaign",
        context: { recipientsCount: recipients.length },
      });
      if (!entStub.allowed) {
        await ctx.runMutation(internal.emails.updateCampaignStatus, {
          campaignId,
          status: "failed",
          lastError: entStub.reason,
        });
        await ctx.runMutation(internal.audit.write, {
          businessId: campaign.businessId,
          action: "entitlement_block",
          entityType: "email_campaign",
          entityId: String(campaignId),
          details: {
            reason: entStub.reason,
            recipientsCount: recipients.length,
            tier: entStub.tier,
            limit: entStub.limit,
          },
        });
        return;
      }

      const sendIds = recipients.slice(0, 1000).map((_, idx) => `stub_${Date.now()}_${idx}`);

      await ctx.runMutation(internal.emails.updateCampaignStatus, {
        campaignId,
        status: "sending",
      });

      await ctx.runMutation(internal.emails.appendSendIdsAndComplete, {
        campaignId,
        sendIds,
        status: "sent",
      });

      return;
    }

    if (!RESEND_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }
    const resend = new Resend(RESEND_KEY);

    await ctx.runMutation(internal.emails.updateCampaignStatus, {
      campaignId,
      status: "sending",
    });

    try {
      let recipients: string[] = [];
      
      if (campaign.audienceType === "direct") {
        recipients = campaign.recipients || [];
      } else if (campaign.audienceType === "list" && campaign.audienceListId) {
        const getListRecipientsRef =
          (internal as any).contacts?.getListRecipientEmails ||
          (api as any).contacts?.getListRecipientEmails;
        recipients = getListRecipientsRef
          ? await ctx.runQuery(getListRecipientsRef, { listId: campaign.audienceListId })
          : [];
      }

      const validRecipients: string[] = [];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      for (const email of recipients) {
        if (!emailRegex.test(email)) continue;
        const isUnsubscribed = await ctx.runQuery(api.emails.isUnsubscribedQuery, {
          businessId: campaign.businessId,
          email,
        });
        if (isUnsubscribed) continue;
        validRecipients.push(email);
      }

      // Entitlements guard before attempting to send
      const ent = await ctx.runQuery(internal.entitlements.checkEntitlement, {
        businessId: campaign.businessId,
        action: "emails.sendCampaign",
        context: { recipientsCount: validRecipients.length },
      });
      if (!ent.allowed) {
        await ctx.runMutation(internal.emails.updateCampaignStatus, {
          campaignId,
          status: "failed",
          lastError: ent.reason,
        });
        await ctx.runMutation(internal.audit.write, {
          businessId: campaign.businessId,
          action: "entitlement_block",
          entityType: "email_campaign",
          entityId: String(campaignId),
          details: {
            reason: ent.reason,
            recipientsCount: validRecipients.length,
            tier: ent.tier,
            limit: ent.limit,
          },
        });
        return;
      }

      const cappedRecipients = validRecipients.slice(0, EMAILS_MAX_RECIPIENTS_PER_JOB);
      if (validRecipients.length > EMAILS_MAX_RECIPIENTS_PER_JOB) {
        console.warn(`Campaign ${campaignId} capped to ${EMAILS_MAX_RECIPIENTS_PER_JOB} recipients`);
      }

      const sendIds: string[] = [];
      
      for (let i = 0; i < cappedRecipients.length; i += EMAILS_BATCH_SIZE) {
        const batch = cappedRecipients.slice(i, i + EMAILS_BATCH_SIZE);
        
        for (const email of batch) {
          try {
            const unsubscribeToken = await ctx.runMutation(internal.emails.ensureTokenMutation, {
              businessId: campaign.businessId,
              email,
            });

            const unsubscribeUrl = `${process.env.VITE_PUBLIC_BASE_URL || ""}/api/unsubscribe?token=${encodeURIComponent(
              unsubscribeToken
            )}&businessId=${encodeURIComponent(String(campaign.businessId))}&email=${encodeURIComponent(email)}`;

            let htmlContent = (campaign.body || (campaign as any).htmlContent || "") as string;
            let buttonsHtml = "";
            if (campaign.buttons && campaign.buttons.length > 0) {
              buttonsHtml = campaign.buttons
                .map(
                  (btn: any) =>
                    `<a href="${btn.url}" style="display: inline-block; padding: 10px 20px; background-color: #059669; color: white; text-decoration: none; border-radius: 5px; margin: 5px;">${btn.text}</a>`
                )
                .join("");
            }
            if (buttonsHtml) {
              htmlContent += `<div style="margin: 20px 0;">${buttonsHtml}</div>`;
            }
            htmlContent += `<div style="margin-top: 30px; font-size: 12px; color: #666;"><a href="${unsubscribeUrl}">Unsubscribe</a></div>`;

            const { data } = await resend.emails.send({
              from: campaign.fromName
                ? `${campaign.fromName} <${campaign.fromEmail || "noreply@resend.dev"}>`
                : campaign.fromEmail || "noreply@resend.dev",
              to: [email],
              subject: campaign.subject || "No Subject",
              html: htmlContent,
              reply_to: campaign.replyTo,
            });

            if (data?.id) {
              sendIds.push(data.id);
            }
          } catch (error) {
            console.error(`Failed to send to ${email}:`, error);
          }
        }
        
        if (i + EMAILS_BATCH_SIZE < cappedRecipients.length) {
          await new Promise(resolve => setTimeout(resolve, EMAILS_BATCH_DELAY_MS));
        }
      }

      await ctx.runMutation(internal.emails.appendSendIdsAndComplete, {
        campaignId,
        sendIds,
        status: "sent",
      });

    } catch (error) {
      await ctx.runMutation(internal.emails.updateCampaignStatus, {
        campaignId,
        status: "failed",
        lastError: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  },
});

// Public action to send Sales inquiry via Resend
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
    const RESEND_KEY = process.env.RESEND_API_KEY;
    const DEV_SAFE = process.env.DEV_SAFE_EMAILS === "true";

    if ((!RESEND_KEY || !inbox) && DEV_SAFE) {
      console.warn("[EMAIL][STUB] Sales inquiry stubbed. Configure RESEND_API_KEY and SALES_INBOX/PUBLIC_SALES_INBOX for delivery.", {
        name: args.name,
        email: args.email,
        plan: args.plan,
      });
      return { ok: true as const };
    }

    if (!RESEND_KEY) {
      throw new Error("Email service not configured");
    }
    if (!inbox) {
      throw new Error("Sales inbox not configured");
    }

    // Instantiate Resend here to use the configured API key at runtime
    const resend = new Resend(RESEND_KEY);

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
      from: inbox,
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