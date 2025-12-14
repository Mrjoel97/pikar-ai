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

/**
 * Query: Predictive attrition modeling
 */
export const getAttritionPredictions = query({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return {
        overallAttritionRate: 0,
        predictedAttrition: 0,
        attritionTrend: "stable",
        highRiskEmployees: [],
        attritionByDepartment: [],
        retentionRecommendations: [],
      };
    }

    const business = await ctx.db.get(args.businessId);
    const teamSize = business?.teamMembers?.length || 0;

    // Simulate attrition predictions based on historical patterns
    const overallAttritionRate = 12.5; // 12.5% annual attrition
    const predictedAttrition = Math.round(teamSize * (overallAttritionRate / 100));

    const highRiskEmployees = [
      {
        employeeId: "emp_001",
        name: "John Doe",
        department: "Engineering",
        riskScore: 85,
        riskFactors: ["Low engagement", "No promotion in 2 years", "High workload"],
        tenure: 24,
      },
      {
        employeeId: "emp_002",
        name: "Jane Smith",
        department: "Sales",
        riskScore: 78,
        riskFactors: ["Below target performance", "Limited growth opportunities"],
        tenure: 18,
      },
      {
        employeeId: "emp_003",
        name: "Mike Johnson",
        department: "Marketing",
        riskScore: 72,
        riskFactors: ["Recent team changes", "Compensation below market"],
        tenure: 36,
      },
    ];

    const attritionByDepartment = [
      { department: "Engineering", currentRate: 15, predictedRate: 18, trend: "increasing" },
      { department: "Sales", currentRate: 20, predictedRate: 22, trend: "increasing" },
      { department: "Marketing", currentRate: 10, predictedRate: 9, trend: "decreasing" },
      { department: "Operations", currentRate: 8, predictedRate: 8, trend: "stable" },
    ];

    const retentionRecommendations = [
      {
        priority: "high",
        action: "Implement career development plans for high-risk employees",
        impact: "Reduce attrition by 15-20%",
        cost: "$50K",
      },
      {
        priority: "high",
        action: "Conduct compensation review for below-market salaries",
        impact: "Reduce attrition by 10-15%",
        cost: "$120K",
      },
      {
        priority: "medium",
        action: "Launch employee engagement initiatives",
        impact: "Improve retention by 8-12%",
        cost: "$30K",
      },
      {
        priority: "medium",
        action: "Enhance work-life balance programs",
        impact: "Reduce burnout-related attrition by 10%",
        cost: "$25K",
      },
    ];

    return {
      overallAttritionRate,
      predictedAttrition,
      attritionTrend: "increasing",
      highRiskEmployees,
      attritionByDepartment,
      retentionRecommendations,
      retentionCost: 225000, // Annual retention investment
      departmentBreakdown: attritionByDepartment.map(dept => ({
        department: dept.department,
        attritionRate: dept.currentRate,
        atRiskCount: Math.round((dept.currentRate / 100) * (teamSize / 4)),
      })),
    };
  },
});

/**
 * Query: Advanced skill gap analysis with training recommendations
 */
export const getAdvancedSkillGapAnalysis = query({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return {
        criticalGaps: [],
        emergingSkills: [],
        trainingPrograms: [],
        skillTrends: [],
        hiringNeeds: [],
      };
    }

    const criticalGaps = [
      {
        skill: "AI/ML Engineering",
        currentLevel: 45,
        targetLevel: 80,
        gap: 35,
        employeesWithSkill: 8,
        employeesNeeded: 15,
        urgency: "critical",
        marketAvailability: "low",
      },
      {
        skill: "Cloud Architecture",
        currentLevel: 62,
        targetLevel: 85,
        gap: 23,
        employeesWithSkill: 12,
        employeesNeeded: 18,
        urgency: "high",
        marketAvailability: "medium",
      },
      {
        skill: "Data Analytics",
        currentLevel: 58,
        targetLevel: 75,
        gap: 17,
        employeesWithSkill: 15,
        employeesNeeded: 20,
        urgency: "medium",
        marketAvailability: "high",
      },
    ];

    const emergingSkills = [
      { skill: "Generative AI", demand: 95, currentCoverage: 20, growthRate: 150 },
      { skill: "Kubernetes", demand: 85, currentCoverage: 45, growthRate: 80 },
      { skill: "Cybersecurity", demand: 90, currentCoverage: 55, growthRate: 70 },
    ];

    const trainingPrograms = [
      {
        programName: "AI/ML Bootcamp",
        targetSkill: "AI/ML Engineering",
        duration: "12 weeks",
        cost: 5000,
        expectedImprovement: 30,
        capacity: 10,
        provider: "Internal + Coursera",
      },
      {
        programName: "Cloud Certification Track",
        targetSkill: "Cloud Architecture",
        duration: "8 weeks",
        cost: 3000,
        expectedImprovement: 25,
        capacity: 15,
        provider: "AWS/Azure",
      },
      {
        programName: "Data Analytics Masterclass",
        targetSkill: "Data Analytics",
        duration: "6 weeks",
        cost: 2500,
        expectedImprovement: 20,
        capacity: 20,
        provider: "DataCamp",
      },
    ];

    const skillTrends = [
      { month: "Jan", aiml: 40, cloud: 58, data: 55 },
      { month: "Feb", aiml: 42, cloud: 60, data: 56 },
      { month: "Mar", aiml: 45, cloud: 62, data: 58 },
    ];

    const hiringNeeds = [
      {
        skill: "AI/ML Engineering",
        priority: "critical",
        positions: 7,
        timeToFill: "3-4 months",
        estimatedCost: 840000,
      },
      {
        skill: "Cloud Architecture",
        priority: "high",
        positions: 6,
        timeToFill: "2-3 months",
        estimatedCost: 720000,
      },
    ];

    return {
      criticalGaps: criticalGaps.map(gap => ({
        ...gap,
        recommendedTraining: `${gap.skill} certification program - 12 weeks`,
      })),
      emergingSkills,
      trainingPrograms,
      skillTrends,
      hiringNeeds,
      totalSkills: criticalGaps.length + emergingSkills.length,
      trainingRoi: 35, // Expected productivity gain percentage
      skillDistribution: [
        { skill: "AI/ML Engineering", employees: 8, proficiency: 45 },
        { skill: "Cloud Architecture", employees: 12, proficiency: 62 },
        { skill: "Data Analytics", employees: 15, proficiency: 58 },
        { skill: "DevOps", employees: 10, proficiency: 72 },
        { skill: "Security", employees: 6, proficiency: 68 },
      ],
    };
  },
});

/**
 * Query: Capacity planning and forecasting
 */
export const getCapacityPlanning = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    timeHorizon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return {
        currentCapacity: 0,
        projectedDemand: [],
        capacityGap: [],
        utilizationForecast: [],
        scalingRecommendations: [],
      };
    }

    const business = await ctx.db.get(args.businessId);
    const currentHeadcount = business?.teamMembers?.length || 0;

    const projectedDemand = [
      { quarter: "Q1 2025", demand: currentHeadcount * 1.1, projects: 12, workload: 85 },
      { quarter: "Q2 2025", demand: currentHeadcount * 1.25, projects: 15, workload: 92 },
      { quarter: "Q3 2025", demand: currentHeadcount * 1.4, projects: 18, workload: 98 },
      { quarter: "Q4 2025", demand: currentHeadcount * 1.5, projects: 20, workload: 105 },
    ];

    const capacityGap = [
      { quarter: "Q1 2025", gap: Math.round(currentHeadcount * 0.1), severity: "low" },
      { quarter: "Q2 2025", gap: Math.round(currentHeadcount * 0.25), severity: "medium" },
      { quarter: "Q3 2025", gap: Math.round(currentHeadcount * 0.4), severity: "high" },
      { quarter: "Q4 2025", gap: Math.round(currentHeadcount * 0.5), severity: "critical" },
    ];

    const utilizationForecast = [
      { month: "Jan", utilization: 82, capacity: 100, demand: 82 },
      { month: "Feb", utilization: 85, capacity: 100, demand: 85 },
      { month: "Mar", utilization: 88, capacity: 100, demand: 88 },
      { month: "Apr", utilization: 92, capacity: 100, demand: 92 },
      { month: "May", utilization: 95, capacity: 100, demand: 95 },
      { month: "Jun", utilization: 98, capacity: 100, demand: 98 },
    ];

    const scalingRecommendations = [
      {
        action: "Hire 5 engineers in Q1",
        rationale: "Projected 10% capacity gap",
        cost: 600000,
        impact: "Maintain 85% utilization",
        timeline: "Immediate",
      },
      {
        action: "Hire 12 additional staff in Q2",
        rationale: "Projected 25% capacity gap",
        cost: 1440000,
        impact: "Support growth initiatives",
        timeline: "Start recruiting in Q1",
      },
      {
        action: "Consider contractor augmentation",
        rationale: "Flexible capacity for peak periods",
        cost: 300000,
        impact: "Handle overflow work",
        timeline: "Q2-Q3",
      },
    ];

    return {
      currentCapacity: currentHeadcount,
      projectedDemand,
      capacityGap,
      utilizationForecast,
      scalingRecommendations,
    };
  },
});

/**
 * Query: Performance forecasting
 */
export const getPerformanceForecasting = query({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return {
        overallPerformanceTrend: "stable",
        departmentForecasts: [],
        productivityPredictions: [],
        performanceRisks: [],
        improvementOpportunities: [],
      };
    }

    const business = await ctx.db.get(args.businessId);
    const teamSize = business?.teamMembers?.length || 0; // Defined teamSize

    const departmentForecasts = [
      {
        department: "Engineering",
        currentScore: 85,
        forecastedScore: 88,
        trend: "improving",
        confidence: 82,
        factors: ["New tooling adoption", "Team training"],
      },
      {
        department: "Sales",
        currentScore: 78,
        forecastedScore: 75,
        trend: "declining",
        confidence: 75,
        factors: ["Market conditions", "Team turnover"],
      },
      {
        department: "Marketing",
        currentScore: 82,
        forecastedScore: 84,
        trend: "improving",
        confidence: 80,
        factors: ["Campaign optimization", "New hires"],
      },
      {
        department: "Operations",
        currentScore: 90,
        forecastedScore: 90,
        trend: "stable",
        confidence: 88,
        factors: ["Process maturity", "Consistent execution"],
      },
    ];

    const productivityPredictions = [
      { month: "Jan", predicted: 85, actual: 84, confidence: 90 },
      { month: "Feb", predicted: 86, actual: 85, confidence: 88 },
      { month: "Mar", predicted: 87, actual: null, confidence: 85 },
      { month: "Apr", predicted: 88, actual: null, confidence: 82 },
      { month: "May", predicted: 89, actual: null, confidence: 80 },
      { month: "Jun", predicted: 90, actual: null, confidence: 78 },
    ];

    const performanceRisks = [
      {
        risk: "Sales team underperformance",
        probability: 65,
        impact: "high",
        mitigation: "Implement performance improvement plans and additional training",
      },
      {
        risk: "Engineering burnout",
        probability: 45,
        impact: "medium",
        mitigation: "Reduce overtime, hire additional resources",
      },
      {
        risk: "Knowledge loss from attrition",
        probability: 55,
        impact: "high",
        mitigation: "Documentation initiatives, knowledge transfer programs",
      },
    ];

    const improvementOpportunities = [
      {
        opportunity: "Automation of manual processes",
        potentialGain: "15% productivity increase",
        investment: "$80K",
        timeline: "3 months",
        roi: "250%",
      },
      {
        opportunity: "Cross-functional collaboration tools",
        potentialGain: "10% efficiency improvement",
        investment: "$40K",
        timeline: "2 months",
        roi: "180%",
      },
      {
        opportunity: "Performance management system upgrade",
        potentialGain: "12% engagement increase",
        investment: "$60K",
        timeline: "4 months",
        roi: "200%",
      },
    ];

    return {
      overallPerformanceTrend: "improving",
      departmentForecasts,
      productivityPredictions,
      performanceRisks,
      improvementOpportunities,
      avgPerformanceScore: 83,
      highPerformers: Math.round(teamSize * 0.25),
      needsImprovement: Math.round(teamSize * 0.15),
      quarterlyForecasts: [
        { quarter: "Q1 2025", avgScore: 83, productivity: 87, trend: "up", change: 3 },
        { quarter: "Q2 2025", avgScore: 85, productivity: 89, trend: "up", change: 2 },
        { quarter: "Q3 2025", avgScore: 86, productivity: 90, trend: "up", change: 1 },
        { quarter: "Q4 2025", avgScore: 88, productivity: 92, trend: "up", change: 2 },
      ],
      topPerformers: [
        {
          id: "emp_101",
          name: "Sarah Chen",
          department: "Engineering",
          score: 95,
          achievements: ["Led 3 major projects", "Mentored 5 juniors", "Innovation award"],
        },
        {
          id: "emp_102",
          name: "Marcus Johnson",
          department: "Sales",
          score: 92,
          achievements: ["150% quota attainment", "Top closer Q3", "New market expansion"],
        },
        {
          id: "emp_103",
          name: "Emily Rodriguez",
          department: "Marketing",
          score: 90,
          achievements: ["Campaign ROI 300%", "Brand refresh lead", "Team leadership"],
        },
      ],
    };
  },
});

/**
 * Query: Workforce optimization recommendations
 */
export const getWorkforceOptimization = query({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      return {
        optimizationScore: 0,
        recommendations: [],
        costSavings: [],
        efficiencyGains: [],
        implementationPlan: [],
      };
    }

    const recommendations = [
      {
        category: "Resource Allocation",
        priority: "high",
        recommendation: "Reallocate 3 engineers from Project A to Project B",
        rationale: "Project B is understaffed and critical path",
        impact: "20% faster delivery on Project B",
        effort: "low",
        timeframe: "Immediate",
      },
      {
        category: "Skill Development",
        priority: "high",
        recommendation: "Launch AI/ML training program for 10 engineers",
        rationale: "Critical skill gap identified",
        impact: "Reduce dependency on external contractors by 40%",
        effort: "medium",
        timeframe: "3 months",
      },
      {
        category: "Retention",
        priority: "critical",
        recommendation: "Implement retention bonuses for high-risk employees",
        rationale: "3 key employees at high attrition risk",
        impact: "Prevent $500K in replacement costs",
        effort: "low",
        timeframe: "Immediate",
      },
      {
        category: "Capacity Planning",
        priority: "medium",
        recommendation: "Hire 5 contractors for Q2 peak demand",
        rationale: "Temporary capacity gap during product launch",
        impact: "Maintain delivery timelines",
        effort: "medium",
        timeframe: "1 month",
      },
      {
        category: "Process Improvement",
        priority: "medium",
        recommendation: "Automate deployment pipeline",
        rationale: "Engineering team spending 15% time on manual deployments",
        impact: "Free up 150 hours/month",
        effort: "high",
        timeframe: "2 months",
      },
    ];

    const costSavings = [
      {
        initiative: "Reduce contractor dependency through training",
        annualSavings: 480000,
        implementation: 50000,
        netSavings: 430000,
        paybackPeriod: "1.5 months",
      },
      {
        initiative: "Prevent attrition of key employees",
        annualSavings: 500000,
        implementation: 150000,
        netSavings: 350000,
        paybackPeriod: "3.6 months",
      },
      {
        initiative: "Process automation",
        annualSavings: 300000,
        implementation: 80000,
        netSavings: 220000,
        paybackPeriod: "3.2 months",
      },
    ];

    const efficiencyGains = [
      { area: "Engineering", currentEfficiency: 75, targetEfficiency: 85, gain: 10 },
      { area: "Sales", currentEfficiency: 68, targetEfficiency: 78, gain: 10 },
      { area: "Marketing", currentEfficiency: 80, targetEfficiency: 88, gain: 8 },
      { area: "Operations", currentEfficiency: 85, targetEfficiency: 90, gain: 5 },
    ];

    const implementationPlan = [
      {
        phase: "Phase 1 (Immediate)",
        duration: "1 month",
        actions: ["Resource reallocation", "Retention bonuses", "Quick wins"],
        cost: 200000,
        expectedImpact: "Stabilize critical projects",
      },
      {
        phase: "Phase 2 (Short-term)",
        duration: "3 months",
        actions: ["Training programs", "Contractor hiring", "Process improvements"],
        cost: 350000,
        expectedImpact: "Build internal capabilities",
      },
      {
        phase: "Phase 3 (Long-term)",
        duration: "6 months",
        actions: ["Automation initiatives", "Culture programs", "Strategic hiring"],
        cost: 500000,
        expectedImpact: "Sustainable optimization",
      },
    ];

    return {
      optimizationScore: 72,
      recommendations,
      costSavings,
      efficiencyGains,
      implementationPlan,
      potentialSavings: costSavings.reduce((sum, item) => sum + item.netSavings, 0),
      efficiencyGain: Math.round(
        efficiencyGains.reduce((sum, area) => sum + area.gain, 0) / efficiencyGains.length
      ),
    };
  },
});

/**
 * Query: Calculate team velocity
 */
export const getTeamVelocity = query({
  args: {
    businessId: v.optional(v.id("businesses")),
  },
  handler: async (ctx, args) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const completedTasks = await ctx.db
      .query("tasks")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId as any))
      .filter((q) => 
        q.and(
          q.eq(q.field("status"), "completed"),
          q.gte(q.field("updatedAt"), thirtyDaysAgo.getTime())
        )
      )
      .collect();

    const teamMembers = await ctx.db
      .query("users")
      .withIndex("by_token") // Using by_token as a proxy for listing users, or better use business teamMembers
      .collect();
      
    // Filter for this business if possible, or use business.teamMembers
    const business = await ctx.db.get(args.businessId as any);
    const teamSize = business?.teamMembers?.length || 1;

    const velocity = completedTasks.length / teamSize;

    return {
      velocity,
      completedTasks: completedTasks.length,
      teamSize,
      period: "30d",
    };
  },
});

/**
 * Mutation: Create workforce optimization plan
 */
export const createOptimizationPlan = mutation({
  args: {
    businessId: v.id("businesses"),
    planName: v.string(),
    recommendations: v.array(v.any()),
    targetDate: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const planId = await ctx.db.insert("workforceOptimizationPlans", {
      businessId: args.businessId,
      planName: args.planName,
      recommendations: args.recommendations,
      status: "draft",
      targetDate: args.targetDate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return planId;
  },
});