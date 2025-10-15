import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// Create a new team goal
export const createGoal = mutation({
  args: {
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.optional(v.string()),
    targetValue: v.number(),
    currentValue: v.optional(v.number()),
    unit: v.string(), // e.g., "revenue", "customers", "tasks", "%"
    deadline: v.optional(v.number()),
    assignedTo: v.optional(v.array(v.id("users"))),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("User not found");

    // Validate business membership
    const business = await ctx.db.get(args.businessId);
    if (!business) throw new Error("Business not found");
    
    const isMember = business.teamMembers.includes(user._id) || business.ownerId === user._id;
    if (!isMember) throw new Error("Not a team member");

    const goalId = await ctx.db.insert("teamGoals", {
      businessId: args.businessId,
      title: args.title,
      description: args.description,
      targetValue: args.targetValue,
      currentValue: args.currentValue || 0,
      unit: args.unit,
      deadline: args.deadline,
      assignedTo: args.assignedTo || [],
      category: args.category || "general",
      status: "active",
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Audit log
    await ctx.runMutation("audit:write" as any, {
      businessId: args.businessId,
      action: "goal_created",
      entityType: "team_goal",
      entityId: String(goalId),
      details: { title: args.title },
    });

    return goalId;
  },
});

// List goals for a business
export const listGoals = query({
  args: {
    businessId: v.id("businesses"),
    status: v.optional(v.union(v.literal("active"), v.literal("completed"), v.literal("archived"))),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();
    if (!user) return [];

    let goals = await ctx.db
      .query("teamGoals")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .collect();

    // Filter by status if provided
    if (args.status) {
      goals = goals.filter(g => g.status === args.status);
    }

    // Filter by category if provided
    if (args.category) {
      goals = goals.filter(g => g.category === args.category);
    }

    // Enrich with creator info and progress
    const enriched = await Promise.all(
      goals.map(async (goal) => {
        const creator = await ctx.db.get(goal.createdBy);
        const creatorName = creator && 'name' in creator && creator.name ? creator.name : "Unknown";
        
        const progress = goal.targetValue > 0 
          ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
          : 0;

        const isOverdue = goal.deadline && goal.deadline < Date.now() && goal.status !== "completed";

        return {
          ...goal,
          creatorName,
          progress,
          isOverdue: !!isOverdue,
        };
      })
    );

    return enriched;
  },
});

// Update goal progress
export const updateProgress = mutation({
  args: {
    goalId: v.id("teamGoals"),
    currentValue: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("User not found");

    const goal = await ctx.db.get(args.goalId);
    if (!goal) throw new Error("Goal not found");

    // Check if goal is completed
    const isCompleted = args.currentValue >= goal.targetValue;

    await ctx.db.patch(args.goalId, {
      currentValue: args.currentValue,
      status: isCompleted ? "completed" : goal.status,
      updatedAt: Date.now(),
    });

    // Add progress update to history
    await ctx.db.insert("goalUpdates", {
      goalId: args.goalId,
      businessId: goal.businessId,
      updatedBy: user._id,
      previousValue: goal.currentValue,
      newValue: args.currentValue,
      note: args.note,
      timestamp: Date.now(),
    });

    // Send milestone notification if goal is near completion or completed
    const progress = goal.targetValue > 0 ? (args.currentValue / goal.targetValue) * 100 : 0;
    
    if (isCompleted) {
      // Notify assigned users (or the creator if none assigned) about completion
      const recipients: Id<"users">[] =
        Array.isArray(goal.assignedTo) && goal.assignedTo.length > 0
          ? goal.assignedTo
          : [goal.createdBy];
      for (const userId of recipients) {
        await ctx.db.insert("notifications", {
          businessId: goal.businessId,
          userId,
          type: "workflow_completion",
          title: "🎉 Goal Completed!",
          message: `"${goal.title}" has been completed!`,
          data: { goalId: String(args.goalId) },
          isRead: false,
          priority: "high",
          createdAt: Date.now(),
        });
      }
    } else if (progress >= 75 && goal.currentValue < goal.targetValue) {
      // Notify about milestone (75% completion)
      const previousProgress = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;
      if (previousProgress < 75) {
        // Notify assigned users (or the creator if none assigned)
        const recipients: Id<"users">[] =
          Array.isArray(goal.assignedTo) && goal.assignedTo.length > 0
            ? goal.assignedTo
            : [goal.createdBy];
        for (const userId of recipients) {
          await ctx.db.insert("notifications", {
            businessId: goal.businessId,
            userId,
            type: "system_alert",
            title: "🎯 Goal Milestone Reached",
            message: `"${goal.title}" is now ${Math.round(progress)}% complete!`,
            data: { goalId: String(args.goalId) },
            isRead: false,
            priority: "medium",
            createdAt: Date.now(),
          });
        }
      }
    }

    // Audit log
    await ctx.runMutation("audit:write" as any, {
      businessId: goal.businessId,
      action: "goal_updated",
      entityType: "team_goal",
      entityId: String(args.goalId),
      details: { 
        currentValue: args.currentValue,
        isCompleted,
      },
    });

    return { success: true, isCompleted };
  },
});

// Update goal details
export const updateGoal = mutation({
  args: {
    goalId: v.id("teamGoals"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    targetValue: v.optional(v.number()),
    deadline: v.optional(v.number()),
    assignedTo: v.optional(v.array(v.id("users"))),
    category: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("completed"), v.literal("archived"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("User not found");

    const goal = await ctx.db.get(args.goalId);
    if (!goal) throw new Error("Goal not found");

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.targetValue !== undefined) updates.targetValue = args.targetValue;
    if (args.deadline !== undefined) updates.deadline = args.deadline;
    if (args.assignedTo !== undefined) updates.assignedTo = args.assignedTo;
    if (args.category !== undefined) updates.category = args.category;
    if (args.status !== undefined) updates.status = args.status;

    await ctx.db.patch(args.goalId, updates);

    return { success: true };
  },
});

// Delete a goal
export const deleteGoal = mutation({
  args: { goalId: v.id("teamGoals") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();
    if (!user) throw new Error("User not found");

    const goal = await ctx.db.get(args.goalId);
    if (!goal) throw new Error("Goal not found");

    // Only creator or business owner can delete
    const business = await ctx.db.get(goal.businessId);
    if (!business) throw new Error("Business not found");
    
    if (goal.createdBy !== user._id && business.ownerId !== user._id) {
      throw new Error("Not authorized to delete this goal");
    }

    await ctx.db.delete(args.goalId);

    return { success: true };
  },
});

// Get goal update history
export const getGoalHistory = query({
  args: { goalId: v.id("teamGoals") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const updates = await ctx.db
      .query("goalUpdates")
      .withIndex("by_goal", (q) => q.eq("goalId", args.goalId))
      .order("desc")
      .take(50);

    // Enrich with user info
    const enriched = await Promise.all(
      updates.map(async (update) => {
        const user = await ctx.db.get(update.updatedBy);
        const userName = user && 'name' in user && user.name ? user.name : "Unknown";
        return {
          ...update,
          userName,
        };
      })
    );

    return enriched;
  },
});

// Get goals summary/stats
export const getGoalsSummary = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const goals = await ctx.db
      .query("teamGoals")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const active = goals.filter(g => g.status === "active");
    const completed = goals.filter(g => g.status === "completed");
    const overdue = active.filter(g => g.deadline && g.deadline < Date.now());

    const totalProgress = active.length > 0
      ? active.reduce((sum, g) => {
          const progress = g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0;
          return sum + Math.min(100, progress);
        }, 0) / active.length
      : 0;

    return {
      total: goals.length,
      active: active.length,
      completed: completed.length,
      overdue: overdue.length,
      averageProgress: Math.round(totalProgress),
    };
  },
});

// Add: Get team member contributions for goals
export const getTeamContributions = query({
  args: { 
    businessId: v.id("businesses"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const days = args.days || 30;
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);

    // Get all goal updates in the time period
    const updates = await ctx.db
      .query("goalUpdates")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("timestamp"), cutoff))
      .collect();

    // Group by user
    const contributionMap = new Map<string, {
      userId: string;
      userName: string;
      updateCount: number;
      totalProgress: number;
      goalsContributed: Set<string>;
    }>();

    for (const update of updates) {
      const user = await ctx.db.get(update.updatedBy);
      const userName = user && 'name' in user && user.name ? user.name : "Unknown";
      const userId = String(update.updatedBy);

      if (!contributionMap.has(userId)) {
        contributionMap.set(userId, {
          userId,
          userName,
          updateCount: 0,
          totalProgress: 0,
          goalsContributed: new Set(),
        });
      }

      const contrib = contributionMap.get(userId)!;
      contrib.updateCount++;
      contrib.totalProgress += (update.newValue - update.previousValue);
      contrib.goalsContributed.add(String(update.goalId));
    }

    // Convert to array
    return Array.from(contributionMap.values()).map(c => ({
      userId: c.userId,
      userName: c.userName,
      updateCount: c.updateCount,
      totalProgress: Math.round(c.totalProgress),
      goalsContributed: c.goalsContributed.size,
    })).sort((a, b) => b.updateCount - a.updateCount);
  },
});

// Add: Get goals dashboard summary with milestones
export const getDashboardSummary = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const goals = await ctx.db
      .query("teamGoals")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const active = goals.filter(g => g.status === "active");
    const completed = goals.filter(g => g.status === "completed");
    const overdue = active.filter(g => g.deadline && g.deadline < Date.now());

    // Calculate milestones (goals near completion)
    const nearCompletion = active.filter(g => {
      const progress = g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0;
      return progress >= 75 && progress < 100;
    });

    // Recent completions (last 7 days)
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentCompletions = completed.filter(g => g.updatedAt >= weekAgo);

    return {
      total: goals.length,
      active: active.length,
      completed: completed.length,
      overdue: overdue.length,
      nearCompletion: nearCompletion.length,
      recentCompletions: recentCompletions.length,
      topGoals: active.slice(0, 3).map(g => ({
        _id: g._id,
        title: g.title,
        progress: g.targetValue > 0 ? Math.min(100, Math.round((g.currentValue / g.targetValue) * 100)) : 0,
        deadline: g.deadline,
      })),
    };
  },
});