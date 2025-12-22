"use node";

import { action } from "./_generated/server";
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
    const existing = await ctx.runQuery(internal.passwordAuthData.getCredentialByEmail, {
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
    await ctx.runMutation(internal.passwordAuthData.setCredential, {
      email,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    // Create user record
    await ctx.runMutation(internal.passwordAuthData.createUserForEmail, {
      email,
    });

    return { success: true, email };
  },
});

export const loginPassword = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; email: string; userId: any }> => {
    const email = args.email.toLowerCase().trim();

    const credential = await ctx.runQuery(internal.passwordAuthData.getCredentialByEmail, {
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

    // Ensure user exists
    const userId: any = await ctx.runMutation(internal.passwordAuthData.ensureUserForEmail, {
      email,
    });

    // Create auth session
    await ctx.runMutation(internal.passwordAuthData.createAuthSession, {
      email,
      userId,
    });

    return { success: true, email, userId };
  },
});

export const requestPasswordReset = action({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    const credential = await ctx.runQuery(internal.passwordAuthData.getCredentialByEmail, {
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

    await ctx.runMutation(internal.passwordAuthData.setResetToken, { email, token, expires });

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
      internal.passwordAuthData.getCredentialByResetToken,
      { token: args.token },
    );
    if (!credential) {
      throw new Error("Invalid or expired reset token");
    }

    // Hash new password and update via internal mutation
    const { hash, salt } = hashPassword(args.newPassword);
    const passwordHash = `${salt}:${hash}`;

    await ctx.runMutation(internal.passwordAuthData.updateCredentialHash, {
      id: credential._id,
      passwordHash,
    });

    return { success: true };
  },
});