import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

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

    const updatedSteps = checklist.steps.map((step) =>
      step.id === args.stepId
        ? { ...step, completed: true, completedAt: Date.now() }
        : step
    );

    const completedCount = updatedSteps.filter((s) => s.completed).length;
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

    const resetSteps = checklist.steps.map((step) => ({
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