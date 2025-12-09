import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getBranding = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("whiteLabelBranding")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .first();
  },
});

export const updateBranding = mutation({
  args: {
    businessId: v.id("businesses"),
    logoUrl: v.optional(v.string()),
    faviconUrl: v.optional(v.string()),
    brandName: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    accentColor: v.optional(v.string()),
    fontFamily: v.optional(v.string()),
    customCss: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const { businessId, ...brandingData } = args;

    const existing = await ctx.db
      .query("whiteLabelBranding")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...brandingData,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("whiteLabelBranding", {
        businessId,
        ...brandingData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

export const deleteBranding = mutation({
  args: { brandingId: v.id("whiteLabelBranding") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    await ctx.db.delete(args.brandingId);
  },
});
