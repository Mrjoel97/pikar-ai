import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";

/**
 * OIDC Configuration Management
 */

export const createOIDCConfig = mutation({
  args: {
    businessId: v.id("businesses"),
    issuer: v.string(),
    clientId: v.string(),
    clientSecret: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Check if config already exists
    const existing = await ctx.db
      .query("oidcConfigs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        issuer: args.issuer,
        clientId: args.clientId,
        clientSecret: args.clientSecret,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    // Create new
    const configId = await ctx.db.insert("oidcConfigs", {
      businessId: args.businessId,
      issuer: args.issuer,
      clientId: args.clientId,
      clientSecret: args.clientSecret,
      redirectUri: `${process.env.VITE_PUBLIC_BASE_URL}/auth/oidc/callback`,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      userId: identity.subject as any,
      action: "oidc_config_created",
      entityType: "oidc_config",
      entityId: configId,
      details: { issuer: args.issuer },
      createdAt: Date.now(),
    });

    return configId;
  },
});

export const getOIDCConfig = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("oidcConfigs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .first();
  },
});

export const toggleOIDCConfig = mutation({
  args: {
    businessId: v.id("businesses"),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const config = await ctx.db
      .query("oidcConfigs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .first();

    if (!config) throw new Error("OIDC config not found");

    await ctx.db.patch(config._id, {
      active: args.active,
      updatedAt: Date.now(),
    });

    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      userId: identity.subject as any,
      action: args.active ? "oidc_config_enabled" : "oidc_config_disabled",
      entityType: "oidc_config",
      entityId: config._id,
      details: {},
      createdAt: Date.now(),
    });
  },
});

export const getOIDCConfigInternal = internalQuery({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("oidcConfigs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .first();
  },
});