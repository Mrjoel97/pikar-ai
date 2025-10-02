"use node";

import { v } from "convex/values";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * SAML Configuration Management
 */

export const createSAMLConfig = mutation({
  args: {
    businessId: v.id("businesses"),
    idpEntityId: v.string(),
    ssoUrl: v.string(),
    certificate: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Check if config already exists
    const existing = await ctx.db
      .query("samlConfigs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        idpEntityId: args.idpEntityId,
        ssoUrl: args.ssoUrl,
        certificate: args.certificate,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    // Create new
    const configId = await ctx.db.insert("samlConfigs", {
      businessId: args.businessId,
      idpEntityId: args.idpEntityId,
      ssoUrl: args.ssoUrl,
      certificate: args.certificate,
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
      details: { idpEntityId: args.idpEntityId },
      createdAt: Date.now(),
    });

    return configId;
  },
});

export const getSAMLConfig = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("samlConfigs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .first();
  },
});

export const toggleSAMLConfig = mutation({
  args: {
    businessId: v.id("businesses"),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const config = await ctx.db
      .query("samlConfigs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .first();

    if (!config) throw new Error("SAML config not found");

    await ctx.db.patch(config._id, {
      active: args.active,
      updatedAt: Date.now(),
    });

    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      userId: identity.subject as any,
      action: args.active ? "saml_config_enabled" : "saml_config_disabled",
      entityType: "saml_config",
      entityId: config._id,
      details: {},
      createdAt: Date.now(),
    });
  },
});

export const validateSAMLAssertion = action({
  args: {
    samlResponse: v.string(),
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const samlify = await import("samlify");

    // Get SAML config
    const config = await ctx.runQuery(internal.saml.getSAMLConfigInternal, {
      businessId: args.businessId,
    });

    if (!config || !config.active) {
      throw new Error("SAML not configured or inactive");
    }

    try {
      // Create service provider
      const sp = samlify.ServiceProvider({
        entityID: "pikar-ai",
        assertionConsumerService: [
          {
            Binding: samlify.Constants.namespace.binding.post,
            Location: `${process.env.VITE_PUBLIC_BASE_URL}/auth/saml/acs`,
          },
        ],
      });

      // Create identity provider
      const idp = samlify.IdentityProvider({
        entityID: config.idpEntityId,
        singleSignOnService: [
          {
            Binding: samlify.Constants.namespace.binding.redirect,
            Location: config.ssoUrl,
          },
        ],
        signingCert: config.certificate,
      });

      // Parse and validate SAML response
      const result = await sp.parseLoginResponse(idp, "post", {
        body: { SAMLResponse: args.samlResponse },
      });

      // Extract user info from assertion
      const extract = result.extract;
      const email = extract.nameID || extract.attributes?.email?.[0];
      const firstName = extract.attributes?.firstName?.[0] || "";
      const lastName = extract.attributes?.lastName?.[0] || "";

      if (!email) {
        throw new Error("No email found in SAML assertion");
      }

      return {
        success: true,
        email,
        firstName,
        lastName,
        attributes: extract.attributes,
      };
    } catch (error: any) {
      console.error("SAML validation error:", error);
      throw new Error(`SAML validation failed: ${error.message}`);
    }
  },
});

export const getSAMLConfigInternal = internalQuery({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("samlConfigs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .first();
  },
});
