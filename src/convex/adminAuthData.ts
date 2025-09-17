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
    return await ctx.db.insert("adminAuths", args);
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
    return await ctx.db.insert("adminSessions", args);
  },
});

export const ensureAdminRole = internalMutation({
  args: {
    email: v.string(),
    role: v.union(
      v.literal("superadmin"),
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

// Public query (NON-Node file)
export const validateSession = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q: any) => q.eq("token", args.token))
      .unique();

    if (!session || session.expiresAt < Date.now()) {
      return { valid: false };
    }

    const admin = await ctx.db
      .query("admins")
      .withIndex("by_email", (q: any) => q.eq("email", session.email))
      .unique();

    const role = admin?.role || "admin";

    return {
      valid: true,
      email: session.email,
      role,
    };
  },
});
