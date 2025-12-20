"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

export const sendEmailViaResend = action({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
    text: v.string(),
    resendApiKey: v.string(),
    fromEmail: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${args.resendApiKey}`,
        },
        body: JSON.stringify({
          from: `Pikar AI Admin <${args.fromEmail}>`,
          to: [args.to],
          subject: args.subject,
          html: args.html,
          text: args.text,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Resend API error: ${error}`);
      }

      const result = await response.json();
      return { success: true, messageId: result.id };
    } catch (error: any) {
      console.error("Failed to send email via Resend:", error);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  },
});
