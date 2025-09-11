import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// List top "Today’s Focus" tasks using simple SNAP-like priority
export const listTopFocus = query({
  args: { businessId: v.id("businesses"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    // Simple priority sort: urgent desc, priority high->low, dueDate asc, createdAt asc
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    tasks.sort((a, b) => {
      if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
      const pA = priorityOrder[a.priority] ?? 2;
      const pB = priorityOrder[b.priority] ?? 2;
      if (pA !== pB) return pA - pB;
      if ((a.dueDate ?? Infinity) !== (b.dueDate ?? Infinity)) {
        return (a.dueDate ?? Infinity) - (b.dueDate ?? Infinity);
      }
      return a.createdAt - b.createdAt;
    });

    const top = tasks.filter((t) => t.status !== "done").slice(0, args.limit ?? 3);
    return top;
  },
});

export const create = mutation({
  args: {
    businessId: v.id("businesses"),
    initiativeId: v.optional(v.id("initiatives")),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    urgent: v.optional(v.boolean()),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tasks", {
      businessId: args.businessId,
      initiativeId: args.initiativeId,
      title: args.title,
      description: args.description,
      priority: args.priority,
      urgent: args.urgent ?? false,
      status: "todo",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      dueDate: args.dueDate,
    });
  },
});

export const updateStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(v.literal("todo"), v.literal("in_progress"), v.literal("blocked"), v.literal("done")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, { status: args.status, updatedAt: Date.now() });
    return args.taskId;
  },
});

export const update = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    urgent: v.optional(v.boolean()),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { taskId, ...rest } = args;
    await ctx.db.patch(taskId, { ...rest, updatedAt: Date.now() });
    return taskId;
  },
});
