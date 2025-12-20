import { query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Internal queries
export const getAdminAuthByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("adminAuths")
      .withIndex("by_email", (q: any) => q.eq("email", args.email))
      .unique();
  },
});

export const getAdminByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("admins")
      .withIndex("by_email", (q: any) => q.eq("email", args.email))
      .unique();
  },
});

// Internal mutations
export const createAdminAuth = internalMutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("adminAuths", {
      ...args,
      updatedAt: args.createdAt,
      role: "admin",
      isVerified: false,
    });
  },
});

export const createSession = internalMutation({
  args: {
    token: v.string(),
    email: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("adminAuths")
      .withIndex("by_email", (q: any) => q.eq("email", args.email))
      .unique();
      
    if (!admin) {
      throw new Error("Admin not found for session creation");
    }

    return await ctx.db.insert("adminSessions", {
      ...args,
      adminId: admin._id,
    });
  },
});

export const invalidateSession = internalMutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q: any) => q.eq("token", args.token))
      .unique();
    
    if (session) {
      await ctx.db.delete(session._id);
    }
    
    return { success: true };
  },
});

export const ensureAdminRole = internalMutation({
  args: {
    email: v.string(),
    role: v.union(
      v.literal("super_admin"),
      v.literal("senior"),
      v.literal("pending_senior"),
      v.literal("admin"),
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("admins")
      .withIndex("by_email", (q: any) => q.eq("email", args.email))
      .unique();
    if (!existing) {
      await ctx.db.insert("admins", {
        email: args.email,
        role: args.role,
        createdAt: Date.now(),
      });
    }
  },
});

// Log admin actions to audit_logs
export const logAdminAction = internalMutation({
  args: {
    email: v.string(),
    action: v.string(),
    details: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("audit_logs", {
      businessId: "system" as any,
      action: args.action,
      entityType: "admin_session",
      entityId: args.email,
      details: {
        adminEmail: args.email,
        ...args.details,
      },
      createdAt: Date.now(),
    });
  },
});

// Password reset helpers
export const getAdminAuthByResetToken = internalQuery({
  args: { resetToken: v.string() },
  handler: async (ctx, args) => {
    const allAdmins = await ctx.db.query("adminAuths").collect();
    return allAdmins.find((admin) => admin.resetToken === args.resetToken) || null;
  },
});

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

// Public query for session validation (called from client)
export const validateSession = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.token) {
      return { valid: false };
    }

    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q: any) => q.eq("token", args.token))
      .unique();

    if (!session || session.expiresAt < Date.now()) {
      return { valid: false };
    }

    // Handle both old sessions (with email) and new sessions (with adminId)
    let email: string;
    
    if (session.adminId) {
      const adminAuth = await ctx.db.get(session.adminId);
      if (!adminAuth) {
        return { valid: false };
      }
      email = (adminAuth as any).email;
    } else if (session.email) {
      email = session.email;
    } else {
      return { valid: false };
    }

    const admin = await ctx.db
      .query("admins")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .unique();

    const role = admin?.role || "admin";

    return {
      valid: true,
      email,
      role,
    };
  },
});

// Internal query for session validation (used by Node actions)
export const validateSessionInternal = internalQuery({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.token) {
      return { valid: false };
    }

    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q: any) => q.eq("token", args.token))
      .unique();

    if (!session || session.expiresAt < Date.now()) {
      return { valid: false };
    }

    // Handle both old sessions (with email) and new sessions (with adminId)
    let email: string;
    
    if (session.adminId) {
      const adminAuth = await ctx.db.get(session.adminId);
      if (!adminAuth) {
        return { valid: false };
      }
      email = (adminAuth as any).email;
    } else if (session.email) {
      email = session.email;
    } else {
      return { valid: false };
    }

    const admin = await ctx.db
      .query("admins")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .unique();

    const role = admin?.role || "admin";

    return {
      valid: true,
      email,
      role,
    };
  },
});