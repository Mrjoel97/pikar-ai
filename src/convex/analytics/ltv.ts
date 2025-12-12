import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Calculate Customer Lifetime Value (LTV)
 */
export const calculateLTV = query({
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

    // Calculate average revenue per customer (placeholder - needs revenue tracking)
    const totalRevenue = 0; // Sum from invoices or revenue tracking
    const avgRevenuePerCustomer = contacts.length > 0 ? totalRevenue / contacts.length : 0;

    // Calculate average customer lifespan
    const now = Date.now();
    const avgLifespan = contacts.reduce((sum, c) => {
      const lifespan = (now - c.createdAt) / (365 * 24 * 60 * 60 * 1000); // years
      return sum + lifespan;
    }, 0) / contacts.length;

    // LTV = Average Revenue per Customer × Average Customer Lifespan
    const ltv = avgRevenuePerCustomer * avgLifespan;

    return {
      ltv: Math.round(ltv),
      avgRevenuePerCustomer: Math.round(avgRevenuePerCustomer),
      avgLifespanYears: Math.round(avgLifespan * 10) / 10,
      totalCustomers: contacts.length,
    };
  },
});

/**
 * Calculate Customer Acquisition Cost (CAC)
 */
export const calculateCAC = query({
  args: {
    businessId: v.id("businesses"),
    timeRange: v.optional(v.number()), // days
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const timeRange = args.timeRange || 30;
    const startTime = Date.now() - timeRange * 24 * 60 * 60 * 1000;

    // Get new customers in time range
    const newCustomers = await ctx.db
      .query("contacts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.gte(q.field("createdAt"), startTime))
      .take(500);

    // Calculate marketing spend (placeholder - needs expense tracking)
    const marketingSpend = 0; // Sum from campaigns, ads, etc.

    // CAC = Total Marketing Spend / Number of New Customers
    const cac = newCustomers.length > 0 ? marketingSpend / newCustomers.length : 0;

    return {
      cac: Math.round(cac),
      newCustomers: newCustomers.length,
      marketingSpend,
      timeRange,
    };
  },
});

/**
 * Get LTV/CAC ratio
 */
export const getLTVCACRatio = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const ltvData = await ctx.runQuery("analytics.ltv:calculateLTV" as any, {
      businessId: args.businessId,
    });

    const cacData = await ctx.runQuery("analytics.ltv:calculateCAC" as any, {
      businessId: args.businessId,
    });

    if (!ltvData || !cacData) return null;

    const ratio = cacData.cac > 0 ? ltvData.ltv / cacData.cac : 0;

    // Ratio interpretation
    let health: "poor" | "fair" | "good" | "excellent";
    if (ratio < 1) health = "poor";
    else if (ratio < 3) health = "fair";
    else if (ratio < 5) health = "good";
    else health = "excellent";

    return {
      ratio: Math.round(ratio * 10) / 10,
      ltv: ltvData.ltv,
      cac: cacData.cac,
      health,
      recommendation:
        ratio < 1
          ? "Critical: CAC exceeds LTV. Reduce acquisition costs or increase customer value."
          : ratio < 3
          ? "Improve: Aim for 3:1 ratio. Focus on retention and upselling."
          : ratio < 5
          ? "Good: Healthy ratio. Continue optimizing both metrics."
          : "Excellent: Strong unit economics. Scale acquisition efforts.",
    };
  },
});

/**
 * Calculate payback period
 */
export const getPaybackPeriod = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const cacData = await ctx.runQuery("analytics.ltv:calculateCAC" as any, {
      businessId: args.businessId,
    });

    const ltvData = await ctx.runQuery("analytics.ltv:calculateLTV" as any, {
      businessId: args.businessId,
    });

    if (!cacData || !ltvData) return null;

    // Payback Period = CAC / (Average Revenue per Customer / 12)
    const monthlyRevenue = ltvData.avgRevenuePerCustomer / 12;
    const paybackMonths = monthlyRevenue > 0 ? cacData.cac / monthlyRevenue : 0;

    return {
      paybackMonths: Math.round(paybackMonths * 10) / 10,
      cac: cacData.cac,
      monthlyRevenue: Math.round(monthlyRevenue),
      recommendation:
        paybackMonths < 12
          ? "Excellent: Quick payback period"
          : paybackMonths < 18
          ? "Good: Reasonable payback period"
          : "Needs improvement: Long payback period may strain cash flow",
    };
  },
});
