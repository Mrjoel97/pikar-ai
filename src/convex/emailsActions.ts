"use node";

import { Resend } from "resend";
import { internalAction, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { renderHtml, escapeHtml } from "./emails";
import { v } from "convex/values";

// Config constants removed as unused to avoid TS unused var errors

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

    // Prefer per-business Resend key, fallback to global
    const cfg: any = await ctx.runQuery(internal.emailConfig.getByBusiness, {
      businessId: args.businessId,
    });
    const RESEND_KEY: string | undefined = (cfg?.resendApiKey as string | undefined) || process.env.RESEND_API_KEY;

    // Safe stub if not configured and DEV_SAFE_EMAILS enabled
    if (!RESEND_KEY) {
      if (DEV_SAFE) {
        console.warn("[EMAIL][STUB] RESEND_API_KEY missing. Stubbing test email send.", {
          to: args.to,
          subject: args.subject,
        });

        await ctx.runMutation(internal.emails.ensureTokenMutation, {
          businessId: args.businessId,
          email: args.to,
        });

        return { id: `stub_${Date.now()}` };
      }
      throw new Error("RESEND_API_KEY not configured");
    }

    const resend: Resend = new Resend(RESEND_KEY);

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

    const { data, error }: { data: any; error: any } = await resend.emails.send({
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
    // Get campaign details
    const campaign = await ctx.runQuery(internal.emails.getCampaignById, { 
      campaignId 
    });
    
    if (!campaign) {
      console.error(`Campaign ${campaignId} not found`);
      return;
    }

    // Idempotency check - don't reprocess if already sending/sent
    if (campaign.status === "sending" || campaign.status === "sent") {
      console.log(`Campaign ${campaignId} already processed (${campaign.status})`);
      return;
    }

    try {
      // Mark as sending
      await ctx.runMutation(internal.emails.updateCampaignStatus, {
        campaignId,
        status: "sending"
      });

      // Get recipients
      const recipients = campaign.recipients ||
        (campaign.audienceListId
          ? await ctx.runQuery(internal.contacts.getListRecipientEmailsInternal, {
              listId: campaign.audienceListId,
            })
          : []);

      if (recipients.length === 0) {
        await ctx.runMutation(internal.emails.updateCampaignStatus, {
          campaignId,
          status: "failed",
          lastError: "No recipients found"
        });
        return;
      }

      const cfg: any = await ctx.runQuery(internal.emailConfig.getByBusiness, {
        businessId: campaign.businessId,
      });
      const RESEND_KEY: string | undefined = (cfg?.resendApiKey as string | undefined) || process.env.RESEND_API_KEY;
      const devSafeEmails = process.env.DEV_SAFE_EMAILS === "true";
      const resend: Resend | null = RESEND_KEY ? new Resend(RESEND_KEY) : null;
      const sendIds: string[] = [];
      let successCount = 0;
      let lastError: string | undefined;

      if (!resend && !devSafeEmails) {
        await ctx.runMutation(internal.emails.updateCampaignStatus, {
          campaignId,
          status: "failed",
          lastError: "RESEND_API_KEY not configured",
        });
        await ctx.runMutation(internal.audit.write, {
          businessId: campaign.businessId,
          action: "campaign_failed",
          entityType: "email",
          entityId: campaignId,
          details: { error: "RESEND_API_KEY not configured" },
        });
        return;
      }

      // Batch send with retry logic (supports stub mode when DEV_SAFE_EMAILS and no RESEND_API_KEY)
      for (const email of recipients) {
        try {
          const targetEmail = devSafeEmails ? "test@resend.dev" : email;

          if (!resend) {
            // Stub path: simulate successful send
            const stubId = `stub_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
            sendIds.push(stubId);
            successCount++;
            await new Promise((resolve) => setTimeout(resolve, 50));
            continue;
          }

          const { data, error }: { data: any; error: any } = await resend!.emails.send({
            from: campaign.fromEmail || cfg?.fromEmail || "noreply@pikar.ai",
            to: [targetEmail],
            subject: campaign.subject,
            html: campaign.htmlContent || campaign.body || "",
            reply_to: campaign.fromEmail || cfg?.replyTo || cfg?.fromEmail || "noreply@pikar.ai",
          });

          if (error) {
            lastError = `Send error: ${error.message}`;
            console.error(`Failed to send to ${email}:`, error);
          } else if (data?.id) {
            sendIds.push(data.id);
            successCount++;
          }

          // Small delay between sends to avoid rate limits
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (err: any) {
          lastError = `Exception: ${err.message}`;
          console.error(`Exception sending to ${email}:`, err);

          // Simple backoff on transient errors
          if (err.message?.includes("rate") || err.message?.includes("timeout")) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }
      }

      // Update final status
      const finalStatus = successCount > 0 ? "sent" : "failed";
      await ctx.runMutation(internal.emails.appendSendIdsAndComplete, {
        campaignId,
        sendIds,
        status: finalStatus,
        lastError
      });

      // Ensure audit log includes businessId
      await ctx.runMutation(internal.audit.write, {
        businessId: campaign.businessId,
        action: "campaign_sent",
        entityType: "email",
        entityId: campaignId,
        details: {
          recipientCount: recipients.length,
          successCount,
          finalStatus,
          devSafeEmails
        }
      });

      console.log(`Campaign ${campaignId} completed: ${successCount}/${recipients.length} sent`);

    } catch (err: any) {
      console.error(`Campaign ${campaignId} failed:`, err);
      
      await ctx.runMutation(internal.emails.updateCampaignStatus, {
        campaignId,
        status: "failed",
        lastError: err.message
      });

      // Ensure audit log includes businessId
      await ctx.runMutation(internal.audit.write, {
        businessId: campaign?.businessId,
        action: "campaign_failed",
        entityType: "email", 
        entityId: campaignId,
        details: { error: err.message }
      });
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
    // NOTE: Always use global env for admin communications
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