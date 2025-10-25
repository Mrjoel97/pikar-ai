"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

// Generate default content using AI (Node.js action)
export const generateDefaultContent = action({
  args: {
    businessId: v.id("businesses"),
    contentType: v.union(
      v.literal("bio"),
      v.literal("tagline"),
      v.literal("mission"),
      v.literal("social-post")
    ),
    context: v.optional(v.object({
      businessName: v.optional(v.string()),
      industry: v.optional(v.string()),
      targetAudience: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    // Get business details
    const business = await ctx.runQuery(api.businesses.get, { 
      id: args.businessId 
    });

    if (!business) {
      throw new Error("Business not found");
    }

    const businessName = args.context?.businessName || business.name;
    const industry = args.context?.industry || business.industry;
    const targetAudience = args.context?.targetAudience || "professionals";

    // Generate content based on type
    let prompt = "";
    let maxLength = 100;

    switch (args.contentType) {
      case "bio":
        prompt = `Write a compelling 2-3 sentence business bio for ${businessName}, a ${industry} company targeting ${targetAudience}. Make it professional yet engaging.`;
        maxLength = 200;
        break;
      case "tagline":
        prompt = `Create a catchy, memorable tagline (5-8 words) for ${businessName}, a ${industry} company.`;
        maxLength = 50;
        break;
      case "mission":
        prompt = `Write a clear mission statement (1-2 sentences) for ${businessName} in the ${industry} industry.`;
        maxLength = 150;
        break;
      case "social-post":
        prompt = `Write an engaging social media post announcing the launch of ${businessName}, a ${industry} company. Include relevant hashtags.`;
        maxLength = 280;
        break;
    }

    // Simulate AI generation (replace with actual OpenAI call)
    const generated = await simulateAIGeneration(prompt, maxLength);

    return {
      content: generated,
      contentType: args.contentType,
    };
  },
});

// Helper function to simulate AI generation
async function simulateAIGeneration(prompt: string, maxLength: number): Promise<string> {
  // In production, replace with actual OpenAI API call
  const responses: Record<string, string> = {
    bio: "We empower businesses to achieve their goals through innovative solutions and exceptional service. Our team is dedicated to delivering results that matter.",
    tagline: "Innovate. Transform. Succeed.",
    mission: "To revolutionize the industry by providing cutting-edge solutions that drive growth and success for our clients.",
    "social-post": "🚀 Exciting news! We're officially launching and ready to transform the way you work. Join us on this journey! #Innovation #Launch #NewBeginnings",
  };

  // Simple keyword matching for demo
  for (const [key, value] of Object.entries(responses)) {
    if (prompt.toLowerCase().includes(key)) {
      return value;
    }
  }

  return "Generated content based on your business profile.";
}
