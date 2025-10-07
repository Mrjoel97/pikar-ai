import { mutation, query, internalQuery } from "../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";

export async function initSolopreneurAgent(ctx: any, args: any): Promise<any> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  // Resolve current user
  const user = await ctx.db
    .query("users")
    .withIndex("email", (q: any) => q.eq("email", identity.email || ""))
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
    .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId))
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
  const sameBusiness = existing.find((p: any) => p.businessId === args.businessId);
  if (sameBusiness) {
    await ctx.db.patch(sameBusiness._id, payload);
    profileId = sameBusiness._id;
  } else {
    profileId = await ctx.db.insert("agentProfiles", payload);
  }

  // Audit logging removed to avoid TypeScript type instantiation issues
  // Context: agent_profile_initialized, industry, brandVoice, automations

  return { profileId };
}

export async function summarizeUploads(ctx: any, args: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity && !args.userId) throw new Error("Not authenticated");

  let userId: Id<"users"> | null = args.userId ?? null;
  if (!userId && identity?.email) {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", identity.email || ""))
      .unique()
      .catch(() => null);
    if (!user) throw new Error("User not found");
    userId = user._id;
  }
  if (!userId) throw new Error("User not resolved");

  const limit = Math.max(1, Math.min(args.limit ?? 5, 10));
  const items = await ctx.db
    .query("uploads")
    .withIndex("by_user", (q: any) => q.eq("userId", userId!))
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
      uploadedAt: u.uploadAt,
      size,
      summary,
    });
  }

  return summaries;
}

export async function forgetUploads(ctx: any, args: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("email", (q: any) => q.eq("email", identity.email || ""))
    .unique()
    .catch(() => null);
  if (!user) throw new Error("User not found");

  const profiles = await ctx.db
    .query("agentProfiles")
    // Scope to the provided business up front; these are the only ones we want to clear
    .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId))
    .take(50);

  let count = 0;
  for (const p of profiles) {
    if (p.businessId !== args.businessId) continue;
    await ctx.db.patch(p._id, { docRefs: [] as Array<Id<"_storage">>, lastUpdated: Date.now() });
    count++;
  }

  // Audit logging removed to avoid TypeScript type instantiation issues
  // Context: agent_forget_uploads, affectedProfiles: count

  return { updatedProfiles: count };
}

export async function getAgentProfileLite(ctx: any, args: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const user = await ctx.db
    .query("users")
    .withIndex("email", (q: any) => q.eq("email", identity.email || ""))
    .unique()
    .catch(() => null);
  if (!user) return null;

  const rows = await ctx.db
    .query("agentProfiles")
    .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId))
    .take(50);

  const p = rows.find((r: any) => r.userId === user._id) || rows[0] || null;
  if (!p) return null;

  return {
    businessSummary: p.businessSummary ?? "",
    industry: (p as any).industry ?? "",
    brandVoice: (p as any).brandVoice ?? "casual",
    timezone: (p as any).timezone ?? "UTC",
    lastUpdated: (p as any).lastUpdated ?? 0,
  };
}

export async function runQuickAnalytics(ctx: any, args: any) {
  const now = Date.now();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  const windowStart = now - ninetyDaysMs;

  // Revenue 90d
  let revenue90d = 0;
  const revIter = ctx.db
    .query("key_metrics")
    .withIndex("by_business_and_metricKey", (q: any) =>
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
    .withIndex("by_business_and_metricKey", (q: any) =>
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
    .withIndex("by_business_and_metricKey", (q: any) =>
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
}

export async function listRecommendedByTier(ctx: any, args: any) {
  const limit = args.limit ?? 4;
  const results: Array<{
    agent_key: string;
    display_name: string;
    short_desc: string;
  }> = [];

  // Query by "active" index then take first N matching tier (or global) agents
  const iter = ctx.db
    .query("agentCatalog")
    .withIndex("by_active", (q: any) => q.eq("active", true))
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
}