"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * Create a multi-channel campaign
 */
export const createMultiChannelCampaign = action({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    channels: v.array(v.object({
      type: v.union(v.literal("email"), v.literal("social"), v.literal("ads")),
      config: v.any(),
      budget: v.optional(v.number()),
      scheduledAt: v.optional(v.number()),
    })),
    startDate: v.number(),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Create campaign record
    const campaignId = await ctx.runMutation(internal.campaigns.mutations.createCampaignRecord, {
      businessId: args.businessId,
      name: args.name,
      description: args.description,
      startDate: args.startDate,
      endDate: args.endDate,
      status: "draft",
    });

    // Create channel-specific campaigns
    for (const channel of args.channels) {
      if (channel.type === "email") {
        await ctx.runMutation(internal.emails.createCampaign as any, {
          businessId: args.businessId,
          subject: channel.config.subject,
          body: channel.config.body,
          audienceType: channel.config.audienceType || "list",
          scheduledAt: channel.scheduledAt,
          experimentId: campaignId as any,
        });
      } else if (channel.type === "social") {
        await ctx.runMutation(internal.socialPosts.createPost as any, {
          businessId: args.businessId,
          content: channel.config.content,
          platforms: channel.config.platforms,
          scheduledAt: channel.scheduledAt,
        });
      }
    }

    return { campaignId, success: true };
  },
});
