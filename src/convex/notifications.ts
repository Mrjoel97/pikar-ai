import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
// removed unused internal import

// Query to get notifications for a user
export const getUserNotifications = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Rename local variable to avoid shadowing the imported `query`
    let dbQuery = ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");

    if (args.unreadOnly) {
      dbQuery = dbQuery.filter((q) => q.eq(q.field("isRead"), false));
    }

    let notifications;
    if (args.limit) {
      notifications = await dbQuery.take(args.limit);
    } else {
      notifications = await dbQuery.collect();
    }

    // Filter out expired notifications
    const now = Date.now();
    return notifications.filter(n => !n.expiresAt || n.expiresAt > now);
  },
});

// Query to get notification count
export const getNotificationCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const unreadCount = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) => 
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .filter((q) => 
        q.or(
          q.eq(q.field("expiresAt"), undefined),
          q.gt(q.field("expiresAt"), now)
        )
      )
      .collect();

    return unreadCount.length;
  },
});

// Mutation to mark notification as read
export const markNotificationRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    // Verify user owns this notification
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    if (!user || notification.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.notificationId, {
      isRead: true,
      readAt: Date.now(),
    });
  },
});

// Mutation to mark all notifications as read
export const markAllNotificationsRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    if (!user || args.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) => 
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    const now = Date.now();
    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, {
        isRead: true,
        readAt: now,
      });
    }

    return unreadNotifications.length;
  },
});

// Internal mutation to create a notification (used by other services)
export const createNotification = internalMutation({
  args: {
    businessId: v.id("businesses"),
    userId: v.id("users"),
    type: v.union(
      v.literal("assignment"),
      v.literal("approval"),
      v.literal("sla_warning"),
      v.literal("integration_error"),
      v.literal("workflow_completion"),
      v.literal("system_alert")
    ),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check user notification preferences
    const preferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (preferences) {
      // Check if this type of notification is enabled
      const typeEnabled = preferences.preferences[args.type as keyof typeof preferences.preferences];
      if (!typeEnabled) {
        return null; // Don't create notification if disabled
      }

      // Check rate limits
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);
      const oneDayAgo = now - (24 * 60 * 60 * 1000);

      const recentNotifications = await ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.gt(q.field("createdAt"), oneHourAgo))
        .collect();

      const todayNotifications = await ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.gt(q.field("createdAt"), oneDayAgo))
        .collect();

      if (recentNotifications.length >= preferences.rateLimits.maxPerHour ||
          todayNotifications.length >= preferences.rateLimits.maxPerDay) {
        return null; // Rate limit exceeded
      }
    }

    return await ctx.db.insert("notifications", {
      businessId: args.businessId,
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      data: args.data,
      isRead: false,
      priority: args.priority || "medium",
      createdAt: Date.now(),
      expiresAt: args.expiresAt,
    });
  },
});

// Query to get notification preferences
export const getNotificationPreferences = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    if (!user || args.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const preferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    // Return default preferences if none exist
    if (!preferences) {
      return {
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: false,
        preferences: {
          assignments: true,
          approvals: true,
          slaWarnings: true,
          integrationErrors: true,
          workflowCompletions: true,
          systemAlerts: true,
        },
        rateLimits: {
          maxPerHour: 10,
          maxPerDay: 50,
        },
      };
    }

    return preferences;
  },
});

// Mutation to update notification preferences
export const updateNotificationPreferences = mutation({
  args: {
    userId: v.id("users"),
    businessId: v.id("businesses"),
    emailEnabled: v.optional(v.boolean()),
    pushEnabled: v.optional(v.boolean()),
    smsEnabled: v.optional(v.boolean()),
    preferences: v.optional(v.object({
      assignments: v.boolean(),
      approvals: v.boolean(),
      slaWarnings: v.boolean(),
      integrationErrors: v.boolean(),
      workflowCompletions: v.boolean(),
      systemAlerts: v.boolean(),
    })),
    rateLimits: v.optional(v.object({
      maxPerHour: v.number(),
      maxPerDay: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    if (!user || args.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const existingPreferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const updateData = {
      userId: args.userId,
      businessId: args.businessId,
      emailEnabled: args.emailEnabled ?? true,
      pushEnabled: args.pushEnabled ?? true,
      smsEnabled: args.smsEnabled ?? false,
      preferences: args.preferences ?? {
        assignments: true,
        approvals: true,
        slaWarnings: true,
        integrationErrors: true,
        workflowCompletions: true,
        systemAlerts: true,
      },
      rateLimits: args.rateLimits ?? {
        maxPerHour: 10,
        maxPerDay: 50,
      },
      updatedAt: Date.now(),
    };

    if (existingPreferences) {
      await ctx.db.patch(existingPreferences._id, updateData);
      return existingPreferences._id;
    } else {
      return await ctx.db.insert("notificationPreferences", updateData);
    }
  },
});

// Internal function to send notifications (can be extended for email/SMS)
export const sendNotification = internalMutation({
  args: {
    businessId: v.id("businesses"),
    userId: v.id("users"),
    type: v.union(
      v.literal("assignment"),
      v.literal("approval"),
      v.literal("sla_warning"),
      v.literal("integration_error"),
      v.literal("workflow_completion"),
      v.literal("system_alert")
    ),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
  },
  handler: async (ctx, args): Promise<Id<"notifications"> | null> => {
    // Create in-app notification directly
    const notificationId = await ctx.db.insert("notifications", {
      businessId: args.businessId,
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      data: args.data,
      isRead: false,
      priority: args.priority || "medium",
      createdAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // Expire after 7 days
    });

    // TODO: Add email/SMS sending logic here based on user preferences

    return notificationId;
  },
});

// Scheduled function to clean up expired notifications
export const cleanupExpiredNotifications = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expiredNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_expires_at", (q) => q.lt("expiresAt", now))
      .collect();

    for (const notification of expiredNotifications) {
      await ctx.db.delete(notification._id);
    }

    return expiredNotifications.length;
  },
});

// Add: identity-based preferences (get)
export const getMyNotificationPreferences = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) throw new Error("User not found");

    const preferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!preferences) {
      return {
        userId: user._id,
        businessId: args.businessId,
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: false,
        preferences: {
          assignments: true,
          approvals: true,
          slaWarnings: true,
          integrationErrors: true,
          workflowCompletions: true,
          systemAlerts: true,
        },
        rateLimits: {
          maxPerHour: 10,
          maxPerDay: 50,
        },
      };
    }
    return preferences;
  },
});

// Add: identity-based preferences (update)
export const updateMyNotificationPreferences = mutation({
  args: {
    businessId: v.id("businesses"),
    emailEnabled: v.optional(v.boolean()),
    pushEnabled: v.optional(v.boolean()),
    smsEnabled: v.optional(v.boolean()),
    preferences: v.optional(
      v.object({
        assignments: v.boolean(),
        approvals: v.boolean(),
        slaWarnings: v.boolean(),
        integrationErrors: v.boolean(),
        workflowCompletions: v.boolean(),
        systemAlerts: v.boolean(),
      })
    ),
    rateLimits: v.optional(
      v.object({
        maxPerHour: v.number(),
        maxPerDay: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) throw new Error("User not found");

    const existing = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    const payload = {
      userId: user._id,
      businessId: args.businessId,
      emailEnabled: args.emailEnabled ?? (existing?.emailEnabled ?? true),
      pushEnabled: args.pushEnabled ?? (existing?.pushEnabled ?? true),
      smsEnabled: args.smsEnabled ?? (existing?.smsEnabled ?? false),
      preferences:
        args.preferences ??
        (existing?.preferences ?? {
          assignments: true,
          approvals: true,
          slaWarnings: true,
          integrationErrors: true,
          workflowCompletions: true,
          systemAlerts: true,
        }),
      rateLimits:
        args.rateLimits ??
        (existing?.rateLimits ?? {
          maxPerHour: 10,
          maxPerDay: 50,
        }),
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }
    return await ctx.db.insert("notificationPreferences", payload);
  },
});

// Add: Snooze a notification (identity-safe)
export const snoozeMyNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
    minutes: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) throw new Error("User not found");

    const n = await ctx.db.get(args.notificationId);
    if (!n) throw new Error("Notification not found");
    if (n.userId !== user._id) throw new Error("Unauthorized");

    const until = Date.now() + Math.max(1, args.minutes) * 60 * 1000;
    await ctx.db.patch(args.notificationId, { snoozeUntil: until });
    return true;
  },
});

// Query to get notifications for the authenticated user
export const getMyNotifications = query({
  args: {
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) {
      throw new Error("User not found");
    }

    // Rename local variable to avoid shadowing within callbacks
    let dbQuery = ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc");

    if (args.unreadOnly) {
      dbQuery = dbQuery.filter((q) => q.eq(q.field("isRead"), false));
    }

    const rows = args.limit ? await dbQuery.take(args.limit) : await dbQuery.collect();
    const now = Date.now();
    return rows.filter(
      (n) =>
        (!n.expiresAt || n.expiresAt > now) &&
        (!(n as any).snoozeUntil || (n as any).snoozeUntil <= now)
    );
  },
});

// Query to get notification count
export const getMyNotificationCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) {
      throw new Error("User not found");
    }
    const now = Date.now();
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", user._id).eq("isRead", false)
      )
      .filter((q) =>
        q.and(
          q.or(
            q.eq(q.field("expiresAt"), undefined),
            q.gt(q.field("expiresAt"), now)
          ),
          q.or(
            q.eq(q.field("snoozeUntil"), undefined),
            q.lte(q.field("snoozeUntil"), now)
          )
        )
      )
      .collect();
    return unread.length;
  },
});

// Mutation to mark notification as read
export const markMyNotificationRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) {
      throw new Error("User not found");
    }
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }
    if (notification.userId !== user._id) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(args.notificationId, { isRead: true, readAt: Date.now() });
    return true;
  },
});

// Mutation to mark all notifications as read
export const markAllMyNotificationsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) {
      throw new Error("User not found");
    }
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) => q.eq("userId", user._id).eq("isRead", false))
      .collect();
    const now = Date.now();
    for (const n of unread) {
      await ctx.db.patch(n._id, { isRead: true, readAt: now });
    }
    return unread.length;
  },
});