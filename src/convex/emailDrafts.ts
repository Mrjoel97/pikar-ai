import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const saveDraft = mutation({
  args: {
    businessId: v.id("businesses"),
    recipientEmail: v.string(),
    subject: v.string(),
    body: v.string(),
    tone: v.optional(v.union(v.literal("concise"), v.literal("friendly"), v.literal("premium"))),
    metadata: v.optional(v.object({
      intent: v.optional(v.string()),
      aiGenerated: v.optional(v.boolean()),
    })),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    const now = Date.now();

    const draftId = await ctx.db.insert("emailDrafts", {
      businessId: args.businessId,
      createdBy: user._id,
      recipientEmail: args.recipientEmail,
      subject: args.subject,
      body: args.body,
      status: "draft",
      tone: args.tone,
      metadata: args.metadata,
      createdAt: now,
      updatedAt: now,
    });

    return draftId;
  },
});

export const updateDraft = mutation({
  args: {
    draftId: v.id("emailDrafts"),
    subject: v.optional(v.string()),
    body: v.optional(v.string()),
    tone: v.optional(v.union(v.literal("concise"), v.literal("friendly"), v.literal("premium"))),
    status: v.optional(v.union(v.literal("draft"), v.literal("sent"), v.literal("archived"))),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const draft = await ctx.db.get(args.draftId);
    if (!draft) throw new Error("Draft not found");

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.subject !== undefined) updates.subject = args.subject;
    if (args.body !== undefined) updates.body = args.body;
    if (args.tone !== undefined) updates.tone = args.tone;
    if (args.status !== undefined) updates.status = args.status;

    await ctx.db.patch(args.draftId, updates);

    return args.draftId;
  },
});

export const deleteDraft = mutation({
  args: {
    draftId: v.id("emailDrafts"),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const draft = await ctx.db.get(args.draftId);
    if (!draft) throw new Error("Draft not found");

    await ctx.db.delete(args.draftId);

    return { success: true };
  },
});

export const listDrafts = query({
  args: {
    businessId: v.id("businesses"),
    status: v.optional(v.union(v.literal("draft"), v.literal("sent"), v.literal("archived"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const limit = args.limit || 20;

    if (args.status !== undefined) {
      return await ctx.db
        .query("emailDrafts")
        .withIndex("by_business_and_status", (q: any) => 
          q.eq("businessId", args.businessId).eq("status", args.status!)
        )
        .order("desc")
        .take(limit);
    }

    return await ctx.db
      .query("emailDrafts")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId))
      .order("desc")
      .take(limit);
  },
});

export const getDraft = query({
  args: {
    draftId: v.id("emailDrafts"),
  },
  handler: async (ctx: any, args) => {
    return await ctx.db.get(args.draftId);
  },
});