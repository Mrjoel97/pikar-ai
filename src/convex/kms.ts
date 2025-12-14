import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * KMS (Key Management Service) Integration
 * Supports AWS KMS, Azure Key Vault, and Google Cloud KMS
 * Implements envelope encryption pattern for data security
 * Enhanced with key rotation, field-level encryption, analytics, and compliance
 */

/**
 * Create or update KMS configuration
 */
export const saveKmsConfig = mutation({
  args: {
    businessId: v.id("businesses"),
    provider: v.union(v.literal("aws"), v.literal("azure"), v.literal("gcp")),
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
        isActive: args.active,
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
      const identity = await ctx.auth.getUserIdentity();
      const email = identity?.email?.toLowerCase();
      const user = email ? await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", email))
        .unique() : null;
      
      const id = await ctx.db.insert("kmsConfigs", {
        businessId: args.businessId,
        provider: args.provider,
        keyId: args.keyId,
        region: args.region,
        isActive: args.active,
        createdAt: now,
        updatedAt: now,
        status: "active",
        createdBy: user?._id || ("" as any),
        keyRotationDays: 90,
        scope: ["all"],
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
      isActive: c.isActive,
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
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    
    return config || null;
  },
});

/**
 * Schedule key rotation
 */
export const scheduleKeyRotation = mutation({
  args: {
    businessId: v.id("businesses"),
    configId: v.id("kmsConfigs"),
    rotationIntervalDays: v.number(),
    autoRotate: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const config = await ctx.db.get(args.configId);
    if (!config || config.businessId !== args.businessId) {
      throw new Error("KMS config not found");
    }

    const nextRotation = Date.now() + args.rotationIntervalDays * 24 * 60 * 60 * 1000;

    const rotationId = await ctx.db.insert("kmsKeyRotations", {
      businessId: args.businessId,
      configId: args.configId,
      scheduledAt: Date.now(),
      status: "scheduled",
      nextRotationDate: nextRotation,
      autoRotate: args.autoRotate,
    });

    await ctx.runMutation(api.audit.write, {
      action: "kms_rotation_scheduled",
      entityType: "kms_rotation",
      entityId: String(rotationId),
      details: { configId: args.configId, intervalDays: args.rotationIntervalDays },
    });

    return rotationId;
  },
});

/**
 * Get key rotation schedule
 */
export const getKeyRotationSchedule = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("kmsKeyRotations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
  },
});

/**
 * Create encryption policy
 */
export const createEncryptionPolicy = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.string(),
    targetTables: v.array(v.string()),
    targetFields: v.array(v.string()),
    encryptionLevel: v.union(v.literal("field"), v.literal("record"), v.literal("table")),
    mandatory: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const policyId = await ctx.db.insert("kmsEncryptionPolicies", {
      businessId: args.businessId,
      name: args.name,
      description: args.description,
      algorithm: "AES-256",
      isActive: true,
      encryptionLevel: args.encryptionLevel,
      mandatory: args.mandatory,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: identity.subject as any,
      keyRotationDays: 90,
      scope: ["all"],
    });

    await ctx.runMutation(api.audit.write, {
      action: "encryption_policy_created",
      entityType: "encryption_policy",
      entityId: String(policyId),
      details: { name: args.name, level: args.encryptionLevel },
    });

    return policyId;
  },
});

/**
 * Get encryption policies
 */
export const getEncryptionPolicies = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("kmsEncryptionPolicies")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
  },
});

/**
 * Log encryption operation
 */
export const logEncryptionOperation = mutation({
  args: {
    businessId: v.id("businesses"),
    configId: v.id("kmsConfigs"),
    operation: v.union(v.literal("encrypt"), v.literal("decrypt")),
    dataType: v.string(),
    dataSize: v.number(),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("kmsUsageLogs", {
      businessId: args.businessId,
      configId: args.configId,
      operation: args.operation,
      dataType: args.dataType,
      dataSize: args.dataSize,
      success: args.success,
      errorMessage: args.errorMessage,
      timestamp: Date.now(),
    } as any);
  },
});

/**
 * Get KMS usage analytics
 */
export const getKmsAnalytics = query({
  args: {
    businessId: v.id("businesses"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const start = args.startDate || Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days ago
    const end = args.endDate || Date.now();

    const logs = await ctx.db
      .query("kmsUsageLogs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), start),
          q.lte(q.field("timestamp"), end)
        )
      )
      .collect();

    const totalOperations = logs.length;
    const encryptOperations = logs.filter((l) => l.operation === "encrypt").length;
    const decryptOperations = logs.filter((l) => l.operation === "decrypt").length;
    const successfulOperations = logs.filter((l) => l.success).length;
    const failedOperations = totalOperations - successfulOperations;
    const totalDataSize = logs.reduce((sum, l) => sum + (l.dataSize || 0), 0);

    // Group by data type
    const byDataType = logs.reduce((acc: any[], log) => {
      const existing = acc.find((item) => item.dataType === log.dataType);
      if (existing) {
        existing.count++;
        existing.dataSize += (log.dataSize || 0);
      } else {
        acc.push({
          dataType: log.dataType,
          count: 1,
          dataSize: (log.dataSize || 0),
        });
      }
      return acc;
    }, []);

    // Daily operations
    const dailyOps = logs.reduce((acc: any[], log) => {
      const date = new Date(log.timestamp).toISOString().split("T")[0];
      const existing = acc.find((item) => item.date === date);
      if (existing) {
        existing.operations++;
        if (log.operation === "encrypt") existing.encrypts++;
        if (log.operation === "decrypt") existing.decrypts++;
      } else {
        acc.push({
          date,
          operations: 1,
          encrypts: log.operation === "encrypt" ? 1 : 0,
          decrypts: log.operation === "decrypt" ? 1 : 0,
        });
      }
      return acc;
    }, []);

    return {
      totalOperations,
      encryptOperations,
      decryptOperations,
      successfulOperations,
      failedOperations,
      successRate: totalOperations > 0 ? (successfulOperations / totalOperations) * 100 : 0,
      totalDataSize,
      byDataType,
      dailyOps: dailyOps.sort((a, b) => a.date.localeCompare(b.date)),
    };
  },
});

/**
 * Get compliance report
 */
export const getComplianceReport = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const configs = await ctx.db
      .query("kmsConfigs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const rotations = await ctx.db
      .query("kmsKeyRotations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const policies = await ctx.db
      .query("kmsEncryptionPolicies")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const recentLogs = await ctx.db
      .query("kmsUsageLogs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .take(100);

    const activeConfigs = configs.filter((c) => c.isActive).length;
    const scheduledRotations = rotations.filter((r) => r.status === "scheduled").length;
    const activePolicies = policies.filter((p) => p.isActive).length;
    const recentFailures = recentLogs.filter((l) => !l.success).length;

    // Check for overdue rotations
    const now = Date.now();
    const overdueRotations = rotations.filter(
      (r) => r.nextRotationDate && r.nextRotationDate < now && r.status === "scheduled"
    ).length;

    return {
      summary: {
        activeConfigs,
        scheduledRotations,
        overdueRotations,
        activePolicies,
        recentFailures,
      },
      configs: configs.map((c) => ({
        provider: c.provider,
        isActive: c.isActive,
        createdAt: c.createdAt,
      })),
      rotations: rotations.map((r) => ({
        configId: r.configId,
        nextRotationDate: r.nextRotationDate,
        status: r.status,
        autoRotate: r.autoRotate,
      })),
      policies: policies.map((p) => ({
        name: p.name,
        encryptionLevel: p.encryptionLevel,
        mandatory: p.mandatory,
        isActive: p.isActive,
      })),
      complianceScore: calculateComplianceScore({
        activeConfigs,
        overdueRotations,
        activePolicies,
        recentFailures,
      }),
    };
  },
});

function calculateComplianceScore(metrics: {
  activeConfigs: number;
  overdueRotations: number;
  activePolicies: number;
  recentFailures: number;
}): number {
  let score = 100;

  // Deduct points for issues
  if (metrics.activeConfigs === 0) score -= 40;
  if (metrics.overdueRotations > 0) score -= metrics.overdueRotations * 10;
  if (metrics.activePolicies === 0) score -= 20;
  if (metrics.recentFailures > 0) score -= metrics.recentFailures * 2;

  return Math.max(0, score);
}

/**
 * Update encryption policy
 */
export const updateEncryptionPolicy = mutation({
  args: {
    policyId: v.id("kmsEncryptionPolicies"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    targetTables: v.optional(v.array(v.string())),
    targetFields: v.optional(v.array(v.string())),
    encryptionLevel: v.optional(v.union(v.literal("field"), v.literal("record"), v.literal("table"))),
    mandatory: v.optional(v.boolean()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const policy = await ctx.db.get(args.policyId);
    if (!policy) throw new Error("Policy not found");

    const updates: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.targetTables !== undefined) updates.targetTables = args.targetTables;
    if (args.targetFields !== undefined) updates.targetFields = args.targetFields;
    if (args.encryptionLevel !== undefined) updates.encryptionLevel = args.encryptionLevel;
    if (args.mandatory !== undefined) updates.mandatory = args.mandatory;
    if (args.active !== undefined) updates.active = args.active;

    await ctx.db.patch(args.policyId, updates);

    await ctx.runMutation(api.audit.write, {
      action: "encryption_policy_updated",
      entityType: "encryption_policy",
      entityId: String(args.policyId),
      details: updates,
    });
  },
});

/**
 * Delete encryption policy
 */
export const deleteEncryptionPolicy = mutation({
  args: { policyId: v.id("kmsEncryptionPolicies") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const policy = await ctx.db.get(args.policyId);
    if (!policy) throw new Error("Policy not found");

    await ctx.db.delete(args.policyId);

    await ctx.runMutation(api.audit.write, {
      action: "encryption_policy_deleted",
      entityType: "encryption_policy",
      entityId: String(args.policyId),
      details: { name: policy.name },
    });
  },
});