import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get team capacity metrics
 */
export const getTeamCapacity = query({
  args: {
    businessId: v.id("businesses"),
    sprintDuration: v.optional(v.number()), // days
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const sprintDuration = args.sprintDuration || 14;

    // Get team members
    const business = await ctx.db.get(args.businessId);
    if (!business) return null;

    const teamMembers = business.teamMembers || [];
    const totalMembers = teamMembers.length + 1; // +1 for owner

    // Get active goals
    const activeGoals = await ctx.db
      .query("teamGoals")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(100);

    // Calculate workload
    const totalWork = activeGoals.reduce((sum, g) => sum + (g.targetValue - g.currentValue), 0);
    const workPerMember = totalMembers > 0 ? totalWork / totalMembers : 0;

    // Get recent velocity
    const now = Date.now();
    const sprintStart = now - sprintDuration * 24 * 60 * 60 * 1000;

    const recentUpdates = await ctx.db
      .query("goalUpdates")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("timestamp"), sprintStart))
      .take(200);

    const completedWork = recentUpdates.reduce(
      (sum, u) => sum + (u.newValue - u.previousValue),
      0
    );

    const capacityUtilization = completedWork > 0 ? (completedWork / totalWork) * 100 : 0;

    return {
      totalMembers,
      activeGoals: activeGoals.length,
      totalWork,
      workPerMember: Math.round(workPerMember),
      completedWork,
      remainingWork: totalWork - completedWork,
      capacityUtilization: Math.min(100, Math.round(capacityUtilization)),
      estimatedCapacity: Math.round(completedWork * (30 / sprintDuration)), // Monthly projection
    };
  },
});

/**
 * Get resource allocation by team member
 */
export const getResourceAllocation = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Get all active goals with assignments
    const activeGoals = await ctx.db
      .query("teamGoals")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(100);

    // Map workload by user
    const allocationMap = new Map<string, {
      userId: string;
      userName: string;
      assignedGoals: number;
      totalWork: number;
      completedWork: number;
      utilizationRate: number;
    }>();

    for (const goal of activeGoals) {
      const assignedUsers = goal.assignedTo || [];
      const workPerUser = assignedUsers.length > 0 
        ? (goal.targetValue - goal.currentValue) / assignedUsers.length 
        : 0;

      for (const userId of assignedUsers) {
        const user = await ctx.db.get(userId);
        const userName = user && 'name' in user && user.name ? user.name : "Unknown";

        if (!allocationMap.has(String(userId))) {
          allocationMap.set(String(userId), {
            userId: String(userId),
            userName,
            assignedGoals: 0,
            totalWork: 0,
            completedWork: 0,
            utilizationRate: 0,
          });
        }

        const allocation = allocationMap.get(String(userId))!;
        allocation.assignedGoals++;
        allocation.totalWork += workPerUser;
        allocation.completedWork += goal.currentValue / assignedUsers.length;
      }
    }

    // Calculate utilization rates
    const allocations = Array.from(allocationMap.values()).map((a: {
      userId: string;
      userName: string;
      assignedGoals: number;
      totalWork: number;
      completedWork: number;
      utilizationRate: number;
    }) => ({
      ...a,
      utilizationRate: a.totalWork > 0 ? Math.round((a.completedWork / a.totalWork) * 100) : 0,
    }));

    type AllocationItem = {
      userId: string;
      userName: string;
      assignedGoals: number;
      totalWork: number;
      completedWork: number;
      utilizationRate: number;
    };
    
    return allocations.sort((a: AllocationItem, b: AllocationItem) => b.totalWork - a.totalWork);
  },
});

/**
 * AI-powered reallocation suggestions
 */
export const suggestReallocation = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const allocations = await ctx.runQuery("analytics.capacity:getResourceAllocation" as any, {
      businessId: args.businessId,
    });

    if (!allocations || allocations.length === 0) return [];

    const suggestions = [];

    // Calculate confidence based on velocity consistency
    const avgUtilization = allocations.reduce((sum: number, a: { utilizationRate: number }) => sum + a.utilizationRate, 0) / allocations.length;
    const overloaded = allocations.filter((a: { utilizationRate: number; userName: string }) => a.utilizationRate > avgUtilization + 20);
    const underutilized = allocations.filter((a: { utilizationRate: number; userName: string }) => a.utilizationRate < avgUtilization - 20);

    // Generate suggestions
    for (const over of overloaded) {
      for (const under of underutilized) {
        suggestions.push({
          type: "rebalance",
          priority: "high",
          from: over.userName,
          to: under.userName,
          reason: `${over.userName} is overloaded (${over.utilizationRate}% utilization) while ${under.userName} has capacity (${under.utilizationRate}% utilization)`,
          recommendation: `Consider reassigning 1-2 goals from ${over.userName} to ${under.userName}`,
          impact: "Improved team balance and reduced burnout risk",
        });
      }
    }

    // Suggest hiring if everyone is overloaded
    if (allocations.every((a) => a.utilizationRate > 80)) {
      suggestions.push({
        type: "hiring",
        priority: "critical",
        reason: "All team members are at or near capacity",
        recommendation: "Consider hiring additional team members or contractors",
        impact: "Increased capacity and faster goal completion",
      });
    }

    return suggestions.slice(0, 5);
  },
});