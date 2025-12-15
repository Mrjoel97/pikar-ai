import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get sentiment analysis across all social platforms
 */
export const getSentimentAnalysis = query({
  args: {
    businessId: v.id("businesses"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const startTime = Date.now() - days * 24 * 60 * 60 * 1000;

    const posts = await ctx.db
      .query("socialPosts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("createdAt"), startTime))
      .collect();

    // Simulate sentiment analysis (in production, this would use AI)
    const sentimentScores = posts.map(post => {
      const engagement = (post.likes || 0) + (post.comments || 0) + (post.shares || 0);
      const avgEngagement = engagement / 3;
      
      // Simple heuristic: higher engagement = more positive
      if (avgEngagement > 100) return "positive";
      if (avgEngagement > 20) return "neutral";
      return "negative";
    });

    const positive = sentimentScores.filter(s => s === "positive").length;
    const neutral = sentimentScores.filter(s => s === "neutral").length;
    const negative = sentimentScores.filter(s => s === "negative").length;
    const total = sentimentScores.length || 1;

    // Calculate by platform
    const byPlatform: Record<string, any> = {};
    posts.forEach(post => {
      const platform = post.platform || "unknown";
      if (!byPlatform[platform]) {
        byPlatform[platform] = { positive: 0, neutral: 0, negative: 0, total: 0 };
      }
      
      const engagement = (post.likes || 0) + (post.comments || 0) + (post.shares || 0);
      const avgEngagement = engagement / 3;
      
      if (avgEngagement > 100) byPlatform[platform].positive++;
      else if (avgEngagement > 20) byPlatform[platform].neutral++;
      else byPlatform[platform].negative++;
      
      byPlatform[platform].total++;
    });

    // Determine trend
    const recentPosts = posts.slice(-Math.floor(posts.length / 3));
    const recentPositive = recentPosts.filter(p => {
      const engagement = ((p.likes || 0) + (p.comments || 0) + (p.shares || 0)) / 3;
      return engagement > 100;
    }).length;
    const recentPositiveRate = recentPosts.length > 0 ? (recentPositive / recentPosts.length) * 100 : 0;
    const overallPositiveRate = (positive / total) * 100;

    const trend = recentPositiveRate > overallPositiveRate + 5 ? "improving" :
                 recentPositiveRate < overallPositiveRate - 5 ? "declining" : "stable";

    return {
      overall: {
        positive: (positive / total) * 100,
        neutral: (neutral / total) * 100,
        negative: (negative / total) * 100,
      },
      byPlatform,
      totalPosts: posts.length,
      trend,
    };
  },
});

/**
 * Get cross-platform performance metrics
 */
export const getCrossPlatformMetrics = query({
  args: {
    businessId: v.id("businesses"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const startTime = Date.now() - days * 24 * 60 * 60 * 1000;

    const posts = await ctx.db
      .query("socialPosts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("createdAt"), startTime))
      .collect();

    // Group by platform
    const platformMetrics: Record<string, any> = {};
    
    posts.forEach(post => {
      const platform = post.platform || "unknown";
      if (!platformMetrics[platform]) {
        platformMetrics[platform] = {
          posts: 0,
          totalEngagement: 0,
          totalReach: 0,
        };
      }
      
      platformMetrics[platform].posts++;
      platformMetrics[platform].totalEngagement += (post.likes || 0) + (post.comments || 0) + (post.shares || 0);
      platformMetrics[platform].totalReach += post.reach || 0;
    });

    // Calculate metrics
    const metrics = Object.entries(platformMetrics).map(([platform, data]) => ({
      platform,
      posts: data.posts,
      avgEngagement: data.posts > 0 ? data.totalEngagement / data.posts : 0,
      avgReach: data.posts > 0 ? data.totalReach / data.posts : 0,
      engagementRate: data.totalReach > 0 ? (data.totalEngagement / data.totalReach) * 100 : 0,
    }));

    return metrics;
  },
});

export const getHistoricalTrends = query({
  args: {
    businessId: v.id("businesses"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days ?? 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    // Get social posts from the last N days
    const posts = await ctx.db
      .query("socialPosts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("createdAt"), cutoff))
      .collect();

    // Aggregate metrics by day
    const trendsByDay: Record<string, {
      date: string;
      posts: number;
      engagement: number;
      reach: number;
    }> = {};

    for (const post of posts) {
      const dateKey = new Date(post.createdAt).toISOString().split('T')[0];
      
      if (!trendsByDay[dateKey]) {
        trendsByDay[dateKey] = {
          date: dateKey,
          posts: 0,
          engagement: 0,
          reach: 0,
        };
      }

      trendsByDay[dateKey].posts += 1;
      trendsByDay[dateKey].engagement += (post.likes || 0) + (post.comments || 0);
      trendsByDay[dateKey].reach += post.reach || 0;
    }

    // Convert to array and sort by date
    const trends = Object.values(trendsByDay).sort((a, b) => 
      a.date.localeCompare(b.date)
    );

    return {
      trends,
      summary: {
        totalPosts: posts.length,
        avgEngagement: trends.length > 0 
          ? trends.reduce((sum, t) => sum + t.engagement, 0) / trends.length 
          : 0,
        avgReach: trends.length > 0
          ? trends.reduce((sum, t) => sum + t.reach, 0) / trends.length
          : 0,
      },
    };
  },
});