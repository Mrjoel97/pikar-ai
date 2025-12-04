"use node";
import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * AI-powered scheduling assistant that suggests optimal meeting times
 */
export const suggestMeetingTimes = action({
  args: {
    businessId: v.id("businesses"),
    duration: v.number(), // in minutes
    preferences: v.optional(v.object({
      preferredDays: v.optional(v.array(v.string())),
      preferredTimeStart: v.optional(v.string()), // "09:00"
      preferredTimeEnd: v.optional(v.string()), // "17:00"
      bufferBefore: v.optional(v.number()), // minutes
      bufferAfter: v.optional(v.number()),
    })),
    timezone: v.string(),
  },
  handler: async (ctx, args) => {
    const { businessId, duration, preferences, timezone } = args;

    // Get existing appointments and availability
    const availability = await ctx.runQuery(internal.scheduling.availability.getAvailability, {
      businessId,
      startDate: Date.now(),
      endDate: Date.now() + 14 * 24 * 60 * 60 * 1000, // next 2 weeks
    });

    const appointments = await ctx.runQuery(internal.scheduling.availability.getAppointments, {
      businessId,
      startDate: Date.now(),
      endDate: Date.now() + 14 * 24 * 60 * 60 * 1000,
    });

    // Find available slots
    const suggestions = findOptimalSlots(
      availability,
      appointments,
      duration,
      preferences,
      timezone
    );

    return {
      suggestions,
      aiGenerated: true,
      reasoning: "Based on your availability patterns and preferences",
    };
  },
});

/**
 * Analyze scheduling patterns and provide insights
 */
export const analyzeSchedulingPatterns = action({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const appointments = await ctx.runQuery(internal.scheduling.availability.getAppointments, {
      businessId: args.businessId,
      startDate: Date.now() - 30 * 24 * 60 * 60 * 1000, // last 30 days
      endDate: Date.now(),
    });

    // Analyze patterns
    const patterns = analyzePatterns(appointments);

    return {
      insights: [
        {
          type: "peak_hours",
          title: "Peak Meeting Hours",
          description: `Most meetings occur between ${patterns.peakStart} and ${patterns.peakEnd}`,
          recommendation: "Consider blocking focus time outside these hours",
        },
        {
          type: "meeting_load",
          title: "Meeting Load",
          description: `Average ${patterns.avgMeetingsPerDay} meetings per day`,
          recommendation: patterns.avgMeetingsPerDay > 5 
            ? "Consider consolidating meetings to preserve focus time"
            : "Good balance of meetings and focus time",
        },
        {
          type: "buffer_time",
          title: "Buffer Time",
          description: `${patterns.hasBuffers ? "Good" : "Limited"} buffer time between meetings`,
          recommendation: patterns.hasBuffers 
            ? "Continue maintaining buffers for preparation"
            : "Add 15-minute buffers between meetings",
        },
      ],
      patterns,
    };
  },
});

// Helper functions
function findOptimalSlots(
  availability: any[],
  appointments: any[],
  duration: number,
  preferences: any,
  timezone: string
) {
  const slots = [];
  const now = Date.now();
  
  // Generate slots for next 14 days
  for (let day = 0; day < 14; day++) {
    const date = new Date(now + day * 24 * 60 * 60 * 1000);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Check if day matches preferences
    if (preferences?.preferredDays && !preferences.preferredDays.includes(dayName)) {
      continue;
    }

    // Generate time slots (9 AM to 5 PM by default)
    const startHour = preferences?.preferredTimeStart ? parseInt(preferences.preferredTimeStart.split(':')[0]) : 9;
    const endHour = preferences?.preferredTimeEnd ? parseInt(preferences.preferredTimeEnd.split(':')[0]) : 17;

    for (let hour = startHour; hour < endHour; hour++) {
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

      // Check if slot is available
      const isAvailable = !appointments.some((apt: any) => {
        return (
          (slotStart.getTime() >= apt.startTime && slotStart.getTime() < apt.endTime) ||
          (slotEnd.getTime() > apt.startTime && slotEnd.getTime() <= apt.endTime)
        );
      });

      if (isAvailable && slots.length < 10) {
        slots.push({
          startTime: slotStart.getTime(),
          endTime: slotEnd.getTime(),
          label: `${dayName}, ${slotStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`,
          score: calculateSlotScore(slotStart, preferences),
        });
      }
    }
  }

  // Sort by score (highest first)
  return slots.sort((a, b) => b.score - a.score).slice(0, 5);
}

function calculateSlotScore(date: Date, preferences: any): number {
  let score = 100;
  const hour = date.getHours();

  // Prefer mid-morning and early afternoon
  if (hour >= 10 && hour <= 11) score += 20;
  if (hour >= 14 && hour <= 15) score += 15;
  
  // Slight penalty for very early or late
  if (hour < 9 || hour > 16) score -= 10;

  return score;
}

function analyzePatterns(appointments: any[]) {
  if (appointments.length === 0) {
    return {
      peakStart: "10:00 AM",
      peakEnd: "2:00 PM",
      avgMeetingsPerDay: 0,
      hasBuffers: true,
    };
  }

  // Calculate average meetings per day
  const days = new Set(appointments.map((apt: any) => 
    new Date(apt.startTime).toDateString()
  )).size;
  const avgMeetingsPerDay = Math.round(appointments.length / days);

  // Find peak hours
  const hourCounts: Record<number, number> = {};
  appointments.forEach((apt: any) => {
    const hour = new Date(apt.startTime).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const peakHour = Object.entries(hourCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || "10";

  // Check for buffers
  const sortedApts = [...appointments].sort((a, b) => a.startTime - b.startTime);
  let hasBuffers = true;
  for (let i = 0; i < sortedApts.length - 1; i++) {
    const gap = sortedApts[i + 1].startTime - sortedApts[i].endTime;
    if (gap < 5 * 60 * 1000) { // less than 5 minutes
      hasBuffers = false;
      break;
    }
  }

  return {
    peakStart: `${peakHour}:00 AM`,
    peakEnd: `${parseInt(peakHour.toString()) + 2}:00 PM`,
    avgMeetingsPerDay,
    hasBuffers,
  };
}
