"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal, api } from "../_generated/api";

/**
 * Analyze customers and generate AI-powered segments using OpenAI
 */
export const analyzeCustomers = action({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args): Promise<any> => {
    // Get all contacts for the business
    const contacts: any = await ctx.runQuery(internal.contacts.listContacts, {
      businessId: args.businessId,
    });

    if (!contacts || contacts.length === 0) {
      return {
        segments: [],
        insights: "No contacts found. Add contacts to start segmentation.",
      };
    }

    // Analyze engagement patterns
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    const highEngagement: any = contacts.filter(
      (c: any) => c.engagementScore && c.engagementScore > 70
    );
    const mediumEngagement = contacts.filter(
      (c: any) => c.engagementScore && c.engagementScore > 40 && c.engagementScore <= 70
    );
    const lowEngagement = contacts.filter(
      (c: any) => !c.engagementScore || c.engagementScore <= 40
    );

    // Calculate percentages
    const highPct = Math.round((highEngagement.length / contacts.length) * 100);
    const mediumPct = Math.round((mediumEngagement.length / contacts.length) * 100);
    const lowPct = Math.round((lowEngagement.length / contacts.length) * 100);

    // Use AI for deeper insights if available
    let aiInsights = "";
    if (process.env.OPENAI_API_KEY) {
      try {
        const prompt = `Analyze this customer engagement data and provide actionable insights:

Total Contacts: ${contacts.length}
High Engagement: ${highEngagement.length} (${highPct}%)
Medium Engagement: ${mediumEngagement.length} (${mediumPct}%)
Low Engagement: ${lowEngagement.length} (${lowPct}%)

Provide:
1. Overall health assessment (1-2 sentences)
2. Top 3 actionable recommendations
3. Biggest opportunity or risk

Keep it concise and actionable (under 200 words).`;

        const result = await ctx.runAction(api.openai.generate, {
          prompt,
          model: "gpt-4o-mini",
          temperature: 0.7,
          maxTokens: 300,
        });

        aiInsights = result.text;
      } catch (error) {
        console.warn("[CUSTOMER_SEGMENTATION] AI analysis failed, using fallback");
      }
    }

    // Fallback insights if AI not available
    const fallbackInsights = `📊 Customer Analysis Summary:
- Total Contacts: ${contacts.length}
- High Engagement (Active): ${highEngagement.length} (${highPct}%)
- Medium Engagement (Dormant): ${mediumEngagement.length} (${mediumPct}%)
- Low Engagement (Inactive): ${lowEngagement.length} (${lowPct}%)

💡 Key Insights:
${highPct > 30 ? "✅ Strong engagement rate - maintain current strategies" : "⚠️ Low engagement rate - consider re-engagement campaigns"}
${lowPct > 40 ? "🔴 High inactive rate - urgent action needed" : ""}
${mediumPct > 30 ? "⚡ Opportunity to re-activate dormant customers" : ""}`;

    const insights = aiInsights || fallbackInsights;

    // Create suggested segments
    const segments: any = [
      {
        name: "High Engagement",
        description: "Highly engaged customers with frequent interactions",
        criteria: { engagement: "active", minInteractions: 5 },
        count: highEngagement.length,
        color: "#10b981",
      },
      {
        name: "At-Risk Customers",
        description: "Previously active customers showing declining engagement",
        criteria: { engagement: "dormant", previouslyActive: true },
        count: mediumEngagement.length,
        color: "#f59e0b",
      },
      {
        name: "Win-Back Targets",
        description: "Inactive customers who need re-engagement",
        criteria: { engagement: "inactive", daysSinceLastContact: 90 },
        count: lowEngagement.length,
        color: "#ef4444",
      },
      {
        name: "New Prospects",
        description: "Recently added contacts with potential",
        criteria: { status: "subscribed", daysOld: 30 },
        count: contacts.filter((c: any) => now - c._creationTime < thirtyDays).length,
        color: "#3b82f6",
      },
    ];

    return { segments, insights, totalContacts: contacts.length };
  },
});

/**
 * Predict customer churn risk using engagement patterns
 */
export const predictChurn = action({
  args: {
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args): Promise<any> => {
    const contact: any = await ctx.runQuery(internal.contacts.getContact as any, {
      contactId: args.contactId,
    });

    if (!contact) {
      throw new Error("Contact not found");
    }

    const daysSinceEngagement: number = contact.lastEngagedAt
      ? Math.floor((Date.now() - contact.lastEngagedAt) / (1000 * 60 * 60 * 24))
      : 999;

    let churnRisk = "low";
    let churnScore = 0;

    if (daysSinceEngagement > 90) {
      churnRisk = "high";
      churnScore = 85;
    } else if (daysSinceEngagement > 60) {
      churnRisk = "medium";
      churnScore = 60;
    } else if (daysSinceEngagement > 30) {
      churnRisk = "medium";
      churnScore = 40;
    } else {
      churnRisk = "low";
      churnScore = 15;
    }

    const factors: any[] = [
      daysSinceEngagement > 60 ? "No recent engagement" : null,
      contact.status !== "subscribed" ? "Unsubscribed status" : null,
      !contact.tags || contact.tags.length === 0 ? "No tags/segmentation" : null,
    ].filter(Boolean);

    return {
      churnRisk,
      churnProbability: churnScore,
      factors,
      recommendations:
        churnRisk === "high"
          ? "Send personalized re-engagement campaign immediately"
          : churnRisk === "medium"
          ? "Schedule follow-up within 7 days"
          : "Continue regular engagement",
    };
  },
});

/**
 * Generate AI-powered action recommendations for segments
 */
export const recommendActions = action({
  args: {
    businessId: v.id("businesses"),
    segmentType: v.string(),
    segmentValue: v.string(),
  },
  handler: async (ctx, args) => {
    const recommendations: Array<{
      action: string;
      priority: "high" | "medium" | "low";
      description: string;
      expectedImpact: string;
    }> = [];

    // Generate recommendations based on segment type
    if (args.segmentType === "engagement") {
      if (args.segmentValue === "inactive") {
        recommendations.push(
          {
            action: "Win-Back Campaign",
            priority: "high",
            description: "Send personalized email with special offer or incentive",
            expectedImpact: "15-25% re-engagement rate",
          },
          {
            action: "Survey Feedback",
            priority: "medium",
            description: "Ask why they became inactive and what would bring them back",
            expectedImpact: "Valuable insights for improvement",
          },
          {
            action: "Content Re-engagement",
            priority: "medium",
            description: "Share your best-performing content to reignite interest",
            expectedImpact: "10-15% click-through rate",
          }
        );
      } else if (args.segmentValue === "active") {
        recommendations.push(
          {
            action: "Loyalty Program",
            priority: "high",
            description: "Reward active customers with exclusive benefits",
            expectedImpact: "Increased retention and advocacy",
          },
          {
            action: "Upsell Opportunity",
            priority: "high",
            description: "Introduce premium features or complementary products",
            expectedImpact: "20-30% conversion on engaged users",
          },
          {
            action: "Referral Request",
            priority: "medium",
            description: "Ask satisfied customers to refer friends",
            expectedImpact: "2-5x customer acquisition",
          }
        );
      } else if (args.segmentValue === "dormant") {
        recommendations.push(
          {
            action: "Re-activation Series",
            priority: "high",
            description: "3-email sequence highlighting value and updates",
            expectedImpact: "25-35% re-engagement rate",
          },
          {
            action: "Personalized Outreach",
            priority: "medium",
            description: "One-on-one check-in from founder or account manager",
            expectedImpact: "High-touch approach for key accounts",
          }
        );
      }
    } else if (args.segmentType === "status") {
      if (args.segmentValue === "unsubscribed") {
        recommendations.push({
          action: "Exit Survey",
          priority: "low",
          description: "Understand why they unsubscribed",
          expectedImpact: "Improve retention strategies",
        });
      }
    }

    return recommendations;
  },
});
