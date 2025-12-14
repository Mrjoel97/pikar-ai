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
    const docId = await ctx.db.insert("docs", {
      businessId: args.businessId,
      title: args.title,
      slug: args.slug,
      contentMarkdown: args.contentMarkdown,
      // diffPreview: args.diffPreview, // Removed as it's not in schema
      status: "pending",
      createdAt: Date.now(),
      createdBy: args.userId,
    });
    return docId;
  },
});