"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPasswordResetEmail = action({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    
    // Check if user exists
    const credential = await ctx.runQuery(internal.passwordAuthData.getCredentialByEmail, { email });
    
    if (!credential) {
      // Don't reveal if email exists or not for security
      return { success: true };
    }

    // Generate reset token
    const token = crypto.randomUUID();
    const expires = Date.now() + 3600000; // 1 hour

    // Store reset token
    await ctx.runMutation(internal.passwordAuthData.setResetToken, {
      email,
      token,
      expires,
    });

    // Send email
    const resetUrl = `${process.env.CONVEX_SITE_URL}/reset-password?token=${token}`;
    
    try {
      await resend.emails.send({
        from: "Pikar AI <noreply@pikar.ai>",
        to: email,
        subject: "Reset Your Password",
        html: `
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Click the link below to continue:</p>
          <p><a href="${resetUrl}">Reset Password</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      });
    } catch (error) {
      console.error("Failed to send reset email:", error);
      throw new Error("Failed to send reset email");
    }

    return { success: true };
  },
});

export const resetPassword = action({
  args: {
    token: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify token and get credential
    const credential = await ctx.runQuery(
      internal.passwordAuthData.getCredentialByResetToken,
      { token: args.token }
    );

    if (!credential) {
      throw new Error("Invalid or expired reset token");
    }

    // Hash new password
    const bcrypt = require("bcryptjs");
    const passwordHash = await bcrypt.hash(args.newPassword, 10);

    // Update password
    await ctx.runMutation(internal.passwordAuthData.updateCredentialHash, {
      id: credential._id,
      passwordHash,
    });

    // Clear reset token
    await ctx.runMutation(internal.passwordAuthData.clearResetToken, {
      email: credential.email,
    });

    return { success: true };
  },
});