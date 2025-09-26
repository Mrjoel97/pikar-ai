"use node";

import { action, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { randomBytes, scryptSync } from "crypto";
import { internal } from "./_generated/api";

// Replace hashing with scryptSync
function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || randomBytes(16).toString("hex");
  const hash = scryptSync(password, actualSalt, 64).toString("hex");
  return { hash, salt: actualSalt };
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  const { hash: testHash } = hashPassword(password, salt);
  return testHash === hash;
}

// Export internal queries and mutations so they are registered and callable via `internal.passwordAuth.*`
export const getCredentialByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userCredentials")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .unique();
  },
});

export const setCredential = internalMutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("userCredentials", args);
  },
});

export const setResetToken = internalMutation({
  args: {
    email: v.string(),
    token: v.string(),
    expires: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.runQuery(internal.passwordAuth.getCredentialByEmail, {
      email: args.email,
    });
    if (!existing) throw new Error("No account found");

    await ctx.db.patch(existing._id, {
      passwordResetToken: args.token,
      passwordResetExpires: args.expires,
      updatedAt: Date.now(),
    });
  },
});

export const clearReset = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.runQuery(internal.passwordAuth.getCredentialByEmail, {
      email: args.email,
    });
    if (!existing) return;

    await ctx.db.patch(existing._id, {
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
      updatedAt: Date.now(),
    });
  },
});

export const createLoginToken = internalMutation({
  args: {
    email: v.string(),
    token: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("userLoginTokens", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// New internal helper to find a credential by reset token (actions can't access db directly)
export const getCredentialByResetToken = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    for await (const cred of ctx.db.query("userCredentials")) {
      if (
        cred.passwordResetToken === args.token &&
        cred.passwordResetExpires &&
        cred.passwordResetExpires > Date.now()
      ) {
        return cred;
      }
    }
    return null;
  },
});

// New internal helper to update password hash by credential id
export const updateCredentialHash = internalMutation({
  args: {
    id: v.id("userCredentials"),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      passwordHash: args.passwordHash,
      updatedAt: Date.now(),
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    });
  },
});

// Public actions (now calling internal.* via ctx.runQuery/ctx.runMutation)

export const signUpPassword = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    // Basic validation
    if (!email.includes("@") || email.length < 3) {
      throw new Error("Please enter a valid email address");
    }
    if (args.password.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }

    // Check if credential already exists
    const existing = await ctx.runQuery(internal.passwordAuth.getCredentialByEmail, {
      email,
    });
    if (existing) {
      throw new Error("An account with this email already exists");
    }

    // Hash password
    const { hash, salt } = hashPassword(args.password);
    const passwordHash = `${salt}:${hash}`;

    // Store credential
    const now = Date.now();
    await ctx.runMutation(internal.passwordAuth.setCredential, {
      email,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, email };
  },
});

export const loginPassword = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    const credential = await ctx.runQuery(internal.passwordAuth.getCredentialByEmail, {
      email,
    });
    if (!credential) {
      throw new Error("Invalid email or password");
    }

    // Verify password
    const [salt, hash] = credential.passwordHash.split(":");
    if (!verifyPassword(args.password, hash, salt)) {
      throw new Error("Invalid email or password");
    }

    // Create short-lived login token
    const token = randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    await ctx.runMutation(internal.passwordAuth.createLoginToken, {
      email,
      token,
      expiresAt,
    });

    return { success: true, email, token };
  },
});

export const requestPasswordReset = action({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    const credential = await ctx.runQuery(internal.passwordAuth.getCredentialByEmail, {
      email,
    });
    if (!credential) {
      // Don't reveal if email exists
      return {
        success: true,
        message: "If an account exists, reset instructions have been sent",
      };
    }

    const token = randomBytes(32).toString("hex");
    const expires = Date.now() + 60 * 60 * 1000; // 1 hour

    await ctx.runMutation(internal.passwordAuth.setResetToken, { email, token, expires });

    // For dev: return token directly
    // In production: send email via emailsActions
    return { success: true, token, message: "Reset token generated (dev mode)" };
  },
});

export const resetPassword = action({
  args: {
    token: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }

    // Find credential by reset token (via internal query)
    const credential = await ctx.runQuery(
      internal.passwordAuth.getCredentialByResetToken,
      { token: args.token },
    );
    if (!credential) {
      throw new Error("Invalid or expired reset token");
    }

    // Hash new password and update via internal mutation
    const { hash, salt } = hashPassword(args.newPassword);
    const passwordHash = `${salt}:${hash}`;

    await ctx.runMutation(internal.passwordAuth.updateCredentialHash, {
      id: credential._id,
      passwordHash,
    });

    return { success: true };
  },
});