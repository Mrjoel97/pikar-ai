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

    // Send password reset email
    try {
      const resetUrl = `${process.env.VITE_PUBLIC_BASE_URL || "https://pikar-ai.com"}/admin-reset-password?token=${resetToken}`;
      
      await ctx.runAction(internal.emailsActions.sendEmail, {
        to: normalizedEmail,
        subject: "Admin Password Reset - Pikar AI",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>You requested to reset your admin password for Pikar AI.</p>
            <p>Click the link below to reset your password. This link will expire in 1 hour.</p>
            <p style="margin: 30px 0;">
              <a href="${resetUrl}" style="background: #111827; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Reset Password
              </a>
            </p>
            <p style="color: #666; font-size: 14px;">
              If you didn't request this, please ignore this email. Your password will remain unchanged.
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              Or copy and paste this link: ${resetUrl}
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      // Don't throw - we've already saved the token, user can try again
    }

    return {
      success: true,
      message: "If the email exists, a reset link has been sent.",
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
