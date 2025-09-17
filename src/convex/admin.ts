import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Admin determination rules:
 * - If the signed-in user's email is included in ADMIN_EMAILS (comma-separated), they are admin.
 * - Else if their email appears in the "admins" table, they are admin.
 * Returns boolean.
 */
export const getIsAdmin = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) return false;

    const email = identity.email.toLowerCase();

    const envAllowlist = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    if (envAllowlist.includes(email)) return true;

    const admin = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    return !!admin;
  },
});

/**
 * Claim admin if the current user's email is present in ADMIN_EMAILS.
 * Creates an entry in the admins table if not present.
 */
export const ensureAdminSelf = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) throw new Error("Not authenticated");

    const email = identity.email.toLowerCase();
    const envAllowlist = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    if (!envAllowlist.includes(email)) {
      throw new Error("You are not allowed to claim admin");
    }

    const existing = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existing) return existing._id;

    return await ctx.db.insert("admins", {
      email,
      role: "superadmin",
      createdAt: Date.now(),
    });
  },
});

/**
 * List all admins (email + role). Only callable by an admin.
 */
export const listAdmins = query({
  args: {},
  handler: async (ctx) => {
    // Inline admin check to avoid invalid ctx.runQuery({ path: ... })
    const identity = await ctx.auth.getUserIdentity();
    const email = identity?.email?.toLowerCase();

    // If not signed in, return empty list instead of throwing
    if (!email) return [];

    const envAllowlist = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    let isAdmin = envAllowlist.includes(email);

    if (!isAdmin) {
      const admin = await ctx.db
        .query("admins")
        .withIndex("by_email", (q) => q.eq("email", email))
        .unique();
      isAdmin = !!admin;
    }

    // Not an admin? Return an empty list (guest-safe)
    if (!isAdmin) return [];

    const admins = await ctx.db.query("admins").collect();
    return admins;
  },
});