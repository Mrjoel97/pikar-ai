"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

/**
 * Generate automated insights from social media performance data
 */
export const generateInsights = action({
  args: {
    businessId: v.id("businesses"),
    platform: v.union(v.literal("twitter"), v.literal("linkedin"), v.literal("facebook")),
    timeRange: v.optional(v.union(v.literal("7d"), v.literal("30d"), v.literal("90d"))),
    metrics: v.optional(v.object({
      totalPosts: v.number(),
      totalEngagement: v.number(),
      avgEngagementRate: v.number(),
      topPerformingPosts: v.array(v.any()),
      worstPerformingPosts: v.array(v.any()),
    })),
  },
  handler: async (ctx, args) => {
    const { platform, timeRange = "30d", metrics } = args;

    if (!metrics) {
      return {
        insights: [],
        recommendations: [],
        error: "No metrics provided for analysis",
      };
    }

    const prompt = `
Analyze this ${platform} performance data for the last ${timeRange} and generate actionable insights:

Metrics:
- Total posts: ${metrics.totalPosts}
- Total engagement: ${metrics.totalEngagement}
- Average engagement rate: ${metrics.avgEngagementRate}%

Generate:
1. 3-5 key insights about performance patterns
2. 3-5 specific, actionable recommendations

Return JSON format:
{
  "insights": [
    {"type": "positive|negative|neutral", "title": "...", "description": "..."}
  ],
  "recommendations": [
    {"priority": "high|medium|low", "action": "...", "expectedImpact": "..."}
  ],
  "summary": "Overall performance summary"
}
`.trim();

    try {
      const response = await ctx.runAction(api.openai.generate, {
        prompt,
        model: "gpt-4o-mini",
        maxTokens: 600,
      });

      const text = (response as any)?.text || "";
      
      let analysis;
      try {
        analysis = JSON.parse(text);
      } catch {
        analysis = {
          insights: [{
            type: "neutral",
            title: "Performance Analysis",
            description: `Posted ${metrics.totalPosts} times with ${metrics.avgEngagementRate}% avg engagement`,
          }],
          recommendations: [{
            priority: "medium",
            action: "Maintain consistent posting schedule",
            expectedImpact: "Steady audience growth",
          }],
          summary: `${platform} performance is tracking with ${metrics.totalEngagement} total engagements`,
        };
      }

      await ctx.runMutation(api.telemetry.logEvent, {
        businessId: args.businessId,
        eventName: "analytics_insights_generated",
        metadata: {
          platform,
          timeRange,
          insightsCount: analysis.insights?.length || 0,
        },
      });

      return {
        platform,
        timeRange,
        insights: analysis.insights || [],
        recommendations: analysis.recommendations || [],
        summary: analysis.summary || "",
      };
    } catch (error) {
      return {
        platform,
        timeRange,
        insights: [],
        recommendations: [],
        error: String(error).slice(0, 200),
      };
    }
  },
});

/**
 * Competitor analysis (Enterprise tier only)
 */
export const analyzeCompetitors = action({
  args: {
    businessId: v.id("businesses"),
    platform: v.union(v.literal("twitter"), v.literal("linkedin"), v.literal("facebook")),
    competitorHandles: v.array(v.string()),
    ownMetrics: v.optional(v.object({
      avgEngagementRate: v.number(),
      postFrequency: v.number(),
      followerGrowth: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const { platform, competitorHandles, ownMetrics } = args;

    // Verify Enterprise tier
    const business = await ctx.runQuery(api.businesses.getById, { businessId: args.businessId });
    if (!business || business.tier !== "enterprise") {
      return {
        error: "Competitor analysis is only available for Enterprise tier",
        requiresUpgrade: true,
      };
    }

    const prompt = `
Perform competitive analysis for ${platform}:

Our metrics:
- Engagement rate: ${ownMetrics?.avgEngagementRate || "N/A"}%
- Post frequency: ${ownMetrics?.postFrequency || "N/A"} posts/week
- Follower growth: ${ownMetrics?.followerGrowth || "N/A"}%

Competitors: ${competitorHandles.join(", ")}

Provide:
1. Competitive positioning analysis
2. Content strategy gaps
3. Opportunities to differentiate
4. Benchmarking insights

Return JSON format:
{
  "positioning": "...",
  "gaps": ["gap1", "gap2", "gap3"],
  "opportunities": ["opp1", "opp2", "opp3"],
  "benchmarks": {
    "engagementRate": {"us": 0, "industry": 0, "status": "above|below|average"},
    "postFrequency": {"us": 0, "industry": 0, "status": "above|below|average"}
  }
}
`.trim();

    try {
      const response = await ctx.runAction(api.openai.generate, {
        prompt,
        model: "gpt-4o-mini",
        maxTokens: 700,
      });

      const text = (response as any)?.text || "";
      
      let analysis;
      try {
        analysis = JSON.parse(text);
      } catch {
        analysis = {
          positioning: "Competitive analysis in progress",
          gaps: ["Content frequency", "Engagement tactics", "Audience targeting"],
          opportunities: ["Niche content", "Thought leadership", "Community building"],
          benchmarks: {
            engagementRate: { us: ownMetrics?.avgEngagementRate || 0, industry: 3.5, status: "average" },
            postFrequency: { us: ownMetrics?.postFrequency || 0, industry: 5, status: "average" },
          },
        };
      }

      await ctx.runMutation(api.audit.write, {
        businessId: args.businessId,
        action: "competitor_analysis_run",
        entityType: "analytics",
        entityId: platform,
        details: {
          platform,
          competitorCount: competitorHandles.length,
        },
      });

      return {
        platform,
        competitors: competitorHandles,
        analysis,
      };
    } catch (error) {
      return {
        platform,
        competitors: competitorHandles,
        error: String(error).slice(0, 200),
      };
    }
  },
});

/**
 * Detect trending topics and patterns
 */
export const detectTrends = action({
  args: {
    businessId: v.id("businesses"),
    platform: v.union(v.literal("twitter"), v.literal("linkedin"), v.literal("facebook")),
    industry: v.optional(v.string()),
    recentPosts: v.optional(v.array(v.object({
      content: v.string(),
      engagement: v.number(),
      timestamp: v.number(),
    }))),
  },
  handler: async (ctx, args) => {
    const { platform, industry, recentPosts = [] } = args;

    let businessContext = "";
    try {
      const business = await ctx.runQuery(api.businesses.getById, { businessId: args.businessId });
      if (business) {
        businessContext = `Industry: ${business.industry || industry || "general"}`;
      }
    } catch (e) {
      // Continue without business context
    }

    const postsContext = recentPosts.length > 0
      ? `Recent posts analysis:\n${recentPosts.slice(0, 5).map(p => `- "${p.content.slice(0, 100)}..." (${p.engagement} engagements)`).join("\n")}`
      : "No recent posts data available";

    const prompt = `
Detect trending topics and patterns for ${platform}:

${businessContext}
${postsContext}

Identify:
1. Emerging trends relevant to this business
2. Content patterns that drive engagement
3. Optimal content themes to focus on
4. Trending hashtags and topics

Return JSON format:
{
  "trends": [
    {"topic": "...", "relevance": "high|medium|low", "momentum": "rising|stable|declining"}
  ],
  "patterns": [
    {"pattern": "...", "impact": "..."}
  ],
  "recommendedThemes": ["theme1", "theme2", "theme3"],
  "trendingHashtags": ["#tag1", "#tag2", "#tag3"]
}
`.trim();

    try {
      const response = await ctx.runAction(api.openai.generate, {
        prompt,
        model: "gpt-4o-mini",
        maxTokens: 600,
      });

      const text = (response as any)?.text || "";
      
      let trends;
      try {
        trends = JSON.parse(text);
      } catch {
        trends = {
          trends: [
            { topic: "Industry insights", relevance: "high", momentum: "rising" },
            { topic: "Product updates", relevance: "medium", momentum: "stable" },
          ],
          patterns: [
            { pattern: "Visual content performs better", impact: "Higher engagement rates" },
          ],
          recommendedThemes: ["Thought leadership", "Customer success", "Industry news"],
          trendingHashtags: ["#innovation", "#growth", "#success"],
        };
      }

      await ctx.runMutation(api.telemetry.logEvent, {
        businessId: args.businessId,
        eventName: "trends_detected",
        metadata: {
          platform,
          trendsCount: trends.trends?.length || 0,
        },
      });

      return {
        platform,
        industry: businessContext,
        trends: trends.trends || [],
        patterns: trends.patterns || [],
        recommendedThemes: trends.recommendedThemes || [],
        trendingHashtags: trends.trendingHashtags || [],
      };
    } catch (error) {
      return {
        platform,
        trends: [],
        patterns: [],
        error: String(error).slice(0, 200),
      };
    }
  },
});

/**
 * Generate performance recommendations
 */
export const generateRecommendations = action({
  args: {
    businessId: v.id("businesses"),
    platform: v.union(v.literal("twitter"), v.literal("linkedin"), v.literal("facebook")),
    currentPerformance: v.object({
      avgEngagementRate: v.number(),
      postFrequency: v.number(),
      bestPostingTimes: v.array(v.string()),
      topContentTypes: v.array(v.string()),
    }),
    goals: v.optional(v.object({
      targetEngagementRate: v.optional(v.number()),
      targetFollowerGrowth: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const { platform, currentPerformance, goals } = args;

    const prompt = `
Generate performance improvement recommendations for ${platform}:

Current Performance:
- Engagement rate: ${currentPerformance.avgEngagementRate}%
- Post frequency: ${currentPerformance.postFrequency} posts/week
- Best posting times: ${currentPerformance.bestPostingTimes.join(", ")}
- Top content types: ${currentPerformance.topContentTypes.join(", ")}

Goals:
- Target engagement rate: ${goals?.targetEngagementRate || "Not set"}%
- Target follower growth: ${goals?.targetFollowerGrowth || "Not set"}%

Provide:
1. Specific, actionable recommendations (5-7)
2. Quick wins (can be implemented immediately)
3. Long-term strategies
4. Content optimization tips

Return JSON format:
{
  "recommendations": [
    {
      "category": "content|timing|engagement|growth",
      "priority": "high|medium|low",
      "action": "...",
      "rationale": "...",
      "expectedImpact": "...",
      "timeframe": "immediate|short-term|long-term"
    }
  ],
  "quickWins": ["win1", "win2", "win3"],
  "contentTips": ["tip1", "tip2", "tip3"]
}
`.trim();

    try {
      const response = await ctx.runAction(api.openai.generate, {
        prompt,
        model: "gpt-4o-mini",
        maxTokens: 700,
      });

      const text = (response as any)?.text || "";
      
      let recommendations;
      try {
        recommendations = JSON.parse(text);
      } catch {
        recommendations = {
          recommendations: [
            {
              category: "timing",
              priority: "high",
              action: "Post during peak engagement hours",
              rationale: "Your audience is most active during these times",
              expectedImpact: "15-20% increase in engagement",
              timeframe: "immediate",
            },
            {
              category: "content",
              priority: "high",
              action: "Increase visual content ratio",
              rationale: "Visual posts perform 2x better",
              expectedImpact: "Higher engagement rates",
              timeframe: "short-term",
            },
          ],
          quickWins: [
            "Use trending hashtags",
            "Post at optimal times",
            "Add more visuals",
          ],
          contentTips: [
            "Keep captions concise",
            "Ask questions to drive comments",
            "Share behind-the-scenes content",
          ],
        };
      }

      await ctx.runMutation(api.telemetry.logEvent, {
        businessId: args.businessId,
        eventName: "performance_recommendations_generated",
        metadata: {
          platform,
          recommendationsCount: recommendations.recommendations?.length || 0,
        },
      });

      return {
        platform,
        currentPerformance,
        goals,
        recommendations: recommendations.recommendations || [],
        quickWins: recommendations.quickWins || [],
        contentTips: recommendations.contentTips || [],
      };
    } catch (error) {
      return {
        platform,
        recommendations: [],
        quickWins: [],
        contentTips: [],
        error: String(error).slice(0, 200),
      };
    }
  },
});
