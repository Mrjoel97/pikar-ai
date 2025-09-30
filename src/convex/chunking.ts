// ... keep existing code (top-level imports and any existing exported types if present)

// Replace the broken regex-based splitter with a safe, line-based implementation
export type Chunk = {
  id: string;
  content: string;
  text: string; // alias for compatibility with older callers
  start: number;
  end: number;
  meta: Record<string, any>;
};

// Minimal, safe code fence splitter (supports 
// Add: options type expected by callers
export type ChunkingOptions = {
  targetLen?: number;
  overlap?: number;
};

// Add: minimalist chunker with safe defaults; independent of other helpers
export function chunkDocument(
  docText: string,
  opts?: ChunkingOptions
): Chunk[] {
  const targetLen = Math.max(64, Math.min(512, opts?.targetLen ?? 300));
  const overlap = Math.max(0, Math.min(Math.floor(targetLen / 3), opts?.overlap ?? 50));

  const tokens: string[] = String(docText || "")
    .split(/\s+/g)
    .filter(Boolean);

  if (tokens.length === 0) {
    return [];
  }

  const step = Math.max(1, targetLen - overlap);
  const chunks: Chunk[] = [];
  let idx = 0;
  for (let i = 0; i < tokens.length; i += step) {
    const slice = tokens.slice(i, Math.min(i + targetLen, tokens.length)).join(" ").trim();
    if (!slice) continue;
    // compute rough character offsets based on concatenation length
    const prevText = tokens.slice(0, i).join(" ");
    const start = prevText.length > 0 ? prevText.length + 1 : 0;
    const end = start + slice.length;

    // Add: compute simple stats for defaults
    const words = slice.split(/\s+/g).filter(Boolean).length;

    chunks.push({
      id: `c_${idx++}`,
      content: slice,
      text: slice, // keep c.text for compatibility
      start,
      end,
      // Ensure meta is always present with safe defaults
      meta: {
        type: "plain",
        strategy: "plain",
        estTokens: Math.max(1, words),
        // ~180 wpm => ~3 w/s; ensure a sane lower bound
        readingSec: Math.max(5, Math.round(words / 3)),
      },
    });
    if (i + targetLen >= tokens.length) break;
  }

  return chunks;
}