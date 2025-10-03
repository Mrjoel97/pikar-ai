"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

// Encrypt data using the active KMS provider
export const encryptData = action({
  args: {
    businessId: v.id("businesses"),
    plaintext: v.string(),
  },
  handler: async (ctx, args): Promise<{
    encryptedData: string;
    encryptedDek: string;
    iv: string;
    provider: "aws" | "azure" | "google";
  }> => {
    const config: any = await ctx.runQuery(internal.kms.getKmsConfigInternal, {
      businessId: args.businessId,
    });

    if (!config || !config.active) {
      throw new Error("No active KMS configuration found");
    }

    // Generate a data encryption key (DEK)
    const dek = crypto.getRandomValues(new Uint8Array(32));
    const dekBase64 = Buffer.from(dek).toString("base64");

    // Encrypt the plaintext with the DEK
    const encoder = new TextEncoder();
    const data = encoder.encode(args.plaintext);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const key = await crypto.subtle.importKey(
      "raw",
      dek,
      { name: "AES-GCM" },
      false,
      ["encrypt"]
    );
    
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );

    const encryptedBase64 = Buffer.from(encrypted).toString("base64");
    const ivBase64 = Buffer.from(iv).toString("base64");

    // Encrypt the DEK with KMS
    let encryptedDek: string;

    if (config.provider === "aws") {
      const { KMSClient, EncryptCommand } = await import("@aws-sdk/client-kms");
      const client = new KMSClient({
        region: config.region || "us-east-1",
        credentials: config.credentials ? JSON.parse(config.credentials) : undefined,
      });
      const command = new EncryptCommand({
        KeyId: config.keyId,
        Plaintext: Buffer.from(dekBase64),
      });
      const response = await client.send(command);
      encryptedDek = Buffer.from(response.CiphertextBlob!).toString("base64");
    } else if (config.provider === "azure") {
      const { KeyClient } = await import("@azure/keyvault-keys");
      const { DefaultAzureCredential } = await import("@azure/identity");
      const credential = new DefaultAzureCredential();
      const client = new KeyClient(config.keyVaultUrl!, credential);
      const key = await client.getKey(config.keyId);
      const { CryptographyClient } = await import("@azure/keyvault-keys");
      const cryptoClient = new CryptographyClient(key, credential);
      const result = await cryptoClient.encrypt({ algorithm: "RSA-OAEP", plaintext: Buffer.from(dekBase64) });
      encryptedDek = Buffer.from(result.result).toString("base64");
    } else if (config.provider === "google") {
      const { KeyManagementServiceClient } = await import("@google-cloud/kms");
      const client = new KeyManagementServiceClient({
        credentials: config.credentials ? JSON.parse(config.credentials) : undefined,
      });
      const name = `projects/${config.projectId}/locations/${config.location}/keyRings/${config.keyRing}/cryptoKeys/${config.keyId}`;
      const [result] = await client.encrypt({
        name,
        plaintext: Buffer.from(dekBase64),
      });
      encryptedDek = Buffer.from(result.ciphertext!).toString("base64");
    } else {
      throw new Error(`Unsupported KMS provider: ${config.provider}`);
    }

    return {
      encryptedData: encryptedBase64,
      encryptedDek,
      iv: ivBase64,
      provider: config.provider,
    };
  },
});

// Decrypt data using the active KMS provider
export const decryptData = action({
  args: {
    businessId: v.id("businesses"),
    encryptedData: v.string(),
    encryptedDek: v.string(),
    iv: v.string(),
    provider: v.union(v.literal("aws"), v.literal("azure"), v.literal("google")),
  },
  handler: async (ctx, args): Promise<string> => {
    const config: any = await ctx.runQuery(internal.kms.getKmsConfigInternal, {
      businessId: args.businessId,
    });

    if (!config || !config.active || config.provider !== args.provider) {
      throw new Error("KMS configuration mismatch or inactive");
    }

    // Decrypt the DEK with KMS
    let dekBase64: string;

    if (config.provider === "aws") {
      const { KMSClient, DecryptCommand } = await import("@aws-sdk/client-kms");
      const client = new KMSClient({
        region: config.region || "us-east-1",
        credentials: config.credentials ? JSON.parse(config.credentials) : undefined,
      });
      const command = new DecryptCommand({
        CiphertextBlob: Buffer.from(args.encryptedDek, "base64"),
      });
      const response = await client.send(command);
      dekBase64 = Buffer.from(response.Plaintext!).toString("base64");
    } else if (config.provider === "azure") {
      const { KeyClient } = await import("@azure/keyvault-keys");
      const { DefaultAzureCredential } = await import("@azure/identity");
      const credential = new DefaultAzureCredential();
      const client = new KeyClient(config.keyVaultUrl!, credential);
      const key = await client.getKey(config.keyId);
      const { CryptographyClient } = await import("@azure/keyvault-keys");
      const cryptoClient = new CryptographyClient(key, credential);
      const result = await cryptoClient.decrypt({
        algorithm: "RSA-OAEP",
        ciphertext: Buffer.from(args.encryptedDek, "base64"),
      });
      dekBase64 = Buffer.from(result.result).toString("base64");
    } else if (config.provider === "google") {
      const { KeyManagementServiceClient } = await import("@google-cloud/kms");
      const client = new KeyManagementServiceClient({
        credentials: config.credentials ? JSON.parse(config.credentials) : undefined,
      });
      const name = `projects/${config.projectId}/locations/${config.location}/keyRings/${config.keyRing}/cryptoKeys/${config.keyId}`;
      const [result] = await client.decrypt({
        name,
        ciphertext: Buffer.from(args.encryptedDek, "base64"),
      });
      dekBase64 = Buffer.from(result.plaintext!).toString("base64");
    } else {
      throw new Error(`Unsupported KMS provider: ${config.provider}`);
    }

    // Decrypt the data with the DEK
    const dek = Buffer.from(dekBase64, "base64");
    const key = await crypto.subtle.importKey(
      "raw",
      dek,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    const iv = Buffer.from(args.iv, "base64");
    const encrypted = Buffer.from(args.encryptedData, "base64");

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  },
});