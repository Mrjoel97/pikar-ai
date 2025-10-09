import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

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

// Add helper to check platform admin (allowlist or admins table, excluding 'pending_senior')
async function isPlatformAdmin(ctx: any): Promise<boolean> {
  const identity = await ctx.auth.getUserIdentity();
  const email = identity?.email?.toLowerCase();
  if (!email) return false;

  const envAllow = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (envAllow.includes(email)) return true;

  const admin = await ctx.db
    .query("admins")
    .withIndex("by_email", (q: any) => q.eq("email", email))
    .unique();
  const role = admin?.role;
  return role === "superadmin" || role === "senior" || role === "admin";
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

// List tenants (businesses) - admin only
export const listTenants = query({
  args: {},
  handler: async (ctx) => {
    const ok = await isPlatformAdmin(ctx);
    if (!ok) return [];
    const tenants = await ctx.db.query("businesses").collect();
    return tenants;
  },
});

// List API keys for a tenant - admin only
export const listApiKeys = query({
  // Make tenantId optional so initial UI render doesn't throw
  args: { tenantId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    const ok = await isPlatformAdmin(ctx);
    if (!ok) return [];
    if (!args.tenantId) return []; // no tenant selected yet

    // Use loose typing to avoid TS errors if _generated types aren't refreshed yet
    const keys = await (ctx.db as any)
      .query("api_keys" as any)
      .withIndex("by_tenant", (q: any) => q.eq("tenantId", args.tenantId))
      .collect();
    return keys;
  },
});

// Create API key for a tenant - admin only
export const createApiKey = mutation({
  args: {
    tenantId: v.id("businesses"),
    name: v.string(),
    scopes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const ok = await isPlatformAdmin(ctx);
    if (!ok) throw new Error("Admin access required");

    // Best-effort secret generation (no Node crypto in mutations)
    const rand = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 36).toString(36)
    ).join("");
    const secret = `pk_${rand}`;

    // Placeholder non-recoverable representation
    const keyHash = `naive_${rand.slice(-16)}`;

    await (ctx.db as any).insert("api_keys" as any, {
      tenantId: args.tenantId,
      name: args.name,
      scopes: args.scopes,
      keyHash,
      createdAt: Date.now(),
    });

    return { secret };
  },
});

// Revoke API key - admin only
export const revokeApiKey = mutation({
  // Accept string to avoid compile-time coupling to Id<"api_keys"> before generated types refresh
  args: { apiKeyId: v.string() },
  handler: async (ctx, args) => {
    const ok = await isPlatformAdmin(ctx);
    if (!ok) throw new Error("Admin access required");
    await (ctx.db as any).patch(args.apiKeyId as any, { revokedAt: Date.now() });
    return true;
  },
});

// List users for a given tenant (business) using ownerId + teamMembers
export const listTenantUsers = query({
  // Make businessId optional so initial UI render doesn't throw
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      // No tenant selected yet — return empty list (guest-safe)
      return [];
    }

    const biz = await ctx.db.get(args.businessId);
    if (!biz) {
      throw new Error("Business not found");
    }

    // Admin gating: only allow platform admins to use this endpoint
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Admin access required");
    }
    const envAllow = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const isAllowlisted = envAllow.includes(identity.email!.toLowerCase());

    const adminRecord = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first()
      .catch(() => null);

    const role = adminRecord?.role;
    const hasAdminAccess =
      isAllowlisted ||
      role === "superadmin" ||
      role === "senior" ||
      role === "admin";

    if (!hasAdminAccess) {
      throw new Error("Admin access required");
    }

    const userIds: Array<Id<"users">> = [];
    if (biz.ownerId) userIds.push(biz.ownerId);
    if (Array.isArray(biz.teamMembers)) {
      for (const uid of (biz.teamMembers as Array<Id<"users">>)) userIds.push(uid);
    }

    const users: Array<any> = [];
    for (const uid of userIds) {
      const u = (await ctx.db.get(uid)) as any;
      if (u) {
        const roleLabel = String(uid) === String(biz.ownerId) ? "owner" : "member";
        users.push({
          _id: u._id,
          name: u?.name ?? u?.email ?? "User",
          email: u?.email ?? "",
          role: roleLabel,
        });
      }
    }
    return users;
  },
});

// Billing & Usage: usage summary (guest-safe, admin-gated; defaults on errors)
export const getUsageSummary = query({
  args: { tenantId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    const ok = await isPlatformAdmin(ctx);
    if (!ok) return { workflows: 0, runs: 0, agents: 0, emailsSentLast7: 0 };

    try {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      // Use best-effort counts; fall back to zeros if collections or indexes differ.
      let workflows = 0;
      try {
        const q = args.tenantId
          ? (ctx.db as any).query("workflows" as any).withIndex?.("by_business", (q: any) => q.eq("businessId", args.tenantId))
          : (ctx.db as any).query("workflows" as any);
        const all = q?.collect ? await q.collect() : await (ctx.db as any).query("workflows" as any).collect();
        workflows = Array.isArray(all) ? all.length : 0;
      } catch {
        workflows = 0;
      }

      let runs = 0;
      try {
        const q = args.tenantId
          ? (ctx.db as any).query("workflowRuns" as any).withIndex?.("by_business", (q: any) => q.eq("businessId", args.tenantId))
          : (ctx.db as any).query("workflowRuns" as any);
        const all = q?.collect ? await q.collect() : [];
        runs = Array.isArray(all) ? all.length : 0;
      } catch {
        runs = 0;
      }

      let agents = 0;
      try {
        const q = args.tenantId
          ? (ctx.db as any).query("agentProfiles" as any).withIndex?.("by_business", (q: any) => q.eq("businessId", args.tenantId))
          : (ctx.db as any).query("agentProfiles" as any);
        const all = q?.collect ? await q.collect() : [];
        agents = Array.isArray(all) ? all.length : 0;
      } catch {
        agents = 0;
      }

      let emailsSentLast7 = 0;
      try {
        const q = (ctx.db as any).query("emails" as any);
        const all = await q.collect();
        const filtered = Array.isArray(all)
          ? all.filter((e: any) => {
              const okTenant = args.tenantId ? String(e.businessId) === String(args.tenantId) : true;
              const sent = e?.status === "sent" || e?.status === "sending";
              const within = (e?.sentAt ?? e?._creationTime ?? 0) >= sevenDaysAgo;
              return okTenant && sent && within;
            })
          : [];
        emailsSentLast7 = filtered.length;
      } catch {
        emailsSentLast7 = 0;
      }

      return { workflows, runs, agents, emailsSentLast7 };
    } catch {
      return { workflows: 0, runs: 0, agents: 0, emailsSentLast7: 0 };
    }
  },
});

// Billing events list (guest-safe). Attempts to use by_tenant index if present.
export const listBillingEvents = query({
  args: { tenantId: v.optional(v.id("businesses")), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const ok = await isPlatformAdmin(ctx);
    if (!ok) return [];
    const lim = Math.max(1, Math.min(200, args.limit ?? 25));
    try {
      if (args.tenantId) {
        const q = (ctx.db as any)
          .query("billing_events" as any)
          .withIndex?.("by_tenant", (q: any) => q.eq("tenantId", args.tenantId));
        const rows = q?.collect ? await q.collect() : [];
        // Return most recent first by _creationTime when available
        return (rows as any[]).sort((a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0)).slice(0, lim);
      }
      const all = await (ctx.db as any).query("billing_events" as any).collect();
      return (all as any[]).sort((a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0)).slice(0, lim);
    } catch {
      return [];
    }
  },
});

// Alerts & Incidents
export const listAlerts = query({
  args: { tenantId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    const ok = await isPlatformAdmin(ctx);
    if (!ok) return [];
    try {
      const rows = await (ctx.db as any).query("alerts" as any).collect();
      const arr: any[] = Array.isArray(rows) ? rows : [];
      if (!args.tenantId) {
        return arr.sort((a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0));
      }
      return arr
        .filter((a) => String(a.tenantId ?? "") === String(args.tenantId))
        .sort((a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0));
    } catch {
      return [];
    }
  },
});

export const createAlert = mutation({
  args: {
    tenantId: v.optional(v.id("businesses")),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const ok = await isPlatformAdmin(ctx);
    if (!ok) throw new Error("Admin access required");
    const doc = {
      tenantId: args.tenantId ?? null,
      severity: args.severity,
      title: args.title,
      description: args.description ?? "",
      status: "open",
      createdAt: Date.now(),
    };
    const id = await (ctx.db as any).insert("alerts" as any, doc);
    return id;
  },
});

export const resolveAlert = mutation({
  args: { alertId: v.string() },
  handler: async (ctx, args) => {
    const ok = await isPlatformAdmin(ctx);
    if (!ok) throw new Error("Admin access required");
    await (ctx.db as any).patch(args.alertId as any, { status: "resolved", resolvedAt: Date.now() });
    return true;
  },
});

// Add public query for admin session validation (client-callable)
export const validateAdminSession = query({
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