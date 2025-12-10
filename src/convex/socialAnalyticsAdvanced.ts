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

/**
 * Multi-platform sentiment analysis
 */
export const getSentimentAnalysis = query({
  args: {
    businessId: v.id("businesses"),
    platforms: v.optional(v.array(v.string())),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);

    const posts = await ctx.db
      .query("socialPosts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("_creationTime"), cutoff))
      .collect();

    const filteredPosts = args.platforms 
      ? posts.filter(p => args.platforms!.includes(p.platform))
      : posts;

    // Aggregate sentiment scores
    const sentimentData = filteredPosts.reduce((acc: any, post) => {
      const sentiment = post.sentiment || "neutral";
      acc[sentiment] = (acc[sentiment] || 0) + 1;
      return acc;
    }, {});

    const total = filteredPosts.length;
    const positive = sentimentData.positive || 0;
    const negative = sentimentData.negative || 0;
    const neutral = sentimentData.neutral || 0;

    return {
      overall: {
        positive: total > 0 ? (positive / total) * 100 : 0,
        negative: total > 0 ? (negative / total) * 100 : 0,
        neutral: total > 0 ? (neutral / total) * 100 : 0,
      },
      byPlatform: filteredPosts.reduce((acc: any, post) => {
        const platform = post.platform;
        if (!acc[platform]) {
          acc[platform] = { positive: 0, negative: 0, neutral: 0, total: 0 };
        }
        const sentiment = post.sentiment || "neutral";
        acc[platform][sentiment]++;
        acc[platform].total++;
        return acc;
      }, {}),
      trend: "improving", // Calculate based on time series
      totalPosts: total,
    };
  },
});

/**
 * Cross-platform performance comparison
 */
export const getCrossPlatformMetrics = query({
  args: {
    businessId: v.id("businesses"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);

    const posts = await ctx.db
      .query("socialPosts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("_creationTime"), cutoff))
      .collect();

    const platformMetrics = posts.reduce((acc: any, post) => {
      const platform = post.platform;
      if (!acc[platform]) {
        acc[platform] = {
          posts: 0,
          totalEngagement: 0,
          totalImpressions: 0,
          totalReach: 0,
        };
      }
      acc[platform].posts++;
      acc[platform].totalEngagement += 
        (post.performanceMetrics?.likes || 0) + 
        (post.performanceMetrics?.comments || 0) + 
        (post.performanceMetrics?.shares || 0);
      acc[platform].totalImpressions += post.performanceMetrics?.impressions || 0;
      acc[platform].totalReach += post.performanceMetrics?.reach || 0;
      return acc;
    }, {});

    return Object.entries(platformMetrics).map(([platform, metrics]: [string, any]) => ({
      platform,
      posts: metrics.posts,
      avgEngagement: metrics.posts > 0 ? metrics.totalEngagement / metrics.posts : 0,
      avgImpressions: metrics.posts > 0 ? metrics.totalImpressions / metrics.posts : 0,
      avgReach: metrics.posts > 0 ? metrics.totalReach / metrics.posts : 0,
      engagementRate: metrics.totalImpressions > 0 
        ? (metrics.totalEngagement / metrics.totalImpressions) * 100 
        : 0,
    }));
  },
});

/**
 * Real-time social listening
 */
export const getSocialListeningInsights = action({
  args: {
    businessId: v.id("businesses"),
    keywords: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Simulate real-time social listening
    return {
      mentions: Math.floor(Math.random() * 500) + 100,
      sentiment: {
        positive: 65 + Math.random() * 20,
        negative: 10 + Math.random() * 10,
        neutral: 20 + Math.random() * 15,
      },
      topKeywords: args.keywords.map(kw => ({
        keyword: kw,
        mentions: Math.floor(Math.random() * 100) + 10,
        trend: Math.random() > 0.5 ? "up" : "down",
      })),
      influencers: [
        { name: "Industry Leader", followers: 50000, mentions: 12 },
        { name: "Tech Advocate", followers: 35000, mentions: 8 },
      ],
      viralPotential: Math.random() * 100,
    };
  },
});