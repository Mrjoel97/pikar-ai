import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getTheme = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("whiteLabelThemes")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .first();
  },
});

export const updateTheme = mutation({
  args: {
    businessId: v.id("businesses"),
    themeName: v.optional(v.string()),
    colors: v.optional(v.object({
      background: v.string(),
      foreground: v.string(),
      primary: v.string(),
      secondary: v.string(),
      accent: v.string(),
      muted: v.string(),
      border: v.string(),
    })),
    typography: v.optional(v.object({
      fontFamily: v.string(),
      headingFont: v.optional(v.string()),
      fontSize: v.optional(v.string()),
    })),
    layout: v.optional(v.object({
      borderRadius: v.string(),
      spacing: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const { businessId, ...themeData } = args;

    const existing = await ctx.db
      .query("whiteLabelThemes")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...themeData,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("whiteLabelThemes", {
        businessId,
        ...themeData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});
