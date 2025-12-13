import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Calculate time-to-revenue ROI based on time saved and hourly rate
 */
export const calculateTimeSavedROI = query({
  args: {
    businessId: v.id("businesses"),
    userId: v.id("users"),
    days: v.optional(v.number()), // Default to 30 days
  },
  handler: async (ctx: any, args) => {
    const days = args.days ?? 30;
    const startTime = Date.now() - days * 24 * 60 * 60 * 1000;

    // Get user's hourly rate from agent profile
    const agentProfile = await ctx.db
      .query("agentProfiles")
      .withIndex("by_user_and_business", (q: any) =>
        q.eq("userId", args.userId).eq("businessId", args.businessId)
      )
      .first();

    const hourlyRate = agentProfile?.preferences?.hourlyRate ?? 50; // Default $50/hr

    // Get time saved from audit logs (wins)
    const auditLogs = await ctx.db
      .query("audit_logs")
      .filter((q: any) =>
        q.and(
          q.eq(q.field("businessId"), args.businessId),
          q.gte(q.field("createdAt"), startTime)
        )
      )
      .collect();

    const timeSavedMinutes = auditLogs.reduce((total: number, log: any) => {
      return total + (log.details?.timeSavedMinutes ?? 0);
    }, 0);

    const timeSavedHours = timeSavedMinutes / 60;
    const estimatedRevenue = timeSavedHours * hourlyRate;

    // Get actual revenue events
    const revenueEvents = await ctx.db
      .query("revenueEvents")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId))
      .collect();
    
    // Filter by timestamp in memory since we can't use filter after withIndex
    const filteredRevenueEvents = revenueEvents.filter(
      (event: any) => event.timestamp >= startTime
    );

    const actualRevenue = filteredRevenueEvents.reduce((total: number, event: any) => {
      return total + event.amount;
    }, 0);

    // Calculate ROI percentage
    const roiPercentage = estimatedRevenue > 0 ? (actualRevenue / estimatedRevenue) * 100 : 0;

    // Get daily breakdown for chart
    const dailyData: Array<{
      date: string;
      timeSaved: number;
      revenue: number;
    }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = Date.now() - i * 24 * 60 * 60 * 1000;
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const dayLogs = auditLogs.filter(
        (log: any) => log.createdAt && log.createdAt >= dayStart && log.createdAt < dayEnd
      );
      const dayRevenue = filteredRevenueEvents.filter(
        (event: any) => event.timestamp >= dayStart && event.timestamp < dayEnd
      );

      const dayTimeSaved = dayLogs.reduce((total: number, log: any) => {
        return total + (log.details?.timeSavedMinutes ?? 0);
      }, 0);

      const dayRevenueAmount = dayRevenue.reduce((total: number, event: any) => {
        return total + event.amount;
      }, 0);

      dailyData.push({
        date: new Date(dayStart).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        timeSaved: Math.round(dayTimeSaved),
        revenue: Math.round(dayRevenueAmount),
      });
    }

    return {
      timeSavedMinutes: Math.round(timeSavedMinutes),
      timeSavedHours: Math.round(timeSavedHours * 10) / 10,
      hourlyRate,
      estimatedRevenue: Math.round(estimatedRevenue),
      actualRevenue: Math.round(actualRevenue),
      roiPercentage: Math.round(roiPercentage),
      dailyData,
      period: days,
    };
  },
});

/**
 * Get historical ROI trends over time
 */
export const getHistoricalROITrends = query({
  args: {
    businessId: v.id("businesses"),
    userId: v.id("users"),
    months: v.optional(v.number()), // Default 6 months
  },
  handler: async (ctx: any, args) => {
    const months = args.months ?? 6;
    const startTime = Date.now() - months * 30 * 24 * 60 * 60 * 1000;

    // Get user's hourly rate
    const agentProfile = await ctx.db
      .query("agentProfiles")
      .withIndex("by_user_and_business", (q: any) =>
        q.eq("userId", args.userId).eq("businessId", args.businessId)
      )
      .first();

    const hourlyRate = agentProfile?.preferences?.hourlyRate ?? 50;

    // Get all historical data
    const auditLogs = await ctx.db
      .query("audit_logs")
      .filter((q: any) =>
        q.and(
          q.eq(q.field("businessId"), args.businessId),
          q.gte(q.field("createdAt"), startTime)
        )
      )
      .collect();

    const revenueEvents = await ctx.db
      .query("revenueEvents")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId))
      .collect();

    const filteredRevenue = revenueEvents.filter(
      (event: any) => event.timestamp >= startTime
    );

    // Group by month
    const monthlyData: Array<{
      month: string;
      timeSavedHours: number;
      estimatedRevenue: number;
      actualRevenue: number;
      roi: number;
    }> = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = Date.now() - i * 30 * 24 * 60 * 60 * 1000;
      const monthEnd = monthStart + 30 * 24 * 60 * 60 * 1000;

      const monthLogs = auditLogs.filter(
        (log: any) => log.createdAt >= monthStart && log.createdAt < monthEnd
      );
      const monthRevenue = filteredRevenue.filter(
        (event: any) => event.timestamp >= monthStart && event.timestamp < monthEnd
      );

      const timeSavedMinutes = monthLogs.reduce(
        (total: number, log: any) => total + (log.details?.timeSavedMinutes ?? 0),
        0
      );
      const timeSavedHours = timeSavedMinutes / 60;
      const estimatedRevenue = timeSavedHours * hourlyRate;
      const actualRevenue = monthRevenue.reduce(
        (total: number, event: any) => total + event.amount,
        0
      );
      const roi = estimatedRevenue > 0 ? (actualRevenue / estimatedRevenue) * 100 : 0;

      monthlyData.push({
        month: new Date(monthStart).toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        timeSavedHours: Math.round(timeSavedHours * 10) / 10,
        estimatedRevenue: Math.round(estimatedRevenue),
        actualRevenue: Math.round(actualRevenue),
        roi: Math.round(roi),
      });
    }

    // Calculate trend
    const roiValues = monthlyData.map((d) => d.roi);
    const avgROI = roiValues.reduce((a, b) => a + b, 0) / roiValues.length;
    const trend =
      roiValues.length > 1
        ? roiValues[roiValues.length - 1] - roiValues[0]
        : 0;

    return {
      monthlyData,
      summary: {
        averageROI: Math.round(avgROI),
        trend: Math.round(trend),
        trendDirection: trend > 0 ? "up" : trend < 0 ? "down" : "stable",
      },
    };
  },
});

/**
 * Log a revenue event for ROI tracking
 */
export const logRevenueEvent = mutation({
  args: {
    businessId: v.id("businesses"),
    userId: v.id("users"),
    amount: v.number(),
    source: v.string(), // e.g., "invoice_paid", "subscription", "sale"
    description: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const revenueEventId = await ctx.db.insert("revenueEvents", {
      businessId: args.businessId,
      userId: args.userId,
      amount: args.amount,
      source: args.source,
      description: args.description,
      metadata: args.metadata,
      timestamp: Date.now(),
    });

    // Log to audit trail
    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      action: "revenue_logged",
      entityType: "revenue",
      entityId: revenueEventId,
      details: {
        amount: args.amount,
        source: args.source,
      },
      createdAt: Date.now(),
    });

    return revenueEventId;
  },
});

/**
 * Update hourly rate in agent profile
 */
export const updateHourlyRate = mutation({
  args: {
    businessId: v.id("businesses"),
    userId: v.id("users"),
    hourlyRate: v.number(),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const agentProfile = await ctx.db
      .query("agentProfiles")
      .withIndex("by_user_and_business", (q: any) =>
        q.eq("userId", args.userId).eq("businessId", args.businessId)
      )
      .first();

    if (agentProfile) {
      const currentPrefs = agentProfile.preferences || {
        automations: {
          invoicing: false,
          emailDrafts: false,
          socialPosts: false,
        },
      };
      
      await ctx.db.patch(agentProfile._id, {
        preferences: {
          ...currentPrefs,
          hourlyRate: args.hourlyRate,
          automations: currentPrefs.automations || {
            invoicing: false,
            emailDrafts: false,
            socialPosts: false,
          },
        },
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("agentProfiles", {
        userId: args.userId,
        businessId: args.businessId,
        preferences: {
          hourlyRate: args.hourlyRate,
          automations: {
            invoicing: false,
            emailDrafts: false,
            socialPosts: false,
          },
        },
        lastUpdated: Date.now(),
      });
    }

    return { success: true };
  },
});