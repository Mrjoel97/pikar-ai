import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";

/**
 * SAML Configuration Management - Enhanced with Multi-IdP Support
 */

export const createSAMLConfig = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    idpEntityId: v.string(),
    ssoUrl: v.string(),
    certificate: v.string(),
    attributeMapping: v.optional(v.any()),
    jitProvisioning: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Create new SAML config (supports multiple IdPs)
    const configId = await ctx.db.insert("samlConfigs", {
      businessId: args.businessId,
      name: args.name,
      idpEntityId: args.idpEntityId,
      ssoUrl: args.ssoUrl,
      certificate: args.certificate,
      attributeMapping: args.attributeMapping || {
        email: "email",
        firstName: "firstName",
        lastName: "lastName",
        displayName: "displayName",
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
      action: "saml_config_created",
      entityType: "saml_config",
      entityId: configId,
      details: { name: args.name, idpEntityId: args.idpEntityId },
      createdAt: Date.now(),
    });

    return configId;
  },
});

export const updateSAMLConfig = mutation({
  args: {
    configId: v.id("samlConfigs"),
    name: v.optional(v.string()),
    idpEntityId: v.optional(v.string()),
    ssoUrl: v.optional(v.string()),
    certificate: v.optional(v.string()),
    attributeMapping: v.optional(v.any()),
    jitProvisioning: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const config = await ctx.db.get(args.configId);
    if (!config) throw new Error("SAML config not found");

    const updates: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.idpEntityId !== undefined) updates.idpEntityId = args.idpEntityId;
    if (args.ssoUrl !== undefined) updates.ssoUrl = args.ssoUrl;
    if (args.certificate !== undefined) updates.certificate = args.certificate;
    if (args.attributeMapping !== undefined) updates.attributeMapping = args.attributeMapping;
    if (args.jitProvisioning !== undefined) updates.jitProvisioning = args.jitProvisioning;

    await ctx.db.patch(args.configId, updates);

    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: config.businessId,
      userId: identity.subject as any,
      action: "saml_config_updated",
      entityType: "saml_config",
      entityId: args.configId,
      details: updates,
      createdAt: Date.now(),
    });
  },
});

export const deleteSAMLConfig = mutation({
  args: { configId: v.id("samlConfigs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const config = await ctx.db.get(args.configId);
    if (!config) throw new Error("SAML config not found");

    await ctx.db.delete(args.configId);

    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: config.businessId,
      userId: identity.subject as any,
      action: "saml_config_deleted",
      entityType: "saml_config",
      entityId: args.configId,
      details: { name: config.name },
      createdAt: Date.now(),
    });
  },
});

export const listSAMLConfigs = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("samlConfigs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
  },
});

export const getSAMLConfig = query({
  args: { configId: v.id("samlConfigs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.configId);
  },
});

export const toggleSAMLConfig = mutation({
  args: {
    configId: v.id("samlConfigs"),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const config = await ctx.db.get(args.configId);
    if (!config) throw new Error("SAML config not found");

    await ctx.db.patch(args.configId, {
      active: args.active,
      updatedAt: Date.now(),
    });

    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: config.businessId,
      userId: identity.subject as any,
      action: args.active ? "saml_config_enabled" : "saml_config_disabled",
      entityType: "saml_config",
      entityId: args.configId,
      details: {},
      createdAt: Date.now(),
    });
  },
});

export const logSSOEvent = mutation({
  args: {
    businessId: v.id("businesses"),
    configId: v.id("samlConfigs"),
    eventType: v.string(),
    userId: v.optional(v.id("users")),
    success: v.boolean(),
    details: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("ssoAnalytics", {
      businessId: args.businessId,
      configId: args.configId,
      configType: "saml",
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
  handler: async (ctx, args) => {
    const analytics = await ctx.db
      .query("ssoAnalytics")
      .withIndex("by_business_and_timestamp", (q) => q.eq("businessId", args.businessId))
      .collect();

    const totalLogins = analytics.length;
    const successfulLogins = analytics.filter((a) => a.success).length;
    const failedLogins = totalLogins - successfulLogins;
    const successRate = totalLogins > 0 ? (successfulLogins / totalLogins) * 100 : 0;

    // Count JIT provisions
    const jitProvisions = analytics.filter((a) => a.eventType === "jit_provision").length;

    // Group by config
    const byConfig = analytics.reduce((acc: any[], event) => {
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
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)
      .map((event) => ({
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

export const getSAMLConfigInternal = internalQuery({
  args: { configId: v.id("samlConfigs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.configId);
  },
});