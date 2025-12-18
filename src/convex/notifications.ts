import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";

// Add: central validator for notification types to match schema union
const notificationTypeValidator = v.union(
  v.literal("approval"),
  v.literal("assignment"), 
  v.literal("sla_warning"),
  v.literal("sla_overdue"),
  v.literal("integration_error"),
  v.literal("workflow_completion"),
  v.literal("system_alert"),
);

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
    type: notificationTypeValidator,
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

      if (recentNotifications.length >= (preferences.rateLimits?.maxPerHour || 10) ||
          todayNotifications.length >= (preferences.rateLimits?.maxPerDay || 50)) {
        return null; // Rate limit exceeded
      }
    }

    return await ctx.db.insert("notifications", {
      businessId: args.businessId,
      userId: args.userId,
      type: args.type as any, // ensure it matches the union type at runtime
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
    // Use central validator to include all supported types (including sla_overdue)
    type: notificationTypeValidator,
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
  },
  handler: async (ctx, args): Promise<Id<"notifications"> | null> => {
    // Normalize priority to schema-supported values
    const pr: "low" | "medium" | "high" = args.priority ?? "medium";

    const notificationId = await ctx.db.insert("notifications", {
      businessId: args.businessId,
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      data: args.data,
      isRead: false,
      priority: pr,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

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
    paginationOpts: paginationOptsValidator,
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      // Return empty page if not authenticated
      return {
        page: [],
        isDone: true,
        continueCursor: "",
      };
    }
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();

    // Rename local variable to avoid shadowing within callbacks
    let dbQuery = ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc");

    if (args.unreadOnly) {
      dbQuery = dbQuery.filter((q) => q.eq(q.field("isRead"), false));
    }

    // Apply filters in the query for pagination
    dbQuery = dbQuery.filter((q) =>
      q.and(
        // Not expired: expiresAt is undefined OR expiresAt > now
        q.or(
          q.eq(q.field("expiresAt"), undefined),
          q.gt(q.field("expiresAt"), now)
        ),
        // Not snoozed: snoozeUntil is undefined OR snoozeUntil <= now
        q.or(
          q.eq(q.field("snoozeUntil"), undefined),
          q.lte(q.field("snoozeUntil"), now)
        )
      )
    );

    return await dbQuery.paginate(args.paginationOpts);
  },
});

// Query to get notification count
export const getMyNotificationCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return 0;
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

// Internal mutation to create a notification if not duplicate recently
export const sendIfPermitted = internalMutation({
  args: {
    userId: v.id("users"),
    businessId: v.id("businesses"),
    type: notificationTypeValidator, // use central validator to ensure union type
    title: v.string(),
    message: v.string(),
    link: v.optional(v.string()),
    priority: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get user preferences (fallback to defaults if not found)
    const prefsByUser = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const prefs =
      prefsByUser.find((p) => p.businessId === args.businessId) ?? null;

    const rateLimits = prefs?.rateLimits || { maxPerHour: 10, maxPerDay: 50 };

    // High priority bypass (SLA warnings/overdue)
    const isHighPriority =
      args.type === "sla_warning" ||
      args.type === "sla_overdue";

    if (!isHighPriority) {
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;
      const oneDayAgo = now - 24 * 60 * 60 * 1000;

      const recentHour = await ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.gte(q.field("createdAt"), oneHourAgo))
        .collect();

      const recentDay = await ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.gte(q.field("createdAt"), oneDayAgo))
        .collect();

      if (
        recentHour.length >= rateLimits.maxPerHour ||
        recentDay.length >= rateLimits.maxPerDay
      ) {
        return { sent: false };
      }
    }

    await ctx.db.insert("notifications", {
      userId: args.userId,
      businessId: args.businessId,
      type: args.type,
      title: args.title,
      message: args.message,
      isRead: false,
      createdAt: Date.now(),
      // Normalize "urgent" to "high" to match schema's union
      priority: (args.priority === "urgent" ? "high" : (args.priority as any)) ?? "medium",
    });

    return { sent: true };
  },
});

// Add: Send digest email notifications (scheduled)
export const sendDigestEmails = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all users with digest enabled
    const allPrefs = await ctx.db.query("notificationPreferences").collect();
    const digestUsers = allPrefs.filter((p) => (p as any).digestEnabled);

    for (const pref of digestUsers) {
      const user = await ctx.db.get(pref.userId);
      if (!user?.email) continue;

      // Get unread notifications from last 24 hours
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const unread = await ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("userId", pref.userId))
        .filter((q) =>
          q.and(
            q.eq(q.field("isRead"), false),
            q.gte(q.field("createdAt"), oneDayAgo)
          )
        )
        .collect();

      if (unread.length === 0) continue;

      // Group by type
      const grouped = unread.reduce((acc: any, n) => {
        const type = n.type || "info";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      // Send digest email via Resend (if RESEND_API_KEY is configured)
      try {
        // Note: Actual Resend integration would go here
        // For now, log the digest summary
        console.log(`Digest for ${user.email}: ${JSON.stringify(grouped)}`);
        
        // Future: await ctx.scheduler.runAfter(0, internal.emails.sendDigestEmail, {
        //   to: user.email,
        //   subject: `Your Daily Digest - ${unread.length} notifications`,
        //   grouped,
        // });
      } catch (error) {
        console.error(`Failed to send digest to ${user.email}:`, error);
      }
    }

    return { sent: digestUsers.length };
  },
});

// Add: Request browser push permission
export const requestPushPermission = mutation({
  args: {
    businessId: v.id("businesses"),
    subscription: v.any(), // PushSubscription object
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user) throw new Error("User not found");

    // Store push subscription
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        subscription: args.subscription,
      });
      return existing._id;
    }

    return await ctx.db.insert("pushSubscriptions", {
      businessId: args.businessId,
      userId: user._id,
      subscription: args.subscription,
      createdAt: Date.now(),
    });
  },
});

// Add: Send push notification
export const sendPushNotification = internalMutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const subscriptions = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Send push notifications (requires VAPID keys configuration)
    try {
      // Note: Actual Web Push API integration would go here
      // For now, log the push notification
      console.log(`Push to ${subscriptions.length} devices: ${args.title}`);
      
      // Future: Use web-push library with VAPID keys
      // const webpush = require('web-push');
      // for (const sub of subscriptions) {
      //   await webpush.sendNotification(sub.subscription, JSON.stringify({
      //     title: args.title,
      //     body: args.body,
      //     data: args.data,
      //   }));
      // }
    } catch (error) {
      console.error(`Failed to send push notifications:`, error);
    }
    
    return { sent: subscriptions.length };
  },
});

// Add: Handle inline notification action
export const handleNotificationAction = mutation({
  args: {
    notificationId: v.id("notifications"),
    action: v.union(v.literal("approve"), v.literal("reject"), v.literal("dismiss")),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("Notification not found");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user || notification.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // Mark as read
    await ctx.db.patch(args.notificationId, {
      isRead: true,
      readAt: Date.now(),
    });

    // Handle action based on notification type
    if (notification.type === "approval" && notification.data?.approvalId) {
      const approvalId = notification.data.approvalId as any;
      if (args.action === "approve") {
        await ctx.db.patch(approvalId, {
          status: "approved",
          approvedBy: user._id,
          approvedAt: Date.now(),
        } as any);
      } else if (args.action === "reject") {
        await ctx.db.patch(approvalId, {
          status: "rejected",
          reviewedBy: user._id,
          /* removed rejectedAt: not present in schema */
        } as any);
      }
    }

    return { success: true, action: args.action };
  },
});