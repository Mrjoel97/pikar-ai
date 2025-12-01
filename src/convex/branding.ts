import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const updateBrandingConfig = mutation({
  args: {
    configId: v.id("brandingConfigs"),
    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    accentColor: v.optional(v.string()),
    fontFamily: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { configId, ...updates } = args;
    
    const updateData: any = {};
    if (updates.primaryColor !== undefined) updateData.primaryColor = updates.primaryColor;
    if (updates.secondaryColor !== undefined) updateData.secondaryColor = updates.secondaryColor;
    if (updates.accentColor !== undefined) updateData.accentColor = updates.accentColor;
    if (updates.fontFamily !== undefined) updateData.fontFamily = updates.fontFamily;
    if (updates.logoUrl !== undefined) updateData.logoUrl = updates.logoUrl;

    await ctx.db.patch(configId, updateData);
    return configId;
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

/**
 * Verify custom domain configuration (placeholder for DNS verification)
 */
export const verifyCustomDomain = mutation({
  args: {
    businessId: v.id("businesses"),
    customDomain: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("User not found");

    // Placeholder: In production, this would verify DNS records
    // For now, we'll just log the verification attempt
    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      userId: user._id,
      action: "domain_verification_attempted",
      entityType: "branding",
      entityId: args.businessId,
      details: { customDomain: args.customDomain },
      createdAt: Date.now(),
    });

    return {
      verified: false,
      message: "Domain verification requires DNS configuration. Please contact support.",
    };
  },
});

/**
 * Create a new theme version
 */
export const createThemeVersion = mutation({
  args: {
    businessId: v.id("businesses"),
    brandId: v.optional(v.id("brands")),
    name: v.string(),
    description: v.optional(v.string()),
    theme: v.object({
      logoUrl: v.optional(v.string()),
      primaryColor: v.string(),
      secondaryColor: v.string(),
      accentColor: v.optional(v.string()),
      backgroundColor: v.optional(v.string()),
      textColor: v.optional(v.string()),
      fontFamily: v.optional(v.string()),
      borderRadius: v.optional(v.string()),
      customCss: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("User not found");

    // Get current version number
    const existingVersions = await ctx.db
      .query("themeVersions")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const versionNumber = existingVersions.length + 1;

    const versionId = await ctx.db.insert("themeVersions", {
      businessId: args.businessId,
      brandId: args.brandId,
      name: args.name,
      description: args.description,
      version: versionNumber,
      theme: args.theme,
      isActive: false,
      createdBy: user._id,
      createdAt: Date.now(),
    });

    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      userId: user._id,
      action: "theme_version_created",
      entityType: "theme",
      entityId: versionId,
      details: { name: args.name, version: versionNumber },
      createdAt: Date.now(),
    });

    return versionId;
  },
});

/**
 * Get all theme versions
 */
export const getThemeVersions = query({
  args: {
    businessId: v.id("businesses"),
    brandId: v.optional(v.id("brands")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("themeVersions")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId));

    const versions = await query.collect();

    // Filter by brand if specified
    return args.brandId
      ? versions.filter((v) => v.brandId === args.brandId)
      : versions;
  },
});

/**
 * Activate a theme version
 */
export const activateThemeVersion = mutation({
  args: {
    versionId: v.id("themeVersions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("User not found");

    const version = await ctx.db.get(args.versionId);
    if (!version) throw new Error("Theme version not found");

    // Deactivate all other versions for this business/brand
    const allVersions = await ctx.db
      .query("themeVersions")
      .withIndex("by_business", (q) => q.eq("businessId", version.businessId))
      .collect();

    for (const v of allVersions) {
      if (v.brandId === version.brandId && v._id !== args.versionId) {
        await ctx.db.patch(v._id, { isActive: false });
      }
    }

    // Activate the selected version
    await ctx.db.patch(args.versionId, { isActive: true });

    // Update branding config with active theme
    const existingConfig = await ctx.db
      .query("brandingConfigs")
      .withIndex("by_business", (q) => q.eq("businessId", version.businessId))
      .unique();

    if (existingConfig) {
      await ctx.db.patch(existingConfig._id, {
        logoUrl: version.theme.logoUrl,
        primaryColor: version.theme.primaryColor,
        secondaryColor: version.theme.secondaryColor,
        updatedAt: Date.now(),
      });
    }

    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: version.businessId,
      userId: user._id,
      action: "theme_version_activated",
      entityType: "theme",
      entityId: args.versionId,
      details: { version: version.version, name: version.name },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Upload brand asset
 */
export const uploadBrandAsset = mutation({
  args: {
    businessId: v.id("businesses"),
    brandId: v.optional(v.id("brands")),
    name: v.string(),
    type: v.union(
      v.literal("logo"),
      v.literal("icon"),
      v.literal("font"),
      v.literal("image"),
      v.literal("document")
    ),
    url: v.string(),
    fileSize: v.optional(v.number()),
    mimeType: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("User not found");

    const assetId = await ctx.db.insert("brandAssets", {
      businessId: args.businessId,
      brandId: args.brandId,
      name: args.name,
      type: args.type,
      url: args.url,
      fileSize: args.fileSize,
      mimeType: args.mimeType,
      tags: args.tags || [],
      uploadedBy: user._id,
      createdAt: Date.now(),
    });

    return assetId;
  },
});

/**
 * Get brand assets
 */
export const getBrandAssets = query({
  args: {
    businessId: v.id("businesses"),
    brandId: v.optional(v.id("brands")),
    type: v.optional(
      v.union(
        v.literal("logo"),
        v.literal("icon"),
        v.literal("font"),
        v.literal("image"),
        v.literal("document")
      )
    ),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("brandAssets")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId));

    let assets = await query.collect();

    // Filter by brand if specified
    if (args.brandId) {
      assets = assets.filter((a) => a.brandId === args.brandId);
    }

    // Filter by type if specified
    if (args.type) {
      assets = assets.filter((a) => a.type === args.type);
    }

    return assets;
  },
});

/**
 * Delete brand asset
 */
export const deleteBrandAsset = mutation({
  args: {
    assetId: v.id("brandAssets"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const asset = await ctx.db.get(args.assetId);
    if (!asset) throw new Error("Asset not found");

    await ctx.db.delete(args.assetId);

    return { success: true };
  },
});

/**
 * Configure custom domain
 */
export const configureCustomDomain = mutation({
  args: {
    businessId: v.id("businesses"),
    brandId: v.optional(v.id("brands")),
    domain: v.string(),
    sslEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("User not found");

    const domainId = await ctx.db.insert("customDomains", {
      businessId: args.businessId,
      brandId: args.brandId,
      domain: args.domain,
      sslEnabled: args.sslEnabled ?? true,
      verified: false,
      dnsRecords: {
        type: "CNAME",
        name: args.domain,
        value: "pikar-ai.app",
        ttl: 3600,
      },
      createdBy: user._id,
      createdAt: Date.now(),
    });

    return domainId;
  },
});

/**
 * Verify custom domain
 */
export const verifyDomain = mutation({
  args: {
    domainId: v.id("customDomains"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const domain = await ctx.db.get(args.domainId);
    if (!domain) throw new Error("Domain not found");

    // In production, this would check DNS records
    // For now, we'll simulate verification
    await ctx.db.patch(args.domainId, {
      verified: true,
      verifiedAt: Date.now(),
    });

    return { success: true, verified: true };
  },
});

/**
 * Get custom domains
 */
export const getCustomDomains = query({
  args: {
    businessId: v.id("businesses"),
    brandId: v.optional(v.id("brands")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("customDomains")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId));

    let domains = await query.collect();

    if (args.brandId) {
      domains = domains.filter((d) => d.brandId === args.brandId);
    }

    return domains;
  },
});

/**
 * Track branding analytics
 */
export const trackBrandingEvent = internalMutation({
  args: {
    businessId: v.id("businesses"),
    brandId: v.optional(v.id("brands")),
    eventType: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("brandingAnalytics", {
      businessId: args.businessId,
      brandId: args.brandId,
      eventType: args.eventType,
      metadata: args.metadata,
      timestamp: Date.now(),
    });
  },
});

/**
 * Get branding analytics
 */
export const getBrandingAnalytics = query({
  args: {
    businessId: v.id("businesses"),
    brandId: v.optional(v.id("brands")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("brandingAnalytics")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId));

    let events = await query.collect();

    // Filter by brand
    if (args.brandId) {
      events = events.filter((e) => e.brandId === args.brandId);
    }

    // Filter by date range
    if (args.startDate) {
      events = events.filter((e) => e.timestamp >= args.startDate!);
    }
    if (args.endDate) {
      events = events.filter((e) => e.timestamp <= args.endDate!);
    }

    // Aggregate analytics
    const totalEvents = events.length;
    const eventsByType = events.reduce((acc, e) => {
      acc[e.eventType] = (acc[e.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const themeChanges = eventsByType["theme_changed"] || 0;
    const assetUploads = eventsByType["asset_uploaded"] || 0;
    const domainVerifications = eventsByType["domain_verified"] || 0;

    return {
      totalEvents,
      themeChanges,
      assetUploads,
      domainVerifications,
      eventsByType,
      recentEvents: events.slice(-10).reverse(),
    };
  },
});

/**
 * Get active theme for a brand
 */
export const getActiveTheme = query({
  args: {
    businessId: v.id("businesses"),
    brandId: v.optional(v.id("brands")),
  },
  handler: async (ctx, args) => {
    const versions = await ctx.db
      .query("themeVersions")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const activeVersion = versions.find(
      (v) => v.isActive && (!args.brandId || v.brandId === args.brandId)
    );

    return activeVersion || null;
  },
});