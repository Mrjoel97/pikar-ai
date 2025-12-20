"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const internal = require("./_generated/api").internal as any;
const scryptAsync = promisify(scrypt);

// Request password reset - generates token and sends email
export const requestPasswordReset = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.toLowerCase().trim();

    // Check if admin exists
    const adminAuth = (await ctx.runQuery(
      internal.adminAuthData.getAdminAuthByEmail,
      { email: normalizedEmail }
    )) as any;

    if (!adminAuth) {
      // Don't reveal if email exists or not for security
      return { success: true, message: "If the email exists, a reset link will be sent." };
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExpires = Date.now() + 60 * 60 * 1000; // 1 hour

    // Update admin auth with reset token
    await ctx.runMutation(internal.adminAuthData.updateResetToken, {
      email: normalizedEmail,
      resetToken,
      resetTokenExpires,
    });

    // Log password reset request
    await ctx.runMutation(internal.adminAuthData.logAdminAction, {
      email: normalizedEmail,
      action: "admin_password_reset_requested",
      details: { timestamp: Date.now() },
    });

    // TODO: Send email with reset link
    // For now, return the token (in production, this should be sent via email)
    return {
      success: true,
      message: "Password reset link sent to email.",
      resetToken, // Remove this in production
    };
  },
});

// Reset password with token
export const resetPassword = action({
  args: {
    resetToken: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }

    // Find admin by reset token
    const adminAuth = (await ctx.runQuery(
      internal.adminAuthData.getAdminAuthByResetToken,
      { resetToken: args.resetToken }
    )) as any;

    if (!adminAuth) {
      throw new Error("Invalid or expired reset token");
    }

    if (!adminAuth.resetTokenExpires || adminAuth.resetTokenExpires < Date.now()) {
      throw new Error("Reset token has expired");
    }

    // Hash new password
    const salt = randomBytes(32).toString("hex");
    const derivedKey = await scryptAsync(args.newPassword, salt, 64);
    const passwordHash = `scrypt:${salt}:${(derivedKey as Buffer).toString("hex")}`;

    // Update password and clear reset token
    await ctx.runMutation(internal.adminAuthData.updatePassword, {
      email: adminAuth.email,
      passwordHash,
    });

    // Log password reset
    await ctx.runMutation(internal.adminAuthData.logAdminAction, {
      email: adminAuth.email,
      action: "admin_password_reset_completed",
      details: { timestamp: Date.now() },
    });

    return { success: true, message: "Password reset successfully" };
  },
});
