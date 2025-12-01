import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// List all brands for a business
export const listBrands = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("[ERR_NOT_AUTHENTICATED] Not authenticated");
    }

    const brands = await ctx.db
      .query("brands")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    return brands;
  },
});

// Get a single brand by ID
export const getBrand = query({
  args: { brandId: v.id("brands") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("[ERR_NOT_AUTHENTICATED] Not authenticated");
    }

    const brand = await ctx.db.get(args.brandId);
    if (!brand) {
      throw new Error("[ERR_NOT_FOUND] Brand not found");
    }

    return brand;
  },
});

// Create a new brand
export const createBrand = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    website: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("[ERR_NOT_AUTHENTICATED] Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("[ERR_USER_NOT_FOUND] User not found");
    }

    // If this is set as default, unset other defaults
    if (args.isDefault) {
      const existingBrands = await ctx.db
        .query("brands")
        .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
        .collect();

      for (const brand of existingBrands) {
        if (brand.isDefault) {
          await ctx.db.patch(brand._id, { isDefault: false });
        }
      }
    }

    const brandId = await ctx.db.insert("brands", {
      businessId: args.businessId,
      name: args.name,
      description: args.description,
      logoUrl: args.logoUrl,
      primaryColor: args.primaryColor || "#000000",
      secondaryColor: args.secondaryColor || "#666666",
      isDefault: args.isDefault ?? false,
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Audit log
    await (ctx as any).runMutation("audit:write" as any, {
      businessId: args.businessId,
      action: "brand.create",
      entityType: "brand",
      entityId: String(brandId),
      details: {
        message: `Brand created: ${args.name}`,
        actorUserId: user._id,
        brandName: args.name,
      },
    });

    return brandId;
  },
});

// Update an existing brand
export const updateBrand = mutation({
  args: {
    brandId: v.id("brands"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    website: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("[ERR_NOT_AUTHENTICATED] Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("[ERR_USER_NOT_FOUND] User not found");
    }

    const brand = await ctx.db.get(args.brandId);
    if (!brand) {
      throw new Error("[ERR_NOT_FOUND] Brand not found");
    }

    // If setting as default, unset other defaults
    if (args.isDefault) {
      const existingBrands = await ctx.db
        .query("brands")
        .withIndex("by_business", (q) => q.eq("businessId", brand.businessId))
        .collect();

      for (const b of existingBrands) {
        if (b._id !== args.brandId && b.isDefault) {
          await ctx.db.patch(b._id, { isDefault: false });
        }
      }
    }

    const { brandId, ...updates } = args;
    await ctx.db.patch(brandId, {
      ...updates,
      updatedAt: Date.now(),
    });

    // Audit log
    await (ctx as any).runMutation("audit:write" as any, {
      businessId: brand.businessId,
      action: "brand.update",
      entityType: "brand",
      entityId: String(brandId),
      details: {
        message: `Brand updated: ${brand.name}`,
        actorUserId: user._id,
        updates,
      },
    });

    return await ctx.db.get(brandId);
  },
});

// Delete a brand
export const deleteBrand = mutation({
  args: { brandId: v.id("brands") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("[ERR_NOT_AUTHENTICATED] Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("[ERR_USER_NOT_FOUND] User not found");
    }

    const brand = await ctx.db.get(args.brandId);
    if (!brand) {
      throw new Error("[ERR_NOT_FOUND] Brand not found");
    }

    // Don't allow deleting the default brand
    if (brand.isDefault) {
      throw new Error("[ERR_FORBIDDEN] Cannot delete the default brand");
    }

    await ctx.db.delete(args.brandId);

    // Audit log
    await (ctx as any).runMutation("audit:write" as any, {
      businessId: brand.businessId,
      action: "brand.delete",
      entityType: "brand",
      entityId: String(args.brandId),
      details: {
        message: `Brand deleted: ${brand.name}`,
        actorUserId: user._id,
        brandName: brand.name,
      },
    });

    return { success: true };
  },
});

// Get the default brand for a business
export const getDefaultBrand = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const brand = await ctx.db
      .query("brands")
      .withIndex("by_business_and_default", (q) =>
        q.eq("businessId", args.businessId).eq("isDefault", true)
      )
      .first();

    return brand;
  },
});

/**
 * Query: Get brand-specific analytics
 */
export const getBrandAnalytics = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    brandId: v.optional(v.id("brands")),
    timeRange: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return {
        posts: 0,
        impressions: 0,
        engagements: 0,
        engagementRate: 0,
        topPosts: [],
      };
    }

    // Get social posts for this brand
    let postsQuery = ctx.db
      .query("socialPosts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!));

    const posts = await postsQuery.collect();
    
    // Filter by brand if specified
    const brandPosts = args.brandId
      ? posts.filter((p: any) => (p as any).brandId && (p as any).brandId === args.brandId)
      : posts;

    const totalImpressions = brandPosts.reduce(
      (sum, p) => sum + (p.performanceMetrics?.impressions || 0),
      0
    );
    const totalEngagements = brandPosts.reduce(
      (sum, p) => sum + (p.performanceMetrics?.engagements || 0),
      0
    );

    return {
      posts: brandPosts.length,
      impressions: totalImpressions,
      engagements: totalEngagements,
      engagementRate: totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0,
      topPosts: brandPosts
        .sort((a, b) => (b.performanceMetrics?.engagements || 0) - (a.performanceMetrics?.engagements || 0))
        .slice(0, 5)
        .map((p) => ({
          postId: p._id,
          content: p.content.substring(0, 100),
          engagements: p.performanceMetrics?.engagements || 0,
        })),
    };
  },
});

/**
 * Query: Compare brand performance
 */
export const compareBrandPerformance = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    timeRange: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return [];
    }

    const brands = await ctx.db
      .query("brands")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
      .collect();

    const comparison = [];

    for (const brand of brands) {
      const analytics = await ctx.runQuery("brands:getBrandAnalytics" as any, {
        businessId: args.businessId,
        brandId: brand._id,
        timeRange: args.timeRange,
      });

      comparison.push({
        brandId: brand._id,
        brandName: brand.name,
        ...analytics,
      });
    }

    return comparison;
  },
});

/**
 * Query: Get brand asset library
 */
export const getBrandAssets = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    brandId: v.optional(v.id("brands")),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return [];
    }

    const brand = args.brandId ? await ctx.db.get(args.brandId) : null;

    // Return brand assets (logos, colors, guidelines)
    return [
      {
        type: "logo",
        url: brand?.logoUrl || "",
        name: "Primary Logo",
      },
      {
        type: "color",
        value: brand?.primaryColor || "#000000",
        name: "Primary Color",
      },
      {
        type: "color",
        value: brand?.secondaryColor || "#666666",
        name: "Secondary Color",
      },
    ];
  },
});