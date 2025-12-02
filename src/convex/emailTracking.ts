import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const recordEmailEvent = mutation({
  args: {
    // Track against the emailCampaigns table
    campaignId: v.id("emailCampaigns"),
    recipientEmail: v.string(),
    eventType: v.union(
      v.literal("sent"),
      v.literal("opened"),
      v.literal("clicked"),
      v.literal("bounced"),
      v.literal("unsubscribed")
    ),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx: any, args) => {
    await ctx.db.insert("emailEvents", {
      campaignId: args.campaignId,
      recipientEmail: args.recipientEmail,
      eventType: args.eventType,
      metadata: args.metadata,
      timestamp: Date.now(),
    });
  },
});