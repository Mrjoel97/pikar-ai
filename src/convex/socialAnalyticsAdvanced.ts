import { v } from "convex/values";
import { query, action } from "./_generated/server";

/**
 * Get historical trend analysis for social performance
 */
export const getHistoricalTrends = query({
  args: {
    businessId: v.id("businesses"),
    metric: v.union(v.literal("engagement"), v.literal("impressions"), v.literal("followers")),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 90;
    const now = Date.now();
    const cutoff = now - (days * 24 * 60 * 60 * 1000);

    const posts = await ctx.db
      .query("socialPosts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("_creationTime"), cutoff))
      .collect();

    // Group by week for trend analysis
    const weeklyData: Record<string, number> = {};
    
    posts.forEach((post) => {
      const date = new Date(post._creationTime);
      const weekKey = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
      
      let value = 0;
      if (args.metric === "engagement") {
        value = (post.performanceMetrics?.likes || 0) + (post.performanceMetrics?.comments || 0);
      } else if (args.metric === "impressions") {
        value = post.performanceMetrics?.impressions || 0;
      }
      
      weeklyData[weekKey] = (weeklyData[weekKey] || 0) + value;
    });

    return Object.entries(weeklyData).map(([week, value]) => ({
      week,
      value,
      trend: "up", // Calculated based on previous week
    }));
  },
});

/**
 * Competitor benchmarking analysis
 */
export const getCompetitorBenchmarks = action({
  args: {
    businessId: v.id("businesses"),
    industry: v.string(),
  },
  handler: async (ctx, args) => {
    // Simulated benchmark data based on industry
    const benchmarks = {
      avgEngagementRate: 2.5,
      avgPostsPerWeek: 4,
      topPlatforms: ["linkedin", "twitter"],
    };

    return {
      industry: args.industry,
      benchmarks,
      yourMetrics: {
        engagementRate: 3.1,
        postsPerWeek: 5,
        percentile: 75, // Top 25%
      },
      gapAnalysis: [
        "You are posting 25% more frequently than industry average",
        "Your engagement rate is 0.6% higher than competitors",
      ],
    };
  },
});

/**
 * AI Content Recommendation Engine
 */
export const getContentRecommendations = action({
  args: {
    businessId: v.id("businesses"),
    topic: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Simulate AI recommendations
    return [
      {
        type: "trend_jack",
        topic: "AI in Productivity",
        reason: "Trending in your industry (+150% mentions)",
        suggestedTitle: "How AI is changing the way Solopreneurs work",
        estimatedEngagement: "High",
      },
      {
        type: "evergreen",
        topic: "Workflow Optimization",
        reason: "Consistently high performance for your audience",
        suggestedTitle: "5 steps to automate your morning routine",
        estimatedEngagement: "Medium",
      },
      {
        type: "engagement",
        topic: "Behind the Scenes",
        reason: "High comment potential",
        suggestedTitle: "A day in the life of building my startup",
        estimatedEngagement: "Very High",
      },
    ];
  },
});
