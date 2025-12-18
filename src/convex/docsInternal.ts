import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Internal creator used by the public action to enqueue a docs proposal
export const createProposal = internalMutation({
  args: {
    businessId: v.id("businesses"),
    userId: v.id("users"),
    title: v.string(),
    slug: v.string(),
    contentMarkdown: v.string(),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const docId = await ctx.db.insert("docs", {
      businessId: args.businessId,
      title: args.title,
      slug: args.slug,
      contentMarkdown: args.contentMarkdown,
      status: "pending",
      createdAt: Date.now(),
      createdBy: args.userId,
    });
    return docId;
  },
});