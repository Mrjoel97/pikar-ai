"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { internal } from "./_generated/api";

const scryptAsync = promisify(scrypt);

// Sign up action (Node runtime)
export const signUp = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const { email, password } = args;

    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if admin auth already exists
    // Break type inference chain by casting internal object
    const getAdminAuthFn: any = (internal as any).adminAuthData.getAdminAuthByEmail;
    const existing = (await ctx.runQuery(getAdminAuthFn, { email: normalizedEmail } as any)) as any;
    if (existing) {
      throw new Error("Admin account already exists with this email");
    }

    // Hash password
    const salt = randomBytes(32).toString("hex");
    const derivedKey = await scryptAsync(password, salt, 64);
    const passwordHash = `scrypt:${salt}:${(derivedKey as Buffer).toString("hex")}`;

    // Persist admin auth
    await ctx.runMutation((internal as any).adminAuthData.createAdminAuth, {
      email: normalizedEmail,
      passwordHash,
      createdAt: Date.now(),
    });

    // Ensure admin role exists
    // Break type inference chain by storing function reference
    const getAdminFn: any = (internal as any).adminAuthData.getAdminByEmail;
    const adminRole = (await ctx.runQuery(getAdminFn, { email: normalizedEmail } as any)) as any;
    if (!adminRole) {
      await ctx.runMutation((internal as any).adminAuthData.ensureAdminRole, {
        email: normalizedEmail,
        role: "admin",
      });
    }

    return { success: true };
  },
});

// Login action (Node runtime)
export const login = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const { email, password } = args;
    const normalizedEmail = email.toLowerCase().trim();

    // Load admin auth
    // Break type inference chain by storing function reference
    const getAdminAuthFn2: any = (internal as any).adminAuthData.getAdminAuthByEmail;
    const adminAuth = (await ctx.runQuery(getAdminAuthFn2, { email: normalizedEmail } as any)) as any;
    if (!adminAuth) {
      throw new Error("Invalid email or password");
    }

    // Verify password
    const [, salt, storedKey] = adminAuth.passwordHash.split(":");
    const derivedKey = await scryptAsync(password, salt, 64);
    const derivedKeyHex = (derivedKey as Buffer).toString("hex");

    if (derivedKeyHex !== storedKey) {
      throw new Error("Invalid email or password");
    }

    // Issue session
    const token = randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    await ctx.runMutation((internal as any).adminAuthData.createSession, {
      token,
      email: normalizedEmail,
      createdAt: Date.now(),
      expiresAt,
    });

    return { token, expiresAt };
  },
});