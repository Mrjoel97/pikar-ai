import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

const CAMPAIGN_TEMPLATES = [
  {
    id: "product-launch",
    name: "Product Launch",
    description: "Multi-channel campaign for new product announcements",
    channels: ["email", "social"],
    estimatedDuration: 7,
  },
  {
    id: "seasonal-promo",
    name: "Seasonal Promotion",
    description: "Holiday or seasonal sales campaign",
    channels: ["email", "social", "ads"],
    estimatedDuration: 14,
  },
  {
    id: "webinar-promotion",
    name: "Webinar Promotion",
    description: "Drive registrations for upcoming webinar",
    channels: ["email", "social"],
    estimatedDuration: 21,
  },
  {
    id: "customer-reactivation",
    name: "Customer Reactivation",
    description: "Re-engage dormant customers",
    channels: ["email"],
    estimatedDuration: 30,
  },
  {
    id: "content-series",
    name: "Content Series",
    description: "Educational content drip campaign",
    channels: ["email", "social"],
    estimatedDuration: 30,
  },
];

/**
 * List available campaign templates
 */
export const listCampaignTemplates = query({
  args: {},
  handler: async () => {
    return CAMPAIGN_TEMPLATES;
  },
});

/**
 * Create campaign from template
 */
export const createFromTemplate = mutation({
  args: {
    businessId: v.id("businesses"),
    templateId: v.string(),
    customizations: v.object({
      name: v.string(),
      startDate: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const template = CAMPAIGN_TEMPLATES.find((t) => t.id === args.templateId);
    if (!template) throw new Error("Template not found");

    // Create experiment as campaign container
    const campaignId = await ctx.db.insert("experiments", {
      businessId: args.businessId,
      name: args.customizations.name,
      hypothesis: template.description,
      goal: "conversions",
      status: "draft",
      createdBy: args.businessId as any,
      configuration: {
        templateId: template.id,
        channels: template.channels,
        startDate: args.customizations.startDate,
      },
      createdAt: Date.now(),
    });

    return { campaignId, template };
  },
});
