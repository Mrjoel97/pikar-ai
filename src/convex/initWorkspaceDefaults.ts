import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Initialize workspace defaults including public base URL.
 * Run this once to set up default configuration.
 */
export const setDefaultBaseUrl = mutation({
  args: {
    businessId: v.id("businesses"),
    publicBaseUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("emailConfigs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        publicBaseUrl: args.publicBaseUrl,
        updatedAt: now,
      });
      return { success: true, message: `Updated public base URL to ${args.publicBaseUrl}` };
    } else {
      await ctx.db.insert("emailConfigs", {
        businessId: args.businessId,
        provider: "resend",
        fromName: "Pikar AI",
        fromEmail: "noreply@pikar-ai.com",
        isVerified: false,
        publicBaseUrl: args.publicBaseUrl,
        createdAt: now,
        updatedAt: now,
      });
      return { success: true, message: `Created email config with public base URL: ${args.publicBaseUrl}` };
    }
  },
});
