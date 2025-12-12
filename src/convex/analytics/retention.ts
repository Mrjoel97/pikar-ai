import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get growth metrics for a business
 */
export const getGrowthMetrics = query({
  args: {
    businessId: v.id("businesses"),
    timeRange: v.number(), // days
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const now = Date.now();
    const startTime = now - args.timeRange * 24 * 60 * 60 * 1000;

    // Get all contacts
    const allContacts = await ctx.db
      .query("contacts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .take(5000);

    const totalContacts = allContacts.length;
    const newContacts = allContacts.filter((c) => c.createdAt >= startTime).length;
    const activeContacts = allContacts.filter((c) => c.status === "active").length;

    // Calculate growth rate
    const previousPeriodStart = startTime - args.timeRange * 24 * 60 * 60 * 1000;
    const previousContacts = allContacts.filter(
      (c) => c.createdAt >= previousPeriodStart && c.createdAt < startTime
    ).length;

    const growthRate =
      previousContacts > 0
        ? Math.round(((newContacts - previousContacts) / previousContacts) * 100)
        : 0;

    // Calculate engagement rate
    const engagementRate =
      totalContacts > 0 ? Math.round((activeContacts / totalContacts) * 100) : 0;

    // Generate daily growth data
    const dailyGrowth = [];
    for (let i = 0; i < Math.min(args.timeRange, 30); i++) {
      const dayStart = now - i * 24 * 60 * 60 * 1000;
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const dayContacts = allContacts.filter(
        (c) => c.createdAt >= dayStart && c.createdAt < dayEnd
      ).length;

      const totalUntilDay = allContacts.filter((c) => c.createdAt < dayEnd).length;

      dailyGrowth.unshift({
        date: new Date(dayStart).toLocaleDateString(),
        newContacts: dayContacts,
        totalContacts: totalUntilDay,
      });
    }

    return {
      totalContacts,
      newContacts,
      activeContacts,
      growthRate,
      engagementRate,
      dailyGrowth,
    };
  },
});

/**
 * Get user lifecycle stages
 */
export const getUserLifecycleStages = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .take(5000);

    const now = Date.now();
    const stages = {
      new: 0, // < 7 days
      active: 0, // engaged in last 30 days
      atRisk: 0, // no engagement 30-60 days
      churned: 0, // no engagement > 60 days or status churned
    };

    const percentages = {
      new: 0,
      active: 0,
      atRisk: 0,
      churned: 0,
    };

    for (const contact of contacts) {
      const daysSinceCreation = (now - contact.createdAt) / (24 * 60 * 60 * 1000);
      const daysSinceUpdate = contact.updatedAt
        ? (now - contact.updatedAt) / (24 * 60 * 60 * 1000)
        : daysSinceCreation;

      if (contact.status === "churned" || daysSinceUpdate > 60) {
        stages.churned++;
      } else if (daysSinceCreation < 7) {
        stages.new++;
      } else if (daysSinceUpdate < 30) {
        stages.active++;
      } else {
        stages.atRisk++;
      }
    }

    const total = contacts.length || 1;
    percentages.new = Math.round((stages.new / total) * 100);
    percentages.active = Math.round((stages.active / total) * 100);
    percentages.atRisk = Math.round((stages.atRisk / total) * 100);
    percentages.churned = Math.round((stages.churned / total) * 100);

    return { stages, percentages };
  },
});