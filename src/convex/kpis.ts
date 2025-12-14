import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get growth metrics with funnel tracking and CAC calculations
export const getGrowthMetrics = query({
  args: { 
    businessId: v.optional(v.id("businesses")),
    timeRange: v.optional(v.union(v.literal("7d"), v.literal("30d"), v.literal("90d"), v.literal("1y")))
  },
  handler: async (ctx, args) => {
    // Guest-safe: return demo data if no businessId
    if (!args.businessId) {
      return {
        summary: {
          totalRevenue: 45000,
          activeCustomers: 127,
          conversionRate: 3.2,
          avgCAC: 125,
          avgLTV: 850,
          ltvcacRatio: 6.8,
        },
        conversionFunnel: [
          { stage: "Visitors", count: 5000, rate: 100 },
          { stage: "Leads", count: 800, rate: 16 },
          { stage: "Qualified", count: 320, rate: 6.4 },
          { stage: "Customers", count: 160, rate: 3.2 },
        ],
        trends: [
          { date: "Week 1", revenue: 8500, cac: 135, customers: 22 },
          { date: "Week 2", revenue: 9200, cac: 128, customers: 25 },
          { date: "Week 3", revenue: 10100, cac: 122, customers: 28 },
          { date: "Week 4", revenue: 11200, cac: 118, customers: 31 },
          { date: "Week 5", revenue: 12000, cac: 125, customers: 35 },
        ],
        cacByChannel: [
          { channel: "Organic", cac: 45, customers: 50 },
          { channel: "Paid Social", cac: 180, customers: 35 },
          { channel: "Email", cac: 25, customers: 40 },
          { channel: "Referral", cac: 15, customers: 42 },
        ],
      };
    }

    const businessId = args.businessId;
    const timeRange = args.timeRange || "30d";
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365;
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

    // Get business data
    const business = await ctx.db.get(businessId);
    if (!business) {
      return {
        summary: { totalRevenue: 0, activeCustomers: 0, conversionRate: 0, avgCAC: 0, avgLTV: 0, ltvcacRatio: 0 },
        conversionFunnel: [],
        trends: [],
        cacByChannel: [],
      };
    }

    // Calculate funnel metrics from audit logs and contacts
    const auditLogs = await ctx.db
      .query("audit_logs")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .filter((q) => q.gte(q.field("createdAt"), cutoffTime))
      .collect();

    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .collect();

    // Calculate funnel stages
    const visitors = auditLogs.filter(log => log.action === "page_view").length || 1000;
    const leads = contacts.length;
    const qualified = contacts.filter(c => c.status === "subscribed").length;
    const customers = auditLogs.filter(log => log.action === "purchase" || log.action === "subscription_created").length;

    const conversionFunnel = [
      { stage: "Visitors", count: visitors, rate: 100 },
      { stage: "Leads", count: leads, rate: parseFloat((leads / visitors * 100).toFixed(1)) },
      { stage: "Qualified", count: qualified, rate: parseFloat((qualified / visitors * 100).toFixed(1)) },
      { stage: "Customers", count: customers, rate: parseFloat((customers / visitors * 100).toFixed(1)) },
    ];

    // Calculate CAC and LTV
    const marketingSpend = 15000; // TODO: Get from actual spend tracking
    const avgCAC = customers > 0 ? Math.round(marketingSpend / customers) : 0;
    const avgLTV = 850; // TODO: Calculate from actual customer lifetime value
    const ltvcacRatio = avgCAC > 0 ? parseFloat((avgLTV / avgCAC).toFixed(1)) : 0;

    // Get revenue from KPI snapshots
    const kpiSnapshots = await ctx.db
      .query("dashboardKpis")
      .withIndex("by_business_and_date", (q) => q.eq("businessId", businessId))
      .collect();

    const totalRevenue = kpiSnapshots.reduce((sum, kpi) => sum + (kpi.revenue || 0), 0);

    // Generate trend data (weekly aggregates)
    const weeklyData: any[] = [];
    const weeksToShow = Math.min(5, Math.ceil(days / 7));
    for (let i = 0; i < weeksToShow; i++) {
      const weekStart = cutoffTime + (i * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = weekStart + (7 * 24 * 60 * 60 * 1000);
      
      const weekKpis = kpiSnapshots.filter(kpi => {
        const kpiTime = new Date(kpi.date).getTime();
        return kpiTime >= weekStart && kpiTime < weekEnd;
      });
      
      const weekRevenue = weekKpis.reduce((sum, kpi) => sum + (kpi.revenue || 0), 0);
      const weekCustomers = Math.floor(customers / weeksToShow);
      const weekCAC = weekCustomers > 0 ? Math.round(marketingSpend / weeksToShow / weekCustomers) : avgCAC;
      
      weeklyData.push({
        date: `Week ${i + 1}`,
        revenue: weekRevenue || (totalRevenue / weeksToShow),
        cac: weekCAC,
        customers: weekCustomers,
      });
    }

    // CAC by channel (mock data - TODO: integrate with actual channel tracking)
    const cacByChannel = [
      { channel: "Organic", cac: Math.round(avgCAC * 0.4), customers: Math.floor(customers * 0.35) },
      { channel: "Paid Social", cac: Math.round(avgCAC * 1.5), customers: Math.floor(customers * 0.25) },
      { channel: "Email", cac: Math.round(avgCAC * 0.2), customers: Math.floor(customers * 0.25) },
      { channel: "Referral", cac: Math.round(avgCAC * 0.15), customers: Math.floor(customers * 0.15) },
    ];

    return {
      summary: {
        totalRevenue: Math.round(totalRevenue),
        activeCustomers: customers,
        conversionRate: parseFloat((customers / visitors * 100).toFixed(1)),
        avgCAC,
        avgLTV,
        ltvcacRatio,
      },
      conversionFunnel,
      trends: weeklyData,
      cacByChannel,
    };
  },
});

// Get latest KPI snapshot for a business
export const latestForBusiness = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const snapshots = await ctx.db
      .query("dashboardKpis")
      .withIndex("by_business_and_date", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .take(1);
    return snapshots[0] || null;
  },
});

// Make getSnapshot guest-safe and accept optional args
export const getSnapshot = query({
  args: { 
    businessId: v.optional(v.id("businesses")), 
    date: v.optional(v.string()) 
  },
  handler: async (ctx, args) => {
    // Return null if businessId is not provided (guest/public views)
    if (!args.businessId) {
      return null;
    }

    // If no date provided, get the latest snapshot
    if (!args.date) {
      const snapshots = await ctx.db
        .query("dashboardKpis")
        .withIndex("by_business_and_date", (q) => q.eq("businessId", args.businessId!))
        .order("desc")
        .first();
      return snapshots || null;
    }

    // Get snapshot for specific date
    const snapshots = await ctx.db
      .query("dashboardKpis")
      .withIndex("by_business_and_date", (q) => 
        q.eq("businessId", args.businessId!).eq("date", args.date!)
      )
      .first();
    return snapshots || null;
  },
});

// Upsert a KPI snapshot
export const upsert = mutation({
  args: {
    businessId: v.id("businesses"),
    date: v.string(),
    visitors: v.number(),
    subscribers: v.number(),
    engagement: v.number(),
    revenue: v.number(),
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
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        visitors: args.visitors,
        subscribers: args.subscribers,
        engagement: args.engagement,
        revenue: args.revenue,
        subscribersDelta: args.subscribersDelta,
        engagementDelta: args.engagementDelta,
        revenueDelta: args.revenueDelta,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("dashboardKpis", {
        businessId: args.businessId,
        date: args.date,
        visitors: args.visitors,
        subscribers: args.subscribers,
        engagement: args.engagement,
        revenue: args.revenue,
        subscribersDelta: args.subscribersDelta,
        engagementDelta: args.engagementDelta,
        revenueDelta: args.revenueDelta,
      });
    }
  },
});

// Seed demo KPI snapshot
export const seedDemoKpisSnapshot = mutation({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];
    await ctx.db.insert("dashboardKpis", {
      businessId: args.businessId,
      date: today,
      visitors: 1200,
      subscribers: 450,
      engagement: 68,
      revenue: 15000,
      subscribersDelta: 8,
      engagementDelta: 3,
      revenueDelta: 15,
    });
    return { success: true };
  },
});