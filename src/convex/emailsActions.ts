"use node";

import { Resend } from "resend";
import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";
/* removed unused Id type import */
import { renderHtml, escapeHtml } from "./emails";

/* using escapeHtml from ./emails */

/* using renderHtml from ./emails */

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
    // Ensure API key is configured
    if (!process.env.RESEND_API_KEY) {
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
  args: {
    campaignId: v.id("emails"),
    batchSize: v.optional(v.number()),
    batchDelay: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      await ctx.runMutation(internal.emails.updateCampaignStatus, {
        campaignId: args.campaignId,
        status: "failed",
        lastError: "RESEND_API_KEY not configured. Please set up the API key in Integrations.",
      });
      throw new Error("RESEND_API_KEY not configured");
    }

    const resend = new Resend(resendApiKey);
    const campaign = await ctx.runQuery(internal.emails.getCampaignById, {
      campaignId: args.campaignId,
    });

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    let recipients: string[] = [];

    // Resolve recipients based on audience type
    if (campaign.audienceType === "list" && campaign.audienceListId) {
      recipients = await ctx.runQuery(api.contacts.getListRecipientEmails, {
        listId: campaign.audienceListId,
      });
    } else {
      recipients = campaign.recipients;
    }

    if (recipients.length === 0) {
      await ctx.runMutation(internal.emails.updateCampaignStatus, {
        campaignId: args.campaignId,
        status: "failed",
        lastError: "No recipients found",
      });
      return;
    }

    // Update status to sending
    await ctx.runMutation(internal.emails.updateCampaignStatus, {
      campaignId: args.campaignId,
      status: "sending",
    });

    const batchSize = args.batchSize || 100;
    const batchDelay = args.batchDelay || 500;
    const allSendIds: string[] = [];
    let totalSent = 0;

    // Process in batches
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          const batchResults = await Promise.allSettled(
            batch.map(async (email) => {
              const result = await resend.emails.send({
                from: campaign.fromName 
                  ? `${campaign.fromName} <${campaign.fromEmail}>`
                  : campaign.fromEmail,
                to: [email],
                subject: campaign.subject,
                html: campaign.htmlContent,
                text: campaign.textContent,
                reply_to: campaign.replyTo,
              });

              if (result.error) {
                throw new Error(`Failed to send to ${email}: ${result.error.message}`);
              }

              return result.data?.id;
            })
          );

          // Collect successful send IDs
          const batchSendIds = batchResults
            .filter((result): result is PromiseFulfilledResult<string> => 
              result.status === "fulfilled" && result.value !== undefined
            )
            .map(result => result.value);

          allSendIds.push(...batchSendIds);
          totalSent += batchSendIds.length;

          // Check for failures
          const failures = batchResults.filter(result => result.status === "rejected");
          if (failures.length > 0) {
            console.warn(`Batch ${i / batchSize + 1}: ${failures.length} failures out of ${batch.length}`);
          }

          break; // Success, exit retry loop
        } catch (error: any) {
          retries++;
          if (error.message?.includes("429") || error.message?.includes("rate limit")) {
            // Rate limited, wait longer
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
          } else if (retries >= maxRetries) {
            // Final failure
            await ctx.runMutation(internal.emails.updateCampaignStatus, {
              campaignId: args.campaignId,
              status: "failed",
              lastError: `Batch ${i / batchSize + 1} failed after ${maxRetries} retries: ${error.message}`,
            });
            return;
          }
        }
      }

      // Delay between batches (except last batch)
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, batchDelay));
      }
    }

    // Update campaign with results
    await ctx.runMutation(internal.emails.appendSendIdsAndComplete, {
      campaignId: args.campaignId,
      sendIds: allSendIds,
      status: totalSent > 0 ? "sent" : "failed",
      lastError: totalSent === 0 ? "No emails were successfully sent" : undefined,
    });

    return {
      totalRecipients: recipients.length,
      totalSent,
      sendIds: allSendIds,
    };
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
    if (!process.env.RESEND_API_KEY) {
      throw new Error("Email service not configured");
    }
    if (!inbox) {
      throw new Error("Sales inbox not configured");
    }

    // Instantiate Resend here to use the configured API key at runtime
    const resend = new Resend(process.env.RESEND_API_KEY);

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