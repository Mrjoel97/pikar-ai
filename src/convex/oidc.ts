import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";

/**
 * OIDC Configuration Management - Enhanced with Multi-IdP Support
 */

export const createOIDCConfig = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    issuer: v.string(),
    clientId: v.string(),
    clientSecret: v.string(),
    attributeMapping: v.optional(v.any()),
    jitProvisioning: v.optional(v.boolean()),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Create new OIDC config (supports multiple IdPs)
    const configId = await ctx.db.insert("oidcConfigs", {
      businessId: args.businessId,
      name: args.name,
      issuer: args.issuer,
      clientId: args.clientId,
      clientSecret: args.clientSecret,
      redirectUri: `${process.env.VITE_PUBLIC_BASE_URL}/auth/oidc/callback`,
      attributeMapping: args.attributeMapping || {
        email: "email",
        firstName: "given_name",
        lastName: "family_name",
        displayName: "name",
      },
      jitProvisioning: args.jitProvisioning ?? true,
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
      details: { name: args.name, issuer: args.issuer },
      createdAt: Date.now(),
    });

    return configId;
  },
});

export const updateOIDCConfig = mutation({
  args: {
    configId: v.id("oidcConfigs"),
    name: v.optional(v.string()),
    issuer: v.optional(v.string()),
    clientId: v.optional(v.string()),
    clientSecret: v.optional(v.string()),
    attributeMapping: v.optional(v.any()),
    jitProvisioning: v.optional(v.boolean()),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const config = await ctx.db.get(args.configId);
    if (!config) throw new Error("OIDC config not found");

    const updates: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.issuer !== undefined) updates.issuer = args.issuer;
    if (args.clientId !== undefined) updates.clientId = args.clientId;
    if (args.clientSecret !== undefined) updates.clientSecret = args.clientSecret;
    if (args.attributeMapping !== undefined) updates.attributeMapping = args.attributeMapping;
    if (args.jitProvisioning !== undefined) updates.jitProvisioning = args.jitProvisioning;

    await ctx.db.patch(args.configId, updates);

    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: config.businessId,
      userId: identity.subject as any,
      action: "oidc_config_updated",
      entityType: "oidc_config",
      entityId: args.configId,
      details: updates,
      createdAt: Date.now(),
    });
  },
});

export const deleteOIDCConfig = mutation({
  args: { configId: v.id("oidcConfigs") },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const config = await ctx.db.get(args.configId);
    if (!config) throw new Error("OIDC config not found");

    await ctx.db.delete(args.configId);

    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: config.businessId,
      userId: identity.subject as any,
      action: "oidc_config_deleted",
      entityType: "oidc_config",
      entityId: args.configId,
      details: { name: config.name },
      createdAt: Date.now(),
    });
  },
});

export const listOIDCConfigs = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx: any, args) => {
    return await ctx.db
      .query("oidcConfigs")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId))
      .collect();
  },
});

export const getOIDCConfig = query({
  args: { configId: v.id("oidcConfigs") },
  handler: async (ctx: any, args) => {
    return await ctx.db.get(args.configId);
  },
});

export const toggleOIDCConfig = mutation({
  args: {
    configId: v.id("oidcConfigs"),
    active: v.boolean(),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const config = await ctx.db.get(args.configId);
    if (!config) throw new Error("OIDC config not found");

    await ctx.db.patch(args.configId, {
      active: args.active,
      updatedAt: Date.now(),
    });

    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: config.businessId,
      userId: identity.subject as any,
      action: args.active ? "oidc_config_enabled" : "oidc_config_disabled",
      entityType: "oidc_config",
      entityId: args.configId,
      details: {},
      createdAt: Date.now(),
    });
  },
});

export const logSSOEvent = mutation({
  args: {
    businessId: v.id("businesses"),
    configId: v.id("oidcConfigs"),
    eventType: v.string(),
    userId: v.optional(v.id("users")),
    success: v.boolean(),
    details: v.optional(v.any()),
  },
  handler: async (ctx: any, args) => {
    await ctx.db.insert("ssoAnalytics", {
      businessId: args.businessId,
      configId: args.configId,
      configType: "oidc",
      eventType: args.eventType,
      userId: args.userId,
      success: args.success,
      details: args.details,
      timestamp: Date.now(),
    });
  },
});

export const getSSOAnalytics = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx: any, args) => {
    const analytics = await ctx.db
      .query("ssoAnalytics")
      .withIndex("by_business_and_timestamp", (q: any) => q.eq("businessId", args.businessId))
      .collect();

    const totalLogins = analytics.length;
    const successfulLogins = analytics.filter((a: any) => a.success).length;
    const failedLogins = totalLogins - successfulLogins;
    const successRate = totalLogins > 0 ? (successfulLogins / totalLogins) * 100 : 0;

    // Count JIT provisions
    const jitProvisions = analytics.filter((a: any) => a.eventType === "jit_provision").length;

    // Group by config
    const byConfig = analytics.reduce((acc: any[], event: any) => {
      const existing = acc.find((item) => item.configId === event.configId);
      if (existing) {
        if (event.success) {
          existing.successfulLogins++;
        } else {
          existing.failedLogins++;
        }
      } else {
        acc.push({
          configId: event.configId,
          configType: event.configType,
          successfulLogins: event.success ? 1 : 0,
          failedLogins: event.success ? 0 : 1,
        });
      }
      return acc;
    }, []);

    // Get recent events (last 10)
    const recentEvents = analytics
      .sort((a: any, b: any) => b.timestamp - a.timestamp)
      .slice(0, 10)
      .map((event: any) => ({
        configId: event.configId,
        configType: event.configType,
        eventType: event.eventType,
        success: event.success,
        timestamp: event.timestamp,
      }));

    return {
      totalLogins,
      successfulLogins,
      failedLogins,
      successRate,
      jitProvisions,
      byConfig,
      recentEvents,
    };
  },
});

export const getOIDCConfigInternal = internalQuery({
  args: { configId: v.id("oidcConfigs") },
  handler: async (ctx: any, args) => {
    return await ctx.db.get(args.configId);
  },
});