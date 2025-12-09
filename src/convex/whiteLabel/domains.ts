import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getDomains = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("whiteLabelDomains")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
  },
});

export const addDomain = mutation({
  args: {
    businessId: v.id("businesses"),
    domain: v.string(),
    isPrimary: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // If setting as primary, unset other primary domains
    if (args.isPrimary) {
      const existingDomains = await ctx.db
        .query("whiteLabelDomains")
        .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
        .collect();

      for (const domain of existingDomains) {
        if (domain.isPrimary) {
          await ctx.db.patch(domain._id, { isPrimary: false });
        }
      }
    }

    return await ctx.db.insert("whiteLabelDomains", {
      businessId: args.businessId,
      domain: args.domain,
      isPrimary: args.isPrimary ?? false,
      verified: false,
      verificationToken: Math.random().toString(36).substring(2, 15),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const verifyDomain = mutation({
  args: { domainId: v.id("whiteLabelDomains") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.domainId, {
      verified: true,
      verifiedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const deleteDomain = mutation({
  args: { domainId: v.id("whiteLabelDomains") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    await ctx.db.delete(args.domainId);
  },
});
