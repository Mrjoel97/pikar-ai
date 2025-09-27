import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Query: find credential by email
export const getCredentialByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userCredentials")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .unique();
  },
});

// Mutation: insert credential
export const setCredential = internalMutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("userCredentials", args);
  },
});

// Mutation: set password reset token
export const setResetToken = internalMutation({
  args: {
    email: v.string(),
    token: v.string(),
    expires: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userCredentials")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .unique();

    if (!existing) throw new Error("No account found");

    await ctx.db.patch(existing._id, {
      passwordResetToken: args.token,
      passwordResetExpires: args.expires,
      updatedAt: Date.now(),
    });
  },
});

// Mutation: clear password reset token
export const clearReset = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userCredentials")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .unique();

    if (!existing) return;

    await ctx.db.patch(existing._id, {
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
      updatedAt: Date.now(),
    });
  },
});

// Mutation: create login token
export const createLoginToken = internalMutation({
  args: {
    email: v.string(),
    token: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("userLoginTokens", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Query: find credential by reset token
export const getCredentialByResetToken = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    for await (const cred of ctx.db.query("userCredentials")) {
      if (
        cred.passwordResetToken === args.token &&
        cred.passwordResetExpires &&
        cred.passwordResetExpires > Date.now()
      ) {
        return cred;
      }
    }
    return null;
  },
});

// Mutation: update password hash
export const updateCredentialHash = internalMutation({
  args: {
    id: v.id("userCredentials"),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      passwordHash: args.passwordHash,
      updatedAt: Date.now(),
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    });
  },
});
