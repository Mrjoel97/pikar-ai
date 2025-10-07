import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Add: latest KPI snapshot for a business
export const latestForBusiness = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    // Use by_business_and_date to get latest by date (string YYYY-MM-DD)
    // We'll scan and keep the max since date is a string; dataset is small for dev
    let latest: any | null = null;
    for await (const row of ctx.db
      .query("dashboardKpis")
      .withIndex("by_business_and_date", (q) => q.eq("businessId", args.businessId))) {
      if (!latest || row.date > latest.date) {
        latest = row;
      }
    }
    return latest;
  },
});

// Get the latest KPI snapshot for a business (fallback to zeros)
export const getSnapshot = query({
  args: { businessId: v.optional(v.id("businesses")) },
  handler: async (ctx, args) => {
    // Guest-safe: return default zeros if no businessId provided
    if (!args.businessId) {
      return {
        businessId: undefined as any,
        date: new Date().toISOString().slice(0, 10),
        visitors: 0,
        subscribers: 0,
        engagement: 0,
        revenue: 0,
        visitorsDelta: 0,
        subscribersDelta: 0,
        engagementDelta: 0,
        revenueDelta: 0,
      };
    }

    const latest = await ctx.db
      .query("dashboardKpis")
      .withIndex("by_business_and_date", (q) =>
        q.eq("businessId", args.businessId!)
      )
      .order("desc")
      .first();

    if (!latest) {
      return {
        businessId: args.businessId,
        date: new Date().toISOString().slice(0, 10),
        visitors: 0,
        subscribers: 0,
        engagement: 0,
        revenue: 0,
        visitorsDelta: 0,
        subscribersDelta: 0,
        engagementDelta: 0,
        revenueDelta: 0,
      };
    }
    return latest;
  },
});

// Upsert a KPI snapshot (one per business per date)
export const upsert = mutation({
  args: {
    businessId: v.id("businesses"),
    date: v.string(), // YYYY-MM-DD
    visitors: v.number(),
    subscribers: v.number(),
    engagement: v.number(), // percentage 0-100
    revenue: v.number(), // numeric summary
    visitorsDelta: v.optional(v.number()),
    subscribersDelta: v.optional(v.number()),
    engagementDelta: v.optional(v.number()),
    revenueDelta: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dashboardKpis")
      .withIndex("by_business_and_date", (q) =>
        q.eq("businessId", args.businessId).eq("date", args.date)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        visitors: args.visitors,
        subscribers: args.subscribers,
        engagement: args.engagement,
        revenue: args.revenue,
        visitorsDelta: args.visitorsDelta ?? existing.visitorsDelta ?? 0,
        subscribersDelta: args.subscribersDelta ?? existing.subscribersDelta ?? 0,
        engagementDelta: args.engagementDelta ?? existing.engagementDelta ?? 0,
        revenueDelta: args.revenueDelta ?? existing.revenueDelta ?? 0,
      });
      return existing._id;
    }

    return await ctx.db.insert("dashboardKpis", {
      businessId: args.businessId,
      date: args.date,
      visitors: args.visitors,
      subscribers: args.subscribers,
      engagement: args.engagement,
      revenue: args.revenue,
      visitorsDelta: args.visitorsDelta ?? 0,
      subscribersDelta: args.subscribersDelta ?? 0,
      engagementDelta: args.engagementDelta ?? 0,
      revenueDelta: args.revenueDelta ?? 0,
    });
  },
});

export const seedDemoKpisSnapshot = mutation({
  args: {
    businessId: v.id("businesses"),
    visitors: v.number(),
    subscribers: v.number(),
    engagement: v.number(),
    revenue: v.number(),
    visitorsDelta: v.optional(v.number()),
    subscribersDelta: v.optional(v.number()),
    engagementDelta: v.optional(v.number()),
    revenueDelta: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const doc = {
      businessId: args.businessId,
      visitors: args.visitors,
      subscribers: args.subscribers,
      engagement: args.engagement,
      revenue: args.revenue,
      visitorsDelta: args.visitorsDelta ?? 12,
      subscribersDelta: args.subscribersDelta ?? 8,
      engagementDelta: args.engagementDelta ?? 5,
      revenueDelta: args.revenueDelta ?? 15,
      snapshotAt: Date.now(),
    } as any;

    await ctx.db.insert("dashboardKpis", doc);
    return null;
  },
});