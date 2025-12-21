"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const internal = require("./_generated/api").internal as any;
const scryptAsync = promisify(scrypt);

/**
 * Direct password reset for admin accounts
 * Use this to set a new password when you've forgotten the old one
 */
export const resetAdminPassword = action({
  args: {
    email: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }

    const normalizedEmail = args.email.toLowerCase().trim();

    // Check if admin exists
    const adminAuth = await ctx.runQuery(
      (internal as any)["adminAuthData"]["getAdminAuthByEmail"],
      { email: normalizedEmail }
    );

    if (!adminAuth) {
      throw new Error("Admin account not found");
    }

    // Hash new password
    const salt = randomBytes(32).toString("hex");
    const derivedKey = await scryptAsync(args.newPassword, salt, 64);
    const passwordHash = `scrypt:${salt}:${(derivedKey as Buffer).toString("hex")}`;

    // Update password
    await ctx.runMutation(
      (internal as any)["adminAuthData"]["updatePassword"],
      {
        email: normalizedEmail,
        passwordHash,
      }
    );

    return { 
      success: true, 
      message: "Password reset successfully. You can now log in with your new password." 
    };
  },
});
