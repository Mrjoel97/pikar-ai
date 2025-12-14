import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Upload voice note
export const uploadVoiceNote = mutation({
  args: {
    businessId: v.id("businesses"),
    storageId: v.id("_storage"),
    duration: v.number(),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const voiceNoteId = await ctx.db.insert("voiceNotes", {
      businessId: args.businessId,
      userId: identity.subject as any, // Cast
      storageId: args.storageId,
      duration: args.duration,
      title: args.title || "Untitled Voice Note",
      status: "processing",
      transcription: undefined, // Changed from null
      summary: undefined, // Changed from null
      tags: [],
      initiativeId: undefined, // Changed from null
    });

    // Trigger transcription
    await ctx.scheduler.runAfter(0, internal.voiceNotes.transcribeVoiceNote, {
      voiceNoteId,
    });

    return voiceNoteId;
  },
});

// Transcribe voice note (internal action)
export const transcribeVoiceNote = action({
  args: { voiceNoteId: v.id("voiceNotes") },
  handler: async (ctx, args) => {
    const voiceNote = await ctx.runQuery(internal.voiceNotes.getVoiceNote, {
      voiceNoteId: args.voiceNoteId,
    });

    if (!voiceNote) return;

    // Simulate transcription (replace with actual API call)
    const transcription = `This is a simulated transcription for voice note ${args.voiceNoteId}. In production, this would call OpenAI Whisper API or similar service.`;

    await ctx.runMutation(internal.voiceNotes.updateTranscription, {
      voiceNoteId: args.voiceNoteId,
      transcription,
    });

    // Trigger summarization
    await ctx.scheduler.runAfter(0, internal.voiceNotes.summarizeVoiceNote, {
      voiceNoteId: args.voiceNoteId,
    });
  },
});

// Summarize voice note (internal action)
export const summarizeVoiceNote = action({
  args: { voiceNoteId: v.id("voiceNotes") },
  handler: async (ctx, args) => {
    const voiceNote = await ctx.runQuery(internal.voiceNotes.getVoiceNote, {
      voiceNoteId: args.voiceNoteId,
    });

    if (!voiceNote || !voiceNote.transcription) return;

    // Simulate AI summary (replace with actual API call)
    const summary = `AI Summary: This voice note discusses key business insights and action items. Main topics include strategy planning and customer feedback.`;
    const suggestedTags = ["strategy", "planning", "customer-feedback"];

    await ctx.runMutation(internal.voiceNotes.updateSummary, {
      voiceNoteId: args.voiceNoteId,
      summary,
      suggestedTags,
    });
  },
});

// Internal query to get voice note
export const getVoiceNote = query({
  args: { voiceNoteId: v.id("voiceNotes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.voiceNoteId);
  },
});

// Internal mutation to update transcription
export const updateTranscription = mutation({
  args: {
    voiceNoteId: v.id("voiceNotes"),
    transcription: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.voiceNoteId, {
      transcription: args.transcription,
      status: "transcribed",
    });
  },
});

// Internal mutation to update summary
export const updateSummary = mutation({
  args: {
    voiceNoteId: v.id("voiceNotes"),
    summary: v.string(),
    suggestedTags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.voiceNoteId, {
      summary: args.summary,
      status: "completed",
      tags: args.suggestedTags,
    });
  },
});

// Search voice notes
export const searchVoiceNotes = query({
  args: {
    businessId: v.id("businesses"),
    searchTerm: v.optional(v.string()),
    tag: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    let notes = await ctx.db
      .query("voiceNotes")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .collect();

    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();
      notes = notes.filter(
        (note) =>
          note.title?.toLowerCase().includes(term) ||
          note.transcription?.toLowerCase().includes(term) ||
          note.summary?.toLowerCase().includes(term)
      );
    }

    if (args.tag) {
      notes = notes.filter((note) => (note.tags || []).includes(args.tag!));
    }

    return notes;
  },
});

// List voice notes
export const listVoiceNotes = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db
      .query("voiceNotes")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .take(50);
  },
});

// Tag voice note
export const tagVoiceNote = mutation({
  args: {
    voiceNoteId: v.id("voiceNotes"),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    await ctx.db.patch(args.voiceNoteId, {
      tags: args.tags,
    });
  },
});

// Link to initiative
export const linkToInitiative = mutation({
  args: {
    voiceNoteId: v.id("voiceNotes"),
    initiativeId: v.id("initiatives"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    await ctx.db.patch(args.voiceNoteId, {
      initiativeId: args.initiativeId,
    });
  },
});

// Export voice notes
export const exportVoiceNotes = action({
  args: {
    businessId: v.id("businesses"),
    format: v.union(v.literal("csv"), v.literal("json")),
  },
  handler: async (ctx, args): Promise<string> => {
    const notes: any = await ctx.runQuery(api.voiceNotes.listVoiceNotes, {
      businessId: args.businessId,
    });

    if (args.format === "csv") {
      const csvRows = [
        "Title,Transcription,Summary,Tags,Created At",
        ...notes.map(
          (note: any) =>
            `"${note.title}","${note.transcription}","${note.summary}","${note.tags.join(", ")}","${new Date(note.createdAt).toISOString()}"`
        ),
      ];
      return csvRows.join("\n");
    } else {
      return JSON.stringify(
        notes.map((note: any) => ({
          title: note.title,
          transcription: note.transcription,
          summary: note.summary,
          tags: note.tags,
          createdAt: new Date(note.createdAt).toISOString(),
        })),
        null,
        2
      );
    }
  },
});

// Delete voice note
export const deleteVoiceNote = mutation({
  args: { voiceNoteId: v.id("voiceNotes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    await ctx.db.delete(args.voiceNoteId);
  },
});

// Get voice note analytics
export const getVoiceNoteAnalytics = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const notes = await ctx.db
      .query("voiceNotes")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const totalNotes = notes.length;
    const totalDuration = notes.reduce((sum, note) => sum + (note.duration || 0), 0);
    const completedNotes = notes.filter((n) => n.status === "completed").length;
    const linkedToInitiatives = notes.filter((n) => n.initiativeId).length;

    const tagCounts: Record<string, number> = {};
    notes.forEach((note) => {
      (note.tags || []).forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return {
      totalNotes,
      totalDuration,
      completedNotes,
      linkedToInitiatives,
      topTags: Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count })),
    };
  },
});