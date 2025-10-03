import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * KMS (Key Management Service) Integration
 * Supports AWS KMS, Azure Key Vault, and Google Cloud KMS
 * Implements envelope encryption pattern for data security
 */

/**
 * Create or update KMS configuration
 */
export const saveKmsConfig = mutation({
  args: {
    businessId: v.id("businesses"),
    provider: v.union(v.literal("aws"), v.literal("azure"), v.literal("google")),
    keyId: v.string(),
    region: v.optional(v.string()),
    keyVaultUrl: v.optional(v.string()),
    projectId: v.optional(v.string()),
    location: v.optional(v.string()),
    keyRing: v.optional(v.string()),
    credentials: v.optional(v.string()),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    const existing = await ctx.db
      .query("kmsConfigs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.eq(q.field("provider"), args.provider))
      .unique();
    
    const now = Date.now();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        keyId: args.keyId,
        region: args.region,
        keyVaultUrl: args.keyVaultUrl,
        projectId: args.projectId,
        location: args.location,
        keyRing: args.keyRing,
        credentials: args.credentials,
        active: args.active,
        updatedAt: now,
      });
      
      await ctx.runMutation(api.audit.write, {
        action: "kms_config_updated",
        entityType: "kms",
        entityId: String(existing._id),
        details: { businessId: args.businessId, provider: args.provider },
      });
      
      return existing._id;
    } else {
      const id = await ctx.db.insert("kmsConfigs", {
        businessId: args.businessId,
        provider: args.provider,
        keyId: args.keyId,
        region: args.region,
        keyVaultUrl: args.keyVaultUrl,
        projectId: args.projectId,
        location: args.location,
        keyRing: args.keyRing,
        credentials: args.credentials,
        active: args.active,
        createdAt: now,
      });
      
      await ctx.runMutation(api.audit.write, {
        action: "kms_config_created",
        entityType: "kms",
        entityId: String(id),
        details: { businessId: args.businessId, provider: args.provider },
      });
      
      return id;
    }
  },
});

/**
 * Get KMS configuration for a business
 */
export const getKmsConfig = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const configs = await ctx.db
      .query("kmsConfigs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
    
    // Return configs without sensitive credentials
    return configs.map((c) => ({
      _id: c._id,
      businessId: c.businessId,
      provider: c.provider,
      keyId: c.keyId,
      region: c.region,
      keyVaultUrl: c.keyVaultUrl,
      projectId: c.projectId,
      location: c.location,
      keyRing: c.keyRing,
      active: c.active,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  },
});

/**
 * Internal: Get full KMS configuration including credentials
 */
export const getKmsConfigInternal = internalQuery({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("kmsConfigs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.eq(q.field("active"), true))
      .first();
    
    return config || null;
  },
});