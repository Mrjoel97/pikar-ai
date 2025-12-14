import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// List top "Today's Focus" tasks using simple SNAP-like priority
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

    const top = tasks.filter((t) => t.status !== "completed").slice(0, args.limit ?? 3);
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
    await ctx.db.patch(args.taskId, { status: args.status as any, updatedAt: Date.now() });
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

export const seedDemoTasksForBusiness = mutation({
  args: {
    businessId: v.id("businesses"),
    count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const toCreate = args.count ?? 3;

    const presets = [
      {
        title: "Define ICP and top 3 pains",
        description: "Draft a sharp ICP and validate pains with 3 customer calls.",
        priority: "high" as const,
        urgent: true,
        dueDate: now + 24 * 60 * 60 * 1000,
      },
      {
        title: "Publish one value post",
        description: "Share a practical tip on LinkedIn and collect 3 comments.",
        priority: "medium" as const,
        urgent: false,
        dueDate: now + 2 * 24 * 60 * 60 * 1000,
      },
      {
        title: "Schedule 2 demo calls",
        description: "Book two 20-minute discovery calls with warm leads.",
        priority: "low" as const,
        urgent: false,
        dueDate: now + 3 * 24 * 60 * 60 * 1000,
      },
    ];

    const selected = presets.slice(0, toCreate);
    for (const p of selected) {
      await ctx.db.insert("tasks", {
        businessId: args.businessId,
        initiativeId: undefined,
        title: p.title,
        description: p.description,
        priority: p.priority,
        urgent: p.urgent,
        status: "todo",
        createdAt: now,
        updatedAt: now,
        dueDate: p.dueDate,
      } as any);
    }

    return selected.length;
  },
});

// Add: Top 3 tasks (SNAP-like) per business: urgent/high first, then updatedAt desc
export const topThreeForBusiness = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    // Fetch by business via index and manually prioritize
    const rows: Array<any> = [];
    for await (const row of ctx.db
      .query("tasks")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))) {
      rows.push(row);
      if (rows.length > 100) break; // cap scan for perf in dev
    }

    const priorityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
    rows.sort((a, b) => {
      // Urgent first
      if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
      // Priority next
      const pr = (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9);
      if (pr !== 0) return pr;
      // Newer updatedAt first
      return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
    });

    return rows.slice(0, 3);
  },
});