import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Admin-managed social media API configurations
 * Used by all tiers except Enterprise (white-label)
 */

// Add a shared validator for supported platforms (twitter, linkedin, meta, youtube, google)
const platformArg = v.union(
  v.literal("twitter"),
  v.literal("linkedin"),
  v.literal("meta"),
  v.literal("youtube"),
  v.literal("google"),
);

export const getPlatformConfig = query({
  args: {
    platform: platformArg,
  },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("socialApiConfigs")
      .withIndex("by_platform_and_scope", (q) =>
        q.eq("platform", args.platform).eq("scope", "platform")
      )
      .first();
    
    if (!config) {
      return null;
    }

    // Return config without exposing secrets to frontend
    return {
      _id: config._id,
      platform: config.platform,
      isActive: config.isActive,
      hasCredentials: !!(config.clientId && config.clientSecret),
    };
  },
});

export const getEnterpriseConfig = query({
  args: {
    businessId: v.id("businesses"),
    platform: platformArg,
  },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("socialApiConfigs")
      .withIndex("by_business_and_platform", (q) =>
        q.eq("businessId", args.businessId).eq("platform", args.platform)
      )
      .first();
    
    if (!config) {
      return null;
    }

    return {
      _id: config._id,
      platform: config.platform,
      isActive: config.isActive,
      hasCredentials: !!(config.clientId && config.clientSecret),
      callbackUrl: config.callbackUrl,
    };
  },
});

export const setPlatformConfig = mutation({
  args: {
    platform: platformArg,
    clientId: v.string(),
    clientSecret: v.string(),
    callbackUrl: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    // TODO: Add admin auth check here
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db
      .query("socialApiConfigs")
      .withIndex("by_platform_and_scope", (q) =>
        q.eq("platform", args.platform).eq("scope", "platform")
      )
      .first();

    const configData = {
      platform: args.platform,
      scope: "platform" as const,
      clientId: args.clientId,
      clientSecret: args.clientSecret,
      callbackUrl: args.callbackUrl,
      isActive: args.isActive,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, configData);
      return existing._id;
    } else {
      return await ctx.db.insert("socialApiConfigs", {
        ...configData,
        createdAt: Date.now(),
      });
    }
  },
});

export const setEnterpriseConfig = mutation({
  args: {
    businessId: v.id("businesses"),
    platform: platformArg,
    clientId: v.string(),
    clientSecret: v.string(),
    callbackUrl: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Verify user has access to this business
    const business = await ctx.db.get(args.businessId);
    if (!business) {
      throw new Error("Business not found");
    }

    const existing = await ctx.db
      .query("socialApiConfigs")
      .withIndex("by_business_and_platform", (q) =>
        q.eq("businessId", args.businessId).eq("platform", args.platform)
      )
      .first();

    const configData = {
      businessId: args.businessId,
      platform: args.platform,
      scope: "enterprise" as const,
      clientId: args.clientId,
      clientSecret: args.clientSecret,
      callbackUrl: args.callbackUrl,
      isActive: args.isActive,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, configData);
      return existing._id;
    } else {
      return await ctx.db.insert("socialApiConfigs", {
        ...configData,
        createdAt: Date.now(),
      });
    }
  },
});

export const listPlatformConfigs = query({
  args: {},
  handler: async (ctx) => {
    // TODO: Add admin auth check
    const configs = await ctx.db
      .query("socialApiConfigs")
      .withIndex("by_scope", (q) => q.eq("scope", "platform"))
      .collect();

    return configs.map((config) => ({
      _id: config._id,
      platform: config.platform,
      isActive: config.isActive,
      hasCredentials: !!(config.clientId && config.clientSecret),
      callbackUrl: config.callbackUrl,
      updatedAt: config.updatedAt,
    }));
  },
});

export const getConfigForAuth = internalQuery({
  args: {
    businessId: v.id("businesses"),
    platform: platformArg,
  },
  handler: async (ctx, args) => {
    const business = await ctx.db.get(args.businessId);
    if (!business) {
      throw new Error("Business not found");
    }

    const tier = business.tier || business.settings?.plan || "solopreneur";
    const isEnterprise = tier.toLowerCase() === "enterprise";

    // Enterprise uses their own config
    if (isEnterprise) {
      const enterpriseConfig = await ctx.db
        .query("socialApiConfigs")
        .withIndex("by_business_and_platform", (q) =>
          q.eq("businessId", args.businessId).eq("platform", args.platform)
        )
        .first();

      if (enterpriseConfig && enterpriseConfig.isActive) {
        return {
          clientId: enterpriseConfig.clientId,
          clientSecret: enterpriseConfig.clientSecret,
          callbackUrl: enterpriseConfig.callbackUrl,
          scope: "enterprise" as const,
        };
      }
    }

    // All other tiers use platform config
    const platformConfig = await ctx.db
      .query("socialApiConfigs")
      .withIndex("by_platform_and_scope", (q) =>
        q.eq("platform", args.platform).eq("scope", "platform")
      )
      .first();

    if (!platformConfig || !platformConfig.isActive) {
      throw new Error(`${args.platform} integration not configured by admin`);
    }

    return {
      clientId: platformConfig.clientId,
      clientSecret: platformConfig.clientSecret,
      callbackUrl: platformConfig.callbackUrl,
      scope: "platform" as const,
    };
  },
});

export const listConfigsForBusiness = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const [platformConfigs, enterpriseConfigs] = await Promise.all([
      ctx.db
        .query("socialApiConfigs")
        .withIndex("by_scope", (q) => q.eq("scope", "platform"))
        .collect(),
      ctx.db
        .query("socialApiConfigs")
        .withIndex("by_business_and_platform", (q) =>
          q.eq("businessId", args.businessId)
        )
        .collect(),
    ]);

    return {
      platformConfigs: platformConfigs.map((c) => ({
        _id: c._id,
        platform: c.platform,
        isActive: c.isActive,
        hasCredentials: !!(c.clientId && c.clientSecret),
        callbackUrl: c.callbackUrl,
        updatedAt: c.updatedAt,
      })),
      enterpriseConfigs: enterpriseConfigs.map((c) => ({
        _id: c._id,
        platform: c.platform,
        businessId: c.businessId as Id<"businesses">,
        isActive: c.isActive,
        hasCredentials: !!(c.clientId && c.clientSecret),
        callbackUrl: c.callbackUrl,
        updatedAt: c.updatedAt,
      })),
    };
  },
});