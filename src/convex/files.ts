"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

// Generate a signed upload URL for client to PUT a file (returns {url, storageIdField: "storageId"})
export const getUploadUrl = action({
  args: {},
  handler: async (ctx) => {
    const url = await ctx.storage.generateUploadUrl();
    return { url };
  },
});

export const transcribeAudio = action({
  args: {
    fileId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    try {
      // Validate the file exists via a signed URL (actions cannot use ctx.db)
      const url = await ctx.storage.getUrl(args.fileId);
      if (!url) {
        throw new Error("File not found");
      }

      // Call the OpenAI Whisper transcription service
      const result: any = await ctx.runAction("openai:transcribeAudio" as any, {
        fileId: args.fileId,
      });

      // Check if transcription was successful
      if (!result?.transcript || result.provider === "none") {
        return {
          success: false,
          error: result?.note || "Transcription service unavailable",
        };
      }

      // Generate summary and tags using OpenAI
      let summary = "";
      let detectedTags: string[] = [];

      try {
        const summaryPrompt = `Summarize this transcription in 1-2 sentences and suggest 3-5 relevant tags:\n\n${result.transcript}`;
        const summaryResult: any = await ctx.runAction("openai:generate" as any, {
          prompt: summaryPrompt,
          model: "gpt-4o-mini",
          maxTokens: 150,
        });

        if (summaryResult?.text) {
          const lines = summaryResult.text.split("\n").filter((l: string) => l.trim());
          summary = lines[0] || "";
          const tagsLine = lines.find((l: string) => l.toLowerCase().includes("tag"));
          if (tagsLine) {
            detectedTags = tagsLine
              .replace(/tags?:?/gi, "")
              .split(",")
              .map((t: string) => t.trim().toLowerCase())
              .filter((t: string) => t.length > 0)
              .slice(0, 5);
          }
        }
      } catch (summaryError) {
        console.warn("Summary generation failed, using transcript preview:", summaryError);
        summary = result.transcript.slice(0, 100) + "...";
        detectedTags = ["voice-note"];
      }

      return {
        success: true,
        transcript: result.transcript,
        summary: summary || "Voice note transcribed successfully.",
        detectedTags: detectedTags.length > 0 ? detectedTags : ["voice-note", "audio"],
        title: "Voice Note",
      };
    } catch (error) {
      console.error("Transcription error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Transcription failed",
      };
    }
  },
});

// Return a signed URL for downloading a stored file (for chat attachments)
export const getFileUrl = action({
  args: { fileId: v.id("_storage") },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.fileId);
    if (!url) {
      // If the file doesn't exist or URL can't be generated, return a null-ish string
      return { url: "" };
    }
    return { url };
  },
});

// Provide the expected export name used by the frontend
export const generateUploadUrl = action({
  args: {},
  handler: async (ctx) => {
    const uploadUrl = await ctx.storage.generateUploadUrl();
    // Extract storageId from the upload URL
    // Convex upload URLs contain the storage ID in the path
    const urlParts = uploadUrl.split('/');
    const storageId = urlParts[urlParts.length - 1]?.split('?')[0] || '';
    return { uploadUrl, storageId };
  },
});