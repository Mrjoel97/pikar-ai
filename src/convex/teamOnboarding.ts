import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Role-based task templates
const ROLE_TASK_TEMPLATES: Record<string, Array<{ title: string; description: string; priority: "low" | "medium" | "high"; dueInDays: number }>> = {
  developer: [
    { title: "Set up development environment", description: "Install required tools and access repositories", priority: "high", dueInDays: 1 },
    { title: "Complete security training", description: "Review security policies and best practices", priority: "high", dueInDays: 2 },
    { title: "Review codebase architecture", description: "Understand system design and patterns", priority: "medium", dueInDays: 3 },
    { title: "Complete first code review", description: "Participate in team code review process", priority: "medium", dueInDays: 5 },
  ],
  designer: [
    { title: "Access design tools", description: "Set up Figma, Adobe Creative Suite, etc.", priority: "high", dueInDays: 1 },
    { title: "Review brand guidelines", description: "Study company brand identity and standards", priority: "high", dueInDays: 2 },
    { title: "Meet with design team", description: "Introduction to design processes and workflows", priority: "medium", dueInDays: 3 },
    { title: "Complete first design task", description: "Work on assigned design project", priority: "medium", dueInDays: 7 },
  ],
  marketing: [
    { title: "Access marketing platforms", description: "Set up accounts for social media, analytics, etc.", priority: "high", dueInDays: 1 },
    { title: "Review marketing strategy", description: "Understand current campaigns and goals", priority: "high", dueInDays: 2 },
    { title: "Meet key stakeholders", description: "Connect with sales, product, and content teams", priority: "medium", dueInDays: 3 },
    { title: "Create first campaign", description: "Launch your first marketing initiative", priority: "medium", dueInDays: 7 },
  ],
  sales: [
    { title: "CRM system training", description: "Learn to use Salesforce/HubSpot", priority: "high", dueInDays: 1 },
    { title: "Product knowledge training", description: "Deep dive into product features and benefits", priority: "high", dueInDays: 2 },
    { title: "Shadow senior sales rep", description: "Observe sales calls and demos", priority: "medium", dueInDays: 3 },
    { title: "Complete first demo", description: "Deliver product demo to prospect", priority: "medium", dueInDays: 10 },
  ],
  manager: [
    { title: "HR systems access", description: "Set up access to HRIS, payroll, performance tools", priority: "high", dueInDays: 1 },
    { title: "Leadership training", description: "Complete management fundamentals course", priority: "high", dueInDays: 3 },
    { title: "Team introductions", description: "Meet with all direct reports individually", priority: "high", dueInDays: 5 },
    { title: "Set team goals", description: "Establish quarterly objectives with team", priority: "medium", dueInDays: 14 },
  ],
};

// Create onboarding session with automated task assignment
export const createOnboardingSession = mutation({
  args: {
    businessId: v.id("businesses"),
    userId: v.id("users"),
    role: v.string(),
    department: v.optional(v.string()),
    startDate: v.number(),
    hrSystemId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // TODO: Add teamOnboarding table to schema
    const sessionId = args.userId; // Temporary workaround
    /*
    const sessionId = await ctx.db.insert("teamOnboarding", {
      businessId: args.businessId,
      userId: args.userId,
      role: args.role,
      department: args.department,
      startDate: args.startDate,
      currentStep: 0,
      completedSteps: [],
      progress: 0,
      status: "in_progress",
      hrSystemId: args.hrSystemId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    */

    // Automatically create role-based tasks
    await ctx.scheduler.runAfter(0, internal.teamOnboarding.createRoleBasedTasks, {
      sessionId,
      businessId: args.businessId,
      userId: args.userId,
      role: args.role,
    });

    // Send welcome notification
    await ctx.scheduler.runAfter(0, internal.notifications.sendNotification, {
      businessId: args.businessId,
      userId: args.userId,
      type: "system_alert",
      title: "Welcome to the team!",
      message: `Your onboarding journey has begun. Complete your tasks to get started.`,
      priority: "high",
    });

    return sessionId;
  },
});

// Internal mutation to create role-based tasks
export const createRoleBasedTasks = internalMutation({
  args: {
    sessionId: v.id("teamOnboarding"),
    businessId: v.id("businesses"),
    userId: v.id("users"),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const templates = ROLE_TASK_TEMPLATES[args.role.toLowerCase()] || ROLE_TASK_TEMPLATES.developer;
    const now = Date.now();

    for (const template of templates) {
      const dueDate = now + (template.dueInDays * 24 * 60 * 60 * 1000);
      
      await ctx.db.insert("tasks", {
        businessId: args.businessId,
        title: template.title,
        description: template.description,
        priority: template.priority,
        urgent: template.priority === "high",
        status: "todo",
        dueDate,
        createdAt: now,
        updatedAt: now,
        metadata: {
          onboardingSessionId: args.sessionId,
          assignedTo: args.userId,
        },
      });
    }

    return templates.length;
  },
});

// Update onboarding progress with notifications
export const updateOnboardingProgress = mutation({
  args: {
    sessionId: v.id("teamOnboarding"),
    stepCompleted: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Onboarding session not found");

    const completedSteps = [...session.completedSteps, args.stepCompleted];
    const totalSteps = 8; // Standard onboarding steps
    const progress = Math.round((completedSteps.length / totalSteps) * 100);
    const status = progress === 100 ? "completed" : "in_progress";

    await ctx.db.patch(args.sessionId, {
      completedSteps,
      currentStep: args.stepCompleted + 1,
      progress,
      status,
      updatedAt: Date.now(),
    });

    // Send progress notification
    await ctx.scheduler.runAfter(0, internal.notifications.sendNotification, {
      businessId: session.businessId,
      userId: session.userId,
      type: "workflow_completion",
      title: "Onboarding Progress Update",
      message: `You've completed step ${args.stepCompleted + 1}. You're ${progress}% done!`,
      priority: "medium",
    });

    // If completed, trigger completion workflow
    if (status === "completed") {
      await ctx.scheduler.runAfter(0, internal.teamOnboarding.handleOnboardingCompletion, {
        sessionId: args.sessionId,
        businessId: session.businessId,
        userId: session.userId,
      });
    }

    return { progress, status };
  },
});

// Handle onboarding completion
export const handleOnboardingCompletion = internalMutation({
  args: {
    sessionId: v.id("teamOnboarding"),
    businessId: v.id("businesses"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      completedAt: Date.now(),
      status: "completed",
    });

    // Send completion notification
    await ctx.scheduler.runAfter(0, internal.notifications.sendNotification, {
      businessId: args.businessId,
      userId: args.userId,
      type: "workflow_completion",
      title: "🎉 Onboarding Complete!",
      message: "Congratulations! You've completed your onboarding. Your certificate is ready.",
      priority: "high",
    });

    // Notify manager/HR
    const user = await ctx.db.get(args.userId);
    if (user?.managerId) {
      await ctx.scheduler.runAfter(0, internal.notifications.sendNotification, {
        businessId: args.businessId,
        userId: user.managerId,
        type: "system_alert",
        title: "Team Member Onboarding Complete",
        message: `${user.name || user.email} has completed their onboarding.`,
        priority: "medium",
      });
    }

    return true;
  },
});

// Get onboarding analytics
export const getOnboardingAnalytics = query({
  args: {
    businessId: v.id("businesses"),
    timeRange: v.optional(v.union(v.literal("7d"), v.literal("30d"), v.literal("90d"))),
  },
  handler: async (ctx, args) => {
    // TODO: Add teamOnboarding table to schema
    const sessions: any[] = [];
    /*
    const sessions = await ctx.db
      .query("teamOnboarding")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
    */

    const now = Date.now();
    const timeRangeMs = args.timeRange === "7d" ? 7 * 24 * 60 * 60 * 1000 :
                        args.timeRange === "30d" ? 30 * 24 * 60 * 60 * 1000 :
                        90 * 24 * 60 * 60 * 1000;
    
    const recentSessions = sessions.filter(s => s.createdAt > now - timeRangeMs);

    const totalSessions = recentSessions.length;
    const completedSessions = recentSessions.filter(s => s.status === "completed").length;
    const inProgressSessions = recentSessions.filter(s => s.status === "in_progress").length;
    const averageProgress = recentSessions.reduce((sum, s) => sum + s.progress, 0) / (totalSessions || 1);
    
    // Calculate average completion time
    const completedWithTime = recentSessions.filter(s => s.completedAt);
    const averageCompletionDays = completedWithTime.length > 0
      ? completedWithTime.reduce((sum, s) => sum + ((s.completedAt! - s.createdAt) / (24 * 60 * 60 * 1000)), 0) / completedWithTime.length
      : 0;

    // Role breakdown
    const roleBreakdown = recentSessions.reduce((acc: Record<string, number>, s) => {
      acc[s.role] = (acc[s.role] || 0) + 1;
      return acc;
    }, {});

    return {
      totalSessions: 0,
      completedSessions: 0,
      inProgressSessions: 0,
      completionRate: 0,
      averageProgress: 0,
      averageCompletionDays: 0,
      roleBreakdown: {},
      recentSessions: [],
    };
  },
});

// Get user's onboarding session
export const getUserOnboardingSession = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("teamOnboarding")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .first();

    if (!session) return null;

    // Get associated tasks
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_business", (q) => q.eq("businessId", session.businessId))
      .collect();

    const onboardingTasks = tasks.filter(t => 
      t.metadata?.onboardingSessionId === session._id
    );

    return {
      ...session,
      tasks: onboardingTasks,
    };
  },
});

// Sync with HR system
export const syncWithHRSystem = mutation({
  args: {
    sessionId: v.id("teamOnboarding"),
    hrData: v.any(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    await ctx.db.patch(args.sessionId, {
      hrSystemData: args.hrData,
      lastHRSync: Date.now(),
      updatedAt: Date.now(),
    });

    return true;
  },
});

// Get team onboarding dashboard
export const getTeamOnboardingDashboard = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("teamOnboarding")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .take(50);

    const activeCount = sessions.filter(s => s.status === "in_progress").length;
    const completedCount = sessions.filter(s => s.status === "completed").length;
    const avgProgress = sessions.reduce((sum, s) => sum + s.progress, 0) / (sessions.length || 1);

    return {
      sessions,
      stats: {
        active: activeCount,
        completed: completedCount,
        total: sessions.length,
        averageProgress: Math.round(avgProgress),
      },
    };
  },
});

// Get user's onboarding checklist
export const getUserOnboarding = query({
  args: {
    userId: v.id("users"),
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("onboardingChecklists")
      .withIndex("by_user_and_business", (q) =>
        q.eq("userId", args.userId).eq("businessId", args.businessId)
      )
      .first();
  },
});

// Get user's role and permissions
export const getUserPermissions = query({
  args: {
    userId: v.id("users"),
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("userRoles")
      .withIndex("by_user_and_business", (q) =>
        q.eq("userId", args.userId).eq("businessId", args.businessId)
      )
      .first();
  },
});

// Get onboarding template for a role
export const getOnboardingTemplate = query({
  args: {
    role: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("onboardingTemplates")
      .withIndex("by_role", (q) => q.eq("role", args.role))
      .first();
  },
});

// List all team members' onboarding status
export const listTeamOnboarding = query({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    // Return empty array if no businessId provided
    if (!args.businessId) return [];

    // Check if the table exists by trying to query it
    try {
      return await ctx.db
        .query("onboardingChecklists")
        .withIndex("by_business", (q) => q.eq("businessId", args.businessId!))
        .collect();
    } catch (error) {
      console.error("Error querying onboardingChecklists:", error);
      return [];
    }
  },
});

// Complete an onboarding step
export const completeOnboardingStep = mutation({
  args: {
    userId: v.id("users"),
    businessId: v.id("businesses"),
    stepId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const checklist = await ctx.db
      .query("onboardingChecklists")
      .withIndex("by_user_and_business", (q) =>
        q.eq("userId", args.userId).eq("businessId", args.businessId)
      )
      .first();

    if (!checklist) throw new Error("Onboarding checklist not found");

    const updatedSteps = checklist.steps.map((step: any) =>
      step.id === args.stepId
        ? { ...step, completed: true, completedAt: Date.now() }
        : step
    );

    const completedCount = updatedSteps.filter((s: any) => s.completed).length;
    const allCompleted = completedCount === updatedSteps.length;

    await ctx.db.patch(checklist._id, {
      steps: updatedSteps,
      currentStepIndex: Math.min(
        checklist.currentStepIndex + 1,
        updatedSteps.length - 1
      ),
      completedAt: allCompleted ? Date.now() : undefined,
    });

    // Audit log
    await ctx.runMutation(internal.audit.write, {
      businessId: args.businessId,
      action: "onboarding.step_completed",
      entityType: "onboarding",
      entityId: String(checklist._id),
      details: {
        userId: args.userId,
        stepId: args.stepId,
        progress: `${completedCount}/${updatedSteps.length}`,
      },
    });

    return checklist._id;
  },
});

// Reset onboarding
export const resetOnboarding = mutation({
  args: {
    userId: v.id("users"),
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const checklist = await ctx.db
      .query("onboardingChecklists")
      .withIndex("by_user_and_business", (q) =>
        q.eq("userId", args.userId).eq("businessId", args.businessId)
      )
      .first();

    if (!checklist) throw new Error("Onboarding checklist not found");

    const resetSteps = checklist.steps.map((step: any) => ({
      ...step,
      completed: false,
      completedAt: undefined,
    }));

    await ctx.db.patch(checklist._id, {
      steps: resetSteps,
      currentStepIndex: 0,
      completedAt: undefined,
    });

    return checklist._id;
  },
});

// Assign role to user
export const assignRole = mutation({
  args: {
    userId: v.id("users"),
    businessId: v.id("businesses"),
    role: v.union(
      v.literal("admin"),
      v.literal("editor"),
      v.literal("viewer"),
      v.literal("custom")
    ),
    permissions: v.object({
      canApprove: v.boolean(),
      canEdit: v.boolean(),
      canView: v.boolean(),
      canManageTeam: v.boolean(),
      canManageSettings: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    // Check if role already exists
    const existing = await ctx.db
      .query("userRoles")
      .withIndex("by_user_and_business", (q) =>
        q.eq("userId", args.userId).eq("businessId", args.businessId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        role: args.role,
        permissions: args.permissions,
        assignedBy: user._id,
        assignedAt: Date.now(),
      });

      // Audit log
      await ctx.runMutation(internal.audit.write, {
        businessId: args.businessId,
        action: "role.updated",
        entityType: "userRole",
        entityId: String(existing._id),
        details: {
          userId: args.userId,
          role: args.role,
          assignedBy: user._id,
        },
      });

      return existing._id;
    } else {
      const roleId = await ctx.db.insert("userRoles", {
        userId: args.userId,
        businessId: args.businessId,
        role: args.role,
        permissions: args.permissions,
        assignedBy: user._id,
        assignedAt: Date.now(),
      });

      // Audit log
      await ctx.runMutation(internal.audit.write, {
        businessId: args.businessId,
        action: "role.assigned",
        entityType: "userRole",
        entityId: String(roleId),
        details: {
          userId: args.userId,
          role: args.role,
          assignedBy: user._id,
        },
      });

      return roleId;
    }
  },
});

// Update user permissions
export const updatePermissions = mutation({
  args: {
    userId: v.id("users"),
    businessId: v.id("businesses"),
    permissions: v.object({
      canApprove: v.boolean(),
      canEdit: v.boolean(),
      canView: v.boolean(),
      canManageTeam: v.boolean(),
      canManageSettings: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user_and_business", (q) =>
        q.eq("userId", args.userId).eq("businessId", args.businessId)
      )
      .first();

    if (!userRole) throw new Error("User role not found");

    await ctx.db.patch(userRole._id, {
      permissions: args.permissions,
      role: "custom",
    });

    // Audit log
    await ctx.runMutation(internal.audit.write, {
      businessId: args.businessId,
      action: "permissions.updated",
      entityType: "userRole",
      entityId: String(userRole._id),
      details: {
        userId: args.userId,
        permissions: args.permissions,
      },
    });

    return userRole._id;
  },
});