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
    const id = await ctx.db.insert("docsProposals", {
      title: args.title,
      slug: args.slug,
      contentMarkdown: args.contentMarkdown,
      diffPreview: args.diffPreview,
      source: args.source,
      status: "pending",
      createdAt: Date.now(),
    });
    return id;
  },
});