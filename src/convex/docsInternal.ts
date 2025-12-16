import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Internal creator used by the public action to enqueue a docs proposal
export const createProposal = internalMutation({
  args: {
    title: v.string(),
    slug: v.string(),
    contentMarkdown: v.string(),
    source: v.string(),
    diffPreview: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const docId = await ctx.db.insert("docsPages", {
      businessId: args.businessId,
      title: args.title,
      slug: args.slug,
      contentMarkdown: args.contentMarkdown,
      isPublished: false,
      lastEditedBy: args.userId, // Assuming userId is passed or we should use identity
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return docId;
  },
});