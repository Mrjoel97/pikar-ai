import { v } from "convex/values";
import { query } from "../_generated/server";

export const getHandoffAnalytics = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const handoffs = await ctx.db
      .query("workflowHandoffs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const totalHandoffs = handoffs.length;
    const completedHandoffs = handoffs.filter(h => h.status === "completed").length;
    const pendingHandoffs = handoffs.filter(h => h.status === "pending").length;
    const avgDuration = handoffs
      .filter(h => h.completedAt && h.createdAt)
      .reduce((sum, h) => sum + (h.completedAt! - h.createdAt!), 0) / (completedHandoffs || 1);

    // Department-to-department flow
    const flowMap = new Map<string, Map<string, number>>();
    handoffs.forEach(h => {
      if (!flowMap.has(h.fromDepartment)) {
        flowMap.set(h.fromDepartment, new Map());
      }
      const toMap = flowMap.get(h.fromDepartment)!;
      toMap.set(h.toDepartment, (toMap.get(h.toDepartment) || 0) + 1);
    });

    const flows = Array.from(flowMap.entries()).flatMap(([from, toMap]) =>
      Array.from(toMap.entries()).map(([to, count]) => ({ from, to, count }))
    );

    return {
      totalHandoffs,
      completedHandoffs,
      pendingHandoffs,
      avgDuration,
      completionRate: totalHandoffs > 0 ? (completedHandoffs / totalHandoffs) * 100 : 0,
      flows,
    };
  },
});

export const getBottleneckAnalysis = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const handoffs = await ctx.db
      .query("workflowHandoffs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    // Calculate average duration per department pair
    const durationMap = new Map<string, { total: number; count: number }>();
    handoffs.forEach(h => {
      if (h.completedAt && h.createdAt) {
        const key = `${h.fromDepartment}->${h.toDepartment}`;
        const existing = durationMap.get(key) || { total: 0, count: 0 };
        existing.total += h.completedAt - h.createdAt;
        existing.count += 1;
        durationMap.set(key, existing);
      }
    });

    const bottlenecks = Array.from(durationMap.entries())
      .map(([key, { total, count }]) => {
        const [from, to] = key.split("->");
        return {
          from,
          to,
          avgDuration: total / count,
          count,
          severity: total / count > 86400000 ? "high" : total / count > 43200000 ? "medium" : "low",
        };
      })
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 10);

    return bottlenecks;
  },
});

export const getHandoffDuration = query({
  args: { 
    businessId: v.id("businesses"),
    fromDepartment: v.optional(v.string()),
    toDepartment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let handoffs = await ctx.db
      .query("workflowHandoffs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    if (args.fromDepartment) {
      handoffs = handoffs.filter(h => h.fromDepartment === args.fromDepartment);
    }
    if (args.toDepartment) {
      handoffs = handoffs.filter(h => h.toDepartment === args.toDepartment);
    }

    const durations = handoffs
      .filter(h => h.completedAt && h.createdAt)
      .map(h => ({
        duration: h.completedAt! - h.createdAt!,
        timestamp: h.createdAt!,
        from: h.fromDepartment,
        to: h.toDepartment,
      }));

    return durations;
  },
});

export const getOptimizationSuggestions = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const handoffs = await ctx.db
      .query("workflowHandoffs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const suggestions: Array<{
      type: string;
      priority: "high" | "medium" | "low";
      title: string;
      description: string;
      impact: string;
    }> = [];

    // Analyze for automation opportunities
    const repetitiveHandoffs = new Map<string, number>();
    handoffs.forEach(h => {
      const key = `${h.fromDepartment}->${h.toDepartment}`;
      repetitiveHandoffs.set(key, (repetitiveHandoffs.get(key) || 0) + 1);
    });

    repetitiveHandoffs.forEach((count, key) => {
      if (count > 10) {
        const [from, to] = key.split("->");
        suggestions.push({
          type: "automation",
          priority: "high",
          title: `Automate ${from} → ${to} handoffs`,
          description: `This handoff occurs ${count} times. Consider automating with workflow rules.`,
          impact: `Could save ~${Math.round(count * 0.5)} hours/month`,
        });
      }
    });

    // Analyze for bottlenecks
    const durationMap = new Map<string, { total: number; count: number }>();
    handoffs.forEach(h => {
      if (h.completedAt && h.createdAt) {
        const key = `${h.fromDepartment}->${h.toDepartment}`;
        const existing = durationMap.get(key) || { total: 0, count: 0 };
        existing.total += h.completedAt - h.createdAt;
        existing.count += 1;
        durationMap.set(key, existing);
      }
    });

    durationMap.forEach(({ total, count }, key) => {
      const avgDuration = total / count;
      if (avgDuration > 86400000) { // > 24 hours
        const [from, to] = key.split("->");
        suggestions.push({
          type: "bottleneck",
          priority: "high",
          title: `Reduce ${from} → ${to} handoff time`,
          description: `Average handoff takes ${Math.round(avgDuration / 3600000)} hours. Consider adding SLA alerts.`,
          impact: `Could reduce cycle time by 30-50%`,
        });
      }
    });

    // Analyze for parallelization
    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    workflows.forEach(w => {
      const pipeline = w.pipeline || [];
      const sequentialSteps = pipeline.filter((s: any) => s.type !== "parallel");
      if (sequentialSteps.length > 3) {
        suggestions.push({
          type: "parallelization",
          priority: "medium",
          title: `Parallelize workflow: ${w.name}`,
          description: `${sequentialSteps.length} sequential steps could be parallelized.`,
          impact: `Could reduce execution time by 40-60%`,
        });
      }
    });

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  },
});
