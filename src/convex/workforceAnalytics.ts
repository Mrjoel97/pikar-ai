import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Query: Get global team performance aggregation
 */
export const getGlobalTeamPerformance = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    region: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return {
        totalEmployees: 0,
        activeUsers: 0,
        productivityScore: 0,
        byRegion: [],
      };
    }

    // Get team members
    const business = await ctx.db.get(args.businessId);
    if (!business) {
      return {
        totalEmployees: 0,
        activeUsers: 0,
        productivityScore: 0,
        byRegion: [],
      };
    }

    const teamMembers = business.teamMembers || [];

    // Mock regional distribution
    const byRegion = [
      { region: "na", employees: Math.floor(teamMembers.length * 0.4), productivity: 87 },
      { region: "eu", employees: Math.floor(teamMembers.length * 0.35), productivity: 85 },
      { region: "apac", employees: Math.floor(teamMembers.length * 0.25), productivity: 89 },
    ];

    return {
      totalEmployees: teamMembers.length,
      activeUsers: teamMembers.length,
      productivityScore: 87,
      byRegion,
    };
  },
});

/**
 * Query: Get productivity by region
 */
export const getProductivityByRegion = query({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return [];
    }

    return [
      {
        region: "na",
        productivity: 87,
        tasksCompleted: 245,
        avgResponseTime: 2.3,
        utilizationRate: 82,
      },
      {
        region: "eu",
        productivity: 85,
        tasksCompleted: 198,
        avgResponseTime: 2.8,
        utilizationRate: 79,
      },
      {
        region: "apac",
        productivity: 89,
        tasksCompleted: 167,
        avgResponseTime: 2.1,
        utilizationRate: 85,
      },
    ];
  },
});

/**
 * Query: Skill gap analysis
 */
export const getSkillGapAnalysis = query({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return {
        criticalGaps: [],
        skillDistribution: [],
        recommendations: [],
      };
    }

    return {
      criticalGaps: [
        { skill: "AI/ML", currentLevel: 45, targetLevel: 80, gap: 35 },
        { skill: "Cloud Architecture", currentLevel: 62, targetLevel: 85, gap: 23 },
        { skill: "Data Analytics", currentLevel: 58, targetLevel: 75, gap: 17 },
      ],
      skillDistribution: [
        { skill: "Project Management", employees: 12, proficiency: 78 },
        { skill: "Software Development", employees: 25, proficiency: 82 },
        { skill: "Marketing", employees: 8, proficiency: 75 },
      ],
      recommendations: [
        "Invest in AI/ML training programs",
        "Hire 2-3 senior cloud architects",
        "Provide data analytics certifications",
      ],
    };
  },
});

/**
 * Query: Workforce planning tools
 */
export const getWorkforcePlanning = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    timeHorizon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return {
        currentHeadcount: 0,
        projectedNeeds: [],
        budgetAllocation: [],
      };
    }

    const business = await ctx.db.get(args.businessId);
    const currentHeadcount = business?.teamMembers?.length || 0;

    return {
      currentHeadcount,
      projectedNeeds: [
        { quarter: "Q1 2025", headcount: currentHeadcount + 5, roles: ["Engineers", "Sales"] },
        { quarter: "Q2 2025", headcount: currentHeadcount + 12, roles: ["Engineers", "Marketing"] },
        { quarter: "Q3 2025", headcount: currentHeadcount + 18, roles: ["All departments"] },
      ],
      budgetAllocation: [
        { department: "Engineering", current: 450000, projected: 520000 },
        { department: "Sales", current: 280000, projected: 340000 },
        { department: "Marketing", current: 180000, projected: 220000 },
      ],
    };
  },
});
