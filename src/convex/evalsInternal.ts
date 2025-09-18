import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const getSet = internalQuery({
  args: { setId: v.id("evalSets") },
  handler: async (ctx, args) => {
    const set = await ctx.db.get(args.setId);
    if (!set) throw new Error("Eval set not found");
    return set;
  },
});

export const recordRun = internalMutation({
  args: {
    setId: v.id("evalSets"),
    startedAt: v.number(),
    finishedAt: v.number(),
    status: v.union(v.literal("completed"), v.literal("failed")),
    passCount: v.number(),
    failCount: v.number(),
    results: v.array(
      v.object({
        testIndex: v.number(),
        passed: v.boolean(),
        actualPreview: v.string(),
        error: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("evalRuns", {
      setId: args.setId,
      startedAt: args.startedAt,
      finishedAt: args.finishedAt,
      status: args.status,
      passCount: args.passCount,
      failCount: args.failCount,
      results: args.results,
    });
    return id;
  },
});
