import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Enterprise Support System
 * Handles support tickets and training scheduling for Enterprise tier customers
 */

// ============================================================================
// SUPPORT TICKETS
// ============================================================================

export const listTickets = query({
  args: {
    businessId: v.id("businesses"),
    status: v.optional(v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("waiting_customer"),
      v.literal("resolved"),
      v.literal("closed")
    )),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) {
      throw new Error("[ERR_NOT_AUTHENTICATED] You must be signed in.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) {
      throw new Error("[ERR_USER_NOT_FOUND] User not found.");
    }

    const business = await ctx.db.get(args.businessId);
    if (!business) {
      throw new Error("[ERR_BUSINESS_NOT_FOUND] Business not found.");
    }

    if (business.ownerId !== user._id && !business.teamMembers.includes(user._id)) {
      throw new Error("[ERR_FORBIDDEN] Not authorized.");
    }

    let query = ctx.db
      .query("supportTickets")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId));

    const tickets = await query.order("desc").take(args.limit ?? 50);

    // Filter by status and priority in memory
    let filtered = tickets;
    if (args.status) {
      filtered = filtered.filter((t) => t.status === args.status);
    }
    if (args.priority) {
      filtered = filtered.filter((t) => t.priority === args.priority);
    }

    // Enrich with user data
    const enriched = await Promise.all(
      filtered.map(async (ticket) => {
        const creator = ticket.createdBy ? await ctx.db.get(ticket.createdBy) : null;
        const assignee = ticket.assignedTo ? await ctx.db.get(ticket.assignedTo) : null;
        return {
          ...ticket,
          creatorName: creator?.name ?? "Unknown",
          assigneeName: assignee?.name ?? "Unassigned",
        };
      })
    );

    return enriched;
  },
});

export const getTicket = query({
  args: { ticketId: v.id("supportTickets") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) {
      throw new Error("[ERR_NOT_AUTHENTICATED] You must be signed in.");
    }

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      throw new Error("[ERR_NOT_FOUND] Ticket not found.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) {
      throw new Error("[ERR_USER_NOT_FOUND] User not found.");
    }

    const business = await ctx.db.get(ticket.businessId);
    if (!business) {
      throw new Error("[ERR_BUSINESS_NOT_FOUND] Business not found.");
    }

    if (business.ownerId !== user._id && !business.teamMembers.includes(user._id)) {
      throw new Error("[ERR_FORBIDDEN] Not authorized.");
    }

    const creator = ticket.createdBy ? await ctx.db.get(ticket.createdBy) : null;
    const assignee = ticket.assignedTo ? await ctx.db.get(ticket.assignedTo) : null;

    return {
      ...ticket,
      creatorName: creator?.name ?? "Unknown",
      assigneeName: assignee?.name ?? "Unassigned",
    };
  },
});

export const createTicket = mutation({
  args: {
    businessId: v.id("businesses"),
    subject: v.string(),
    description: v.string(),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) {
      throw new Error("[ERR_NOT_AUTHENTICATED] You must be signed in.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) {
      throw new Error("[ERR_USER_NOT_FOUND] User not found.");
    }

    const business = await ctx.db.get(args.businessId);
    if (!business) {
      throw new Error("[ERR_BUSINESS_NOT_FOUND] Business not found.");
    }

    if (business.ownerId !== user._id && !business.teamMembers.includes(user._id)) {
      throw new Error("[ERR_FORBIDDEN] Not authorized.");
    }

    const ticketId = await ctx.db.insert("supportTickets", {
      businessId: args.businessId,
      subject: args.subject,
      description: args.description,
      priority: args.priority,
      category: args.category,
      status: "open",
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Audit log
    await ctx.runMutation("audit:write" as any, {
      businessId: args.businessId,
      action: "support_ticket_created",
      entityType: "support_ticket",
      entityId: ticketId,
      details: { subject: args.subject, priority: args.priority },
    });

    return ticketId;
  },
});

export const updateTicket = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    status: v.optional(v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("waiting_customer"),
      v.literal("resolved"),
      v.literal("closed")
    )),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    )),
    assignedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) {
      throw new Error("[ERR_NOT_AUTHENTICATED] You must be signed in.");
    }

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      throw new Error("[ERR_NOT_FOUND] Ticket not found.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) {
      throw new Error("[ERR_USER_NOT_FOUND] User not found.");
    }

    const business = await ctx.db.get(ticket.businessId);
    if (!business) {
      throw new Error("[ERR_BUSINESS_NOT_FOUND] Business not found.");
    }

    if (business.ownerId !== user._id && !business.teamMembers.includes(user._id)) {
      throw new Error("[ERR_FORBIDDEN] Not authorized.");
    }

    const updates: any = { updatedAt: Date.now() };
    if (args.status !== undefined) updates.status = args.status;
    if (args.priority !== undefined) updates.priority = args.priority;
    if (args.assignedTo !== undefined) updates.assignedTo = args.assignedTo;

    await ctx.db.patch(args.ticketId, updates);

    // Audit log
    await ctx.runMutation("audit:write" as any, {
      businessId: ticket.businessId,
      action: "support_ticket_updated",
      entityType: "support_ticket",
      entityId: args.ticketId,
      details: updates,
    });

    return true;
  },
});

export const addTicketComment = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) {
      throw new Error("[ERR_NOT_AUTHENTICATED] You must be signed in.");
    }

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      throw new Error("[ERR_NOT_FOUND] Ticket not found.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) {
      throw new Error("[ERR_USER_NOT_FOUND] User not found.");
    }

    const business = await ctx.db.get(ticket.businessId);
    if (!business) {
      throw new Error("[ERR_BUSINESS_NOT_FOUND] Business not found.");
    }

    if (business.ownerId !== user._id && !business.teamMembers.includes(user._id)) {
      throw new Error("[ERR_FORBIDDEN] Not authorized.");
    }

    const commentId = await ctx.db.insert("ticketComments", {
      ticketId: args.ticketId,
      userId: user._id,
      comment: args.comment,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.ticketId, { updatedAt: Date.now() });

    return commentId;
  },
});

export const getTicketComments = query({
  args: { ticketId: v.id("supportTickets") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) {
      throw new Error("[ERR_NOT_AUTHENTICATED] You must be signed in.");
    }

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      throw new Error("[ERR_NOT_FOUND] Ticket not found.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) {
      throw new Error("[ERR_USER_NOT_FOUND] User not found.");
    }

    const business = await ctx.db.get(ticket.businessId);
    if (!business) {
      throw new Error("[ERR_BUSINESS_NOT_FOUND] Business not found.");
    }

    if (business.ownerId !== user._id && !business.teamMembers.includes(user._id)) {
      throw new Error("[ERR_FORBIDDEN] Not authorized.");
    }

    const comments = await ctx.db
      .query("ticketComments")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .order("asc")
      .collect();

    const enriched = await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.userId);
        return {
          ...comment,
          authorName: author?.name ?? "Unknown",
          authorEmail: author?.email ?? "",
        };
      })
    );

    return enriched;
  },
});

// ============================================================================
// TRAINING SESSIONS
// ============================================================================

export const listTrainingSessions = query({
  args: {
    businessId: v.id("businesses"),
    status: v.optional(v.union(
      v.literal("scheduled"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) {
      throw new Error("[ERR_NOT_AUTHENTICATED] You must be signed in.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) {
      throw new Error("[ERR_USER_NOT_FOUND] User not found.");
    }

    const business = await ctx.db.get(args.businessId);
    if (!business) {
      throw new Error("[ERR_BUSINESS_NOT_FOUND] Business not found.");
    }

    if (business.ownerId !== user._id && !business.teamMembers.includes(user._id)) {
      throw new Error("[ERR_FORBIDDEN] Not authorized.");
    }

    let query = ctx.db
      .query("trainingSessions")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId));

    const sessions = await query.order("desc").take(args.limit ?? 50);

    let filtered = sessions;
    if (args.status) {
      filtered = filtered.filter((s) => s.status === args.status);
    }

    const enriched = await Promise.all(
      filtered.map(async (session) => {
        const trainer = session.trainerId ? await ctx.db.get(session.trainerId) : null;
        return {
          ...session,
          trainerName: trainer?.name ?? "TBD",
          attendeeCount: session.attendees?.length ?? 0,
        };
      })
    );

    return enriched;
  },
});

export const getTrainingSession = query({
  args: { sessionId: v.id("trainingSessions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) {
      throw new Error("[ERR_NOT_AUTHENTICATED] You must be signed in.");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("[ERR_NOT_FOUND] Training session not found.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) {
      throw new Error("[ERR_USER_NOT_FOUND] User not found.");
    }

    const business = await ctx.db.get(session.businessId);
    if (!business) {
      throw new Error("[ERR_BUSINESS_NOT_FOUND] Business not found.");
    }

    if (business.ownerId !== user._id && !business.teamMembers.includes(user._id)) {
      throw new Error("[ERR_FORBIDDEN] Not authorized.");
    }

    const trainer = session.trainerId ? await ctx.db.get(session.trainerId) : null;

    return {
      ...session,
      trainerName: trainer?.name ?? "TBD",
      attendeeCount: session.attendees?.length ?? 0,
    };
  },
});

export const scheduleTraining = mutation({
  args: {
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.string(),
    scheduledAt: v.number(),
    durationMinutes: v.number(),
    topic: v.string(),
    maxAttendees: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) {
      throw new Error("[ERR_NOT_AUTHENTICATED] You must be signed in.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) {
      throw new Error("[ERR_USER_NOT_FOUND] User not found.");
    }

    const business = await ctx.db.get(args.businessId);
    if (!business) {
      throw new Error("[ERR_BUSINESS_NOT_FOUND] Business not found.");
    }

    if (business.ownerId !== user._id && !business.teamMembers.includes(user._id)) {
      throw new Error("[ERR_FORBIDDEN] Not authorized.");
    }

    const sessionId = await ctx.db.insert("trainingSessions", {
      businessId: args.businessId,
      title: args.title,
      description: args.description,
      scheduledAt: args.scheduledAt,
      durationMinutes: args.durationMinutes,
      topic: args.topic,
      maxAttendees: args.maxAttendees,
      status: "scheduled",
      attendees: [],
      createdBy: user._id,
      createdAt: Date.now(),
    });

    // Audit log
    await ctx.runMutation("audit:write" as any, {
      businessId: args.businessId,
      action: "training_session_scheduled",
      entityType: "training_session",
      entityId: sessionId,
      details: { title: args.title, scheduledAt: args.scheduledAt },
    });

    return sessionId;
  },
});

export const registerForTraining = mutation({
  args: { sessionId: v.id("trainingSessions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) {
      throw new Error("[ERR_NOT_AUTHENTICATED] You must be signed in.");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("[ERR_NOT_FOUND] Training session not found.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) {
      throw new Error("[ERR_USER_NOT_FOUND] User not found.");
    }

    const business = await ctx.db.get(session.businessId);
    if (!business) {
      throw new Error("[ERR_BUSINESS_NOT_FOUND] Business not found.");
    }

    if (business.ownerId !== user._id && !business.teamMembers.includes(user._id)) {
      throw new Error("[ERR_FORBIDDEN] Not authorized.");
    }

    const attendees = session.attendees || [];
    if (attendees.includes(user._id)) {
      throw new Error("[ERR_ALREADY_REGISTERED] Already registered for this session.");
    }

    if (session.maxAttendees && attendees.length >= session.maxAttendees) {
      throw new Error("[ERR_SESSION_FULL] Training session is full.");
    }

    await ctx.db.patch(args.sessionId, {
      attendees: [...attendees, user._id],
    });

    return true;
  },
});

export const cancelTraining = mutation({
  args: { sessionId: v.id("trainingSessions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) {
      throw new Error("[ERR_NOT_AUTHENTICATED] You must be signed in.");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("[ERR_NOT_FOUND] Training session not found.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) {
      throw new Error("[ERR_USER_NOT_FOUND] User not found.");
    }

    const business = await ctx.db.get(session.businessId);
    if (!business) {
      throw new Error("[ERR_BUSINESS_NOT_FOUND] Business not found.");
    }

    if (business.ownerId !== user._id && !business.teamMembers.includes(user._id)) {
      throw new Error("[ERR_FORBIDDEN] Not authorized.");
    }

    await ctx.db.patch(args.sessionId, { status: "cancelled" });

    // Audit log
    await ctx.runMutation("audit:write" as any, {
      businessId: session.businessId,
      action: "training_session_cancelled",
      entityType: "training_session",
      entityId: args.sessionId,
      details: { title: session.title },
    });

    return true;
  },
});

// ============================================================================
// ANALYTICS
// ============================================================================

export const getSupportStats = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) {
      throw new Error("[ERR_NOT_AUTHENTICATED] You must be signed in.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    if (!user) {
      throw new Error("[ERR_USER_NOT_FOUND] User not found.");
    }

    const business = await ctx.db.get(args.businessId);
    if (!business) {
      throw new Error("[ERR_BUSINESS_NOT_FOUND] Business not found.");
    }

    if (business.ownerId !== user._id && !business.teamMembers.includes(user._id)) {
      throw new Error("[ERR_FORBIDDEN] Not authorized.");
    }

    const tickets = await ctx.db
      .query("supportTickets")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const sessions = await ctx.db
      .query("trainingSessions")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const openTickets = tickets.filter((t) => t.status === "open").length;
    const inProgressTickets = tickets.filter((t) => t.status === "in_progress").length;
    const resolvedTickets = tickets.filter((t) => t.status === "resolved").length;
    const criticalTickets = tickets.filter((t) => t.priority === "critical").length;

    const scheduledSessions = sessions.filter((s) => s.status === "scheduled").length;
    const completedSessions = sessions.filter((s) => s.status === "completed").length;

    return {
      tickets: {
        total: tickets.length,
        open: openTickets,
        inProgress: inProgressTickets,
        resolved: resolvedTickets,
        critical: criticalTickets,
      },
      training: {
        total: sessions.length,
        scheduled: scheduledSessions,
        completed: completedSessions,
      },
    };
  },
});
