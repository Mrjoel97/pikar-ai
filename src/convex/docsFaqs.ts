import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("docsFaqs")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .collect();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("docsFaqs").order("desc").collect();
  },
});

export const upsert = mutation({
  args: {
    id: v.optional(v.id("docsFaqs")),
    question: v.string(),
    answer: v.string(),
    category: v.string(),
    order: v.number(),
    isPublished: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (args.id) {
      await ctx.db.patch(args.id, {
        question: args.question,
        answer: args.answer,
        category: args.category,
        order: args.order,
        isPublished: args.isPublished,
        updatedAt: Date.now(),
      });
      return args.id;
    } else {
      return await ctx.db.insert("docsFaqs", {
        question: args.question,
        answer: args.answer,
        category: args.category,
        order: args.order,
        isPublished: args.isPublished,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

export const remove = mutation({
  args: { id: v.id("docsFaqs") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});