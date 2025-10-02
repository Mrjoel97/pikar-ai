import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const updateBrandingConfig = mutation({
  args: {
    businessId: v.id("businesses"),
    logoUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    customDomain: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("User not found");

    // Check if config exists
    const existing = await ctx.db
      .query("brandingConfigs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        logoUrl: args.logoUrl,
        primaryColor: args.primaryColor,
        secondaryColor: args.secondaryColor,
        customDomain: args.customDomain,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("brandingConfigs", {
        businessId: args.businessId,
        logoUrl: args.logoUrl,
        primaryColor: args.primaryColor,
        secondaryColor: args.secondaryColor,
        customDomain: args.customDomain,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      userId: user._id,
      action: "branding_updated",
      entityType: "branding",
      entityId: args.businessId,
      details: { logoUrl: args.logoUrl, primaryColor: args.primaryColor },
      createdAt: Date.now(),
    });
  },
});

export const getBrandingConfig = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    if (!args.businessId) return null;

    const config = await ctx.db
      .query("brandingConfigs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId as Id<"businesses">))
      .unique();

    return config;
  },
});