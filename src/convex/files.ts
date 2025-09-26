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

      // For now, return a mock transcription
      // In production, this would call OpenAI Whisper or similar service
      const mockTranscript = "This is a mock transcription. Audio processing would happen here.";
      
      return {
        success: true,
        transcript: mockTranscript,
        summary: "Mock summary of the audio content.",
        detectedTags: ["audio", "transcription"],
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

// Provide the expected export name used by the frontend
export const generateUploadUrl = action({
  args: {},
  handler: async (ctx) => {
    const url = await ctx.storage.generateUploadUrl();
    return { url };
  },
});