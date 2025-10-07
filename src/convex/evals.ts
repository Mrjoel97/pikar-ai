import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

const evalTestValidator = v.object({
  tool: v.string(), // "health" | "flags" | "alerts"
  input: v.optional(v.string()),
  expectedContains: v.optional(v.string()),
});

export const createSet = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    tests: v.array(evalTestValidator),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const createdBy = identity?.tokenIdentifier
      ? undefined
      : undefined; // We keep createdBy optional to be guest-safe

    const id = await ctx.db.insert("evalSets", {
      name: args.name,
      description: args.description,
      createdAt: Date.now(),
      createdBy,
      tests: args.tests,
    });
    return { setId: id };
  },
});

export const listSets = query({
  args: {},
  handler: async (ctx) => {
    const sets = await ctx.db.query("evalSets").order("desc").take(100);
    return sets;
  },
});

export const listRunsBySet = query({
  args: { setId: v.optional(v.id("evalSets")) },
  handler: async (ctx, args) => {
    // No set selected yet — return an empty list safely
    if (!args.setId) {
      return [];
    }
    // Fetch runs for the selected setId using the existing index
    const rows = await ctx.db
      .query("evalRuns")
      .withIndex("by_set", (q) => q.eq("setId", args.setId as any))
      .order("desc")
      .take(50);
    return rows;
  },
});

export const runSet: any = action({
  args: { setId: v.id("evalSets") },
  handler: async (ctx, args): Promise<{ runId: any; passCount: number; failCount: number; total: number }> => {
    const startedAt = Date.now();
    const set: any = await ctx.runQuery("evalsInternal:getSet" as any, { setId: args.setId });

    const results: Array<{
      testIndex: number;
      passed: boolean;
      actualPreview: string;
      error?: string;
    }> = [];

    let passCount = 0;
    let failCount = 0;

    for (let i = 0; i < set.tests.length; i++) {
      const t = set.tests[i];
      try {
        let data: any = null;

        // Execute read-only tools (queries) — sandboxed by nature
        if (t.tool === "health") {
          const { api } = await import("./_generated/api");
          data = await ctx.runQuery((api as any).health.envStatus, {});
        } else if (t.tool === "flags") {
          const { api } = await import("./_generated/api");
          data = await ctx.runQuery((api as any).featureFlags.getFeatureFlags, {});
        } else if (t.tool === "alerts") {
          const { api } = await import("./_generated/api");
          data = await ctx.runQuery((api as any).admin.listAlerts, {});
        } else if (t.tool === "retrieval") {
          // New retrieval tool for vector search testing
          const { api } = await import("./_generated/api");
          data = await ctx.runQuery((api as any).vectors.retrieve, {
            query: t.input || "test query",
            topK: 3,
          });
        } else if (t.tool === "kgraph") {
          // New knowledge graph tool for testing
          const { api } = await import("./_generated/api");
          data = await ctx.runQuery((api as any).kgraph.neighborhood, {
            type: "dataset",
            key: t.input || "test",
            depth: 1,
            limit: 5,
          });
        } else {
          throw new Error(`Unknown tool: ${t.tool}`);
        }

        const text = JSON.stringify(data);
        const expect = (t.expectedContains ?? "").trim();
        const passed = expect ? text.includes(expect) : true;

        if (passed) passCount++;
        else failCount++;

        results.push({
          testIndex: i,
          passed,
          actualPreview: text.slice(0, 500),
        });
      } catch (e: any) {
        failCount++;
        results.push({
          testIndex: i,
          passed: false,
          actualPreview: "",
          error: e?.message || "Tool execution failed",
        });
      }
    }

    const finishedAt = Date.now();
    const status = "completed" as const;

    const runId: any = await ctx.runMutation("evalsInternal:recordRun" as any, {
      setId: args.setId,
      startedAt,
      finishedAt,
      status,
      passCount,
      failCount,
      results,
    });

    return { runId, passCount, failCount, total: set.tests.length };
  },
});

export const latestSummary = query({
  args: {},
  handler: async (ctx) => {
    const sets = await ctx.db.query("evalSets").order("desc").take(100);
    const summaries: any[] = [];
    let allPassing = true;

    for (const s of sets) {
      const last = await ctx.db
        .query("evalRuns")
        .withIndex("by_set", (q) => q.eq("setId", s._id))
        .order("desc")
        .take(1);

      const run = last[0];
      const passing =
        !!run &&
        run.status === "completed" &&
        run.failCount === 0 &&
        run.passCount === (s.tests?.length || 0);

      if (sets.length > 0 && !passing) allPassing = false;

      summaries.push({
        setId: s._id,
        name: s.name,
        totalTests: s.tests?.length || 0,
        lastRun: run
          ? {
              runId: run._id,
              passCount: run.passCount,
              failCount: run.failCount,
              finishedAt: run.finishedAt,
              status: run.status,
            }
          : undefined,
        passing,
      });
    }

    const gateRequired = sets.length > 0;
    return { sets: summaries, gateRequired, allPassing };
  },
});