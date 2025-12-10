import { v } from "convex/values";
import { query } from "../_generated/server";

// Get retention metrics over time
export const getRetentionMetrics = query({
  args: {
    businessId: v.id("businesses"),
    startDate: v.number(),
    endDate: v.number(),
    interval: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
  },
  handler: async (ctx, args) => {
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), args.startDate),
          q.lte(q.field("createdAt"), args.endDate)
        )
      )
      .collect();

    // Calculate retention curves
    const retentionData = [];
    const intervalMs = getIntervalMs(args.interval);
    
    for (let time = args.startDate; time <= args.endDate; time += intervalMs) {
      const periodEnd = time + intervalMs;
      
      // Users who joined in this period
      const newUsers = contacts.filter(
        (c) => c.createdAt >= time && c.createdAt < periodEnd
      );
      
      // Calculate retention for subsequent periods
      const retentionRates = [];
      for (let i = 0; i < 12; i++) {
        const checkTime = periodEnd + i * intervalMs;
        const retained = newUsers.filter(
          (c) => c.lastEngagedAt && c.lastEngagedAt >= checkTime
        ).length;
        
        const rate = newUsers.length > 0 
          ? Math.round((retained / newUsers.length) * 100) 
          : 0;
        retentionRates.push(rate);
      }
      
      retentionData.push({
        period: time,
        newUsers: newUsers.length,
        retentionRates,
      });
    }

    return retentionData;
  },
});

// Get retention by segment
export const getRetentionBySegment = query({
  args: {
    businessId: v.id("businesses"),
    segmentField: v.string(),
  },
  handler: async (ctx, args) => {
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    // Group by segment
    const segments = new Map<string, any[]>();
    
    for (const contact of contacts) {
      const segmentValue = getSegmentValue(contact, args.segmentField);
      if (!segments.has(segmentValue)) {
        segments.set(segmentValue, []);
      }
      segments.get(segmentValue)!.push(contact);
    }

    // Calculate retention for each segment
    const segmentRetention = [];
    
    for (const [segmentName, segmentContacts] of segments.entries()) {
      const thirtyDayRetention = calculateRetentionRate(segmentContacts, 30);
      const sixtyDayRetention = calculateRetentionRate(segmentContacts, 60);
      const ninetyDayRetention = calculateRetentionRate(segmentContacts, 90);
      
      segmentRetention.push({
        segment: segmentName,
        totalUsers: segmentContacts.length,
        day30: thirtyDayRetention,
        day60: sixtyDayRetention,
        day90: ninetyDayRetention,
      });
    }

    return segmentRetention;
  },
});

// Get user lifecycle stages
export const getUserLifecycleStages = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const now = Date.now();
    const stages = {
      new: 0,
      active: 0,
      atRisk: 0,
      churned: 0,
    };

    for (const contact of contacts) {
      const daysSinceCreation = (now - contact.createdAt) / (1000 * 60 * 60 * 24);
      const daysSinceEngagement = contact.lastEngagedAt
        ? (now - contact.lastEngagedAt) / (1000 * 60 * 60 * 24)
        : Infinity;

      if (daysSinceCreation <= 7) {
        stages.new++;
      } else if (daysSinceEngagement <= 30) {
        stages.active++;
      } else if (daysSinceEngagement <= 60) {
        stages.atRisk++;
      } else {
        stages.churned++;
      }
    }

    return {
      stages,
      total: contacts.length,
      percentages: {
        new: Math.round((stages.new / contacts.length) * 100),
        active: Math.round((stages.active / contacts.length) * 100),
        atRisk: Math.round((stages.atRisk / contacts.length) * 100),
        churned: Math.round((stages.churned / contacts.length) * 100),
      },
    };
  },
});

// Get growth metrics for startup dashboard
export const getGrowthMetrics = query({
  args: {
    businessId: v.id("businesses"),
    timeRange: v.optional(v.number()), // days
  },
  handler: async (ctx, args) => {
    const timeRange = args.timeRange ?? 30;
    const startTime = Date.now() - timeRange * 24 * 60 * 60 * 1000;

    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    // Calculate growth metrics
    const newContacts = contacts.filter((c) => c.createdAt >= startTime);
    const activeContacts = contacts.filter(
      (c) => c.lastEngagedAt && c.lastEngagedAt >= startTime
    );

    // Calculate growth rate
    const previousPeriodStart = startTime - timeRange * 24 * 60 * 60 * 1000;
    const previousContacts = contacts.filter(
      (c) => c.createdAt >= previousPeriodStart && c.createdAt < startTime
    );

    const growthRate =
      previousContacts.length > 0
        ? ((newContacts.length - previousContacts.length) / previousContacts.length) * 100
        : 0;

    // Calculate engagement rate
    const engagementRate =
      contacts.length > 0 ? (activeContacts.length / contacts.length) * 100 : 0;

    // Daily breakdown
    const dailyGrowth = [];
    for (let i = timeRange - 1; i >= 0; i--) {
      const dayStart = Date.now() - i * 24 * 60 * 60 * 1000;
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const dayContacts = contacts.filter(
        (c) => c.createdAt >= dayStart && c.createdAt < dayEnd
      );

      dailyGrowth.push({
        date: new Date(dayStart).toISOString().split("T")[0],
        newContacts: dayContacts.length,
        totalContacts: contacts.filter((c) => c.createdAt < dayEnd).length,
      });
    }

    return {
      totalContacts: contacts.length,
      newContacts: newContacts.length,
      activeContacts: activeContacts.length,
      growthRate: Math.round(growthRate * 10) / 10,
      engagementRate: Math.round(engagementRate * 10) / 10,
      dailyGrowth,
    };
  },
});

// Helper functions
function getIntervalMs(interval: string): number {
  switch (interval) {
    case "daily":
      return 24 * 60 * 60 * 1000;
    case "weekly":
      return 7 * 24 * 60 * 60 * 1000;
    case "monthly":
      return 30 * 24 * 60 * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000;
  }
}

function getSegmentValue(contact: any, field: string): string {
  if (field === "source") {
    return contact.source || "unknown";
  } else if (field === "status") {
    return contact.status || "unknown";
  }
  return "other";
}

function calculateRetentionRate(contacts: any[], days: number): number {
  if (contacts.length === 0) return 0;
  
  const now = Date.now();
  const cutoffTime = now - days * 24 * 60 * 60 * 1000;
  
  const eligibleContacts = contacts.filter((c) => c.createdAt < cutoffTime);
  if (eligibleContacts.length === 0) return 0;
  
  const retainedCount = eligibleContacts.filter(
    (c) => c.lastEngagedAt && c.lastEngagedAt >= cutoffTime
  ).length;
  
  return Math.round((retainedCount / eligibleContacts.length) * 100);
}