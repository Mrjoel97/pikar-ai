import { v } from "convex/values";
import { query, action, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internalQuery, internalMutation, internal } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Aggregate engagement metrics across all posts for a business
 */
export const getEngagementMetrics = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    timeRange: v.optional(v.union(v.literal("7d"), v.literal("30d"), v.literal("90d"), v.literal("1y"))),
  },
  handler: async (ctx: any, args) => {
    // Guest/public: no business context → return empty metrics
    if (!args.businessId) {
      return {
        totalPosts: 0,
        postsWithMetrics: 0,
        totalImpressions: 0,
        totalEngagements: 0,
        totalClicks: 0,
        totalShares: 0,
        totalComments: 0,
        totalLikes: 0,
        engagementRate: 0,
        avgImpressions: 0,
        avgEngagements: 0,
      };
    }

    const now = Date.now();
    const timeRangeMs: Record<string, number> = {
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
      "1y": 365 * 24 * 60 * 60 * 1000,
    };
    const cutoff = now - (timeRangeMs[args.timeRange || "30d"] || timeRangeMs["30d"]);

    const posts = await ctx.db
      .query("socialPosts")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .filter((q: any) => q.gte(q.field("_creationTime"), cutoff))
      .collect();

    let totalImpressions = 0;
    let totalEngagements = 0;
    let totalClicks = 0;
    let totalShares = 0;
    let totalComments = 0;
    let totalLikes = 0;
    let postsWithMetrics = 0;

    for (const post of posts) {
      if (post.performanceMetrics) {
        totalImpressions += post.performanceMetrics.impressions || 0;
        totalEngagements += post.performanceMetrics.engagements || 0;
        totalClicks += post.performanceMetrics.clicks || 0;
        totalShares += post.performanceMetrics.shares || 0;
        totalComments += post.performanceMetrics.comments || 0;
        totalLikes += post.performanceMetrics.likes || 0;
        postsWithMetrics++;
      }
    }

    const engagementRate = totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0;

    return {
      totalPosts: posts.length,
      postsWithMetrics,
      totalImpressions,
      totalEngagements,
      totalClicks,
      totalShares,
      totalComments,
      totalLikes,
      engagementRate: parseFloat(engagementRate.toFixed(2)),
      avgImpressions: postsWithMetrics > 0 ? Math.round(totalImpressions / postsWithMetrics) : 0,
      avgEngagements: postsWithMetrics > 0 ? Math.round(totalEngagements / postsWithMetrics) : 0,
    };
  },
});

/**
 * Calculate ROI per post based on performance metrics and revenue attribution
 */
export const getPostROI = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    timeRange: v.optional(v.union(v.literal("7d"), v.literal("30d"), v.literal("90d"), v.literal("1y"))),
  },
  handler: async (ctx: any, args) => {
    // Guest/public: no business context → return empty
    if (!args.businessId) {
      return {
        posts: [],
        summary: {
          totalPosts: 0,
          totalCost: 0,
          totalRevenue: 0,
          overallROI: 0,
        },
      };
    }

    const now = Date.now();
    const timeRangeMs: Record<string, number> = {
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
      "1y": 365 * 24 * 60 * 60 * 1000,
    };
    const cutoff = now - (timeRangeMs[args.timeRange || "30d"] || timeRangeMs["30d"]);

    const posts = await ctx.db
      .query("socialPosts")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .filter((q: any) => q.gte(q.field("_creationTime"), cutoff))
      .collect();

    // Estimate cost per post (time + platform costs)
    const avgCostPerPost = 25; // $25 estimated cost per post (time + tools)

    const postROIs = posts
      .filter((p: any) => p.performanceMetrics && p.status === "posted")
      .map((post: any) => {
        const metrics = post.performanceMetrics!;
        // Estimate revenue: $0.50 per click, $2 per engagement
        const estimatedRevenue = (metrics.clicks * 0.5) + (metrics.engagements * 2);
        const roi = avgCostPerPost > 0 ? estimatedRevenue / avgCostPerPost : 0;

        return {
          postId: post._id,
          content: post.content.substring(0, 100),
          platforms: post.platforms,
          impressions: metrics.impressions,
          engagements: metrics.engagements,
          clicks: metrics.clicks,
          estimatedCost: avgCostPerPost,
          estimatedRevenue: parseFloat(estimatedRevenue.toFixed(2)),
          roi: parseFloat(roi.toFixed(2)),
          publishedAt: post.postedAt || post._creationTime,
        };
      })
      .sort((a: any, b: any) => b.roi - a.roi);

    const totalCost = posts.length * avgCostPerPost;
    const totalRevenue = postROIs.reduce((sum: any, p: any) => sum + p.estimatedRevenue, 0);
    const overallROI = totalCost > 0 ? totalRevenue / totalCost : 0;

    return {
      posts: postROIs.slice(0, 10), // Top 10 posts by ROI
      summary: {
        totalPosts: posts.length,
        totalCost,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        overallROI: parseFloat(overallROI.toFixed(2)),
      },
    };
  },
});

/**
 * Track audience growth over time
 */
export const getAudienceGrowth = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    timeRange: v.optional(v.union(v.literal("7d"), v.literal("30d"), v.literal("90d"), v.literal("1y"))),
  },
  handler: async (ctx: any, args) => {
    // Guest/public: no business context → return empty
    if (!args.businessId) {
      return {
        growthData: [],
        summary: {
          totalNewFollowers: 0,
          avgDailyGrowth: 0,
          growthRate: 0,
        },
      };
    }

    const now = Date.now();
    const timeRangeMs: Record<string, number> = {
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
      "1y": 365 * 24 * 60 * 60 * 1000,
    };
    const range = args.timeRange || "30d";
    const cutoff = now - timeRangeMs[range];

    const posts = await ctx.db
      .query("socialPosts")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .filter((q: any) => q.gte(q.field("_creationTime"), cutoff))
      .collect();

    // Group posts by day and calculate cumulative impressions (proxy for audience reach)
    const dayMs = 24 * 60 * 60 * 1000;
    const daysInRange = Math.ceil(timeRangeMs[range] / dayMs);
    const growthData: Array<{ date: string; impressions: number; engagements: number; followers: number }> = [];

    for (let i = 0; i < daysInRange; i++) {
      const dayStart = cutoff + (i * dayMs);
      const dayEnd = dayStart + dayMs;
      const dayPosts = posts.filter((p: any) => p._creationTime >= dayStart && p._creationTime < dayEnd);

      const dayImpressions = dayPosts.reduce((sum: any, p: any) => sum + (p.performanceMetrics?.impressions || 0), 0);
      const dayEngagements = dayPosts.reduce((sum: any, p: any) => sum + (p.performanceMetrics?.engagements || 0), 0);
      
      // Estimate follower growth: 1% of impressions convert to followers
      const estimatedNewFollowers = Math.round(dayImpressions * 0.01);

      growthData.push({
        date: new Date(dayStart).toISOString().split("T")[0],
        impressions: dayImpressions,
        engagements: dayEngagements,
        followers: estimatedNewFollowers,
      });
    }

    const totalNewFollowers = growthData.reduce((sum, d) => sum + d.followers, 0);
    const avgDailyGrowth = daysInRange > 0 ? totalNewFollowers / daysInRange : 0;

    return {
      growthData,
      summary: {
        totalNewFollowers,
        avgDailyGrowth: parseFloat(avgDailyGrowth.toFixed(1)),
        growthRate: parseFloat(((totalNewFollowers / Math.max(1, posts.length)) * 100).toFixed(2)),
      },
    };
  },
});

/**
 * Generate actionable insights based on analytics data
 */
export const generateInsights = query({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx: any, args) => {
    // Guest/public: no business context → return empty
    if (!args.businessId) {
      return {
        insights: [],
        summary: {
          totalInsights: 0,
          highPriority: 0,
          mediumPriority: 0,
          lowPriority: 0,
        },
      };
    }

    // Get recent posts (last 30 days)
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

    const posts = await ctx.db
      .query("socialPosts")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .filter((q: any) => q.gte(q.field("_creationTime"), thirtyDaysAgo))
      .collect();

    const insights: Array<{ type: string; priority: string; message: string; actionable: string }> = [];

    // Insight 1: Posting frequency
    const postsPerWeek = (posts.length / 4.3).toFixed(1);
    if (parseFloat(postsPerWeek) < 3) {
      insights.push({
        type: "frequency",
        priority: "high",
        message: `You're posting ${postsPerWeek} times per week. Increase to 5-7 posts/week for better engagement.`,
        actionable: "Schedule more posts using the Post Scheduler",
      });
    }

    // Insight 2: Best performing platform
    const platformPerformance: Record<string, { posts: number; avgEngagement: number }> = {};
    for (const post of posts) {
      if (post.performanceMetrics) {
        for (const platform of post.platforms) {
          if (!platformPerformance[platform]) {
            platformPerformance[platform] = { posts: 0, avgEngagement: 0 };
          }
          platformPerformance[platform].posts++;
          platformPerformance[platform].avgEngagement += post.performanceMetrics.engagements;
        }
      }
    }

    let bestPlatform = "";
    let bestEngagement = 0;
    for (const [platform, data] of Object.entries(platformPerformance)) {
      const avg = data.posts > 0 ? data.avgEngagement / data.posts : 0;
      if (avg > bestEngagement) {
        bestEngagement = avg;
        bestPlatform = platform;
      }
    }

    if (bestPlatform) {
      insights.push({
        type: "platform",
        priority: "medium",
        message: `${bestPlatform.charAt(0).toUpperCase() + bestPlatform.slice(1)} is your best performing platform with ${bestEngagement.toFixed(0)} avg engagements.`,
        actionable: `Focus more content on ${bestPlatform}`,
      });
    }

    // Insight 3: Engagement rate
    const postsWithMetrics = posts.filter((p: any) => p.performanceMetrics);
    if (postsWithMetrics.length > 0) {
      const totalImpressions = postsWithMetrics.reduce((sum: any, p: any) => sum + (p.performanceMetrics?.impressions || 0), 0);
      const totalEngagements = postsWithMetrics.reduce((sum: any, p: any) => sum + (p.performanceMetrics?.engagements || 0), 0);
      const engagementRate = totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0;

      if (engagementRate < 2) {
        insights.push({
          type: "engagement",
          priority: "high",
          message: `Your engagement rate is ${engagementRate.toFixed(2)}%. Industry average is 2-3%.`,
          actionable: "Use AI content generation to improve post quality",
        });
      } else if (engagementRate > 4) {
        insights.push({
          type: "engagement",
          priority: "low",
          message: `Excellent! Your engagement rate is ${engagementRate.toFixed(2)}%, above industry average.`,
          actionable: "Keep up the great work and maintain consistency",
        });
      }
    }

    // Insight 4: Content timing
    const hourlyDistribution: Record<number, number> = {};
    for (const post of posts) {
      if (post.postedAt) {
        const hour = new Date(post.postedAt).getHours();
        hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
      }
    }

    const bestHour = Object.entries(hourlyDistribution)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    if (bestHour) {
      insights.push({
        type: "timing",
        priority: "medium",
        message: `Most of your posts are published around ${bestHour}:00. Consider testing different times.`,
        actionable: "Use AI-powered optimal posting time suggestions",
      });
    }

    // Insight 5: AI-generated content performance
    const aiPosts = posts.filter((p: any) => p.aiGenerated);
    const manualPosts = posts.filter((p: any) => !p.aiGenerated);

    if (aiPosts.length > 0 && manualPosts.length > 0) {
      const aiAvgEngagement = aiPosts
        .filter((p: any) => p.performanceMetrics)
        .reduce((sum: any, p: any) => sum + (p.performanceMetrics?.engagements || 0), 0) / aiPosts.length;
      
      const manualAvgEngagement = manualPosts
        .filter((p: any) => p.performanceMetrics)
        .reduce((sum: any, p: any) => sum + (p.performanceMetrics?.engagements || 0), 0) / manualPosts.length;

      if (aiAvgEngagement > manualAvgEngagement * 1.2) {
        insights.push({
          type: "ai_content",
          priority: "medium",
          message: `AI-generated posts perform ${((aiAvgEngagement / manualAvgEngagement - 1) * 100).toFixed(0)}% better than manual posts.`,
          actionable: "Increase use of AI content generation",
        });
      }
    }

    return {
      insights,
      summary: {
        totalInsights: insights.length,
        highPriority: insights.filter((i) => i.priority === "high").length,
        mediumPriority: insights.filter((i) => i.priority === "medium").length,
        lowPriority: insights.filter((i) => i.priority === "low").length,
      },
    };
  },
});

/**
 * Get platform-specific analytics breakdown
 */
export const getPlatformBreakdown = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    timeRange: v.optional(v.union(v.literal("7d"), v.literal("30d"), v.literal("90d"), v.literal("1y"))),
  },
  handler: async (ctx: any, args) => {
    // Guest/public: no business context → return empty
    if (!args.businessId) {
      return [];
    }

    const now = Date.now();
    const timeRangeMs: Record<string, number> = {
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
      "1y": 365 * 24 * 60 * 60 * 1000,
    };
    const cutoff = now - (timeRangeMs[args.timeRange || "30d"] || timeRangeMs["30d"]);

    const posts = await ctx.db
      .query("socialPosts")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .filter((q: any) => q.gte(q.field("_creationTime"), cutoff))
      .collect();

    const platformStats: Record<string, {
      posts: number;
      impressions: number;
      engagements: number;
      clicks: number;
      shares: number;
      comments: number;
      likes: number;
    }> = {
      twitter: { posts: 0, impressions: 0, engagements: 0, clicks: 0, shares: 0, comments: 0, likes: 0 },
      linkedin: { posts: 0, impressions: 0, engagements: 0, clicks: 0, shares: 0, comments: 0, likes: 0 },
      facebook: { posts: 0, impressions: 0, engagements: 0, clicks: 0, shares: 0, comments: 0, likes: 0 },
    };

    for (const post of posts) {
      if (post.performanceMetrics) {
        for (const platform of post.platforms) {
          const stats = platformStats[platform];
          if (stats) {
            stats.posts++;
            stats.impressions += post.performanceMetrics.impressions || 0;
            stats.engagements += post.performanceMetrics.engagements || 0;
            stats.clicks += post.performanceMetrics.clicks || 0;
            stats.shares += post.performanceMetrics.shares || 0;
            stats.comments += post.performanceMetrics.comments || 0;
            stats.likes += post.performanceMetrics.likes || 0;
          }
        }
      }
    }

    const breakdown = Object.entries(platformStats).map(([platform, stats]) => ({
      platform,
      posts: stats.posts,
      impressions: stats.impressions,
      engagements: stats.engagements,
      clicks: stats.clicks,
      shares: stats.shares,
      comments: stats.comments,
      likes: stats.likes,
      engagementRate: stats.impressions > 0 ? parseFloat(((stats.engagements / stats.impressions) * 100).toFixed(2)) : 0,
      avgImpressions: stats.posts > 0 ? Math.round(stats.impressions / stats.posts) : 0,
      avgEngagements: stats.posts > 0 ? Math.round(stats.engagements / stats.posts) : 0,
    }));

    return breakdown;
  },
});

/**
 * Get multi-brand performance comparison (guest-safe)
 */
export const getMultiBrandMetrics = query({
  args: {
    // Make businessId optional for guest/public views
    businessId: v.optional(v.id("businesses")),
    timeRange: v.optional(
      v.union(v.literal("7d"), v.literal("30d"), v.literal("90d"), v.literal("1y"))
    ),
  },
  handler: async (ctx: any, args) => {
    // Guest/public: no business context → return empty/defaults
    if (!args.businessId) {
      return {
        brands: [],
        totals: { posts: 0, impressions: 0, engagements: 0, clicks: 0, shares: 0, comments: 0, likes: 0 },
        timeRange: args.timeRange || "30d",
      };
    }

    const now = Date.now();
    const timeRangeMs: Record<string, number> = {
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
      "1y": 365 * 24 * 60 * 60 * 1000,
    };
    const cutoff = now - (timeRangeMs[args.timeRange || "30d"] || timeRangeMs["30d"]);

    // Get all brands for this business
    const brands = await ctx.db
      .query("brands")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .filter((q: any) => q.eq(q.field("isActive"), true))
      .collect();

    // Get all posts in time range
    const posts = await ctx.db
      .query("socialPosts")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .filter((q: any) => q.gte(q.field("_creationTime"), cutoff))
      .collect();

    // Aggregate metrics by brand
    const brandMetrics = brands.map((brand: any) => {
      // In a real implementation, posts would have a brandId field
      // For now, we'll distribute posts evenly across brands
      const brandPosts = posts.filter((_: any, idx: any) => idx % brands.length === brands.indexOf(brand));
      
      let totalImpressions = 0;
      let totalEngagements = 0;
      let totalClicks = 0;
      let totalShares = 0;
      let totalComments = 0;
      let totalLikes = 0;

      for (const post of brandPosts) {
        if (post.performanceMetrics) {
          totalImpressions += post.performanceMetrics.impressions || 0;
          totalEngagements += post.performanceMetrics.engagements || 0;
          totalClicks += post.performanceMetrics.clicks || 0;
          totalShares += post.performanceMetrics.shares || 0;
          totalComments += post.performanceMetrics.comments || 0;
          totalLikes += post.performanceMetrics.likes || 0;
        }
      }

      const engagementRate = totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0;

      return {
        brandId: brand._id,
        brandName: brand.name,
        brandColor: brand.primaryColor,
        posts: brandPosts.length,
        impressions: totalImpressions,
        engagements: totalEngagements,
        clicks: totalClicks,
        shares: totalShares,
        comments: totalComments,
        likes: totalLikes,
        engagementRate: parseFloat(engagementRate.toFixed(2)),
        avgImpressions: brandPosts.length > 0 ? Math.round(totalImpressions / brandPosts.length) : 0,
      };
    });

    // Calculate totals
    const totals = {
      posts: posts.length,
      impressions: brandMetrics.reduce((sum: any, b: any) => sum + b.impressions, 0),
      engagements: brandMetrics.reduce((sum: any, b: any) => sum + b.engagements, 0),
      clicks: brandMetrics.reduce((sum: any, b: any) => sum + b.clicks, 0),
      shares: brandMetrics.reduce((sum: any, b: any) => sum + b.shares, 0),
      comments: brandMetrics.reduce((sum: any, b: any) => sum + b.comments, 0),
      likes: brandMetrics.reduce((sum: any, b: any) => sum + b.likes, 0),
    };

    return {
      brands: brandMetrics,
      totals,
      timeRange: args.timeRange || "30d",
    };
  },
});

/**
 * Get cross-platform performance summary (guest-safe)
 */
export const getCrossPlatformSummary = query({
  args: {
    // Make businessId optional for guest/public views
    businessId: v.optional(v.id("businesses")),
    timeRange: v.optional(
      v.union(v.literal("7d"), v.literal("30d"), v.literal("90d"), v.literal("1y"))
    ),
  },
  handler: async (ctx: any, args) => {
    // Guest/public: no business context → return empty/defaults
    if (!args.businessId) {
      return {
        platforms: [],
        totalConnected: 0,
        totalPosts: 0,
        timeRange: args.timeRange || "30d",
      };
    }

    const now = Date.now();
    const timeRangeMs: Record<string, number> = {
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
      "1y": 365 * 24 * 60 * 60 * 1000,
    };
    const cutoff = now - (timeRangeMs[args.timeRange || "30d"] || timeRangeMs["30d"]);

    const posts = await ctx.db
      .query("socialPosts")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .filter((q: any) => q.gte(q.field("_creationTime"), cutoff))
      .collect();

    // Get connected accounts
    const accounts = await ctx.db
      .query("socialAccounts")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId!))
      .filter((q: any) => q.eq(q.field("isActive"), true))
      .collect();

    const platformSummary: any = {
      twitter: { connected: false, posts: 0, engagement: 0 },
      linkedin: { connected: false, posts: 0, engagement: 0 },
      facebook: { connected: false, posts: 0, engagement: 0 },
    };

    // Mark connected platforms
    for (const account of accounts) {
      const platform = account.platform as "twitter" | "linkedin" | "facebook";
      if (platformSummary[platform]) {
        platformSummary[platform].connected = true;
      }
    }

    // Aggregate post metrics by platform
    for (const post of posts) {
      if (post.performanceMetrics) {
        for (const platformRaw of post.platforms) {
          const platformKey2 = platformRaw as "twitter" | "linkedin" | "facebook";
          if (platformSummary[platformKey2]) {
            platformSummary[platformKey2].posts++;
            platformSummary[platformKey2].engagement += (post.performanceMetrics?.engagements || 0);
          }
        }
      }
    }

    return {
      platforms: Object.entries(platformSummary).map(([name, data]: any) => ({
        name,
        ...data,
        avgEngagement: data.posts > 0 ? Math.round(data.engagement / data.posts) : 0,
      })),
      totalConnected: accounts.length,
      totalPosts: posts.length,
    };
  },
});

export const getSolopreneurSocialMetrics = query({
  args: {
    businessId: v.id("businesses"),
    days: v.optional(v.number()),
  },
  handler: async (ctx: any, args) => {
    // Pull all posts for the business via index; keep simple and fast
    const posts: any[] = await ctx.db
      .query("socialPosts")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId))
      .order("desc")
      .collect();

    // Compute metrics with safe fallbacks
    const engagementOf = (p: any) =>
      (p.likes ?? p.metrics?.likes ?? 0) +
      (p.comments ?? p.metrics?.comments ?? 0) +
      (p.shares ?? p.metrics?.shares ?? 0);

    const totalPosts = posts.length;
    const totalEngagement = posts.reduce((sum, p) => sum + engagementOf(p), 0);
    const avgEngagement = totalPosts > 0 ? Math.round((totalEngagement / totalPosts) * 10) / 10 : 0;

    const platformMetrics = posts.reduce((acc: Record<string, { posts: number; engagement: number }>, p: any) => {
      const platforms: string[] = Array.isArray(p.platforms) ? p.platforms : [];
      const eng = engagementOf(p);
      platforms.forEach((pf) => {
        if (!acc[pf]) acc[pf] = { posts: 0, engagement: 0 };
        acc[pf].posts += 1;
        acc[pf].engagement += eng;
      });
      return acc;
    }, {});

    const topPosts = posts
      .slice()
      .sort((a, b) => engagementOf(b) - engagementOf(a))
      .slice(0, 5)
      .map((p) => ({
        _id: p._id,
        content: String(p.content ?? "").slice(0, 140),
        platforms: Array.isArray(p.platforms) ? p.platforms : [],
        engagement: engagementOf(p),
        publishedAt: p.publishedAt ?? p.scheduledAt ?? p._creationTime,
      }));

    return {
      summary: {
        totalPosts,
        totalEngagement,
        avgEngagement,
        reach: posts.reduce((sum, p) => sum + (p.reach ?? p.metrics?.reach ?? 0), 0),
      },
      platformMetrics,
      topPosts,
    };
  },
});

/**
 * Sync real-time metrics from social platforms
 */
export const syncRealTimeMetrics = action({
  args: {
    businessId: v.id("businesses"),
    platform: v.union(v.literal("twitter"), v.literal("linkedin"), v.literal("facebook")),
  },
  handler: async (ctx, args) => {
    // Get account credentials
    const account = await ctx.runQuery(internal.socialAnalytics.getAccountByPlatform, {
      businessId: args.businessId,
      platform: args.platform,
    });

    if (!account || !account.isConnected) {
      throw new Error(`${args.platform} account not connected`);
    }

    // Fetch latest metrics from platform API
    // Implementation depends on platform
    const metrics = await fetchPlatformMetrics(args.platform, account.accessToken);

    // Update posts with new metrics
    await ctx.runMutation(internal.socialAnalytics.updatePostMetrics, {
      businessId: args.businessId,
      platform: args.platform,
      metrics,
    });

    // Update last sync timestamp
    await ctx.runMutation(internal.socialAnalytics.updateLastSync, {
      accountId: account._id,
      timestamp: Date.now(),
    });

    return { success: true, syncedAt: Date.now() };
  },
});

/**
 * Get connection status for all social platforms
 */
export const getConnectionStatus = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const accounts = await ctx.db
      .query("socialAccounts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const status = {
      twitter: { connected: false, lastSync: null as number | null },
      linkedin: { connected: false, lastSync: null as number | null },
      facebook: { connected: false, lastSync: null as number | null },
    };

    for (const account of accounts) {
      if (account.platform in status) {
        status[account.platform as keyof typeof status] = {
          connected: true,
          lastSync: account.lastUsedAt || account.connectedAt,
        };
      }
    }

    return status;
  },
});

/**
 * Refresh platform data (sync latest posts and metrics)
 */
export const refreshPlatformData = mutation({
  args: {
    businessId: v.id("businesses"),
    platform: v.union(v.literal("twitter"), v.literal("linkedin"), v.literal("facebook")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("[ERR_NOT_AUTHENTICATED] You must be signed in.");
    }

    // Update lastUsedAt timestamp
    const account = await ctx.db
      .query("socialAccounts")
      .withIndex("by_business_and_platform", (q) =>
        q.eq("businessId", args.businessId).eq("platform", args.platform)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!account) {
      throw new Error("[ERR_ACCOUNT_NOT_FOUND] Platform not connected");
    }

    await ctx.db.patch(account._id, {
      lastUsedAt: Date.now(),
    });

    // Schedule background sync action
    await ctx.scheduler.runAfter(0, internal.socialIntegrationsActions.syncPlatformData, {
      businessId: args.businessId,
      platform: args.platform,
      accountId: account._id,
    });

    return { success: true };
  },
});

/**
 * Internal mutation to update engagement metrics from webhooks
 */
export const updateEngagementMetrics = internalMutation({
  args: {
    businessId: v.id("businesses"),
    platform: v.string(),
    postId: v.string(),
    likes: v.optional(v.number()),
    comments: v.optional(v.number()),
    shares: v.optional(v.number()),
    retweets: v.optional(v.number()),
    replies: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Find the post in socialPosts table
    const post = await ctx.db
      .query("socialPosts")
      .filter((q) =>
        q.and(
          q.eq(q.field("businessId"), args.businessId),
          q.eq(q.field("externalId"), args.postId)
        )
      )
      .first();

    if (!post) {
      // Post not found, skip update
      return { success: false, reason: "post_not_found" };
    }

    // Update engagement metrics
    const updates: any = {};
    if (args.likes !== undefined) updates.likes = args.likes;
    if (args.comments !== undefined) updates.comments = args.comments;
    if (args.shares !== undefined) updates.shares = args.shares;
    if (args.retweets !== undefined) updates.retweets = args.retweets;
    if (args.replies !== undefined) updates.replies = args.replies;

    await ctx.db.patch(post._id, updates);

    return { success: true };
  },
});

// Internal helper queries/mutations
export const getAccountByPlatform = internalQuery({
  args: {
    businessId: v.id("businesses"),
    platform: v.union(v.literal("twitter"), v.literal("linkedin"), v.literal("facebook")),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("socialAccounts")
      .withIndex("by_business_and_platform", (q) =>
        q.eq("businessId", args.businessId).eq("platform", args.platform)
      )
      .first();
  },
});

export const updatePostMetrics = internalMutation({
  args: {
    businessId: v.id("businesses"),
    platform: v.string(),
    metrics: v.any(),
  },
  handler: async (ctx, args) => {
    // Update post metrics in database
    // Implementation depends on metrics structure
  },
});

export const updateLastSync = internalMutation({
  args: {
    accountId: v.id("socialAccounts"),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.accountId, {
      lastSyncAt: args.timestamp,
    });
  },
});

// Helper function to fetch metrics from platform APIs
async function fetchPlatformMetrics(platform: string, accessToken: string): Promise<any> {
  // Implement platform-specific API calls
  // This is a placeholder
  return {};
}