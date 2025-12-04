"use node";
import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * Generate automated response based on ticket category and priority
 */
export const generateAutoResponse = action({
  args: {
    category: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    subject: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const templates = getResponseTemplates();
    const categoryTemplates = templates[args.category as keyof typeof templates] || templates.general;
    
    // Select template based on priority
    let template = categoryTemplates.medium;
    if (args.priority === "critical" || args.priority === "high") {
      template = categoryTemplates.high;
    } else if (args.priority === "low") {
      template = categoryTemplates.low;
    }
    
    // Personalize the response
    const response = personalizeResponse(template, args);
    
    return {
      response,
      shouldAutoSend: args.priority === "low", // Only auto-send for low priority
      suggestedFollowUp: getSuggestedFollowUp(args.category, args.priority),
      estimatedResponseTime: getEstimatedResponseTime(args.priority)
    };
  },
});

/**
 * Send automated acknowledgment email
 */
export const sendAcknowledgment = action({
  args: {
    ticketId: v.id("supportTickets"),
    customerEmail: v.string(),
    subject: v.string(),
  },
  handler: async (ctx, args) => {
    const acknowledgment = `
Thank you for contacting Pikar AI Support!

We've received your support request (Ticket #${args.ticketId.slice(-8)}) regarding: "${args.subject}"

Our team is reviewing your inquiry and will respond shortly. Here's what you can expect:

• Initial response within 24 hours
• Regular updates on progress
• Dedicated support until resolution

In the meantime, you might find these resources helpful:
• Help Center: https://help.pikar.ai
• Video Tutorials: https://pikar.ai/tutorials
• Community Forum: https://community.pikar.ai

If your matter is urgent, please reply with "URGENT" and we'll prioritize your request.

Best regards,
Pikar AI Support Team
    `.trim();
    
    // In production, this would integrate with email service (Resend)
    console.log("Sending acknowledgment to:", args.customerEmail);
    console.log("Content:", acknowledgment);
    
    return {
      sent: true,
      message: acknowledgment
    };
  },
});

function getResponseTemplates() {
  return {
    technical: {
      high: "Thank you for reporting this critical technical issue. Our engineering team has been notified and is investigating immediately. We'll provide an update within 2 hours.",
      medium: "Thank you for reporting this technical issue. Our team is investigating and will provide an update within 24 hours. In the meantime, please try clearing your cache and restarting your browser.",
      low: "Thank you for your inquiry. This appears to be a common question. Please check our Help Center at [link] for detailed guidance. If you need further assistance, we're here to help!"
    },
    billing: {
      high: "Thank you for contacting us about this billing matter. Our finance team is reviewing your account immediately and will respond within 4 hours.",
      medium: "Thank you for your billing inquiry. Our finance team will review your account and respond within 1 business day with a detailed breakdown.",
      low: "Thank you for reaching out. For billing questions, please visit our Billing FAQ at [link]. If you need specific assistance, our team will respond within 2 business days."
    },
    feature_request: {
      high: "Thank you for this valuable feature suggestion! We're excited about this idea and will discuss it in our next product planning session.",
      medium: "Thank you for your feature request! We've added it to our product roadmap for consideration. We'll keep you updated on its progress.",
      low: "Thank you for your suggestion! All feature requests are reviewed quarterly. You can track popular requests in our community forum at [link]."
    },
    question: {
      high: "Thank you for your question! I'd be happy to help. Based on your inquiry, here's what you need to know: [specific answer]. Let me know if you need clarification!",
      medium: "Thank you for reaching out! Here are some resources that should help answer your question: [links]. If you need more specific guidance, please let us know!",
      low: "Thank you for your question! Please check our Help Center at [link] for detailed guides. Our community forum at [link] also has many helpful discussions."
    },
    general: {
      high: "Thank you for contacting us. We've received your message and our team is reviewing it now. You'll receive a response within 4 hours.",
      medium: "Thank you for reaching out. We've received your message and will respond within 24 hours. If your matter is urgent, please reply with 'URGENT'.",
      low: "Thank you for contacting us. We've received your message and will respond within 2 business days. For faster assistance, check our Help Center at [link]."
    }
  };
}

function personalizeResponse(template: string, args: any): string {
  // Add personalization based on ticket content
  let response = template;
  
  // Add specific details if mentioned
  if (args.description.toLowerCase().includes("login")) {
    response += "\n\nFor login issues, please ensure you're using the correct email address and try resetting your password.";
  }
  
  if (args.description.toLowerCase().includes("payment")) {
    response += "\n\nFor payment issues, please verify your payment method is up to date in your account settings.";
  }
  
  return response;
}

function getSuggestedFollowUp(category: string, priority: string): string {
  if (priority === "critical" || priority === "high") {
    return "Follow up in 2 hours if no response";
  } else if (priority === "medium") {
    return "Follow up in 24 hours if no response";
  } else {
    return "Follow up in 48 hours if no response";
  }
}

function getEstimatedResponseTime(priority: string): number {
  // Return time in hours
  switch (priority) {
    case "critical": return 2;
    case "high": return 8;
    case "medium": return 24;
    case "low": return 48;
    default: return 24;
  }
}
