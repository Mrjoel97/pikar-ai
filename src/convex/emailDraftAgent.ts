"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export const generateEmailDraft = action({
  args: {
    businessId: v.id("businesses"),
    recipientEmail: v.string(),
    intent: v.string(),
    tone: v.optional(v.union(v.literal("concise"), v.literal("friendly"), v.literal("premium"))),
  },
  handler: async (ctx, args) => {
    // Get customer context
    const customerContext = await ctx.runQuery(internal.emailDraftAgentData.getCustomerContext, {
      businessId: args.businessId,
      recipientEmail: args.recipientEmail,
    });

    // Build context summary
    let contextSummary = "";
    if (customerContext.contact) {
      contextSummary += `Contact: ${customerContext.contact.name || "Unknown"}\n`;
      if (customerContext.contact.tags && customerContext.contact.tags.length > 0) {
        contextSummary += `Tags: ${customerContext.contact.tags.join(", ")}\n`;
      }
    }

    if (customerContext.recentEmails.length > 0) {
      contextSummary += `\nRecent email history:\n`;
      const emailSummaries = customerContext.recentEmails.map((e: any) =>
        `- ${e.subject} (${new Date(e.createdAt || 0).toLocaleDateString()})`
      );
      contextSummary += emailSummaries.join("\n");
    }

    if (customerContext.recentActivity.length > 0) {
      contextSummary += `\nRecent activity:\n`;
      contextSummary += customerContext.recentActivity
        .slice(0, 3)
        .map((a: any) => `- ${a.action} (${new Date(a.timestamp || 0).toLocaleDateString()})`)
        .join("\n");
    }

    // Determine tone
    const selectedTone = args.tone || "friendly";
    const toneInstructions = {
      concise: "Be brief and to the point. Use short sentences.",
      friendly: "Be warm and conversational. Show genuine interest.",
      premium: "Be professional and polished. Emphasize value and exclusivity.",
    };

    // Generate email with OpenAI
    const prompt = `You are an expert email writer. Generate a professional email based on the following:

Intent: ${args.intent}
Recipient: ${args.recipientEmail}
Tone: ${selectedTone} - ${toneInstructions[selectedTone]}

${contextSummary ? `Context about the recipient:\n${contextSummary}\n` : ""}

Generate a complete email with:
1. A compelling subject line
2. A well-structured body that addresses the intent
3. Appropriate greeting and closing

Format your response as JSON with these exact fields:
{
  "subject": "the subject line",
  "body": "the email body with proper formatting"
}`;

    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        prompt,
        maxOutputTokens: 800,
      });

      // Parse the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse AI response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        subject: parsed.subject || "Follow-up",
        body: parsed.body || "",
        suggestedTone: selectedTone,
      };
    } catch (error: any) {
      console.error("Email generation error:", error);
      
      // Fallback to basic template
      return {
        subject: `Re: ${args.intent}`,
        body: `Hi,\n\nI wanted to reach out regarding ${args.intent}.\n\n[Your message here]\n\nBest regards`,
        suggestedTone: selectedTone,
      };
    }
  },
});