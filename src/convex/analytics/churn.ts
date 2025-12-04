import { v } from "convex/values";
import { query } from "../_generated/server";

// Get churn prediction data
export const getChurnPrediction = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const now = Date.now();
    const predictions = [];

    for (const contact of contacts) {
      const churnRisk = calculateChurnRisk(contact, now);
      
      if (churnRisk.score > 30) {
        predictions.push({
          contactId: contact._id,
          email: contact.email,
          name: contact.name,
          churnScore: churnRisk.score,
          riskLevel: churnRisk.level,
          factors: churnRisk.factors,
          lastEngaged: contact.lastEngagedAt,
          daysSinceEngagement: churnRisk.daysSinceEngagement,
        });
      }
    }

    // Sort by churn score (highest risk first)
    predictions.sort((a, b) => b.churnScore - a.churnScore);

    return {
      predictions: predictions.slice(0, 100),
      summary: {
        totalContacts: contacts.length,
        atRisk: predictions.filter((p) => p.riskLevel === "high").length,
        moderate: predictions.filter((p) => p.riskLevel === "medium").length,
        low: predictions.filter((p) => p.riskLevel === "low").length,
      },
    };
  },
});

// Get churn trends over time
export const getChurnTrends = query({
  args: {
    businessId: v.id("businesses"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    // Calculate monthly churn rates
    const monthlyData = [];
    const monthMs = 30 * 24 * 60 * 60 * 1000;
    
    for (let time = args.startDate; time <= args.endDate; time += monthMs) {
      const periodEnd = time + monthMs;
      
      // Active users at start of period
      const activeAtStart = contacts.filter(
        (c) => c.createdAt < time && (!c.lastEngagedAt || c.lastEngagedAt >= time)
      ).length;
      
      // Users who churned during period
      const churned = contacts.filter(
        (c) =>
          c.createdAt < time &&
          c.lastEngagedAt &&
          c.lastEngagedAt >= time &&
          c.lastEngagedAt < periodEnd &&
          (Date.now() - c.lastEngagedAt) > 30 * 24 * 60 * 60 * 1000
      ).length;
      
      const churnRate = activeAtStart > 0 
        ? Math.round((churned / activeAtStart) * 100) 
        : 0;
      
      monthlyData.push({
        period: time,
        activeUsers: activeAtStart,
        churnedUsers: churned,
        churnRate,
      });
    }

    return monthlyData;
  },
});

// Get churn factors analysis
export const getChurnFactors = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const now = Date.now();
    const factors = {
      lowEngagement: 0,
      noRecentActivity: 0,
      shortTenure: 0,
      negativeStatus: 0,
    };

    for (const contact of contacts) {
      const daysSinceEngagement = contact.lastEngagedAt
        ? (now - contact.lastEngagedAt) / (1000 * 60 * 60 * 24)
        : Infinity;
      
      const daysSinceCreation = (now - contact.createdAt) / (1000 * 60 * 60 * 24);

      if (daysSinceEngagement > 30) {
        factors.noRecentActivity++;
      }
      
      if (daysSinceEngagement > 14 && daysSinceEngagement <= 30) {
        factors.lowEngagement++;
      }
      
      if (daysSinceCreation < 30 && daysSinceEngagement > 7) {
        factors.shortTenure++;
      }
      
      if (contact.status === "bounced" || contact.status === "complained") {
        factors.negativeStatus++;
      }
    }

    return {
      factors,
      total: contacts.length,
      percentages: {
        lowEngagement: Math.round((factors.lowEngagement / contacts.length) * 100),
        noRecentActivity: Math.round((factors.noRecentActivity / contacts.length) * 100),
        shortTenure: Math.round((factors.shortTenure / contacts.length) * 100),
        negativeStatus: Math.round((factors.negativeStatus / contacts.length) * 100),
      },
    };
  },
});

// Helper function to calculate churn risk
function calculateChurnRisk(contact: any, now: number) {
  let score = 0;
  const factors: string[] = [];
  
  const daysSinceEngagement = contact.lastEngagedAt
    ? (now - contact.lastEngagedAt) / (1000 * 60 * 60 * 24)
    : Infinity;
  
  const daysSinceCreation = (now - contact.createdAt) / (1000 * 60 * 60 * 24);

  // Factor 1: Days since last engagement
  if (daysSinceEngagement > 60) {
    score += 40;
    factors.push("No activity for 60+ days");
  } else if (daysSinceEngagement > 30) {
    score += 25;
    factors.push("No activity for 30+ days");
  } else if (daysSinceEngagement > 14) {
    score += 15;
    factors.push("Low recent activity");
  }

  // Factor 2: Short tenure with low engagement
  if (daysSinceCreation < 30 && daysSinceEngagement > 7) {
    score += 20;
    factors.push("New user with low engagement");
  }

  // Factor 3: Negative status
  if (contact.status === "bounced" || contact.status === "complained") {
    score += 30;
    factors.push("Negative email status");
  }

  // Factor 4: No tags (low personalization)
  if (!contact.tags || contact.tags.length === 0) {
    score += 10;
    factors.push("No segmentation tags");
  }

  // Determine risk level
  let level: "low" | "medium" | "high";
  if (score >= 70) {
    level = "high";
  } else if (score >= 40) {
    level = "medium";
  } else {
    level = "low";
  }

  return {
    score: Math.min(score, 100),
    level,
    factors,
    daysSinceEngagement: Math.round(daysSinceEngagement),
  };
}
