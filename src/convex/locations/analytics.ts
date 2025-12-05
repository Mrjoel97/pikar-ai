import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get location-specific analytics
 */
export const getLocationAnalytics = query({
  args: {
    locationId: v.id("locations"),
    timeRange: v.optional(v.union(
      v.literal("7d"),
      v.literal("30d"),
      v.literal("90d")
    )),
  },
  handler: async (ctx, args) => {
    const location = await ctx.db.get(args.locationId);
    if (!location) throw new Error("Location not found");

    const timeRange = args.timeRange || "30d";
    const now = Date.now();
    const ranges: Record<string, number> = {
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
    };
    const startTime = now - ranges[timeRange];

    // Get workflows for this business (workflows don't have locationId in schema)
    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_business", (q) => q.eq("businessId", location.businessId))
      .filter((q) => q.gte(q.field("_creationTime"), startTime))
      .collect();

    const totalWorkflows = workflows.length;
    const completedWorkflows = workflows.filter((w: any) => w.status === "completed").length;
    const activeWorkflows = workflows.filter((w: any) => w.status === "active").length;

    // Get all users (users table doesn't have businessId index in schema)
    const allUsers = await ctx.db.query("users").collect();
    const employees = allUsers.filter((u: any) => u.businessId === location.businessId);

    return {
      location: {
        id: location._id,
        name: location.name,
        code: location.code,
        type: location.type,
      },
      workflows: {
        total: totalWorkflows,
        completed: completedWorkflows,
        active: activeWorkflows,
        completionRate: totalWorkflows > 0
          ? Math.round((completedWorkflows / totalWorkflows) * 100)
          : 0,
      },
      employees: {
        total: employees.length,
        active: employees.length, // users table doesn't have isActive field
      },
      timeRange,
    };
  },
});

/**
 * Compare analytics across locations
 */
export const compareLocations = query({
  args: {
    businessId: v.id("businesses"),
    locationIds: v.array(v.id("locations")),
    metric: v.union(
      v.literal("workflows"),
      v.literal("employees"),
      v.literal("compliance")
    ),
  },
  handler: async (ctx, args) => {
    const comparisons = [];

    for (const locationId of args.locationIds) {
      const location = await ctx.db.get(locationId);
      if (!location) continue;

      let value = 0;

      if (args.metric === "workflows") {
        const workflows = await ctx.db
          .query("workflows")
          .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
          .collect();
        value = workflows.length;
      } else if (args.metric === "employees") {
        const allUsers = await ctx.db.query("users").collect();
        const employees = allUsers.filter((u: any) => u.businessId === args.businessId);
        value = employees.length;
      } else if (args.metric === "compliance") {
        const workflows = await ctx.db
          .query("workflows")
          .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
          .collect();
        
        const compliant = workflows.filter(
          (w) => !w.governanceHealth || w.governanceHealth.score >= 80
        ).length;
        
        value = workflows.length > 0
          ? Math.round((compliant / workflows.length) * 100)
          : 100;
      }

      comparisons.push({
        locationId,
        locationName: location.name,
        locationCode: location.code,
        value,
      });
    }

    return comparisons.sort((a, b) => b.value - a.value);
  },
});

/**
 * Get location performance trends
 */
export const getLocationTrends = query({
  args: {
    locationId: v.id("locations"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const location = await ctx.db.get(args.locationId);
    if (!location) throw new Error("Location not found");

    const days = args.days || 30;
    const now = Date.now();
    const trends = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dayStart = date.setHours(0, 0, 0, 0);
      const dayEnd = date.setHours(23, 59, 59, 999);

      const workflows = await ctx.db
        .query("workflows")
        .withIndex("by_business", (q) => q.eq("businessId", location.businessId))
        .filter((q) =>
          q.and(
            q.gte(q.field("_creationTime"), dayStart),
            q.lte(q.field("_creationTime"), dayEnd)
          )
        )
        .collect();

      trends.push({
        date: date.toISOString().split("T")[0],
        workflowCount: workflows.length,
        completedCount: workflows.filter((w: any) => w.status === "completed").length,
      });
    }

    return trends;
  },
});