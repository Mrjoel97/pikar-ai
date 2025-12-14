"use node";

import { v } from "convex/values";
import { action, mutation, internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

/**
 * Generate AI content capsule with multiple content pieces using OpenAI
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

    const topic = args.topic || "business growth and productivity";
    const tone = args.tone || agentProfile?.tone || "professional";
    const businessName = business.name || "Your Business";
    const brandVoice = agentProfile?.brandVoice || "professional and engaging";

    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn("[CONTENT_CAPSULE] OPENAI_API_KEY not configured. Using fallback content.");
      return generateFallbackContent(topic, tone, businessName);
    }

    try {
      // Generate content using OpenAI
      const prompt = `You are a content marketing expert creating a comprehensive content capsule for ${businessName}.

Business Context:
- Topic: ${topic}
- Tone: ${tone}
- Brand Voice: ${brandVoice}
- Platforms: ${args.platforms.join(", ")}

Generate a complete content capsule with the following components:

1. Weekly Post: A comprehensive social media post (200-250 words) with emojis and hashtags
2. Email Subject: An engaging subject line (under 60 characters)
3. Email Body: A professional email (300-400 words) with clear structure
4. Tweets: Three distinct tweets (under 280 characters each) with hashtags
5. LinkedIn Post: A professional LinkedIn post (400-500 words) with strategic formatting
6. Facebook Post: An engaging Facebook post (250-300 words) with call-to-action

Format your response as JSON with these exact keys: weeklyPost, emailSubject, emailBody, tweets (array), linkedinPost, facebookPost

Make all content actionable, engaging, and aligned with the ${tone} tone.`;

      const result = await ctx.runAction(api.openai.generate, {
        prompt,
        model: "gpt-4o-mini",
        temperature: 0.8,
        maxTokens: 2000,
      });

      // Parse AI response
      let content;
      try {
        // Try to extract JSON from the response
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          content = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        console.warn("[CONTENT_CAPSULE] Failed to parse AI response, using fallback");
        return generateFallbackContent(topic, tone, businessName);
      }

      // Validate and ensure all required fields exist
      const validatedContent = {
        weeklyPost: content.weeklyPost || generateFallbackContent(topic, tone, businessName).weeklyPost,
        emailSubject: content.emailSubject || `Your Weekly ${topic} Insights`,
        emailBody: content.emailBody || generateFallbackContent(topic, tone, businessName).emailBody,
        tweets: Array.isArray(content.tweets) && content.tweets.length >= 3 
          ? content.tweets.slice(0, 3) 
          : generateFallbackContent(topic, tone, businessName).tweets,
        linkedinPost: content.linkedinPost || generateFallbackContent(topic, tone, businessName).linkedinPost,
        facebookPost: content.facebookPost || generateFallbackContent(topic, tone, businessName).facebookPost,
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
          aiGenerated: true,
        },
      });

      return validatedContent;
    } catch (error: any) {
      console.error("[CONTENT_CAPSULE] OpenAI generation failed:", error.message);
      
      // Log error and fall back to template content
      await ctx.runMutation(internal.audit.write, {
        businessId: args.businessId,
        action: "content_capsule_generation_failed",
        entityType: "content_capsule",
        entityId: args.businessId,
        details: {
          error: error.message,
          fallbackUsed: true,
        },
      });

      return generateFallbackContent(topic, tone, businessName);
    }
  },
});

/**
 * Fallback content generator when OpenAI is unavailable
 */
function generateFallbackContent(topic: string, tone: string, businessName: string) {
  return {
    weeklyPost: `🚀 Weekly Insight: ${topic}

This week, we're focusing on strategies that drive real results. Here's what you need to know:

✨ Key takeaway: Success comes from consistent action
💡 Pro tip: Start small, scale smart
🎯 Action item: Implement one new strategy today

#BusinessGrowth #Productivity #Success`,
    
    emailSubject: `Your Weekly ${topic.charAt(0).toUpperCase() + topic.slice(1)} Insights`,
    
    emailBody: `Hi there!

Welcome to this week's insights on ${topic}.

We've been analyzing the latest trends and strategies that successful businesses are using, and we're excited to share what we've learned.

Here are the top 3 insights:

1. Focus on high-impact activities
2. Leverage automation where possible
3. Build systems that scale

Ready to implement these strategies? Let's dive deeper.

Best regards,
${businessName}`,
    
    tweets: [
      `🎯 ${topic}: The secret to success? Consistency over intensity. Small daily actions compound into massive results. #BusinessTips`,
      `💡 Quick tip: Automate the repetitive, focus on the strategic. Your time is your most valuable asset. #Productivity`,
      `🚀 Growth hack: Document your processes. What's repeatable is scalable. #BusinessGrowth`,
    ],
    
    linkedinPost: `${topic.charAt(0).toUpperCase() + topic.slice(1)}: A Strategic Perspective

After working with hundreds of businesses, I've noticed a pattern among the most successful ones.

They don't just work harder—they work smarter.

Here's what sets them apart:

→ Clear systems and processes
→ Data-driven decision making
→ Continuous optimization
→ Focus on high-leverage activities

The question isn't whether you should implement these strategies.

It's: which one will you start with today?

Drop a comment with your biggest challenge, and let's solve it together.

#BusinessStrategy #Leadership #Growth`,
    
    facebookPost: `🌟 ${topic.charAt(0).toUpperCase() + topic.slice(1)} Made Simple

We get it—running a business is overwhelming. There's always more to do than time allows.

But what if you could achieve more by doing less?

Here's how:
✅ Prioritize ruthlessly
✅ Automate repetitive tasks
✅ Delegate what others can do
✅ Focus on what only YOU can do

It's not about working 24/7. It's about working on the right things.

What's one task you could automate this week? Share below! 👇

#SmallBusiness #Entrepreneurship #ProductivityTips`,
  };
}

/**
 * Process scheduled capsules (called by cron job)
 */
export const processScheduledCapsules = internalAction({
  args: {},
  handler: async (ctx): Promise<{ processed: number }> => {
    const now = Date.now();
    
    // Get all scheduled capsules that are due
    const dueCapsules: any[] = await ctx.runQuery(internal.contentCapsulesData.getScheduledCapsules, {
      beforeTime: now,
    });

    for (const capsule of dueCapsules) {
      try {
        // Publish the capsule
        await publishContentCapsule(ctx, { capsuleId: capsule._id });
      } catch (error: any) {
        console.error(`[CRON] Failed to publish capsule ${capsule._id}:`, error.message);
        
        // Update status to failed
        await ctx.runMutation(api.contentCapsulesData.updateCapsuleStatus, {
          capsuleId: capsule._id,
          status: "failed",
          errorMessage: error.message,
        });
      }
    }

    return { processed: dueCapsules.length };
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
    await ctx.runMutation(api.contentCapsulesData.updateCapsuleStatus, {
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
      await ctx.runMutation(api.contentCapsulesData.updateCapsuleStatus, {
        capsuleId: args.capsuleId,
        status: capsule.scheduledAt ? "scheduled" : "published",
        postIds,
        publishedAt: capsule.scheduledAt ? undefined : Date.now(),
      });

      return { success: true, postIds };
    } catch (error: any) {
      // Update status to failed
      await ctx.runMutation(api.contentCapsulesData.updateCapsuleStatus, {
        capsuleId: args.capsuleId,
        status: "failed",
        errorMessage: error.message,
      });

      throw error;
    }
  },
});

/**
 * Send capsule content via email using Resend
 */
export const sendCapsuleEmail = action({
  args: {
    capsuleId: v.id("contentCapsules"),
    recipientEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const capsule = await ctx.runQuery(api.contentCapsulesData.getCapsuleById, {
      capsuleId: args.capsuleId,
    });

    if (!capsule) {
      throw new Error("[ERR_CAPSULE_NOT_FOUND] Content capsule not found.");
    }

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn("[CONTENT_CAPSULE] RESEND_API_KEY not configured. Email not sent.");
      return { success: false, error: "Email service not configured" };
    }

    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "noreply@pikar.ai",
        to: args.recipientEmail,
        subject: capsule.content.emailSubject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">${capsule.content.emailSubject}</h1>
            <div style="line-height: 1.6; color: #555;">
              ${capsule.content.emailBody.replace(/\n/g, '<br>')}
            </div>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="font-size: 12px; color: #999;">
              This email was generated by Pikar AI Content Capsule
            </p>
          </div>
        `,
      });

      return { success: true };
    } catch (error: any) {
      console.error("[CONTENT_CAPSULE] Email send failed:", error.message);
      return { success: false, error: error.message };
    }
  },
});