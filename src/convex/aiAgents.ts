import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

// Import helper modules
import * as training from "./lib/aiAgents/training";
import * as admin from "./lib/aiAgents/admin";
import * as versions from "./lib/aiAgents/versions";
import * as datasets from "./lib/aiAgents/datasets";
import * as config from "./lib/aiAgents/config";
import * as publish from "./lib/aiAgents/publish";

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
  handler: (ctx, args): Promise<any> => training.initSolopreneurAgent(ctx, args),
});

// Summarize recent uploads for onboarding preview
export const summarizeUploads = query({
  args: {
    userId: v.optional(v.id("users")), // if omitted, infer from identity
    limit: v.optional(v.number()),
  },
  handler: (ctx, args) => training.summarizeUploads(ctx, args),
});

// Add: listRecommendedByTier public query
export const listRecommendedByTier = query({
  args: {
    tier: v.string(),
    limit: v.optional(v.number()),
  },
  handler: (ctx, args) => training.listRecommendedByTier(ctx, args),
});

// Compute quick micro-analytics (90d revenue, top products by margin, churn alert)
export const runQuickAnalytics = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: (ctx, args) => training.runQuickAnalytics(ctx, args),
});

// Optional helper to unlink all docRefs (privacy "Forget uploads")
export const forgetUploads = mutation({
  args: { businessId: v.id("businesses") },
  handler: (ctx, args) => training.forgetUploads(ctx, args),
});

// Add lightweight internal query to fetch agent profile context for the current user+business
export const getAgentProfileLite = internalQuery({
  args: { businessId: v.id("businesses") },
  handler: (ctx, args) => training.getAgentProfileLite(ctx, args),
});

// Admin-gated: summarize agents counts (global or by tenant)
export const adminAgentSummary = query({
  args: { tenantId: v.optional(v.id("businesses")) },
  handler: (ctx, args) => admin.adminAgentSummary(ctx, args),
});

// Admin-gated: list agent profiles (optionally by tenant), minimal fields
export const adminListAgents = query({
  args: {
    activeOnly: v.optional(v.boolean()),
    tier: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: (ctx, args) => admin.adminListAgents(ctx, args),
});

// Admin-gated: get single agent by key
export const adminGetAgent = query({
  args: { agent_key: v.string() },
  handler: (ctx, args) => admin.adminGetAgent(ctx, args),
});

// Admin-gated: upsert agent (create or update)
export const adminUpsertAgent = mutation({
  args: {
    agent_key: v.string(),
    display_name: v.string(),
    short_desc: v.string(),
    long_desc: v.string(),
    capabilities: v.array(v.string()),
    default_model: v.string(),
    model_routing: v.string(),
    prompt_template_version: v.string(),
    prompt_templates: v.string(),
    input_schema: v.string(),
    output_schema: v.string(),
    tier_restrictions: v.array(v.string()),
    confidence_hint: v.number(),
    active: v.boolean(),
  },
  handler: (ctx, args) => admin.adminUpsertAgent(ctx, args),
});

// Admin-gated: toggle agent active status
export const adminToggleAgent = mutation({
  args: {
    agent_key: v.string(),
    active: v.boolean(),
  },
  handler: (ctx, args) => admin.adminToggleAgent(ctx, args),
});

// Admin-gated: update agent profile trainingNotes / brandVoice (retrain prompt)
export const adminUpdateAgentProfile = mutation({
  args: {
    profileId: v.id("agentProfiles"),
    trainingNotes: v.optional(v.string()),
    brandVoice: v.optional(v.string()),
  },
  handler: (ctx, args) => admin.adminUpdateAgentProfile(ctx, args),
});

// Admin-gated: mark agent as disabled (sentinel note append)
export const adminMarkAgentDisabled = mutation({
  args: {
    profileId: v.id("agentProfiles"),
    reason: v.optional(v.string()),
  },
  handler: (ctx, args) => admin.adminMarkAgentDisabled(ctx, args),
});

export const adminPublishAgent = mutation({
  args: { agent_key: v.string() },
  handler: (ctx, args) => publish.adminPublishAgent(ctx, args),
});

export const adminRollbackAgent = mutation({
  args: { agent_key: v.string() },
  handler: (ctx, args) => publish.adminRollbackAgent(ctx, args),
});

// Save a version snapshot internally (used on publish)
export const saveAgentVersionInternal = internalMutation({
  args: {
    agent_key: v.string(),
    note: v.optional(v.string()),
  },
  handler: (ctx, args) => versions.saveAgentVersionInternal(ctx, args),
});

// Admin: list agent versions
export const adminListAgentVersions = query({
  // Make agent_key optional and no-op when missing
  args: { agent_key: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const key = (args.agent_key || "").trim();
    if (!key) {
      // Gracefully return empty list if no agent key provided
      return [];
    }
    // Delegate to versions helper with a guaranteed key
    return await versions.adminListAgentVersions(ctx, { agent_key: key, limit: args.limit });
  },
});

// Admin: rollback agent to a specific version
export const adminRollbackAgentToVersion = mutation({
  args: { agent_key: v.string(), versionId: v.id("agentVersions") },
  handler: (ctx, args) => versions.adminRollbackAgentToVersion(ctx, args),
});

// Datasets: create lightweight dataset (url or note)
export const adminCreateDataset = mutation({
  args: {
    title: v.string(),
    sourceType: v.union(v.literal("url"), v.literal("note")),
    sourceUrl: v.optional(v.string()),
    noteText: v.optional(v.string()),
  },
  handler: (ctx, args) => datasets.adminCreateDataset(ctx, args),
});

// Datasets: list
export const adminListDatasets = query({
  args: { limit: v.optional(v.number()) },
  handler: (ctx, args) => datasets.adminListDatasets(ctx, args),
});

// Datasets: link/unlink to agent
export const adminLinkDatasetToAgent = mutation({
  args: { datasetId: v.id("agentDatasets"), agent_key: v.string() },
  handler: (ctx, args) => datasets.adminLinkDatasetToAgent(ctx, args),
});

export const adminUnlinkDatasetFromAgent = mutation({
  args: { datasetId: v.id("agentDatasets"), agent_key: v.string() },
  handler: (ctx, args) => datasets.adminUnlinkDatasetFromAgent(ctx, args),
});

// Agent configuration queries and mutations
export const getAgentConfig = query({
  args: { agent_key: v.string() },
  handler: (ctx, args) => config.getAgentConfig(ctx, args),
});

export const adminUpdateAgentConfig = mutation({
  args: {
    agent_key: v.string(),
    useRag: v.optional(v.boolean()),
    useKgraph: v.optional(v.boolean()),
  },
  handler: (ctx, args) => config.adminUpdateAgentConfig(ctx, args),
});

// Enhanced publish with RAG/KG prerequisites check
export const adminPublishAgentEnhanced: any = mutation({
  args: { agent_key: v.string() },
  handler: (ctx, args) => publish.adminPublishAgentEnhanced(ctx, args),
});

// Agent tool health check: verifies agent presence, publish status, and eval gate
export const toolHealth = query({
  // Make agent_key optional so accidental {} invocations don't throw ArgumentValidationError
  args: { agent_key: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const key = (args.agent_key || "").trim();
    if (!key) {
      // Gracefully return a neutral health object instead of throwing
      return {
        ok: false,
        issues: ["agent_key missing"],
        summary: null,
      };
    }
    // Delegate to config, passing a guaranteed non-empty key
    return await config.getAgentToolHealth(ctx, { agent_key: key });
  },
});

// Add: Admin bulk activation to publish all existing agents with fallback
export const adminActivateAll = mutation({
  args: {},
  handler: async (ctx) => {
    // Admin gate
    const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    // Load current agents (DB-backed only)
    let agents: Array<any> = [];
    try {
      agents = await ctx.runQuery(api.aiAgents.adminListAgents as any, {
        tenantId: undefined,
        limit: 500,
      } as any);
    } catch (e: any) {
      throw new Error(`Failed to list agents: ${e?.message || String(e)}`);
    }

    const results: Array<{ agent_key: string; ok: boolean; mode: "standard" | "enhanced"; error?: string }> = [];

    for (const a of agents) {
      const agent_key = String(a.agent_key || a.agentKey || "");
      if (!agent_key) {
        results.push({ agent_key: "(unknown)", ok: false, mode: "standard", error: "missing agent_key" });
        continue;
      }
      try {
        // First attempt: standard publish
        await ctx.runMutation(api.aiAgents.adminPublishAgent as any, { agent_key } as any);
        results.push({ agent_key, ok: true, mode: "standard" });
      } catch (e1: any) {
        // Fallback attempt: enhanced publish (handles RAG/KG prerequisites)
        try {
          await ctx.runMutation(api.aiAgents.adminPublishAgentEnhanced as any, { agent_key } as any);
          results.push({ agent_key, ok: true, mode: "enhanced" });
        } catch (e2: any) {
          results.push({
            agent_key,
            ok: false,
            mode: "enhanced",
            error: e2?.message || e1?.message || "publish failed",
          });
        }
      }
    }

    return {
      total: agents.length,
      success: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    };
  },
});

// Tighten typing in listCustomAgents and keep guest-safe behavior
export const listCustomAgents = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    // Guest-safe: if no business scope provided, return empty list
    if (!args.businessId) return [];

    // Narrow before use to satisfy TS
    const businessId = args.businessId as Id<"businesses">;

    const profiles = await ctx.db
      .query("agentProfiles")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .collect();

    return profiles;
  },
});

// Make getByBusiness guest-safe and ensure it's registered as a public query
export const getByBusiness = query({
  // Optional to avoid accidental validation errors from empty args
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    // Fetch active system agents from the catalog; tenant scoping can be added later
    const rows = await ctx.db
      .query("agentCatalog")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();

    // Shape results to match frontend expectations in MyAgentsTab
    return rows.map((a: any) => ({
      _id: a._id,
      name: a.display_name ?? a.agent_key ?? "Agent",
      description: a.short_desc ?? a.long_desc ?? "Built-in agent",
      capabilities: Array.isArray(a.capabilities) ? a.capabilities : [],
      isActive: a.active === true,
      performance: {
        tasksCompleted: 0,
        successRate: 0,
      },
    }));
  },
});

// Public: get a user's agent profile for a specific business (guest-safe)
export const getAgentProfile = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Guest-safe: require both IDs; otherwise return null
    if (!args.businessId || !args.userId) return null;

    // Use compound index for efficient lookup
    const doc = await ctx.db
      .query("agentProfiles")
      .withIndex("by_user_and_business", (q) =>
        q.eq("userId", args.userId as Id<"users">).eq("businessId", args.businessId as Id<"businesses">)
      )
      .unique();

    return doc ?? null;
  },
});

// Create a custom (user-trained) agent entry in a guest-safe way.
// We persist minimally to agentProfiles, packing arbitrary fields into `preferences`.
export const createCustomAgent = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    tags: v.array(v.string()),
    config: v.optional(v.any()),
    businessId: v.id("businesses"),
    userId: v.id("users"),
    visibility: v.union(v.literal("private"), v.literal("team"), v.literal("market")),
    riskLevel: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  },
  handler: async (ctx, args) => {
    // Store minimally inside agentProfiles using flexible fields.
    // Many fields in agentProfiles are optional; pack UI fields into `preferences`.
    const docId = await ctx.db.insert("agentProfiles", {
      businessId: args.businessId,
      userId: args.userId,
      trainingNotes: `${args.name}: ${args.description}`,
      brandVoice: "custom",
      lastUpdated: Date.now(),
      // Pack extras in preferences to avoid schema mismatches
      preferences: {
        name: args.name,
        description: args.description,
        tags: args.tags,
        visibility: args.visibility,
        riskLevel: args.riskLevel,
        config: args.config ?? {},
      },
    } as any);

    return { ok: true, _id: docId };
  },
});

// Seed Pikar AI App Agents (no-op placeholder guarded by admin/backend defaults).
// UI uses this for a toast; keep it safe and idempotent.
export const seedEnhancedForBusiness = mutation({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    // In this minimal implementation, there's nothing to seed because built-in
    // Pikar agents come from `agentCatalog` (read by `getByBusiness`).
    // Return a success shape compatible with toasts.
    return { ok: true, added: 0 };
  },
});

export const listTemplates = query({
  args: {
    tier: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Source templates from active agent catalog entries; guest-safe
    const rows = await ctx.db
      .query("agentCatalog")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();

    // Map to a flexible template shape to satisfy various UIs
    let templates = rows.map((a: any) => ({
      _id: a._id,
      agent_key: a.agent_key,
      key: a.agent_key,
      title: a.display_name ?? a.agent_key,
      name: a.display_name ?? a.agent_key,
      short_desc: a.short_desc ?? "",
      description: a.long_desc ?? a.short_desc ?? "",
      long_desc: a.long_desc ?? "",
      capabilities: Array.isArray(a.capabilities) ? a.capabilities : [],
      tier_restrictions: Array.isArray(a.tier_restrictions) ? a.tier_restrictions : [],
      tags: Array.isArray(a.capabilities) ? a.capabilities : [],
      default_model: a.default_model ?? "gpt-4o-mini",
      active: a.active === true,
    }));

    // Optional tier filter (if provided)
    if (args.tier) {
      const t = String(args.tier).toLowerCase();
      templates = templates.filter((tpl) =>
        (tpl.tier_restrictions ?? []).length === 0 ||
        (tpl.tier_restrictions ?? []).some((x: string) => String(x).toLowerCase() === t)
      );
    }

    // Optional search filter
    if (args.search) {
      const s = String(args.search).toLowerCase();
      templates = templates.filter((tpl) =>
        (tpl.title ?? "").toLowerCase().includes(s) ||
        (tpl.name ?? "").toLowerCase().includes(s) ||
        (tpl.short_desc ?? "").toLowerCase().includes(s) ||
        (tpl.description ?? "").toLowerCase().includes(s) ||
        (tpl.agent_key ?? "").toLowerCase().includes(s)
      );
    }

    // Optional limit
    const limit = typeof args.limit === "number" && args.limit > 0 ? args.limit : undefined;
    return limit ? templates.slice(0, limit) : templates;
  },
});