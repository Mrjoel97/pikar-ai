import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get churn prediction for contacts
 */
export const getChurnPrediction = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.neq(q.field("status"), "churned"))
      .take(1000);

    const now = Date.now();
    const predictions = [];

    for (const contact of contacts) {
      const daysSinceUpdate = contact.updatedAt
        ? (now - contact.updatedAt) / (24 * 60 * 60 * 1000)
        : (now - contact.createdAt) / (24 * 60 * 60 * 1000);

      // Simple churn risk scoring
      let riskScore = 0;
      let riskLevel: "low" | "moderate" | "high" = "low";

      if (daysSinceUpdate > 45) {
        riskScore = 85;
        riskLevel = "high";
      } else if (daysSinceUpdate > 30) {
        riskScore = 60;
        riskLevel = "moderate";
      } else if (daysSinceUpdate > 14) {
        riskScore = 30;
        riskLevel = "moderate";
      } else {
        riskScore = 10;
        riskLevel = "low";
      }

      predictions.push({
        contactId: contact._id,
        email: contact.email,
        name: contact.name,
        riskScore,
        riskLevel,
        daysSinceUpdate: Math.round(daysSinceUpdate),
        recommendation:
          riskLevel === "high"
            ? "Immediate re-engagement campaign needed"
            : riskLevel === "moderate"
            ? "Send personalized check-in email"
            : "Continue regular engagement",
      });
    }

    // Sort by risk score
    predictions.sort((a, b) => b.riskScore - a.riskScore);

    const summary = {
      total: predictions.length,
      atRisk: predictions.filter((p) => p.riskLevel === "high").length,
      moderate: predictions.filter((p) => p.riskLevel === "moderate").length,
      low: predictions.filter((p) => p.riskLevel === "low").length,
    };

    return {
      predictions: predictions.slice(0, 50),
      summary,
    };
  },
});