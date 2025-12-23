// Simple model registry & helpers for text generation and embeddings via Vercel AI SDK.
// Import in actions that run in Node runtime only (files with "use node").

import { openai } from "@/utils/openai";

// CHAT MODELS
export function getDefaultChatModel() {
  // General purpose, good quality
  return openai("gpt-4o");
}

export function getLightweightChatModel() {
  // Fast/cheap routing or quick tasks
  return openai("gpt-4o-mini");
}

// EMBEDDINGS
export function getDefaultEmbeddingModel() {
  // Cost-effective, solid performance for RAG
  return openai.textEmbeddingModel("text-embedding-3-small");
}

// Helpers to guard usage if key not present
export function canUseAI(): boolean {
  return typeof process !== "undefined" && !!process.env.OPENAI_API_KEY;
}
