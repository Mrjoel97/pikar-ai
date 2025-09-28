import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Delegate to the existing lightweight helpers
import * as datasets from "./lib/aiAgents/datasets";

// Public: list datasets (admin-gated inside helper)
export const adminListDatasets = query({
  args: { limit: v.optional(v.number()) },
  handler: (ctx, args) => datasets.adminListDatasets(ctx, args),
});

// Public: create dataset (admin-gated inside helper)
export const adminCreateDataset = mutation({
  args: {
    title: v.string(),
    sourceType: v.union(v.literal("url"), v.literal("note")),
    sourceUrl: v.optional(v.string()),
    noteText: v.optional(v.string()),
  },
  handler: (ctx, args) => datasets.adminCreateDataset(ctx, args),
});

// Public: link dataset to agent (admin-gated inside helper)
export const adminLinkDataset = mutation({
  args: {
    datasetId: v.id("agentDatasets"),
    agent_key: v.string(),
  },
  handler: (ctx, args) => datasets.adminLinkDatasetToAgent(ctx, args),
});

// Public: unlink dataset from agent (admin-gated inside helper)
export const adminUnlinkDataset = mutation({
  args: {
    datasetId: v.id("agentDatasets"),
    agent_key: v.string(),
  },
  handler: (ctx, args) => datasets.adminUnlinkDatasetFromAgent(ctx, args),
});
