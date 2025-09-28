import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

// Admin-gated mutation to ingest chunks with deterministic pseudo-embeddings (no external action calls)
export const adminIngestChunks: any = mutation({
  args: {
    items: v.array(v.object({
      content: v.string(),
      meta: v.optional(v.any()),
    })),
    scope: v.union(v.literal("global"), v.literal("dataset"), v.literal("business")),
    businessId: v.optional(v.id("businesses")),
    datasetId: v.optional(v.id("agentDatasets")),
    agentKeys: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // RBAC check
    const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    // Quota check - max 5k chunks per business
    if (args.businessId) {
      const existing = await ctx.db
        .query("vectorChunks")
        .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
        .collect();

      if (existing.length + args.items.length > 5000) {
        throw new Error(`Quota exceeded: max 5000 chunks per business (current: ${existing.length})`);
      }
    }

    const contents: Array<string> = args.items.map((item) => item.content.slice(0, 8000));
    const embeddings: Array<Array<number>> = pseudoEmbed(contents);

    const insertedIds: Array<any> = [];
    for (let i = 0; i < args.items.length; i++) {
      const item = args.items[i];
      const embedding = embeddings[i];

      const id = await ctx.db.insert("vectorChunks", {
        scope: args.scope,
        businessId: args.businessId,
        datasetId: args.datasetId,
        agentKeys: args.agentKeys || [],
        content: item.content.slice(0, 8000),
        meta: item.meta || {},
        embedding,
        createdAt: Date.now(),
      });
      insertedIds.push(id);
    }

    // Audit log (only if businessId is provided; avoid invalid placeholder)
    if (args.businessId) {
      await ctx.runMutation(internal.audit.write, {
        businessId: args.businessId,
        action: "vector_ingest",
        entityType: "vectors",
        // Convert Id to string for audit entityId
        entityId: args.datasetId ? String(args.datasetId) : "",
        details: {
          scope: args.scope,
          count: args.items.length,
          datasetId: args.datasetId,
          agentKeys: args.agentKeys,
          stubbed: true, // embeddings are pseudo/stubbed
        },
      });
    }

    return { insertedIds, count: insertedIds.length, stubbed: true };
  },
});

// Admin-gated mutation to delete chunks by dataset
export const adminDeleteDatasetChunks = mutation({
  args: { datasetId: v.id("agentDatasets") },
  handler: async (ctx, args) => {
    const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    const chunks = await ctx.db
      .query("vectorChunks")
      .withIndex("by_dataset", (q) => q.eq("datasetId", args.datasetId))
      .collect();

    for (const chunk of chunks) {
      await ctx.db.delete(chunk._id);
    }

    // Audit log
    if (chunks.length > 0 && chunks[0]?.businessId) {
      await ctx.runMutation(internal.audit.write, {
        businessId: chunks[0].businessId,
        action: "vector_delete_dataset",
        entityType: "vectors",
        // Convert Id to string for audit entityId
        entityId: String(args.datasetId),
        details: { deletedCount: chunks.length },
      });
    }

    return { deletedCount: chunks.length };
  },
});

// Admin-gated mutation to delete chunks by business
export const adminDeleteBusinessChunks = mutation({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    const chunks = await ctx.db
      .query("vectorChunks")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    for (const chunk of chunks) {
      await ctx.db.delete(chunk._id);
    }

    // Audit log
    await ctx.runMutation(internal.audit.write, {
      businessId: args.businessId,
      action: "vector_delete_business",
      entityType: "vectors",
      entityId: "",
      details: { deletedCount: chunks.length },
    });

    return { deletedCount: chunks.length };
  },
});

// Retrieval query with cosine similarity (using pseudo-embeddings for the query)
export const retrieve: any = query({
  args: {
    query: v.string(),
    agent_key: v.optional(v.string()),
    businessId: v.optional(v.id("businesses")),
    datasetId: v.optional(v.id("agentDatasets")),
    topK: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const topK = Math.min(args.topK || 8, 50);

    try {
      const queryVector: Array<number> = pseudoEmbed([args.query.slice(0, 8000)])[0];

      // Get candidate chunks based on scope
      let candidates: Array<any> = [];

      if (args.datasetId) {
        candidates = await ctx.db
          .query("vectorChunks")
          .withIndex("by_dataset", (q) => q.eq("datasetId", args.datasetId))
          .collect();
      } else if (args.businessId) {
        candidates = await ctx.db
          .query("vectorChunks")
          .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
          .collect();
      } else {
        // Global scope
        candidates = await ctx.db
          .query("vectorChunks")
          .withIndex("by_scope", (q) => q.eq("scope", "global"))
          .collect();
      }

      // Filter by agent if specified
      if (args.agent_key) {
        candidates = candidates.filter(
          (chunk) => chunk.agentKeys.length === 0 || chunk.agentKeys.includes(args.agent_key!)
        );
      }

      // Calculate cosine similarity and sort
      const scored = candidates.map((chunk) => {
        const similarity = cosineSimilarity(queryVector, chunk.embedding);
        return {
          _id: chunk._id,
          content: chunk.content,
          meta: chunk.meta,
          score: similarity,
          datasetId: chunk.datasetId,
          agentKeys: chunk.agentKeys,
        };
      });

      scored.sort((a, b) => b.score - a.score);
      const topChunks = scored.slice(0, topK);

      return {
        chunks: topChunks,
        stubbed: true, // retrieval uses stub embeddings
        total: candidates.length,
      };
    } catch (error) {
      return {
        chunks: [],
        stubbed: true,
        error: "Retrieval failed",
        message: String(error),
      };
    }
  },
});

// Helper: cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Helper: deterministic pseudo-embedding generator (keeps everything V8-safe)
function pseudoEmbed(texts: Array<string>): Array<Array<number>> {
  const dim = 256; // compact dim to keep storage small
  const out: Array<Array<number>> = [];
  for (const text of texts) {
    const h = simpleHash(text);
    const vec: Array<number> = [];
    for (let i = 0; i < dim; i++) {
      // deterministic value in [-1, 1]
      const val = Math.sin((h + i * 31) * 0.01);
      vec.push(val);
    }
    out.push(vec);
  }
  return out;
}

// Helper: simple hash
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32-bit
  }
  return Math.abs(hash);
}

// Add a safe internal ingestion path for initiatives/brain dumps
import { internalMutation } from "./_generated/server";

export const ingestFromInitiatives = internalMutation({
  args: {
    businessId: v.optional(v.id("businesses")),
    datasetId: v.optional(v.id("agentDatasets")),
    agentKeys: v.optional(v.array(v.string())),
    content: v.string(),
    meta: v.optional(v.object({
      source: v.optional(v.string()),
      dumpId: v.optional(v.id("brainDumps")),
      tags: v.optional(v.array(v.string())),
      summary: v.optional(v.string()),
      title: v.optional(v.string()),
      channel: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    // Deterministic pseudo-embedding (V8-safe): 16-dim char code bucket sum normalized
    const dim = 16;
    const buckets: Array<number> = Array.from({ length: dim }, () => 0);
    for (let i = 0; i < args.content.length; i++) {
      const code = args.content.charCodeAt(i) || 0;
      buckets[i % dim] += code;
    }
    const norm = Math.sqrt(buckets.reduce((s, x) => s + x * x, 0)) || 1;
    const embedding: Array<number> = buckets.map((x) => x / norm);

    await ctx.db.insert("vectorChunks", {
      scope: "business",
      businessId: args.businessId,
      datasetId: (args as any).datasetId ?? undefined,
      agentKeys: args.agentKeys ?? [],
      content: args.content,
      meta: {
        ...(args.meta ?? {}),
        source: (args.meta?.source ?? "brain_dump"),
      } as any,
      embedding,
      createdAt: Date.now(),
    } as any);
  },
});