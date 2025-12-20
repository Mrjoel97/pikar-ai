import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Get admin by reset token
export const getAdminAuthByResetToken = internalQuery({
  args: { resetToken: v.string() },
  handler: async (ctx, args) => {
    const allAdmins = await ctx.db.query("adminAuths").collect();
    return allAdmins.find((admin) => admin.resetToken === args.resetToken) || null;
  },
});

// Update reset token
export const updateResetToken = internalMutation({
  args: {
    email: v.string(),
    resetToken: v.string(),
    resetTokenExpires: v.number(),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("adminAuths")
      .withIndex("by_email", (q: any) => q.eq("email", args.email))
      .unique();

    if (!admin) {
      throw new Error("Admin not found");
    }

    await ctx.db.patch(admin._id, {
      resetToken: args.resetToken,
      resetTokenExpires: args.resetTokenExpires,
      updatedAt: Date.now(),
    });
  },
});

// Update password
export const updatePassword = internalMutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("adminAuths")
      .withIndex("by_email", (q: any) => q.eq("email", args.email))
      .unique();

    if (!admin) {
      throw new Error("Admin not found");
    }

    await ctx.db.patch(admin._id, {
      passwordHash: args.passwordHash,
      resetToken: undefined,
      resetTokenExpires: undefined,
      updatedAt: Date.now(),
    });
  },
});
