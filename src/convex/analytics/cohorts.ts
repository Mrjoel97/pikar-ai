import { v } from "convex/values";
import { query } from "../_generated/server";

// Get cohort analysis data
export const getCohortAnalysis = query({
  args: {
    businessId: v.id("businesses"),
    startDate: v.number(),
    endDate: v.number(),
    cohortType: v.union(
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("quarterly")
    ),
  },
  handler: async (ctx, args) => {
    // Get all contacts created in the date range
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

    // Group contacts into cohorts based on creation date
    const cohorts = new Map<string, any>();
    
    for (const contact of contacts) {
      const cohortKey = getCohortKey(contact.createdAt, args.cohortType);
      
      if (!cohorts.has(cohortKey)) {
        cohorts.set(cohortKey, {
          cohortKey,
          cohortDate: contact.createdAt,
          totalUsers: 0,
          activeUsers: new Map<number, number>(),
          retentionRates: [],
        });
      }
      
      const cohort = cohorts.get(cohortKey)!;
      cohort.totalUsers++;
      
      // Track activity over time periods
      if (contact.lastEngagedAt) {
        const periodsSinceJoin = getPeriodsSince(
          contact.createdAt,
          contact.lastEngagedAt,
          args.cohortType
        );
        
        const currentCount = cohort.activeUsers.get(periodsSinceJoin) || 0;
        cohort.activeUsers.set(periodsSinceJoin, currentCount + 1);
      }
    }

    // Calculate retention rates for each cohort
    const cohortData = Array.from(cohorts.values()).map((cohort) => {
      const retentionRates: number[] = [];
      const maxPeriods = 12; // Track up to 12 periods
      
      for (let period = 0; period <= maxPeriods; period++) {
        const activeCount = cohort.activeUsers.get(period) || 0;
        const rate = cohort.totalUsers > 0 
          ? Math.round((activeCount / cohort.totalUsers) * 100) 
          : 0;
        retentionRates.push(rate);
      }
      
      return {
        cohortKey: cohort.cohortKey,
        cohortDate: cohort.cohortDate,
        totalUsers: cohort.totalUsers,
        retentionRates,
      };
    });

    return cohortData.sort((a, b) => a.cohortDate - b.cohortDate);
  },
});

// Get cohort comparison metrics
export const getCohortComparison = query({
  args: {
    businessId: v.id("businesses"),
    cohortKeys: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const comparisons = [];
    
    for (const cohortKey of args.cohortKeys) {
      const contacts = await ctx.db
        .query("contacts")
        .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
        .collect();
      
      // Filter contacts for this cohort
      const cohortContacts = contacts.filter((c) => {
        const key = getCohortKey(c.createdAt, "monthly");
        return key === cohortKey;
      });
      
      // Calculate metrics
      const totalRevenue = cohortContacts.length * 50; // Placeholder calculation
      const avgLifetimeValue = cohortContacts.length > 0 
        ? totalRevenue / cohortContacts.length 
        : 0;
      
      comparisons.push({
        cohortKey,
        size: cohortContacts.length,
        totalRevenue,
        avgLifetimeValue,
        activeRate: calculateActiveRate(cohortContacts),
      });
    }
    
    return comparisons;
  },
});

// Helper functions
function getCohortKey(timestamp: number, type: string): string {
  const date = new Date(timestamp);
  
  if (type === "weekly") {
    const weekNum = getWeekNumber(date);
    return `${date.getFullYear()}-W${weekNum}`;
  } else if (type === "monthly") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  } else {
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return `${date.getFullYear()}-Q${quarter}`;
  }
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function getPeriodsSince(startDate: number, endDate: number, type: string): number {
  const diffMs = endDate - startDate;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  if (type === "weekly") {
    return Math.floor(diffDays / 7);
  } else if (type === "monthly") {
    return Math.floor(diffDays / 30);
  } else {
    return Math.floor(diffDays / 90);
  }
}

function calculateActiveRate(contacts: any[]): number {
  if (contacts.length === 0) return 0;
  
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  
  const activeCount = contacts.filter(
    (c) => c.lastEngagedAt && c.lastEngagedAt > thirtyDaysAgo
  ).length;
  
  return Math.round((activeCount / contacts.length) * 100);
}
