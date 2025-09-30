import type { Value } from "convex/values";

// Basic chunking utilities with multiple strategies and overlap support
export type ChunkStrategy =
  | "auto"
  | "semantic"
  | "paragraph"
  | "sentence"
  | "markdown"
  | "code";

export type DocumentType =
  | "TEXT"
  | "MARKDOWN"
  | "HTML"
  | "JSON"
  | "PDF"
  | "DOCX"
  | "XLSX"
  | "CSV";

export type ChunkingOptions = {
  chunkSize?: number; // approx characters
  overlap?: number; // approx characters
  strategy?: ChunkStrategy;
  documentType?: DocumentType;
};

const DEFAULT_CHUNK_SIZE = 1200;
const DEFAULT_OVERLAP = 200;

export function estimateTokens(text: string): number {
  // Rough heuristic: ~4 chars per token
  return Math.ceil((text || "").length / 4);
}

export function readingTimeSec(text: string): number {
  // Rough heuristic: 200 words/min
  const words = (text || "").trim().split(/\s+/g).filter(Boolean).length;
  return Math.ceil((words / 200) * 60);
}

function splitParagraphs(text: string): string[] {
  return (text || "")
    .split(/\n{2,}/g)
    .map((t) => t.trim())
    .filter(Boolean);
}

function splitSentences(text: string): string[] {
  // Lightweight sentence split; avoids heavyweight deps
  return (text || "")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/g)
    .map((t) => t.trim())
    .filter(Boolean);
}

function splitMarkdownSections(text: string): string[] {
  // Split on headings while preserving content
  const parts = (text || "").split(/\n(?=#+\s)/g);
  return parts.map((p) => p.trim()).filter(Boolean);
}

function splitCodeBlocks(text: string): string[] {
  // Preserve fenced code blocks; split around them and keep non-code text segments
  const blocks: string[] = [];
  const re = /
    (?:^|(?<=\n))(`{3,}|(?:\n\s*`{3,}\s*))(?:(?!\1).)*?(?=\1|$)
  /g;
  let match;
  while ((match = re.exec(text)) !== null) {
    blocks.push(text.slice(match.index, match.index + match[0].length));
  }
  return blocks;
}