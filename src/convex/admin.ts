import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Admin determination rules:
 * - If the signed-in user's email is included in ADMIN_EMAILS (comma-separated), they are admin.
 * - Else if their email appears in the "admins" table with a non-pending role, they are admin.
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

    const role = admin?.role;
    return role === "superadmin" || role === "senior" || role === "admin";
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
 * Guest-safe: returns [] for non-admins.
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
      const role = admin?.role;
      isAdmin = role === "superadmin" || role === "senior" || role === "admin";
    }

    // Not an admin? Return an empty list (guest-safe)
    if (!isAdmin) return [];

    const admins = await ctx.db.query("admins").collect();
    return admins;
  },
});

// Add: helper to check if current user is super admin
async function isSuperAdmin(ctx: any): Promise<boolean> {
  const identity = await ctx.auth.getUserIdentity();
  const email = identity?.email?.toLowerCase();
  if (!email) return false;

  const envAllowlist = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (envAllowlist.includes(email)) return true;

  const admin = await ctx.db
    .query("admins")
    .withIndex("by_email", (q: any) => q.eq("email", email))
    .unique();
  return admin?.role === "superadmin";
}

// Request Senior Admin: create a pending request
export const requestSeniorAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) throw new Error("Not authenticated");

    const email = identity.email.toLowerCase();

    const existing = await ctx.db
      .query("admins")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .unique();

    if (existing) {
      // If already some role, do not duplicate
      if (existing.role === "pending_senior") {
        return existing._id;
      }
      throw new Error("You already have an admin role or a different status");
    }

    return await ctx.db.insert("admins", {
      email,
      role: "pending_senior",
      createdAt: Date.now(),
    });
  },
});

// Approve Senior Admin: super admin only
export const approveSeniorAdmin = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const superOk = await isSuperAdmin(ctx);
    if (!superOk) throw new Error("Forbidden");

    const email = args.email.toLowerCase();
    const existing = await ctx.db
      .query("admins")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .unique();

    if (!existing) {
      // Auto-create as senior if not found (optional path)
      return await ctx.db.insert("admins", {
        email,
        role: "senior",
        createdAt: Date.now(),
      });
    }

    if (existing.role !== "pending_senior") {
      // If already senior or super, do nothing and return
      return existing._id;
    }

    await ctx.db.patch(existing._id, { role: "senior" });
    return existing._id;
  },
});

// List pending requests: super admin only; guest-safe (empty for non-super)
export const listPendingAdminRequests = query({
  args: {},
  handler: async (ctx) => {
    const superOk = await isSuperAdmin(ctx);
    if (!superOk) return [];
    const pending = await ctx.db.query("admins").collect();
    return pending.filter((a: any) => a.role === "pending_senior");
  },
});