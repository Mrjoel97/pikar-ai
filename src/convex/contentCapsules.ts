"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";

/**
 * Generate AI content capsule with multiple content pieces
 */
export const generateContentCapsule = action({
  args: {
    businessId: v.id("businesses"),
    topic: v.optional(v.string()),
    tone: v.optional(v.string()),
    platforms: v.array(v.union(v.literal("twitter"), v.literal("linkedin"), v.literal("facebook"))),
    templateId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{
    weeklyPost: string;
    emailSubject: string;
    emailBody: string;
    tweets: string[];
    linkedinPost: string;
    facebookPost: string;
  }> => {
    // Get business context
    const business = await ctx.runQuery(internal.businesses.getById as any, {
      businessId: args.businessId,
    });

    if (!business) {
      throw new Error("[ERR_BUSINESS_NOT_FOUND] Business not found.");
    }

    // Get agent profile for personalization
    const agentProfile = await ctx.runQuery(api.agentProfile.getMyAgentProfile, {
      businessId: args.businessId,
    });

    // Simulate AI generation (replace with actual OpenAI call)
    const topic = args.topic || "business growth and productivity";
    const tone = args.tone || agentProfile?.tone || "professional";

    const content = {
      weeklyPost: `🚀 Weekly Insight: ${topic}\n\nThis week, we're focusing on strategies that drive real results. Here's what you need to know:\n\n✨ Key takeaway: Success comes from consistent action\n💡 Pro tip: Start small, scale smart\n🎯 Action item: Implement one new strategy today\n\n#BusinessGrowth #Productivity #Success`,
      
      emailSubject: `Your Weekly ${topic.charAt(0).toUpperCase() + topic.slice(1)} Insights`,
      
      emailBody: `Hi there!\n\nWelcome to this week's insights on ${topic}.\n\nWe've been analyzing the latest trends and strategies that successful businesses are using, and we're excited to share what we've learned.\n\nHere are the top 3 insights:\n\n1. Focus on high-impact activities\n2. Leverage automation where possible\n3. Build systems that scale\n\nReady to implement these strategies? Let's dive deeper.\n\nBest regards,\n${business.name}`,
      
      tweets: [
        `🎯 ${topic}: The secret to success? Consistency over intensity. Small daily actions compound into massive results. #BusinessTips`,
        `💡 Quick tip: Automate the repetitive, focus on the strategic. Your time is your most valuable asset. #Productivity`,
        `🚀 Growth hack: Document your processes. What's repeatable is scalable. #BusinessGrowth`,
      ],
      
      linkedinPost: `${topic.charAt(0).toUpperCase() + topic.slice(1)}: A Strategic Perspective\n\nAfter working with hundreds of businesses, I've noticed a pattern among the most successful ones.\n\nThey don't just work harder—they work smarter.\n\nHere's what sets them apart:\n\n→ Clear systems and processes\n→ Data-driven decision making\n→ Continuous optimization\n→ Focus on high-leverage activities\n\nThe question isn't whether you should implement these strategies.\n\nIt's: which one will you start with today?\n\nDrop a comment with your biggest challenge, and let's solve it together.\n\n#BusinessStrategy #Leadership #Growth`,
      
      facebookPost: `🌟 ${topic.charAt(0).toUpperCase() + topic.slice(1)} Made Simple\n\nWe get it—running a business is overwhelming. There's always more to do than time allows.\n\nBut what if you could achieve more by doing less?\n\nHere's how:\n✅ Prioritize ruthlessly\n✅ Automate repetitive tasks\n✅ Delegate what others can do\n✅ Focus on what only YOU can do\n\nIt's not about working 24/7. It's about working on the right things.\n\nWhat's one task you could automate this week? Share below! 👇\n\n#SmallBusiness #Entrepreneurship #ProductivityTips`,
    };

    // Log AI generation for analytics
    await ctx.runMutation(internal.audit.write, {
      businessId: args.businessId,
      action: "content_capsule_generated",
      entityType: "content_capsule",
      entityId: args.businessId,
      details: {
        topic,
        tone,
        platforms: args.platforms,
      },
    });

    return content;
  },
});

/**
 * Publish content capsule to social platforms
 */
export const publishContentCapsule = action({
  args: {
    capsuleId: v.id("contentCapsules"),
  },
  handler: async (ctx, args) => {
    const capsule = await ctx.runQuery(api.contentCapsulesData.getCapsuleById, {
      capsuleId: args.capsuleId,
    });

    if (!capsule) {
      throw new Error("[ERR_CAPSULE_NOT_FOUND] Content capsule not found.");
    }

    // Update status to publishing
    await ctx.runMutation(api.contentCapsules.updateCapsuleStatus, {
      capsuleId: args.capsuleId,
      status: "publishing",
    });

    const postIds: Record<string, string> = {};

    try {
      // Create social posts for each platform
      for (const platform of capsule.platforms) {
        let content = "";
        
        if (platform === "twitter") {
          content = capsule.content.tweets[0]; // Use first tweet
        } else if (platform === "linkedin") {
          content = capsule.content.linkedinPost;
        } else if (platform === "facebook") {
          content = capsule.content.facebookPost;
        }

        const postId = await ctx.runMutation(api.socialPosts.createSocialPost, {
          businessId: capsule.businessId,
          platforms: [platform],
          content,
          scheduledAt: capsule.scheduledAt,
        });

        postIds[platform] = postId;
      }

      // Update capsule with post IDs and status
      await ctx.runMutation(api.contentCapsules.updateCapsuleStatus, {
        capsuleId: args.capsuleId,
        status: capsule.scheduledAt ? "scheduled" : "published",
        postIds,
        publishedAt: capsule.scheduledAt ? undefined : Date.now(),
      });

      return { success: true, postIds };
    } catch (error: any) {
      // Update status to failed
      await ctx.runMutation(api.contentCapsules.updateCapsuleStatus, {
        capsuleId: args.capsuleId,
        status: "failed",
        errorMessage: error.message,
      });

      throw error;
    }
  },
});