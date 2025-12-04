import { v } from "convex/values";
import { query, mutation, internalQuery } from "../_generated/server";

/**
 * Get availability blocks for a business
 */
export const getAvailability = internalQuery({
  args: {
    businessId: v.id("businesses"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    // Get all availability blocks for the business (weekly recurring schedule)
    const blocks = await ctx.db
      .query("availabilityBlocks")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    return blocks;
  },
});

/**
 * Get appointments for a business
 */
export const getAppointments = internalQuery({
  args: {
    businessId: v.id("businesses"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) =>
        q.and(
          q.gte(q.field("startTime"), args.startDate),
          q.lte(q.field("startTime"), args.endDate)
        )
      )
      .collect();

    return appointments;
  },
});

/**
 * List appointments for display
 */
export const listAppointments = query({
  args: {
    businessId: v.id("businesses"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) =>
        q.and(
          q.gte(q.field("startTime"), args.startDate),
          q.lte(q.field("startTime"), args.endDate)
        )
      )
      .collect();

    return appointments;
  },
});

/**
 * Create a new appointment
 */
export const createAppointment = mutation({
  args: {
    businessId: v.id("businesses"),
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    attendees: v.optional(v.array(v.string())),
    location: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const appointmentId = await ctx.db.insert("appointments", {
      businessId: args.businessId,
      title: args.title,
      description: args.description,
      startTime: args.startTime,
      endTime: args.endTime,
      attendees: args.attendees || [],
      location: args.location,
      type: args.type || "meeting",
      status: "scheduled",
    });

    return appointmentId;
  },
});

/**
 * Update an appointment
 */
export const updateAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { appointmentId, ...updates } = args;
    await ctx.db.patch(appointmentId, updates);
    return appointmentId;
  },
});

/**
 * Delete an appointment
 */
export const deleteAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.appointmentId);
  },
});

/**
 * Set availability blocks (recurring weekly schedule)
 */
export const setAvailability = mutation({
  args: {
    businessId: v.id("businesses"),
    dayOfWeek: v.number(), // 0-6 (Sunday-Saturday)
    startTime: v.string(), // "09:00"
    endTime: v.string(), // "17:00"
    isAvailable: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Check if block exists
    const existing = await ctx.db
      .query("availabilityBlocks")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) =>
        q.and(
          q.eq(q.field("dayOfWeek"), args.dayOfWeek),
          q.eq(q.field("startTime"), args.startTime),
          q.eq(q.field("endTime"), args.endTime)
        )
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        isAvailable: args.isAvailable,
      });
      return existing._id;
    } else {
      const blockId = await ctx.db.insert("availabilityBlocks", {
        businessId: args.businessId,
        dayOfWeek: args.dayOfWeek,
        startTime: args.startTime,
        endTime: args.endTime,
        isAvailable: args.isAvailable,
      });
      return blockId;
    }
  },
});

/**
 * Get weekly availability template
 */
export const getWeeklyAvailability = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const blocks = await ctx.db
      .query("availabilityBlocks")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    // Group by day of week
    const weeklySchedule: Record<number, any[]> = {};
    for (let i = 0; i < 7; i++) {
      weeklySchedule[i] = blocks.filter(b => b.dayOfWeek === i);
    }

    return weeklySchedule;
  },
});
