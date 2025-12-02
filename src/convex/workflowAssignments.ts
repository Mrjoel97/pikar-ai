import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// Query to get workflow steps assigned to a user
export const getAssignedSteps = query({
  args: { 
    userId: v.id("users"),
    businessId: v.optional(v.id("businesses")),
    status: v.optional(v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed"), v.literal("blocked"))),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    let query = ctx.db
      .query("workflowSteps")
      .withIndex("by_assignee", (q: any) => q.eq("assigneeId", args.userId));

    if (args.businessId) {
      query = query.filter((q: any) => q.eq(q.field("businessId"), args.businessId));
    }

    if (args.status) {
      query = query.filter((q: any) => q.eq(q.field("status"), args.status));
    }

    const steps = await query.collect();

    // Get workflow details for each step
  const stepsWithWorkflows = await Promise.all(
    steps.map(async (step: any) => {
      const workflow = await ctx.db.get(step.workflowId);
      return {
        ...step,
        workflow,
      };
    })
  );

  return stepsWithWorkflows;
  },
});

// Query to get steps due soon
export const getStepsDueSoon = query({
  args: { 
    userId: v.id("users"),
    hoursAhead: v.optional(v.number()),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const hoursAhead = args.hoursAhead || 24;
    const dueTime = Date.now() + (hoursAhead * 60 * 60 * 1000);

    const steps = await ctx.db
      .query("workflowSteps")
      .withIndex("by_assignee", (q: any) => q.eq("assigneeId", args.userId))
      .filter((q: any) => 
        q.and(
          q.neq(q.field("status"), "completed"),
          q.lte(q.field("dueDate"), dueTime),
          q.neq(q.field("dueDate"), undefined)
        )
      )
      .collect();

    // Get workflow details
    const stepsWithWorkflows = await Promise.all(
      steps.map(async (step: any) => {
        const workflow = await ctx.db.get(step.workflowId);
        return {
          ...step,
          workflow,
        };
      })
    );

    return stepsWithWorkflows;
  },
});

// Add internal mutation to send due reminders (before/due/overdue)
export const sendDueReminder = internalMutation({
  args: {
    stepId: v.id("workflowSteps"),
    when: v.union(v.literal("before"), v.literal("due"), v.literal("overdue")),
  },
  handler: async (ctx: any, args) => {
    const step = await ctx.db.get(args.stepId);
    if (!step) {
      return null;
    }

    // If completed, skip sending notifications
    if (step.status === "completed") {
      return null;
    }

    // Only send if there is an assignee
    if (!step.assigneeId) {
      return null;
    }

    // Build notification content
    const titles = {
      before: "Upcoming Due Task",
      due: "Task Due Now",
      overdue: "Task Overdue",
    } as const;

    const messages = {
      before: `“${step.name}” is due soon. Please review and complete on time.`,
      due: `“${step.name}” is now due. Please complete as soon as possible.`,
      overdue: `“${step.name}” is overdue. Take action or update the status.`,
    } as const;

    // Insert in-app notification to the assignee
    await ctx.db.insert("notifications", {
      businessId: step.businessId,
      userId: step.assigneeId,
      type: args.when === "overdue" ? "sla_warning" : "assignment",
      title: titles[args.when],
      message: messages[args.when],
      data: {
        stepId: step._id,
        workflowId: step.workflowId,
        when: args.when,
        dueDate: step.dueDate,
      },
      isRead: false,
      priority: args.when === "overdue" ? "high" : "medium",
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    // Optionally notify the assigner on overdue to increase visibility
    if (args.when === "overdue" && step.assignedBy) {
      await ctx.db.insert("notifications", {
        businessId: step.businessId,
        userId: step.assignedBy,
        type: "sla_warning",
        title: "Assigned Task Overdue",
        message: `“${step.name}” assigned to a teammate is overdue.`,
        data: {
          stepId: step._id,
          workflowId: step.workflowId,
          assigneeId: step.assigneeId,
          dueDate: step.dueDate,
        },
        isRead: false,
        priority: "high",
        createdAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });
    }

    return null;
  },
});

// Mutation to assign a step to a user
export const assignStep = mutation({
  args: {
    stepId: v.id("workflowSteps"),
    assigneeId: v.id("users"),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("email"), identity.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const step = await ctx.db.get(args.stepId);
    if (!step) {
      throw new Error("Workflow step not found");
    }

    // Update the step with assignment details
    await ctx.db.patch(args.stepId, {
      assigneeId: args.assigneeId,
      dueDate: args.dueDate,
      assignedAt: Date.now(),
      assignedBy: user._id,
      status: "pending",
    });

    // Send notification to assignee
    await ctx.db.insert("notifications", {
      businessId: step.businessId,
      userId: args.assigneeId,
      type: "assignment",
      title: "New Task Assignment",
      message: `You have been assigned a new task: ${step.name}`,
      data: {
        stepId: args.stepId,
        workflowId: step.workflowId,
        dueDate: args.dueDate,
      },
      isRead: false,
      priority: args.dueDate && args.dueDate < Date.now() + (24 * 60 * 60 * 1000) ? "high" : "medium",
      createdAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
    });

    // Schedule due date reminders if a dueDate is present
    if (args.dueDate) {
      const now = Date.now();
      const msUntilDue = args.dueDate - now;

      // Only schedule future reminders
      if (msUntilDue > 0) {
        // Try 24 hours before due; if it's already passed, fallback to 1 hour before if possible
        const twentyFourHours = 24 * 60 * 60 * 1000;
        const oneHour = 60 * 60 * 1000;
        const msUntil24hBefore = msUntilDue - twentyFourHours;

        if (msUntil24hBefore > 0) {
          await ctx.scheduler.runAfter(
            msUntil24hBefore,
            internal.workflowAssignments.sendDueReminder,
            { stepId: args.stepId, when: "before" }
          );
        } else if (msUntilDue - oneHour > 0) {
          // Fallback to 1 hour before if 24h window has passed
          await ctx.scheduler.runAfter(
            msUntilDue - oneHour,
            internal.workflowAssignments.sendDueReminder,
            { stepId: args.stepId, when: "before" }
          );
        }

        // At due time
        await ctx.scheduler.runAfter(
          msUntilDue,
          internal.workflowAssignments.sendDueReminder,
          { stepId: args.stepId, when: "due" }
        );

        // 1 hour after due (overdue)
        await ctx.scheduler.runAfter(
          msUntilDue + oneHour,
          internal.workflowAssignments.sendDueReminder,
          { stepId: args.stepId, when: "overdue" }
        );
      }
    }

    return args.stepId;
  },
});

// Mutation to update step status
export const updateStepStatus = mutation({
  args: {
    stepId: v.id("workflowSteps"),
    status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed"), v.literal("blocked")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("email"), identity.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const step = await ctx.db.get(args.stepId);
    if (!step) {
      throw new Error("Workflow step not found");
    }

    // Check if user is assigned to this step or has permission
    if (step.assigneeId !== user._id) {
      // TODO: Add permission check for managers/admins
      throw new Error("Not authorized to update this step");
    }

    const updateData: any = {
      status: args.status,
    };

    if (args.status === "completed") {
      updateData.completedAt = Date.now();
      updateData.completedBy = user._id;
    }

    if (args.notes) {
      updateData.notes = args.notes;
    }

    await ctx.db.patch(args.stepId, updateData);

    // Send notification for completion
    if (args.status === "completed" && step.assignedBy) {
      await ctx.db.insert("notifications", {
        businessId: step.businessId,
        userId: step.assignedBy,
        type: "workflow_completion",
        title: "Task Completed",
        message: `${step.name} has been completed by ${user.name || user.email}`,
        data: {
          stepId: args.stepId,
          workflowId: step.workflowId,
          completedBy: user._id,
        },
        isRead: false,
        priority: "medium",
        createdAt: Date.now(),
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
      });
    }

    return args.stepId;
  },
});

// Query to get workflow step details with assignment info
export const getStepDetails = query({
  args: { stepId: v.id("workflowSteps") },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const step = await ctx.db.get(args.stepId);
    if (!step) {
      return null;
    }

    // Get assignee details
    const assignee = step.assigneeId ? await ctx.db.get(step.assigneeId) : null;
    const assignedBy = step.assignedBy ? await ctx.db.get(step.assignedBy) : null;
    const completedBy = step.completedBy ? await ctx.db.get(step.completedBy) : null;
    const workflow = await ctx.db.get(step.workflowId);

    return {
      ...step,
      assignee: assignee ? {
        _id: assignee._id,
        name: assignee.name,
        email: assignee.email,
      } : null,
      assignedBy: assignedBy ? {
        _id: assignedBy._id,
        name: assignedBy.name,
        email: assignedBy.email,
      } : null,
      completedBy: completedBy ? {
        _id: completedBy._id,
        name: completedBy.name,
        email: completedBy.email,
      } : null,
      workflow,
    };
  },
});

// Query to get assignment analytics for a business
export const getAssignmentAnalytics = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const steps = await ctx.db
      .query("workflowSteps")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId))
      .collect();

    const totalSteps = steps.length;
    const assignedSteps = steps.filter((s: any) => s.assigneeId).length;
    const completedSteps = steps.filter((s: any) => s.status === "completed").length;
    const overdueTasks = steps.filter((s: any) => 
      s.dueDate && s.dueDate < Date.now() && s.status !== "completed"
    ).length;

    // Group by assignee
    const assigneeStats: Record<string, { assigned: number; completed: number; overdue: number }> = {};
    
    steps.forEach((step: any) => {
      if (step.assigneeId) {
        const assigneeId = step.assigneeId;
        if (!assigneeStats[assigneeId]) {
          assigneeStats[assigneeId] = { assigned: 0, completed: 0, overdue: 0 };
        }
        
        assigneeStats[assigneeId].assigned++;
        
        if (step.status === "completed") {
          assigneeStats[assigneeId].completed++;
        }
        
        if (step.dueDate && step.dueDate < Date.now() && step.status !== "completed") {
          assigneeStats[assigneeId].overdue++;
        }
      }
    });

    return {
      totalSteps,
      assignedSteps,
      completedSteps,
      overdueTasks,
      assignmentRate: totalSteps > 0 ? (assignedSteps / totalSteps) * 100 : 0,
      completionRate: assignedSteps > 0 ? (completedSteps / assignedSteps) * 100 : 0,
      assigneeStats,
    };
  },
});