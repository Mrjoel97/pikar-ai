import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get cohort analysis by signup month
 */
export const getCohortAnalysis = query({
  args: {
    businessId: v.id("businesses"),
    months: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const months = args.months || 6;
    const now = Date.now();

    // Get all contacts
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .take(1000);

    // Group by cohort (signup month)
    const cohorts = new Map<string, any>();

    for (const contact of contacts) {
      const signupDate = new Date(contact.createdAt);
      const cohortKey = `${signupDate.getFullYear()}-${String(
        signupDate.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!cohorts.has(cohortKey)) {
        cohorts.set(cohortKey, {
          cohort: cohortKey,
          signupDate: contact.createdAt,
          size: 0,
          active: 0,
          churned: 0,
          revenue: 0,
        });
      }

      const cohort = cohorts.get(cohortKey)!;
      cohort.size++;

      if (contact.status === "active") cohort.active++;
      if (contact.status === "churned") cohort.churned++;
    }

    // Convert to array and sort by date
    const cohortArray = Array.from(cohorts.values())
      .sort((a, b) => b.signupDate - a.signupDate)
      .slice(0, months);

    return cohortArray;
  },
});

/**
 * Get cohort retention rates
 */
export const getCohortRetention = query({
  args: {
    businessId: v.id("businesses"),
    cohortMonth: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Parse cohort month
    const [year, month] = args.cohortMonth.split("-").map(Number);
    const cohortStart = new Date(year, month - 1, 1).getTime();
    const cohortEnd = new Date(year, month, 1).getTime();

    // Get contacts from this cohort
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), cohortStart),
          q.lt(q.field("createdAt"), cohortEnd)
        )
      )
      .take(500);

    const cohortSize = contacts.length;
    if (cohortSize === 0) return null;

    // Calculate retention for each month
    const retentionData = [];
    const now = Date.now();
    const monthsSinceCohort = Math.floor(
      (now - cohortStart) / (30 * 24 * 60 * 60 * 1000)
    );

    for (let month = 0; month <= Math.min(monthsSinceCohort, 12); month++) {
      const monthStart = cohortStart + month * 30 * 24 * 60 * 60 * 1000;
      const monthEnd = monthStart + 30 * 24 * 60 * 60 * 1000;

      // Count active contacts in this month
      const activeCount = contacts.filter((c) => {
        if (c.status === "churned" && c.updatedAt && c.updatedAt < monthEnd) {
          return false;
        }
        return true;
      }).length;

      retentionData.push({
        month,
        retained: activeCount,
        retentionRate: Math.round((activeCount / cohortSize) * 100),
      });
    }

    return {
      cohort: args.cohortMonth,
      cohortSize,
      retentionData,
    };
  },
});

/**
 * Get cohort LTV (Lifetime Value)
 */
export const getCohortLTV = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Get all contacts with revenue data
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .take(1000);

    // Group by cohort and calculate LTV
    const cohortLTV = new Map<string, { size: number; totalRevenue: number }>();

    for (const contact of contacts) {
      const signupDate = new Date(contact.createdAt);
      const cohortKey = `${signupDate.getFullYear()}-${String(
        signupDate.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!cohortLTV.has(cohortKey)) {
        cohortLTV.set(cohortKey, { size: 0, totalRevenue: 0 });
      }

      const cohort = cohortLTV.get(cohortKey)!;
      cohort.size++;
      // Note: Add revenue tracking to contacts schema for accurate LTV
      cohort.totalRevenue += 0; // Placeholder
    }

    // Calculate average LTV per cohort
    const ltvData = Array.from(cohortLTV.entries()).map(([cohort, data]) => ({
      cohort,
      size: data.size,
      totalRevenue: data.totalRevenue,
      averageLTV: data.size > 0 ? Math.round(data.totalRevenue / data.size) : 0,
    }));

    return ltvData.sort((a, b) => b.cohort.localeCompare(a.cohort)).slice(0, 12);
  },
});