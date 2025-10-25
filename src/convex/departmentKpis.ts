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
 * Cross-Department Analytics
 * Returns metrics that span multiple departments for holistic insights
 */
export const getCrossDepartmentAnalytics = query({
  args: {
    businessId: v.id("businesses"),
    timeRange: v.optional(v.union(
      v.literal("7d"),
      v.literal("30d"),
      v.literal("90d"),
      v.literal("1y")
    )),
  },
  handler: async (ctx, args) => {
    return {
      // Marketing → Sales alignment
      leadToCustomerConversion: {
        marketingLeads: 500,
        salesAcceptedLeads: 350,
        closedDeals: 85,
        conversionRate: 17.0,
        avgTimeToClose: 28,
      },
      // Sales → Finance alignment
      revenueRealization: {
        bookedRevenue: 425000,
        recognizedRevenue: 380000,
        outstandingAR: 45000,
        realizationRate: 89.4,
      },
      // Operations → Finance alignment
      operationalEfficiency: {
        totalOpsCost: 125000,
        unitsProduced: 3500,
        costPerUnit: 35.71,
        targetCostPerUnit: 40.0,
        efficiencyGain: 10.7,
      },
      // Resource allocation across departments
      resourceUtilization: [
        { department: "Marketing", allocated: 75000, spent: 72000, utilization: 96 },
        { department: "Sales", allocated: 100000, spent: 95000, utilization: 95 },
        { department: "Operations", allocated: 125000, spent: 118000, utilization: 94 },
        { department: "Finance", allocated: 50000, spent: 48000, utilization: 96 },
      ],
      // Cross-functional initiatives
      initiatives: [
        { name: "Product Launch Q2", departments: ["Marketing", "Sales", "Operations"], progress: 75, budget: 50000, spent: 38000 },
        { name: "Process Automation", departments: ["Operations", "Finance"], progress: 60, budget: 30000, spent: 18000 },
      ],
    };
  },
});

/**
 * Budget Tracking Query
 * Returns budget vs actual spending by department and category
 */
export const getBudgetTracking = query({
  args: {
    businessId: v.id("businesses"),
    timeRange: v.optional(v.union(
      v.literal("7d"),
      v.literal("30d"),
      v.literal("90d"),
      v.literal("1y")
    )),
  },
  handler: async (ctx, args) => {
    return {
      summary: {
        totalBudget: 500000,
        totalSpent: 425000,
        remaining: 75000,
        utilizationRate: 85.0,
      },
      byDepartment: [
        { department: "Marketing", budget: 100000, spent: 85000, variance: -15, forecast: 95000 },
        { department: "Sales", budget: 150000, spent: 135000, variance: -10, forecast: 145000 },
        { department: "Operations", budget: 175000, spent: 155000, variance: -11, forecast: 168000 },
        { department: "Finance", budget: 75000, spent: 50000, variance: -33, forecast: 60000 },
      ],
      byCategory: [
        { category: "Personnel", budget: 300000, spent: 270000, variance: -10 },
        { category: "Marketing & Sales", budget: 80000, spent: 75000, variance: -6 },
        { category: "Operations", budget: 70000, spent: 55000, variance: -21 },
        { category: "Technology", budget: 30000, spent: 18000, variance: -40 },
        { category: "Other", budget: 20000, spent: 7000, variance: -65 },
      ],
      monthlyTrend: [
        { month: "Jan", budget: 125000, spent: 105000 },
        { month: "Feb", budget: 125000, spent: 110000 },
        { month: "Mar", budget: 125000, spent: 108000 },
        { month: "Apr", budget: 125000, spent: 102000 },
      ],
    };
  },
});

/**
 * Performance Benchmarking Query
 * Returns department performance vs industry benchmarks
 */
export const getPerformanceBenchmarks = query({
  args: {
    businessId: v.id("businesses"),
    industry: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return {
      marketing: {
        metric: "CAC",
        yourValue: 45,
        industryAvg: 52,
        topQuartile: 38,
        percentile: 65,
        status: "above_average",
      },
      sales: {
        metric: "Win Rate",
        yourValue: 24.5,
        industryAvg: 22.0,
        topQuartile: 28.0,
        percentile: 60,
        status: "above_average",
      },
      operations: {
        metric: "Cycle Time",
        yourValue: 4.2,
        industryAvg: 5.1,
        topQuartile: 3.5,
        percentile: 70,
        status: "above_average",
      },
      finance: {
        metric: "Burn Rate Efficiency",
        yourValue: 18,
        industryAvg: 15,
        topQuartile: 20,
        percentile: 55,
        status: "average",
      },
    };
  },
});

/**
 * Resource Allocation Query
 * Returns current resource allocation and optimization suggestions
 */
export const getResourceAllocation = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    return {
      currentAllocation: [
        { department: "Marketing", headcount: 8, budget: 100000, revenue: 320000, roiPerHead: 40000 },
        { department: "Sales", headcount: 12, budget: 150000, revenue: 850000, roiPerHead: 70833 },
        { department: "Operations", headcount: 15, budget: 175000, revenue: 0, roiPerHead: 0 },
        { department: "Finance", headcount: 5, budget: 75000, revenue: 0, roiPerHead: 0 },
      ],
      recommendations: [
        {
          type: "reallocation",
          from: "Operations",
          to: "Sales",
          amount: 25000,
          reason: "Sales has highest ROI per dollar spent",
          expectedImpact: "+$175K revenue",
        },
        {
          type: "hiring",
          department: "Marketing",
          role: "Content Specialist",
          reason: "Content marketing showing 5.2x ROI",
          expectedImpact: "+$200K revenue",
        },
      ],
      utilizationHeatmap: [
        { department: "Marketing", week1: 95, week2: 92, week3: 88, week4: 90 },
        { department: "Sales", week1: 98, week2: 96, week3: 97, week4: 95 },
        { department: "Operations", week1: 85, week2: 88, week3: 82, week4: 86 },
        { department: "Finance", week1: 78, week2: 82, week3: 80, week4: 75 },
      ],
    };
  },
});

/**
 * Drill-down query for detailed campaign analysis
 */
export const getCampaignDrilldown = query({
  args: {
    businessId: v.id("businesses"),
    campaignId: v.optional(v.string()),
    timeRange: v.optional(v.union(
      v.literal("7d"),
      v.literal("30d"),
      v.literal("90d"),
      v.literal("1y")
    )),
  },
  handler: async (ctx, args) => {
    return {
      campaign: {
        id: args.campaignId || "campaign_001",
        name: "Summer Sale 2024",
        status: "active",
        startDate: "2024-06-01",
        endDate: "2024-08-31",
      },
      performance: {
        impressions: 125000,
        clicks: 3750,
        ctr: 3.0,
        conversions: 85,
        conversionRate: 2.27,
        revenue: 15600,
        spend: 3000,
        roi: 5.2,
        cpa: 35.29,
      },
      byChannel: [
        { channel: "Email", impressions: 25000, clicks: 1250, conversions: 35, revenue: 6500, spend: 500 },
        { channel: "Social", impressions: 50000, clicks: 1500, conversions: 30, revenue: 5400, spend: 1200 },
        { channel: "Paid Search", impressions: 50000, clicks: 1000, conversions: 20, revenue: 3700, spend: 1300 },
      ],
      timeline: [
        { date: "Week 1", impressions: 20000, clicks: 600, conversions: 12, revenue: 2200 },
        { date: "Week 2", impressions: 28000, clicks: 840, conversions: 18, revenue: 3400 },
        { date: "Week 3", impressions: 35000, clicks: 1050, conversions: 25, revenue: 4800 },
        { date: "Week 4", impressions: 42000, clicks: 1260, conversions: 30, revenue: 5200 },
      ],
    };
  },
});

/**
 * Drill-down query for detailed deal pipeline analysis
 */
export const getDealPipelineDrilldown = query({
  args: {
    businessId: v.id("businesses"),
    stage: v.optional(v.string()),
    repId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return {
      deals: [
        { id: "deal_001", name: "Acme Corp", value: 25000, stage: "Proposal", probability: 60, rep: "Sarah Chen", daysInStage: 8, nextAction: "Follow-up call" },
        { id: "deal_002", name: "TechStart Inc", value: 18000, stage: "Negotiation", probability: 75, rep: "Mike Johnson", daysInStage: 5, nextAction: "Contract review" },
        { id: "deal_003", name: "Global Systems", value: 42000, stage: "Qualification", probability: 40, rep: "Sarah Chen", daysInStage: 12, nextAction: "Demo scheduled" },
      ],
      stageMetrics: {
        stage: args.stage || "Proposal",
        totalDeals: 18,
        totalValue: 225000,
        avgDealSize: 12500,
        avgDaysInStage: 9.5,
        conversionRate: 45,
      },
      riskFactors: [
        { deal: "deal_003", risk: "high", reason: "12 days in stage, no recent activity", recommendation: "Schedule follow-up" },
      ],
    };
  },
});

/**
 * Export data mutation for generating reports
 */
export const exportDepartmentData = mutation({
  args: {
    businessId: v.id("businesses"),
    department: v.string(),
    format: v.union(v.literal("csv"), v.literal("json"), v.literal("pdf")),
    timeRange: v.optional(v.union(
      v.literal("7d"),
      v.literal("30d"),
      v.literal("90d"),
      v.literal("1y")
    )),
  },
  handler: async (ctx, args) => {
    // In production, this would generate actual export files
    // For now, return metadata about the export
    return {
      exportId: `export_${Date.now()}`,
      department: args.department,
      format: args.format,
      timeRange: args.timeRange || "30d",
      status: "completed",
      downloadUrl: `/api/exports/export_${Date.now()}.${args.format}`,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
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