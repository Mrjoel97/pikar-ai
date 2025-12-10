import { v } from "convex/values";
import { mutation, action, query } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Advanced Brain Dump with Voice Transcription
 */
export const transcribeVoiceNote = action({
  args: {
    audioUrl: v.string(),
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    // Simulate transcription process
    // In production, this would call OpenAI Whisper or similar
    const transcription = "This is a simulated transcription of the voice note. I need to follow up with the client about the new proposal and schedule a meeting for next Tuesday.";
    
    // Auto-tagging based on content
    const tags = ["client", "proposal", "meeting"];
    
    return {
      text: transcription,
      tags,
      confidence: 0.95,
    };
  },
});

/**
 * AI-powered tagging and organization
 */
export const organizeBrainDump = action({
  args: {
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Simulate AI organization
    const category = args.content.toLowerCase().includes("meeting") ? "schedule" : 
                    args.content.toLowerCase().includes("idea") ? "innovation" : "general";
    
    const actionItems = args.content.includes("follow up") ? ["Send email", "Update CRM"] : [];

    return {
      category,
      suggestedTags: ["priority", category],
      actionItems,
    };
  },
});

/**
 * Advanced Search for Brain Dumps
 */
export const searchBrainDumpsAdvanced = query({
  args: {
    businessId: v.id("businesses"),
    query: v.string(),
    tags: v.optional(v.array(v.string())),
    dateRange: v.optional(v.object({
      start: v.number(),
      end: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const dumps = await ctx.db
      .query("brainDumps")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    // In-memory advanced filtering (Convex search is better for large datasets)
    return dumps.filter(dump => {
      const matchesText = dump.content.toLowerCase().includes(args.query.toLowerCase());
      const matchesTags = args.tags ? args.tags.some(t => dump.tags?.includes(t)) : true;
      const matchesDate = args.dateRange ? 
        (dump._creationTime >= args.dateRange.start && dump._creationTime <= args.dateRange.end) : true;
      
      return matchesText && matchesTags && matchesDate;
    });
  },
});
