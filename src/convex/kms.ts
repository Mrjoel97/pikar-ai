"use node";

import { v } from "convex/values";
import { action, mutation, query, internalQuery } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * KMS (Key Management Service) Integration
 * Supports AWS KMS, Azure Key Vault, and Google Cloud KMS
 * Implements envelope encryption pattern for data security
 */

// Envelope encryption: Generate DEK, encrypt data with DEK, encrypt DEK with KMS
async function envelopeEncrypt(plaintext: string, provider: string, config: any): Promise<string> {
  // Generate a random 256-bit data encryption key (DEK)
  const dek = Buffer.from(Array.from({ length: 32 }, () => Math.floor(Math.random() * 256)));
  
  // Encrypt the plaintext with the DEK using AES-256-GCM
  const crypto = await import("crypto");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", dek, iv);
  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag();
  
  // Encrypt the DEK with KMS
  let encryptedDek: string;
  
  if (provider === "aws") {
    const { KMSClient, EncryptCommand } = await import("@aws-sdk/client-kms");
    const client = new KMSClient({
      region: config.region,
      credentials: config.credentials ? JSON.parse(config.credentials) : undefined,
    });
    const command = new EncryptCommand({
      KeyId: config.keyId,
      Plaintext: dek,
    });
    const response = await client.send(command);
    encryptedDek = Buffer.from(response.CiphertextBlob!).toString("base64");
  } else if (provider === "azure") {
    const { KeyClient } = await import("@azure/keyvault-keys");
    const { DefaultAzureCredential, ClientSecretCredential } = await import("@azure/identity");
    const credential = config.credentials
      ? new ClientSecretCredential(
          JSON.parse(config.credentials).tenantId,
          JSON.parse(config.credentials).clientId,
          JSON.parse(config.credentials).clientSecret
        )
      : new DefaultAzureCredential();
    const client = new KeyClient(config.keyVaultUrl, credential);
    const cryptoClient = client.getCryptographyClient(config.keyId);
    const result = await cryptoClient.encrypt({ algorithm: "RSA-OAEP", plaintext: dek });
    encryptedDek = Buffer.from(result.result).toString("base64");
  } else if (provider === "google") {
    const { KeyManagementServiceClient } = await import("@google-cloud/kms");
    const client = new KeyManagementServiceClient(
      config.credentials ? { credentials: JSON.parse(config.credentials) } : undefined
    );
    const keyName = `projects/${config.projectId}/locations/${config.location}/keyRings/${config.keyRing}/cryptoKeys/${config.keyId}`;
    const [result] = await client.encrypt({
      name: keyName,
      plaintext: dek,
    });
    encryptedDek = Buffer.from(result.ciphertext!).toString("base64");
  } else {
    throw new Error(`Unsupported KMS provider: ${provider}`);
  }
  
  // Return envelope: encryptedDek:iv:authTag:encryptedData
  return `${encryptedDek}:${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
}

async function envelopeDecrypt(envelope: string, provider: string, config: any): Promise<string> {
  const [encryptedDek, ivBase64, authTagBase64, encryptedData] = envelope.split(":");
  
  // Decrypt the DEK with KMS
  let dek: Buffer;
  
  if (provider === "aws") {
    const { KMSClient, DecryptCommand } = await import("@aws-sdk/client-kms");
    const client = new KMSClient({
      region: config.region,
      credentials: config.credentials ? JSON.parse(config.credentials) : undefined,
    });
    const command = new DecryptCommand({
      CiphertextBlob: Buffer.from(encryptedDek, "base64"),
    });
    const response = await client.send(command);
    dek = Buffer.from(response.Plaintext!);
  } else if (provider === "azure") {
    const { KeyClient } = await import("@azure/keyvault-keys");
    const { DefaultAzureCredential, ClientSecretCredential } = await import("@azure/identity");
    const credential = config.credentials
      ? new ClientSecretCredential(
          JSON.parse(config.credentials).tenantId,
          JSON.parse(config.credentials).clientId,
          JSON.parse(config.credentials).clientSecret
        )
      : new DefaultAzureCredential();
    const client = new KeyClient(config.keyVaultUrl, credential);
    const cryptoClient = client.getCryptographyClient(config.keyId);
    const result = await cryptoClient.decrypt({
      algorithm: "RSA-OAEP",
      ciphertext: Buffer.from(encryptedDek, "base64"),
    });
    dek = Buffer.from(result.result);
  } else if (provider === "google") {
    const { KeyManagementServiceClient } = await import("@google-cloud/kms");
    const client = new KeyManagementServiceClient(
      config.credentials ? { credentials: JSON.parse(config.credentials) } : undefined
    );
    const keyName = `projects/${config.projectId}/locations/${config.location}/keyRings/${config.keyRing}/cryptoKeys/${config.keyId}`;
    const [result] = await client.decrypt({
      name: keyName,
      ciphertext: Buffer.from(encryptedDek, "base64"),
    });
    dek = Buffer.from(result.plaintext!);
  } else {
    throw new Error(`Unsupported KMS provider: ${provider}`);
  }
  
  // Decrypt the data with the DEK
  const crypto = await import("crypto");
  const iv = Buffer.from(ivBase64, "base64");
  const authTag = Buffer.from(authTagBase64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", dek, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedData, "base64", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}

/**
 * Encrypt data using configured KMS provider
 */
export const encryptData = action({
  args: {
    businessId: v.id("businesses"),
    plaintext: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    const config = await ctx.runQuery(internal.kms.getKmsConfigInternal, {
      businessId: args.businessId,
    });
    
    if (!config || !config.active) {
      throw new Error("KMS not configured or inactive for this business");
    }
    
    try {
      const encrypted = await envelopeEncrypt(args.plaintext, config.provider, config);
      
      // Audit log
      await ctx.runMutation(api.audit.write, {
        action: "kms_encrypt",
        entityType: "kms",
        entityId: String(config._id),
        details: { businessId: args.businessId, provider: config.provider },
      });
      
      return encrypted;
    } catch (error: any) {
      console.error("KMS encryption error:", error);
      throw new Error("Encryption failed");
    }
  },
});

/**
 * Decrypt data using configured KMS provider
 */
export const decryptData = action({
  args: {
    businessId: v.id("businesses"),
    ciphertext: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    const config = await ctx.runQuery(internal.kms.getKmsConfigInternal, {
      businessId: args.businessId,
    });
    
    if (!config || !config.active) {
      throw new Error("KMS not configured or inactive for this business");
    }
    
    try {
      const decrypted = await envelopeDecrypt(args.ciphertext, config.provider, config);
      
      // Audit log
      await ctx.runMutation(api.audit.write, {
        action: "kms_decrypt",
        entityType: "kms",
        entityId: String(config._id),
        details: { businessId: args.businessId, provider: config.provider },
      });
      
      return decrypted;
    } catch (error: any) {
      console.error("KMS decryption error:", error);
      throw new Error("Decryption failed");
    }
  },
});

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

/**
 * Test KMS configuration by encrypting and decrypting test data
 */
export const testKmsConfig = action({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args): Promise<{ success: boolean; message: string }> => {
    try {
      const testData = "KMS_TEST_" + Date.now();
      const encrypted = await ctx.runAction(api.kms.encryptData, {
        businessId: args.businessId,
        plaintext: testData,
      });
      const decrypted = await ctx.runAction(api.kms.decryptData, {
        businessId: args.businessId,
        ciphertext: encrypted,
      });
      
      if (decrypted === testData) {
        return { success: true, message: "KMS configuration is working correctly" };
      } else {
        return { success: false, message: "Decryption mismatch" };
      }
    } catch (error: any) {
      return { success: false, message: error.message || "Test failed" };
    }
  },
});
