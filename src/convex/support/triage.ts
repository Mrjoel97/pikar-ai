"use node";
import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * AI-powered email triage for support tickets
 * Analyzes email content and suggests priority, category, and replies
 */
export const triageEmail = action({
  args: {
    emailBody: v.string(),
  },
  handler: async (ctx, args) => {
    const emailLower = args.emailBody.toLowerCase();
    
    // Analyze sentiment and urgency
    const urgencyKeywords = ["urgent", "asap", "immediately", "critical", "emergency", "down", "broken", "not working"];
    const billingKeywords = ["invoice", "payment", "billing", "charge", "refund", "subscription"];
    const technicalKeywords = ["bug", "error", "crash", "issue", "problem", "broken", "not working"];
    const featureKeywords = ["feature", "request", "suggestion", "enhancement", "would like"];
    const questionKeywords = ["how", "what", "when", "where", "why", "can i", "is it possible"];
    
    const hasUrgency = urgencyKeywords.some(kw => emailLower.includes(kw));
    const isBilling = billingKeywords.some(kw => emailLower.includes(kw));
    const isTechnical = technicalKeywords.some(kw => emailLower.includes(kw));
    const isFeature = featureKeywords.some(kw => emailLower.includes(kw));
    const isQuestion = questionKeywords.some(kw => emailLower.includes(kw));
    
    // Determine priority
    let priority: "high" | "medium" | "low" = "medium";
    if (hasUrgency || (isTechnical && emailLower.includes("down"))) {
      priority = "high";
    } else if (isQuestion || isFeature) {
      priority = "low";
    }
    
    // Generate suggestions
    const suggestions = [];
    
    if (isTechnical) {
      suggestions.push({
        label: "Technical Support",
        priority: hasUrgency ? "high" : "medium",
        reply: `Thank you for reporting this technical issue. I understand how frustrating this must be.\n\nOur technical team is investigating this matter and will provide an update within ${hasUrgency ? "2 hours" : "24 hours"}.\n\nIn the meantime, please try:\n1. Clearing your browser cache\n2. Trying a different browser\n3. Checking your internet connection\n\nWe appreciate your patience and will resolve this as quickly as possible.`
      });
    }
    
    if (isBilling) {
      suggestions.push({
        label: "Billing Inquiry",
        priority: "medium",
        reply: `Thank you for contacting us about your billing inquiry.\n\nI've reviewed your account and our billing team will send you a detailed breakdown within 1 business day.\n\nIf you need immediate assistance, please don't hesitate to reach out.\n\nBest regards,\nSupport Team`
      });
    }
    
    if (isFeature) {
      suggestions.push({
        label: "Feature Request",
        priority: "low",
        reply: `Thank you for your valuable feedback!\n\nWe really appreciate customers who take the time to suggest improvements. Your feature request has been added to our product roadmap for consideration.\n\nOur product team reviews all suggestions during our quarterly planning sessions. We'll keep you updated on the progress.\n\nThank you for helping us improve!`
      });
    }
    
    if (isQuestion) {
      suggestions.push({
        label: "General Question",
        priority: "low",
        reply: `Thank you for reaching out!\n\nI'd be happy to help answer your question. Based on your inquiry, here are some resources that might be helpful:\n\n• Help Center: [link]\n• Video Tutorials: [link]\n• Community Forum: [link]\n\nIf you need more specific assistance, please let me know and I'll provide detailed guidance.\n\nBest regards,\nSupport Team`
      });
    }
    
    // Default suggestion if no specific category matched
    if (suggestions.length === 0) {
      suggestions.push({
        label: "General Support",
        priority: "medium",
        reply: `Thank you for contacting us.\n\nWe've received your message and our support team will review it carefully. You can expect a response within 24 hours.\n\nIf your matter is urgent, please reply with "URGENT" in the subject line and we'll prioritize your request.\n\nBest regards,\nSupport Team`
      });
    }
    
    return {
      suggestions,
      detectedPriority: priority,
      categories: {
        technical: isTechnical,
        billing: isBilling,
        feature: isFeature,
        question: isQuestion
      }
    };
  },
});

/**
 * Classify ticket into categories and priority
 */
export const classifyTicket = action({
  args: {
    subject: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const combined = `${args.subject} ${args.description}`.toLowerCase();
    
    // Category classification
    let category = "general";
    let confidence = 0.7;
    
    if (combined.includes("bug") || combined.includes("error") || combined.includes("broken")) {
      category = "technical";
      confidence = 0.9;
    } else if (combined.includes("billing") || combined.includes("payment") || combined.includes("invoice")) {
      category = "billing";
      confidence = 0.95;
    } else if (combined.includes("feature") || combined.includes("request") || combined.includes("suggestion")) {
      category = "feature_request";
      confidence = 0.85;
    } else if (combined.includes("how") || combined.includes("question")) {
      category = "question";
      confidence = 0.8;
    }
    
    // Priority classification
    let priority: "low" | "medium" | "high" | "critical" = "medium";
    if (combined.includes("urgent") || combined.includes("critical") || combined.includes("down")) {
      priority = "critical";
    } else if (combined.includes("important") || combined.includes("asap")) {
      priority = "high";
    } else if (combined.includes("question") || combined.includes("suggestion")) {
      priority = "low";
    }
    
    // Estimated resolution time (in hours)
    const estimatedResolution = priority === "critical" ? 2 : priority === "high" ? 8 : priority === "medium" ? 24 : 48;
    
    return {
      category,
      priority,
      confidence,
      estimatedResolution,
      tags: extractTags(combined)
    };
  },
});

function extractTags(text: string): string[] {
  const tags: string[] = [];
  
  if (text.includes("login") || text.includes("password")) tags.push("authentication");
  if (text.includes("payment") || text.includes("card")) tags.push("payment");
  if (text.includes("api") || text.includes("integration")) tags.push("api");
  if (text.includes("mobile") || text.includes("app")) tags.push("mobile");
  if (text.includes("slow") || text.includes("performance")) tags.push("performance");
  if (text.includes("data") || text.includes("export")) tags.push("data");
  
  return tags;
}
