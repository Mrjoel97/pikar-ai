import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

export const listAppointments = query({
  args: {
    businessId: v.id("businesses"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    // This is a simplified implementation. 
    // In a real app, you'd query the appointments table with an index on time.
    // Since we don't have a range index on startTime easily without more setup,
    // we'll filter in memory for now or use a simple index.
    
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    return appointments.filter(
      (appt) => appt.startTime >= args.startDate && appt.startTime <= args.endDate
    );
  },
});

export const getWeeklyAvailability = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const blocks = await ctx.db
      .query("availabilityBlocks")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
      
    // Convert to the format expected by the frontend
    const availability: Record<string, any> = {};
    const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    blocks.forEach(block => {
      const dayName = DAYS[block.dayOfWeek];
      if (dayName) {
        availability[dayName] = {
          enabled: block.isAvailable,
          start: block.startTime,
          end: block.endTime
        };
      }
    });
    
    return availability;
  },
});

export const setAvailability = mutation({
  args: {
    businessId: v.id("businesses"),
    dayOfWeek: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    isAvailable: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("availabilityBlocks")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter(q => q.eq(q.field("dayOfWeek"), args.dayOfWeek))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        startTime: args.startTime,
        endTime: args.endTime,
        isAvailable: args.isAvailable,
      });
    } else {
      await ctx.db.insert("availabilityBlocks", {
        businessId: args.businessId,
        dayOfWeek: args.dayOfWeek,
        startTime: args.startTime,
        endTime: args.endTime,
        isAvailable: args.isAvailable,
      });
    }
  },
});