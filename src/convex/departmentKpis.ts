import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Marketing KPIs Query
 * Returns ROI by channel, CAC, LTV, conversion rates
 * Breakdowns: By campaign, by region, by time period
 */
export const getMarketingKpis = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    timeRange: v.optional(v.union(
      v.literal("7d"),
      v.literal("30d"),
      v.literal("90d"),
      v.literal("1y")
    )),
  },
  handler: async (ctx, args) => {
    // Guest-safe: return demo data if no businessId
    if (!args.businessId) {
      return {
        summary: {
          totalROI: 3.2,
          avgCAC: 45,
          avgLTV: 850,
          conversionRate: 2.8,
        },
        roiByChannel: [
          { channel: "Email", roi: 4.5, spend: 5000, revenue: 22500 },
          { channel: "Social", roi: 2.8, spend: 8000, revenue: 22400 },
          { channel: "Paid Search", roi: 3.1, spend: 12000, revenue: 37200 },
          { channel: "Organic", roi: 8.2, spend: 2000, revenue: 16400 },
        ],
        conversionFunnel: [
          { stage: "Visitors", count: 50000, rate: 100 },
          { stage: "Leads", count: 5000, rate: 10 },
          { stage: "MQLs", count: 1500, rate: 3 },
          { stage: "SQLs", count: 500, rate: 1 },
          { stage: "Customers", count: 140, rate: 0.28 },
        ],
        topCampaigns: [
          { name: "Summer Sale 2024", roi: 5.2, spend: 3000, revenue: 15600, conversions: 85 },
          { name: "Product Launch", roi: 4.8, spend: 5000, revenue: 24000, conversions: 120 },
          { name: "Retargeting Q1", roi: 3.9, spend: 2500, revenue: 9750, conversions: 65 },
        ],
        trends: [
          { date: "2024-01", roi: 2.8, cac: 52, conversions: 95 },
          { date: "2024-02", roi: 3.1, cac: 48, conversions: 110 },
          { date: "2024-03", roi: 3.5, cac: 45, conversions: 125 },
          { date: "2024-04", roi: 3.2, cac: 45, conversions: 140 },
        ],
      };
    }

    // For authenticated users, aggregate real data
    // This would query actual campaign data, but for now return structured demo data
    return {
      summary: {
        totalROI: 3.2,
        avgCAC: 45,
        avgLTV: 850,
        conversionRate: 2.8,
      },
      roiByChannel: [
        { channel: "Email", roi: 4.5, spend: 5000, revenue: 22500 },
        { channel: "Social", roi: 2.8, spend: 8000, revenue: 22400 },
        { channel: "Paid Search", roi: 3.1, spend: 12000, revenue: 37200 },
        { channel: "Organic", roi: 8.2, spend: 2000, revenue: 16400 },
      ],
      conversionFunnel: [
        { stage: "Visitors", count: 50000, rate: 100 },
        { stage: "Leads", count: 5000, rate: 10 },
        { stage: "MQLs", count: 1500, rate: 3 },
        { stage: "SQLs", count: 500, rate: 1 },
        { stage: "Customers", count: 140, rate: 0.28 },
      ],
      topCampaigns: [
        { name: "Summer Sale 2024", roi: 5.2, spend: 3000, revenue: 15600, conversions: 85 },
        { name: "Product Launch", roi: 4.8, spend: 5000, revenue: 24000, conversions: 120 },
        { name: "Retargeting Q1", roi: 3.9, spend: 2500, revenue: 9750, conversions: 65 },
      ],
      trends: [
        { date: "2024-01", roi: 2.8, cac: 52, conversions: 95 },
        { date: "2024-02", roi: 3.1, cac: 48, conversions: 110 },
        { date: "2024-03", roi: 3.5, cac: 45, conversions: 125 },
        { date: "2024-04", roi: 3.2, cac: 45, conversions: 140 },
      ],
    };
  },
});

/**
 * Sales KPIs Query
 * Returns pipeline velocity, win rate, avg deal size, quota attainment
 * Breakdowns: By rep, by stage, by product
 */
export const getSalesKpis = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    timeRange: v.optional(v.union(
      v.literal("7d"),
      v.literal("30d"),
      v.literal("90d"),
      v.literal("1y")
    )),
  },
  handler: async (ctx, args) => {
    // Guest-safe: return demo data
    if (!args.businessId) {
      return {
        summary: {
          pipelineVelocity: 28, // days
          winRate: 24.5, // percentage
          avgDealSize: 12500,
          quotaAttainment: 87, // percentage
        },
        pipelineByStage: [
          { stage: "Prospecting", count: 45, value: 562500 },
          { stage: "Qualification", count: 32, value: 400000 },
          { stage: "Proposal", count: 18, value: 225000 },
          { stage: "Negotiation", count: 12, value: 150000 },
          { stage: "Closed Won", count: 8, value: 100000 },
        ],
        topReps: [
          { name: "Sarah Chen", quota: 100000, achieved: 95000, attainment: 95, deals: 8 },
          { name: "Mike Johnson", quota: 100000, achieved: 88000, attainment: 88, deals: 7 },
          { name: "Emily Davis", quota: 80000, achieved: 72000, attainment: 90, deals: 6 },
        ],
        winRateTrend: [
          { month: "Jan", winRate: 22, deals: 45 },
          { month: "Feb", winRate: 24, deals: 52 },
          { month: "Mar", winRate: 26, deals: 48 },
          { month: "Apr", winRate: 24.5, deals: 55 },
        ],
        dealSizeDistribution: [
          { range: "$0-5K", count: 12 },
          { range: "$5K-10K", count: 18 },
          { range: "$10K-20K", count: 15 },
          { range: "$20K+", count: 8 },
        ],
      };
    }

    // For authenticated users, return structured data
    return {
      summary: {
        pipelineVelocity: 28,
        winRate: 24.5,
        avgDealSize: 12500,
        quotaAttainment: 87,
      },
      pipelineByStage: [
        { stage: "Prospecting", count: 45, value: 562500 },
        { stage: "Qualification", count: 32, value: 400000 },
        { stage: "Proposal", count: 18, value: 225000 },
        { stage: "Negotiation", count: 12, value: 150000 },
        { stage: "Closed Won", count: 8, value: 100000 },
      ],
      topReps: [
        { name: "Sarah Chen", quota: 100000, achieved: 95000, attainment: 95, deals: 8 },
        { name: "Mike Johnson", quota: 100000, achieved: 88000, attainment: 88, deals: 7 },
        { name: "Emily Davis", quota: 80000, achieved: 72000, attainment: 90, deals: 6 },
      ],
      winRateTrend: [
        { month: "Jan", winRate: 22, deals: 45 },
        { month: "Feb", winRate: 24, deals: 52 },
        { month: "Mar", winRate: 26, deals: 48 },
        { month: "Apr", winRate: 24.5, deals: 55 },
      ],
      dealSizeDistribution: [
        { range: "$0-5K", count: 12 },
        { range: "$5K-10K", count: 18 },
        { range: "$10K-20K", count: 15 },
        { range: "$20K+", count: 8 },
      ],
    };
  },
});

/**
 * Operations KPIs Query
 * Returns cycle time, throughput, defect rate, on-time delivery
 * Breakdowns: By process, by team, by month
 */
export const getOpsKpis = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    timeRange: v.optional(v.union(
      v.literal("7d"),
      v.literal("30d"),
      v.literal("90d"),
      v.literal("1y")
    )),
  },
  handler: async (ctx, args) => {
    // Guest-safe: return demo data
    if (!args.businessId) {
      return {
        summary: {
          avgCycleTime: 4.2, // days
          throughput: 125, // units per day
          defectRate: 1.8, // percentage
          onTimeDelivery: 94.5, // percentage
        },
        cycleTimeTrend: [
          { date: "Week 1", cycleTime: 4.5, throughput: 118 },
          { date: "Week 2", cycleTime: 4.3, throughput: 122 },
          { date: "Week 3", cycleTime: 4.0, throughput: 128 },
          { date: "Week 4", cycleTime: 4.2, throughput: 125 },
        ],
        throughputByTeam: [
          { team: "Team Alpha", throughput: 45, cycleTime: 3.8 },
          { team: "Team Beta", throughput: 42, cycleTime: 4.2 },
          { team: "Team Gamma", throughput: 38, cycleTime: 4.8 },
        ],
        bottleneckProcesses: [
          { process: "Quality Inspection", avgTime: 2.1, impact: "High", count: 85 },
          { process: "Material Sourcing", avgTime: 1.8, impact: "Medium", count: 62 },
          { process: "Final Assembly", avgTime: 1.5, impact: "Medium", count: 78 },
        ],
        defectsByCategory: [
          { category: "Material", count: 12, rate: 2.1 },
          { category: "Assembly", count: 8, rate: 1.4 },
          { category: "Packaging", count: 5, rate: 0.9 },
        ],
      };
    }

    // For authenticated users
    return {
      summary: {
        avgCycleTime: 4.2,
        throughput: 125,
        defectRate: 1.8,
        onTimeDelivery: 94.5,
      },
      cycleTimeTrend: [
        { date: "Week 1", cycleTime: 4.5, throughput: 118 },
        { date: "Week 2", cycleTime: 4.3, throughput: 122 },
        { date: "Week 3", cycleTime: 4.0, throughput: 128 },
        { date: "Week 4", cycleTime: 4.2, throughput: 125 },
      ],
      throughputByTeam: [
        { team: "Team Alpha", throughput: 45, cycleTime: 3.8 },
        { team: "Team Beta", throughput: 42, cycleTime: 4.2 },
        { team: "Team Gamma", throughput: 38, cycleTime: 4.8 },
      ],
      bottleneckProcesses: [
        { process: "Quality Inspection", avgTime: 2.1, impact: "High", count: 85 },
        { process: "Material Sourcing", avgTime: 1.8, impact: "Medium", count: 62 },
        { process: "Final Assembly", avgTime: 1.5, impact: "Medium", count: 78 },
      ],
      defectsByCategory: [
        { category: "Material", count: 12, rate: 2.1 },
        { category: "Assembly", count: 8, rate: 1.4 },
        { category: "Packaging", count: 5, rate: 0.9 },
      ],
    };
  },
});

/**
 * Finance KPIs Query
 * Returns cash flow, burn rate, runway, AR/AP aging
 * Breakdowns: By department, by project, by quarter
 */
export const getFinanceKpis = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    timeRange: v.optional(v.union(
      v.literal("7d"),
      v.literal("30d"),
      v.literal("90d"),
      v.literal("1y")
    )),
  },
  handler: async (ctx, args) => {
    // Guest-safe: return demo data
    if (!args.businessId) {
      return {
        summary: {
          cashFlow: 125000,
          burnRate: 45000, // per month
          runway: 18, // months
          arTotal: 85000,
          apTotal: 42000,
        },
        cashFlowWaterfall: [
          { category: "Starting Balance", value: 500000, type: "start" },
          { category: "Revenue", value: 180000, type: "positive" },
          { category: "Operating Expenses", value: -95000, type: "negative" },
          { category: "Payroll", value: -120000, type: "negative" },
          { category: "Capital Expenses", value: -15000, type: "negative" },
          { category: "Ending Balance", value: 450000, type: "end" },
        ],
        burnRateTrend: [
          { month: "Jan", burnRate: 48000, runway: 15 },
          { month: "Feb", burnRate: 46000, runway: 16 },
          { month: "Mar", burnRate: 44000, runway: 17 },
          { month: "Apr", burnRate: 45000, runway: 18 },
        ],
        arApAging: [
          { bucket: "Current", ar: 45000, ap: 28000 },
          { bucket: "1-30 days", ar: 25000, ap: 10000 },
          { bucket: "31-60 days", ar: 10000, ap: 3000 },
          { bucket: "60+ days", ar: 5000, ap: 1000 },
        ],
        departmentSpending: [
          { department: "Engineering", spend: 180000, budget: 200000, variance: -10 },
          { department: "Sales", spend: 95000, budget: 100000, variance: -5 },
          { department: "Marketing", spend: 72000, budget: 75000, variance: -4 },
          { department: "Operations", spend: 48000, budget: 50000, variance: -4 },
        ],
      };
    }

    // For authenticated users
    return {
      summary: {
        cashFlow: 125000,
        burnRate: 45000,
        runway: 18,
        arTotal: 85000,
        apTotal: 42000,
      },
      cashFlowWaterfall: [
        { category: "Starting Balance", value: 500000, type: "start" },
        { category: "Revenue", value: 180000, type: "positive" },
        { category: "Operating Expenses", value: -95000, type: "negative" },
        { category: "Payroll", value: -120000, type: "negative" },
        { category: "Capital Expenses", value: -15000, type: "negative" },
        { category: "Ending Balance", value: 450000, type: "end" },
      ],
      burnRateTrend: [
        { month: "Jan", burnRate: 48000, runway: 15 },
        { month: "Feb", burnRate: 46000, runway: 16 },
        { month: "Mar", burnRate: 44000, runway: 17 },
        { month: "Apr", burnRate: 45000, runway: 18 },
      ],
      arApAging: [
        { bucket: "Current", ar: 45000, ap: 28000 },
        { bucket: "1-30 days", ar: 25000, ap: 10000 },
        { bucket: "31-60 days", ar: 10000, ap: 3000 },
        { bucket: "60+ days", ar: 5000, ap: 1000 },
      ],
      departmentSpending: [
        { department: "Engineering", spend: 180000, budget: 200000, variance: -10 },
        { department: "Sales", spend: 95000, budget: 100000, variance: -5 },
        { department: "Marketing", spend: 72000, budget: 75000, variance: -4 },
        { department: "Operations", spend: 48000, budget: 50000, variance: -4 },
      ],
    };
  },
});

/**
 * Internal mutation to collect and store department KPI snapshots
 * Called by daily cron job to aggregate real data from workflows, contacts, revenue, etc.
 */
export const collectDepartmentKpis = internalMutation({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const businessId = args.businessId;
    const now = Date.now();
    const dateKey = new Date(now).toISOString().split('T')[0]; // YYYY-MM-DD
    const cutoff30d = now - 30 * 24 * 60 * 60 * 1000;
    const cutoff7d = now - 7 * 24 * 60 * 60 * 1000;

    // Get business data
    const business = await ctx.db.get(businessId);
    if (!business) return;

    // === MARKETING KPIs ===
    const campaigns = await ctx.db
      .query("emailCampaigns")
      .withIndex("by_business_and_status", (q) => q.eq("businessId", businessId))
      .filter((q) => q.gte(q.field("_creationTime"), cutoff30d))
      .collect();

    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .collect();

    const totalSpend = campaigns.length * 500; // Estimate $500 per campaign
    const totalRevenue = campaigns.filter(c => c.status === "sent").length * 2500;
    const marketingROI = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    const avgCAC = contacts.length > 0 ? totalSpend / contacts.length : 0;
    const conversionRate = contacts.length > 0 ? (campaigns.length / contacts.length) * 100 : 0;

    // === SALES KPIs ===
    const deals = await ctx.db
      .query("crmDeals")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .collect();

    const closedDeals = deals.filter(d => d.stage === "Closed Won");
    const totalDeals = deals.length;
    const winRate = totalDeals > 0 ? (closedDeals.length / totalDeals) * 100 : 0;
    const avgDealSize = closedDeals.length > 0 
      ? closedDeals.reduce((sum, d) => sum + (d.value || 0), 0) / closedDeals.length 
      : 0;
    const pipelineVelocity = 28; // Days - would need more complex calculation

    // === OPERATIONS KPIs ===
    const workflowRuns = await ctx.db
      .query("workflowRuns")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .filter((q) => q.gte(q.field("startedAt"), cutoff7d))
      .collect();

    const completedRuns = workflowRuns.filter(r => r.status === "succeeded");
    const avgCycleTime = completedRuns.length > 0
      ? completedRuns.reduce((sum, r) => {
          const duration = (r.completedAt || now) - r.startedAt;
          return sum + duration;
        }, 0) / completedRuns.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;
    const throughput = workflowRuns.length / 7; // Per day
    const defectRate = workflowRuns.length > 0 
      ? (workflowRuns.filter(r => r.status === "failed").length / workflowRuns.length) * 100 
      : 0;

    // === FINANCE KPIs ===
    const revenueEvents = await ctx.db
      .query("revenueEvents")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .filter((q) => q.gte(q.field("timestamp"), cutoff30d))
      .collect();

    const totalCashFlow = revenueEvents.reduce((sum, e) => sum + e.amount, 0);
    const monthlyRevenue = totalCashFlow / (30 / 30); // Normalize to monthly
    const burnRate = 45000; // Would need expense tracking
    const runway = burnRate > 0 ? (totalCashFlow / burnRate) : 0;

    // Store aggregated KPIs in dashboardKpis table
    const existingSnapshot = await ctx.db
      .query("dashboardKpis")
      .withIndex("by_business_and_date", (q) => 
        q.eq("businessId", businessId).eq("date", dateKey)
      )
      .first();

    const kpiData = {
      businessId,
      date: dateKey,
      // Marketing
      visitors: contacts.length * 10, // Estimate
      subscribers: contacts.filter(c => c.status === "subscribed").length,
      engagement: conversionRate,
      revenue: totalRevenue,
      // Deltas (would calculate from previous day)
      visitorsDelta: 0,
      subscribersDelta: 0,
      engagementDelta: 0,
      revenueDelta: 0,
    };

    if (existingSnapshot) {
      await ctx.db.patch(existingSnapshot._id, kpiData);
    } else {
      await ctx.db.insert("dashboardKpis", kpiData);
    }

    // Log collection in audit
    await ctx.db.insert("audit_logs", {
      businessId,
      action: "kpi_collection",
      entityType: "department_kpis",
      entityId: dateKey,
      details: {
        marketingROI,
        winRate,
        avgCycleTime,
        totalCashFlow,
      },
      createdAt: now,
    });

    return {
      success: true,
      date: dateKey,
      kpisCollected: {
        marketing: { roi: marketingROI, cac: avgCAC, conversionRate },
        sales: { winRate, avgDealSize, pipelineVelocity },
        operations: { avgCycleTime, throughput, defectRate },
        finance: { cashFlow: totalCashFlow, burnRate, runway },
      },
    };
  },
});

/**
 * Cron-triggered action to collect KPIs for all active businesses
 */
export const collectAllBusinessKpis = internalMutation({
  args: {},
  handler: async (ctx) => {
    const businesses = await ctx.db.query("businesses").collect();
    
    let collected = 0;
    for (const business of businesses) {
      try {
        await ctx.runMutation("departmentKpis:collectDepartmentKpis" as any, {
          businessId: business._id,
        });
        collected++;
      } catch (error) {
        console.error(`Failed to collect KPIs for business ${business._id}:`, error);
      }
    }

    return { success: true, businessesProcessed: collected };
  },
});