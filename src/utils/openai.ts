// Centralized OpenAI client using Vercel AI SDK
// Safe to import from Convex actions (Node runtime only) or server utilities.

import { createOpenAI } from "@ai-sdk/openai";

// Note: OPENAI_API_KEY must be set via the Integrations UI / envs
export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Lightweight readiness check for optional usage
export function isOpenAIConfigured(): boolean {
  return typeof process !== "undefined" && !!process.env.OPENAI_API_KEY;
}
