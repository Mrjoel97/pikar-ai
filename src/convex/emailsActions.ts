"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

const internal = require("./_generated/api").internal as any;

/**
 * Send a single email using Resend
 */
export const sendEmail = action({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
    from: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get Resend API key from environment or email config
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not configured, email not sent");
      return { success: false, error: "Email service not configured" };
    }

    const resend = new Resend(resendApiKey);
    
    try {
      const result = await resend.emails.send({
        from: args.from || "Pikar AI <noreply@resend.dev>",
        to: args.to,
        subject: args.subject,
        html: args.html,
      });

      return { success: true, id: result.data?.id };
    } catch (error: any) {
      console.error("Failed to send email:", error);
      return { success: false, error: error.message };
    }
  },
});

/**
 * Internal action to send campaign emails (existing functionality)
 */
export const sendCampaignInternal = action({
  args: {
    campaignId: v.id("emails"),
    experimentId: v.optional(v.id("experiments")),
    variantAId: v.optional(v.id("experimentVariants")),
    variantBId: v.optional(v.id("experimentVariants")),
  },
  handler: async (ctx, args) => {
    // Implementation for campaign sending would go here
    // This is a placeholder for the existing campaign functionality
    console.log("Campaign sending not yet implemented in this action");
    return { success: true };
  },
});