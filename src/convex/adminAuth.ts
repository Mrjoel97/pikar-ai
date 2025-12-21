"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
// Avoid deep type inference by importing as any
const internal = require("./_generated/api").internal as any;

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
    const existing = (await ctx.runQuery(
      (internal as any)["adminAuthData"]["getAdminAuthByEmail"],
      { email: normalizedEmail } as any
    )) as any;
    if (existing) {
      throw new Error("Admin account already exists with this email");
    }

    // Hash password
    const salt = randomBytes(32).toString("hex");
    const derivedKey = await scryptAsync(password, salt, 64);
    const passwordHash = `scrypt:${salt}:${(derivedKey as Buffer).toString("hex")}`;

    // Persist admin auth
    await ctx.runMutation(
      (internal as any)["adminAuthData"]["createAdminAuth"],
      {
        email: normalizedEmail,
        passwordHash,
        createdAt: Date.now(),
      }
    );

    // Ensure admin role exists - always create/update to ensure consistency
    await ctx.runMutation(
      (internal as any)["adminAuthData"]["ensureAdminRole"],
      {
        email: normalizedEmail,
        role: "admin",
      }
    );

    // Log admin signup
    await ctx.runMutation(
      (internal as any)["adminAuthData"]["logAdminAction"],
      {
        email: normalizedEmail,
        action: "admin_signup",
        details: { timestamp: Date.now() },
      }
    );

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
    const adminAuth = (await ctx.runQuery(
      (internal as any)["adminAuthData"]["getAdminAuthByEmail"],
      { email: normalizedEmail } as any
    )) as any;
    if (!adminAuth) {
      throw new Error("Invalid email or password");
    }

    // Verify password
    const parts = adminAuth.passwordHash.split(":");
    if (parts.length !== 3 || parts[0] !== "scrypt") {
      throw new Error("Invalid password hash format");
    }
    const [, salt, storedKey] = parts;
    const derivedKey = await scryptAsync(password, salt, 64);
    const derivedKeyHex = (derivedKey as Buffer).toString("hex");

    if (derivedKeyHex !== storedKey) {
      throw new Error("Invalid email or password");
    }

    // Issue session
    const token = randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    await ctx.runMutation(
      (internal as any)["adminAuthData"]["createSession"],
      {
      token,
      email: normalizedEmail,
      createdAt: Date.now(),
      expiresAt,
    });

    // Log admin login
    await ctx.runMutation(
      (internal as any)["adminAuthData"]["logAdminAction"],
      {
        email: normalizedEmail,
        action: "admin_login",
        details: { timestamp: Date.now() },
      }
    );

    return { token, expiresAt };
  },
});

// Logout action (Node runtime)
export const logout = action({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate and get session info
    const sessionInfo = (await ctx.runQuery(
      (internal as any)["adminAuthData"]["validateSessionInternal"],
      { token: args.token } as any
    )) as any;

    if (!sessionInfo?.valid) {
      throw new Error("Invalid session");
    }

    // Invalidate session
    await ctx.runMutation(
      (internal as any)["adminAuthData"]["invalidateSession"],
      { token: args.token }
    );

    // Log admin logout
    await ctx.runMutation(
      (internal as any)["adminAuthData"]["logAdminAction"],
      {
        email: sessionInfo.email,
        action: "admin_logout",
        details: { timestamp: Date.now() },
      }
    );

    return { success: true };
  },
});