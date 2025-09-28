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