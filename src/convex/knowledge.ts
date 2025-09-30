import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Minimal document store leveraging docsPages as knowledge docs
export const createDocument = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    documentType: v.optional(v.string()),
    visibility: v.optional(v.union(v.literal("PRIVATE"), v.literal("PUBLIC"))),
    tags: v.optional(v.array(v.string())),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    // Reuse docsPages table to avoid new schema
    const slug = args.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const id = await ctx.db.insert("docsPages", {
      title: args.title,
      slug,
      contentMarkdown: args.content,
      sections: [],
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    } as any);
    return { ok: true, documentId: slug, _id: id };
  },
});

// Text semantic search: embed text then query vectors
export const semanticSearch = action({
  args: {
    text: v.string(),
    matchThreshold: v.optional(v.number()),
    matchCount: v.optional(v.number()),
    agentType: v.optional(v.string()),
    businessId: v.optional(v.id("businesses")),
    datasetId: v.optional(v.id("agentDatasets")),
  },
  handler: async (ctx, args) => {
    const emb = await ctx.runAction(api.docProcessing.generateEmbedding, { text: args.text });
    const results = await ctx.runQuery(api.vectors.semanticSearch, {
      queryEmbedding: emb.embedding,
      matchThreshold: args.matchThreshold,
      matchCount: args.matchCount,
      agentType: args.agentType,
      businessId: args.businessId,
      datasetId: args.datasetId,
    });
    return results;
  },
});

// Associate an agent to a document by tagging future chunks via metadata (no new table)
export const addAgentKnowledgeSource = mutation({
  args: {
    agentType: v.string(),
    documentId: v.string(),
    priority: v.optional(v.number()),
    contextInstructions: v.optional(v.string()),
  },
  handler: async (_ctx, _args) => {
    // Association is realized when processing/storing embeddings by setting agentKeys in docProcessing opts.
    // We keep this as a no-op to track API usage and leave UI to pass agentKeys during processing.
    return { ok: true };
  },
});
