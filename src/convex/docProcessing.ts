"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { chunkDocument, type ChunkingOptions } from "./chunking";

// Deterministic local embedding helpers (no external APIs)
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function embedText(text: string, dim = 256): number[] {
  const h = simpleHash(text || "");
  const vec: number[] = new Array(dim);
  for (let i = 0; i < dim; i++) {
    vec[i] = Math.sin((h + i * 31) * 0.01);
  }
  return vec;
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (const t of texts) out.push(embedText(t));
  return out;
}

export const generateEmbedding = action({
  args: { text: v.string(), model: v.optional(v.string()) },
  handler: async (_ctx, args) => {
    const embedding = embedText(args.text);
    return { embedding };
  },
});

export const processDocument = action({
  args: {
    documentId: v.string(),
    content: v.string(),
    opts: v.optional(v.object({
      chunkSize: v.optional(v.number()),
      overlap: v.optional(v.number()),
      strategy: v.optional(v.string()),
      documentType: v.optional(v.string()),
      agentKeys: v.optional(v.array(v.string())),
      businessId: v.optional(v.id("businesses")),
      datasetId: v.optional(v.id("agentDatasets")),
      scope: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const chunks = chunkDocument(args.content, {
      targetLen: args.opts?.chunkSize ?? 300,
      overlap: args.opts?.overlap ?? 50,
    } as ChunkingOptions);

    const embeddings = await embedBatch(chunks.map((c) => c.text));
    const payload = chunks.map((c, i) => ({
      content: c.text,
      embedding: embeddings[i],
      meta: {
        strategy: c.meta.strategy,
        estTokens: c.meta.estTokens,
        readingSec: c.meta.readingSec,
      },
      scope: (args.opts?.scope as any) ?? "business",
      businessId: args.opts?.businessId,
      datasetId: args.opts?.datasetId,
      agentKeys: args.opts?.agentKeys ?? [],
    }));

    await ctx.runMutation(api.vectors.storeDocumentEmbeddings, {
      documentId: args.documentId,
      chunks: payload as any,
    });

    return { ok: true, chunks: payload.length };
  },
});

export const batchProcessDocuments = action({
  args: {
    documents: v.array(v.object({
      documentId: v.string(),
      content: v.string(),
      opts: v.optional(v.any()),
    })),
  },
  handler: async (ctx, args) => {
    let processed = 0;
    for (const d of args.documents) {
      const res = await ctx.runAction(api.docProcessing.processDocument, {
        documentId: d.documentId,
        content: d.content,
        opts: d.opts as any,
      });
      if (res?.ok) processed += 1;
    }
    return { ok: true, processed };
  },
});