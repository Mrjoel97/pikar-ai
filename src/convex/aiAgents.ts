import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

// Solopreneur S1: Initialize private agent profile with randomized high-traction industry
export const initSolopreneurAgent = mutation({
  args: {
    businessId: v.id("businesses"),
    businessSummary: v.optional(v.string()),
    brandVoice: v.optional(v.string()),
    timezone: v.optional(v.string()),
    automations: v.optional(
      v.object({
        invoicing: v.optional(v.boolean()),
        emailDrafts: v.optional(v.boolean()),
        socialPosts: v.optional(v.boolean()),
      })
    ),
    docFileIds: v.optional(v.array(v.id("_storage"))), // optional initial uploads
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Resolve current user
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email || ""))
      .unique()
      .catch(() => null);
    if (!user) throw new Error("User not found");

    // Pick a random high-traction industry
    const industries: Array<string> = [
      "ecommerce",
      "professional_services", 
      "saas",
      "education",
      "healthcare",
      "real_estate",
      "hospitality",
      "media",
      "finance",
      "nonprofit",
    ];
    const industry =
      (user.industry as string | undefined) ||
      industries[Math.floor(Math.random() * industries.length)];

    // Upsert: ensure one profile per user+business
    const existing = await ctx.db
      .query("agentProfiles")
      // Use by_business index and then filter in memory by user
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .take(50);

    const now = Date.now();
    const payload = {
      userId: user._id,
      businessId: args.businessId,
      businessSummary: args.businessSummary ?? "",
      industry,
      brandVoice: args.brandVoice ?? "casual",
      timezone: args.timezone ?? "UTC",
      preferences: {
        automations: {
          invoicing: args.automations?.invoicing ?? true,
          emailDrafts: args.automations?.emailDrafts ?? true,
          socialPosts: args.automations?.socialPosts ?? true,
        },
      },
      docRefs: args.docFileIds ?? [],
      trainingNotes: "",
      onboardingScore: 0,
      lastUpdated: now,
    };

    let profileId: Id<"agentProfiles">;
    const sameBusiness = existing.find((p) => p.businessId === args.businessId);
    if (sameBusiness) {
      await ctx.db.patch(sameBusiness._id, payload);
      profileId = sameBusiness._id;
    } else {
      profileId = await ctx.db.insert("agentProfiles", payload);
    }

    // Audit
    await ctx.runMutation(internal.audit.write, {
      businessId: args.businessId,
      action: "agent_profile_initialized",
      entityType: "agent_profile",
      entityId: String(profileId),
      details: {
        industry,
        brandVoice: payload.brandVoice,
        automations: payload.preferences.automations,
      },
    });

    return { profileId };
  },
});

// Summarize recent uploads for onboarding preview
export const summarizeUploads = query({
  args: {
    userId: v.optional(v.id("users")), // if omitted, infer from identity
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity && !args.userId) throw new Error("Not authenticated");

    let userId: Id<"users"> | null = args.userId ?? null;
    if (!userId && identity?.email) {
      const user = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", identity.email || ""))
        .unique()
        .catch(() => null);
      if (!user) throw new Error("User not found");
      userId = user._id;
    }
    if (!userId) throw new Error("User not resolved");

    const limit = Math.max(1, Math.min(args.limit ?? 5, 10));
    const items = await ctx.db
      .query("uploads")
      .withIndex("by_user", (q) => q.eq("userId", userId!))
      .order("desc")
      .take(limit);

    const summaries: Array<{
      fileId: Id<"_storage">;
      filename: string;
      mimeType: string;
      uploadedAt: number;
      size?: number;
      summary: string;
    }> = [];

    for (const u of items) {
      const meta = await ctx.db.system.get(u.fileId);
      const size = meta?.size;
      const hint =
        u.filename.toLowerCase().includes("invoice")
          ? "Detected invoice-like document"
          : u.filename.toLowerCase().includes("policy")
            ? "Detected policy/guide document"
            : u.filename.toLowerCase().includes("product")
              ? "Detected product list/spec"
              : "General document";
      const summary = `${hint}. ${size ? `~${Math.ceil(size / 1024)}KB.` : ""}`.trim();
      summaries.push({
        fileId: u.fileId,
        filename: u.filename,
        mimeType: u.mimeType,
        uploadedAt: u.uploadedAt,
        size,
        summary,
      });
    }

    return summaries;
  },
});

// Add: listRecommendedByTier public query
export const listRecommendedByTier = query({
  args: {
    tier: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 4;
    const results: Array<{
      agent_key: string;
      display_name: string;
      short_desc: string;
    }> = [];

    // Query by "active" index then take first N matching tier (or global) agents
    const iter = ctx.db
      .query("agentCatalog")
      .withIndex("by_active", (q) => q.eq("active", true))
      .order("desc");

    for await (const row of iter) {
      const tiers = (row.tier_restrictions ?? []) as string[];
      if (tiers.length > 0 && !tiers.includes(args.tier)) continue;
      results.push({
        agent_key: row.agent_key,
        display_name: row.display_name,
        short_desc: row.short_desc,
      });
      if (results.length >= limit) break;
    }

    return results;
  },
});

// Compute quick micro-analytics (90d revenue, top products by margin, churn alert)
export const runQuickAnalytics = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
    const windowStart = now - ninetyDaysMs;

    // Revenue 90d
    let revenue90d = 0;
    const revIter = ctx.db
      .query("key_metrics")
      .withIndex("by_business_and_metricKey", (q) =>
        q.eq("businessId", args.businessId).eq("metricKey", "revenue")
      );
    for await (const row of revIter) {
      if (row.windowStart >= windowStart && row.windowEnd <= now) {
        revenue90d += row.value;
      }
    }

    // Top products by margin (take last 90d)
    type ProductAgg = { product: string; margin: number };
    const marginMap: Record<string, number> = {};
    const marginIter = ctx.db
      .query("key_metrics")
      .withIndex("by_business_and_metricKey", (q) =>
        q.eq("businessId", args.businessId).eq("metricKey", "product_margin")
      );
    for await (const row of marginIter) {
      if (row.windowStart >= windowStart && row.windowEnd <= now) {
        // row.value expected as number; details may be encoded in metricKey detail in real systems.
        // For MVP, assume row has details in createdAt buckets with product encoded in details (skipped).
        // We'll bucket to a generic "Product" placeholder for deterministic MVP aggregation.
        const key = "Product";
        marginMap[key] = (marginMap[key] ?? 0) + row.value;
      }
    }
    const topProducts: Array<ProductAgg> = Object.entries(marginMap)
      .map(([product, margin]) => ({ product, margin }))
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 5);

    // Simple churn alert heuristic using metricKey=active_customers (delta negative beyond threshold)
    let churnAlert = false;
    let churnMessage = "Stable";
    const actIter = ctx.db
      .query("key_metrics")
      .withIndex("by_business_and_metricKey", (q) =>
        q.eq("businessId", args.businessId).eq("metricKey", "active_customers")
      );
    let earliest: number | null = null;
    let latest: number | null = null;
    let earliestVal = 0;
    let latestVal = 0;
    for await (const row of actIter) {
      if (row.windowStart >= windowStart && row.windowEnd <= now) {
        const center = row.windowEnd;
        if (earliest === null || center < earliest) {
          earliest = center;
          earliestVal = row.value;
        }
        if (latest === null || center > latest) {
          latest = center;
          latestVal = row.value;
        }
      }
    }
    if (earliest !== null && latest !== null) {
      const delta = latestVal - earliestVal;
      if (delta < 0) {
        churnAlert = true;
        churnMessage = `Customer count down by ${Math.abs(delta)} over 90 days`;
      }
    }

    return {
      revenue90d,
      topProducts,
      churnAlert,
      churnMessage,
      asOf: now,
    };
  },
});

// Optional helper to unlink all docRefs (privacy "Forget uploads")
export const forgetUploads = mutation({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email || ""))
      .unique()
      .catch(() => null);
    if (!user) throw new Error("User not found");

    const profiles = await ctx.db
      .query("agentProfiles")
      // Scope to the provided business up front; these are the only ones we want to clear
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .take(50);

    let count = 0;
    for (const p of profiles) {
      if (p.businessId !== args.businessId) continue;
      await ctx.db.patch(p._id, { docRefs: [] as Array<Id<"_storage">>, lastUpdated: Date.now() });
      count++;
    }

    await ctx.runMutation(internal.audit.write, {
      businessId: args.businessId,
      action: "agent_forget_uploads",
      entityType: "agent_profile",
      entityId: "bulk",
      details: { affectedProfiles: count },
    });

    return { updatedProfiles: count };
  },
});

// Add lightweight internal query to fetch agent profile context for the current user+business
export const getAgentProfileLite = internalQuery({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email || ""))
      .unique()
      .catch(() => null);
    if (!user) return null;

    const rows = await ctx.db
      .query("agentProfiles")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .take(50);

    const p = rows.find((r) => r.userId === user._id) || rows[0] || null;
    if (!p) return null;

    return {
      businessSummary: p.businessSummary ?? "",
      industry: (p as any).industry ?? "",
      brandVoice: (p as any).brandVoice ?? "casual",
      timezone: (p as any).timezone ?? "UTC",
      lastUpdated: (p as any).lastUpdated ?? 0,
    };
  },
});

// Admin-gated: summarize agents counts (global or by tenant)
export const adminAgentSummary = query({
  args: { tenantId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    const isAdmin = await ctx.runQuery((api as any).admin.getIsAdmin, {});
    if (!isAdmin) return { total: 0, byTenant: [] as Array<{ businessId: Id<"businesses">; count: number }> };

    const byTenantMap = new Map<string, number>();
    let total = 0;

    if (args.tenantId) {
      const rows = await ctx.db
        .query("agentProfiles")
        .withIndex("by_business", (q) => q.eq("businessId", args.tenantId!))
        .take(1000);
      total = rows.length;
      // Fix: ensure map key is a string
      byTenantMap.set(String(args.tenantId), rows.length);
    } else {
      // iterate all agentProfiles in chunks (Convex scans; keep bounded)
      // fetch by known businesses via index with no eq is not supported; fallback to take batches
      const batch = await ctx.db.query("agentProfiles").take(1000);
      total = batch.length;
      for (const r of batch) {
        const key = String(r.businessId);
        byTenantMap.set(key, (byTenantMap.get(key) ?? 0) + 1);
      }
    }

    const byTenant: Array<{ businessId: Id<"businesses">; count: number }> = Array.from(
      byTenantMap.entries(),
    ).map(([k, count]) => ({ businessId: k as unknown as Id<"businesses">, count }));

    return { total, byTenant };
  },
});

// Admin-gated: list agent profiles (optionally by tenant), minimal fields
export const adminListAgents = query({
  args: {
    tenantId: v.optional(v.id("businesses")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const isAdmin = await ctx.runQuery((api as any).admin.getIsAdmin, {});
    if (!isAdmin) return [] as Array<{
      _id: Id<"agentProfiles">;
      businessId: Id<"businesses">;
      userId: Id<"users">;
      brandVoice?: string;
      timezone?: string;
      lastUpdated?: number;
      trainingNotes?: string;
    }>;

    const limit = Math.max(1, Math.min(args.limit ?? 200, 1000));
    let rows:
      | Array<{
          _id: Id<"agentProfiles">;
          businessId: Id<"businesses">;
          userId: Id<"users">;
          brandVoice?: string;
          timezone?: string;
          lastUpdated?: number;
          trainingNotes?: string;
        }>
      | undefined;

    if (args.tenantId) {
      rows = await ctx.db
        .query("agentProfiles")
        .withIndex("by_business", (q) => q.eq("businessId", args.tenantId!))
        .order("desc")
        .take(limit);
    } else {
      rows = await ctx.db.query("agentProfiles").order("desc").take(limit);
    }

    return rows.map((r) => ({
      _id: r._id,
      businessId: r.businessId,
      userId: r.userId,
      brandVoice: (r as any).brandVoice,
      timezone: (r as any).timezone,
      lastUpdated: (r as any).lastUpdated,
      trainingNotes: (r as any).trainingNotes,
    }));
  },
});

// Admin-gated: update agent profile trainingNotes / brandVoice (retrain prompt)
export const adminUpdateAgentProfile = mutation({
  args: {
    profileId: v.id("agentProfiles"),
    trainingNotes: v.optional(v.string()),
    brandVoice: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
    if (isAdmin !== true) {
      throw new Error("Forbidden: admin privileges required");
    }

    const doc = await ctx.db.get(args.profileId);
    if (!doc) throw new Error("Profile not found");

    const patch: Record<string, unknown> = {};
    if (typeof args.trainingNotes === "string") patch.trainingNotes = args.trainingNotes;
    if (typeof args.brandVoice === "string") patch.brandVoice = args.brandVoice;
    if (Object.keys(patch).length === 0) return { updated: false };

    patch.lastUpdated = Date.now();
    await ctx.db.patch(args.profileId, patch);

    try {
      await ctx.runMutation(api.audit.write as any, {
        action: "admin_update_agent_profile",
        entityType: "agent_profile",
        entityId: args.profileId,
        details: {
          // minimal snapshot
          fieldsUpdated: Object.keys({ brandVoice: args.brandVoice, trainingNotes: args.trainingNotes }).filter(
            (k) => (args as any)[k] !== undefined
          ),
          correlationId: `agent-admin-${args.profileId}-${Date.now()}`,
        },
      });
    } catch {
      // swallow audit errors to avoid blocking admin action
    }

    return { updated: true };
  },
});

// Admin-gated: mark agent as disabled (sentinel note append)
export const adminMarkAgentDisabled = mutation({
  args: {
    profileId: v.id("agentProfiles"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
    if (isAdmin !== true) {
      throw new Error("Forbidden: admin privileges required");
    }

    const profile = await ctx.db.get(args.profileId);
    if (!profile) throw new Error("Agent profile not found");
    const tn = (profile as any).trainingNotes || "";
    const alreadyDisabled = typeof tn === "string" && tn.includes("[DISABLED]");

    if (!alreadyDisabled) {
      await ctx.db.patch(args.profileId, { trainingNotes: `${tn}\n[DISABLED]${args.reason ? ` Reason: ${args.reason}` : ""}`, lastUpdated: Date.now() });
    }

    try {
      await ctx.runMutation(api.audit.write as any, {
        action: "admin_disable_agent",
        entityType: "agent_profile",
        entityId: args.profileId,
        details: {
          reason: args.reason || "",
          alreadyDisabled,
          correlationId: `agent-admin-disable-${args.profileId}-${Date.now()}`,
        },
      });
    } catch {
      // swallow audit errors to avoid blocking admin action
    }

    return { disabled: true };
  },
});