import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// Deterministic pseudo-embedding utilities (used for retrieval scoring too)
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function pseudoEmbed(texts: Array<string>): Array<Array<number>> {
  const dim = 256;
  const out: Array<Array<number>> = [];
  for (const text of texts) {
    const h = simpleHash(text);
    const vec: Array<number> = [];
    for (let i = 0; i < dim; i++) {
      const val = Math.sin((h + i * 31) * 0.01);
      vec.push(val);
    }
    out.push(vec);
  }
  return out;
}

function cosineSim(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// Store embeddings for chunks with metadata
export const storeDocumentEmbeddings = mutation({
  args: {
    documentId: v.string(),
    chunks: v.array(v.object({
      content: v.string(),
      embedding: v.array(v.number()),
      meta: v.optional(v.any()),
      scope: v.optional(v.union(v.literal("global"), v.literal("dataset"), v.literal("business"))),
      businessId: v.optional(v.id("businesses")),
      datasetId: v.optional(v.id("agentDatasets")),
      agentKeys: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx: any, args) => {
    const now = Date.now();
    for (const c of args.chunks) {
      await ctx.db.insert("vectorChunks", {
        scope: c.scope ?? "business",
        businessId: c.businessId,
        datasetId: c.datasetId,
        agentKeys: c.agentKeys ?? [],
        content: c.content,
        meta: { ...(c.meta ?? {}), documentId: args.documentId },
        embedding: c.embedding,
        createdAt: now,
      } as any);
    }
    return { ok: true, added: args.chunks.length };
  },
});

// Get embeddings (chunks) by documentId
export const getDocumentEmbeddings = query({
  args: { documentId: v.string() },
  handler: async (ctx: any, args) => {
    const all = await ctx.db.query("vectorChunks").withIndex("by_scope", (q: any) => q.eq("scope", "business")).collect();
    return all.filter((r: any) => r?.meta?.documentId === args.documentId);
  },
});

// Find similar documents given a documentId (aggregate chunk matches)
export const findSimilarDocuments = query({
  args: {
    documentId: v.string(),
    matchThreshold: v.optional(v.number()),
    matchCount: v.optional(v.number()),
    agentType: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
    const sourceChunks: any[] = await ctx.runQuery(api.vectors.getDocumentEmbeddings, { documentId: args.documentId });
    if (!sourceChunks.length) return [];
    const dim: number = (sourceChunks[0]?.embedding || []).length;
    const centroid: number[] = new Array(dim).fill(0);
    for (const ch of sourceChunks) {
      for (let i = 0; i < dim; i++) centroid[i] += (ch.embedding?.[i] ?? 0);
    }
    for (let i = 0; i < dim; i++) centroid[i] /= sourceChunks.length;

    const pool: any[] = await ctx.db.query("vectorChunks").collect();
    type Score = { id: Id<"vectorChunks">; documentId?: string; score: number; preview: string; agentKeys: string[] };
    const scores: Score[] = pool
      .map((p: any) => ({
        id: p._id as Id<"vectorChunks">,
        documentId: p?.meta?.documentId as string | undefined,
        score: cosineSim(centroid, p.embedding || []),
        preview: (p.content || "").slice(0, 240),
        agentKeys: (p.agentKeys || []) as string[],
      }))
      .filter((s: Score) => s.documentId !== args.documentId);

    const threshold = args.matchThreshold ?? 0.7;
    let filtered: Score[] = scores.filter((s: Score) => s.score >= threshold);
    if (args.agentType) {
      const t = String(args.agentType).toLowerCase();
      filtered = filtered.filter((s: Score) =>
        (s.agentKeys || []).some((k: string) => String(k).toLowerCase().includes(t))
      );
    }
    const limit = Math.max(1, Math.min(100, args.matchCount ?? 10));
    return filtered.sort((a: Score, b: Score) => b.score - a.score).slice(0, limit);
  },
});

// Semantic search by embedding vector
export const semanticSearch = query({
  args: {
    queryEmbedding: v.array(v.number()),
    matchThreshold: v.optional(v.number()),
    matchCount: v.optional(v.number()),
    agentType: v.optional(v.string()),
    businessId: v.optional(v.id("businesses")),
    datasetId: v.optional(v.id("agentDatasets")),
  },
  handler: async (ctx: any, args) => {
    let pool: any[] = [];
    if (args.datasetId) {
      pool = await ctx.db
        .query("vectorChunks")
        .withIndex("by_dataset", (qi: any) => qi.eq("datasetId", args.datasetId as Id<"agentDatasets">))
        .collect();
    } else if (args.businessId) {
      pool = await ctx.db
        .query("vectorChunks")
        .withIndex("by_business", (qi: any) => qi.eq("businessId", args.businessId as Id<"businesses">))
        .collect();
    } else {
      pool = await ctx.db
        .query("vectorChunks")
        .withIndex("by_scope", (qi: any) => qi.eq("scope", "global"))
        .collect();
    }

    let items: any[] = pool.map((p: any) => ({
      id: p._id as Id<"vectorChunks">,
      documentId: p?.meta?.documentId as string | undefined,
      score: cosineSim(args.queryEmbedding, p.embedding || []),
      preview: (p.content || "").slice(0, 240),
      agentKeys: (p.agentKeys || []) as string[],
      businessId: p.businessId,
      datasetId: p.datasetId,
    }));

    const threshold = args.matchThreshold ?? 0.7;
    items = items.filter((i: any) => i.score >= threshold);

    if (args.agentType) {
      const t = String(args.agentType).toLowerCase();
      items = items.filter((i: any) =>
        (i.agentKeys || []).some((k: string) => String(k).toLowerCase().includes(t))
      );
    }

    const limit = Math.max(1, Math.min(100, args.matchCount ?? 10));
    return items.sort((a: any, b: any) => b.score - a.score).slice(0, limit);
  },
});

// Admin-gated ingestion (optional, minimal)
export const adminIngestChunks = mutation({
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
  handler: async (ctx: any, args) => {
    const isAdmin = await ctx.runQuery(api.admin.getIsAdmin, {});
    if (!isAdmin) throw new Error("Admin access required");

    const contents: Array<string> = args.items.map((item) => item.content.slice(0, 8000));
    const embeddings: Array<Array<number>> = pseudoEmbed(contents);

    const insertedIds: Array<Id<"vectorChunks">> = [];
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
      } as any);
      insertedIds.push(id as Id<"vectorChunks">);
    }

    if (args.businessId) {
      await ctx.runMutation(internal.audit.write, {
        businessId: args.businessId,
        action: "vector_ingest",
        entityType: "vectors",
        entityId: args.datasetId ? String(args.datasetId) : "",
        details: { scope: args.scope, count: args.items.length, datasetId: args.datasetId, agentKeys: args.agentKeys, stubbed: true },
      });
    }

    return { insertedIds, count: insertedIds.length, stubbed: true };
  },
});

// Lightweight internal ingestion for initiatives (optional)
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
  handler: async (ctx: any, args) => {
    // 16-dim deterministic embedding for V8 safety
    const dim = 16;
    const buckets: number[] = Array.from({ length: dim }, () => 0);
    for (let i = 0; i < args.content.length; i++) {
      const code = args.content.charCodeAt(i) || 0;
      buckets[i % dim] += code;
    }
    const norm = Math.sqrt(buckets.reduce((s, x) => s + x * x, 0)) || 1;
    const embedding = buckets.map((x) => x / norm);

    await ctx.db.insert("vectorChunks", {
      scope: "business",
      businessId: args.businessId,
      datasetId: (args as any).datasetId ?? undefined,
      agentKeys: args.agentKeys ?? [],
      content: args.content,
      meta: { ...(args.meta ?? {}), source: (args.meta?.source ?? "brain_dump") } as any,
      embedding,
      createdAt: Date.now(),
    } as any);
  },
});