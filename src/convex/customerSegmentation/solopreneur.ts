"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

/**
 * Solopreneur-specific customer segmentation logic
 * Focuses on simple, actionable segments for solo business owners
 */

export const generateSolopreneurSegments = action({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    // Get all contacts for the business
    const contacts: any = await ctx.runQuery(internal.contacts.listContacts, {
      businessId: args.businessId,
    });

    if (!contacts || contacts.length === 0) {
      return {
        segments: [],
        recommendations: ["Add contacts to start building segments"],
        totalContacts: 0,
      };
    }

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;
    const thirtyDays = 30 * oneDay;
    const ninetyDays = 90 * oneDay;

    // Segment 1: Hot Leads (recent, engaged, subscribed)
    const hotLeads = contacts.filter((c: any) => {
      const isRecent = c._creationTime && now - c._creationTime < sevenDays;
      const isEngaged = c.lastEngagedAt && now - c.lastEngagedAt < sevenDays;
      const isSubscribed = c.status === "subscribed";
      return isRecent || (isEngaged && isSubscribed);
    });

    // Segment 2: Active Customers (engaged in last 30 days)
    const activeCustomers = contacts.filter((c: any) => {
      const recentlyEngaged = c.lastEngagedAt && now - c.lastEngagedAt < thirtyDays;
      const isSubscribed = c.status === "subscribed";
      return recentlyEngaged && isSubscribed && !hotLeads.includes(c);
    });

    // Segment 3: At-Risk (engaged 30-90 days ago)
    const atRisk = contacts.filter((c: any) => {
      const lastEngaged = c.lastEngagedAt || c._creationTime;
      const daysSinceEngagement = (now - lastEngaged) / oneDay;
      return daysSinceEngagement >= 30 && daysSinceEngagement < 90 && c.status === "subscribed";
    });

    // Segment 4: Dormant (no engagement in 90+ days)
    const dormant = contacts.filter((c: any) => {
      const lastEngaged = c.lastEngagedAt || c._creationTime;
      const daysSinceEngagement = (now - lastEngaged) / oneDay;
      return daysSinceEngagement >= 90;
    });

    // Segment 5: VIP Customers (high engagement score or specific tags)
    const vipCustomers = contacts.filter((c: any) => {
      const hasVipTag = c.tags?.includes("vip") || c.tags?.includes("premium");
      const highEngagement = c.engagementScore && c.engagementScore > 80;
      return hasVipTag || highEngagement;
    });

    // Segment 6: Unsubscribed (for win-back campaigns)
    const unsubscribed = contacts.filter((c: any) => c.status === "unsubscribed");

    // Generate actionable recommendations
    const recommendations = [];
    
    if (hotLeads.length > 0) {
      recommendations.push(`🔥 ${hotLeads.length} hot leads ready for immediate outreach`);
    }
    
    if (atRisk.length > 5) {
      recommendations.push(`⚠️ ${atRisk.length} customers at risk - send re-engagement campaign`);
    }
    
    if (dormant.length > 10) {
      recommendations.push(`💤 ${dormant.length} dormant contacts - consider win-back offer`);
    }
    
    if (vipCustomers.length > 0) {
      recommendations.push(`⭐ ${vipCustomers.length} VIP customers - send exclusive content`);
    }
    
    if (activeCustomers.length > hotLeads.length * 3) {
      recommendations.push(`✅ Strong active customer base - focus on retention`);
    }

    const segments = [
      {
        id: "hot-leads",
        name: "Hot Leads",
        description: "New or recently engaged contacts ready for conversion",
        count: hotLeads.length,
        percentage: Math.round((hotLeads.length / contacts.length) * 100),
        color: "#ef4444",
        priority: "high",
        suggestedAction: "Send personalized welcome series or product demo",
      },
      {
        id: "active-customers",
        name: "Active Customers",
        description: "Engaged customers in the last 30 days",
        count: activeCustomers.length,
        percentage: Math.round((activeCustomers.length / contacts.length) * 100),
        color: "#10b981",
        priority: "medium",
        suggestedAction: "Share valuable content and upsell opportunities",
      },
      {
        id: "at-risk",
        name: "At-Risk",
        description: "Customers showing declining engagement",
        count: atRisk.length,
        percentage: Math.round((atRisk.length / contacts.length) * 100),
        color: "#f59e0b",
        priority: "high",
        suggestedAction: "Launch re-engagement campaign with special offer",
      },
      {
        id: "dormant",
        name: "Dormant",
        description: "No engagement in 90+ days",
        count: dormant.length,
        percentage: Math.round((dormant.length / contacts.length) * 100),
        color: "#6b7280",
        priority: "low",
        suggestedAction: "Win-back campaign or clean list",
      },
      {
        id: "vip-customers",
        name: "VIP Customers",
        description: "High-value or highly engaged customers",
        count: vipCustomers.length,
        percentage: Math.round((vipCustomers.length / contacts.length) * 100),
        color: "#8b5cf6",
        priority: "high",
        suggestedAction: "Exclusive perks, early access, or loyalty rewards",
      },
      {
        id: "unsubscribed",
        name: "Unsubscribed",
        description: "Contacts who opted out",
        count: unsubscribed.length,
        percentage: Math.round((unsubscribed.length / contacts.length) * 100),
        color: "#dc2626",
        priority: "low",
        suggestedAction: "Respect preferences, analyze exit reasons",
      },
    ];

    return {
      segments: segments.filter(s => s.count > 0),
      recommendations,
      totalContacts: contacts.length,
      healthScore: calculateHealthScore(segments),
    };
  },
});

function calculateHealthScore(segments: any[]): number {
  const active = segments.find(s => s.id === "active-customers")?.percentage || 0;
  const hot = segments.find(s => s.id === "hot-leads")?.percentage || 0;
  const atRisk = segments.find(s => s.id === "at-risk")?.percentage || 0;
  const dormant = segments.find(s => s.id === "dormant")?.percentage || 0;

  // Health score formula: reward active/hot, penalize at-risk/dormant
  const score = (active * 1.5 + hot * 2) - (atRisk * 0.5 + dormant * 0.3);
  return Math.max(0, Math.min(100, Math.round(score)));
}
