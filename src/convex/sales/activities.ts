import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// Log a sales activity
export const logActivity = mutation({
  args: {
    businessId: v.id("businesses"),
    dealId: v.optional(v.id("crmDeals")),
    userId: v.id("users"),
    activityType: v.union(
      v.literal("call"),
      v.literal("email"),
      v.literal("meeting"),
      v.literal("note"),
      v.literal("task")
    ),
    subject: v.string(),
    description: v.optional(v.string()),
    duration: v.optional(v.number()), // minutes
    outcome: v.optional(v.string()),
    nextSteps: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const activityId = await ctx.db.insert("activityFeed", {
      businessId: args.businessId,
      userId: args.userId,
      type: `sales_${args.activityType}`,
      content: args.subject,
      data: {
        dealId: args.dealId,
        activityType: args.activityType,
        description: args.description,
        duration: args.duration,
        outcome: args.outcome,
        nextSteps: args.nextSteps,
      },
      isRead: false,
      createdAt: Date.now(),
    });

    return activityId;
  },
});

// Get activities for a deal
export const getDealActivities = query({
  args: { dealId: v.id("crmDeals") },
  handler: async (ctx, args) => {
    const deal = await ctx.db.get(args.dealId);
    if (!deal) return [];

    const activities = await ctx.db
      .query("activityFeed")
      .withIndex("by_business", (q) => q.eq("businessId", deal.businessId))
      .filter((q) => q.eq(q.field("data.dealId"), args.dealId))
      .order("desc")
      .take(50);

    return activities;
  },
});

// Get recent sales activities for a business
export const getRecentActivities = query({
  args: {
    businessId: v.id("businesses"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    const activities = await ctx.db
      .query("activityFeed")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => 
        q.or(
          q.eq(q.field("type"), "sales_call"),
          q.eq(q.field("type"), "sales_email"),
          q.eq(q.field("type"), "sales_meeting"),
          q.eq(q.field("type"), "sales_note"),
          q.eq(q.field("type"), "deal_created"),
          q.eq(q.field("type"), "deal_stage_changed")
        )
      )
      .order("desc")
      .take(limit);

    return activities;
  },
});

// Get activity statistics
export const getActivityStats = query({
  args: {
    businessId: v.id("businesses"),
    userId: v.optional(v.id("users")),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysToAnalyze = args.days || 30;
    const cutoffTime = Date.now() - (daysToAnalyze * 24 * 60 * 60 * 1000);

    let activitiesQuery = ctx.db
      .query("activityFeed")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId));

    if (args.userId) {
      activitiesQuery = activitiesQuery.filter((q) => 
        q.eq(q.field("userId"), args.userId)
      );
    }

    const activities = await activitiesQuery
      .filter((q) => q.gte(q.field("createdAt"), cutoffTime))
      .collect();

    const salesActivities = activities.filter(a => 
      a.type.startsWith("sales_")
    );

    const activityCounts = {
      calls: salesActivities.filter(a => a.type === "sales_call").length,
      emails: salesActivities.filter(a => a.type === "sales_email").length,
      meetings: salesActivities.filter(a => a.type === "sales_meeting").length,
      notes: salesActivities.filter(a => a.type === "sales_note").length,
    };

    const totalDuration = salesActivities.reduce((sum, a) => 
      sum + (a.data?.duration || 0), 0
    );

    return {
      totalActivities: salesActivities.length,
      activityCounts,
      totalDuration,
      avgActivitiesPerDay: salesActivities.length / daysToAnalyze,
      periodDays: daysToAnalyze,
    };
  },
});