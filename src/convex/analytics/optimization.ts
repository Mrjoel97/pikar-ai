import { v } from "convex/values";
import { query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Get AI-powered ROI optimization suggestions
 */
export const getROIOptimizationSuggestions = query({
  args: {
    businessId: v.id("businesses"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const historicalDays = 30;
    const startTime = Date.now() - historicalDays * 24 * 60 * 60 * 1000;

    // Get audit logs to analyze time saved patterns
    const auditLogs = await ctx.db
      .query("audit_logs")
      .filter((q: any) =>
        q.and(
          q.eq(q.field("businessId"), args.businessId),
          q.gte(q.field("createdAt"), startTime)
        )
      )
      .collect();

    // Get revenue events
    const revenueEvents = await ctx.db
      .query("revenueEvents")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId))
      .collect();

    const filteredRevenue = revenueEvents.filter(
      (event: any) => event.timestamp >= startTime
    );

    // Analyze patterns
    const actionTypes: Record<string, { count: number; timeSaved: number }> = {};
    auditLogs.forEach((log: any) => {
      const action = log.action || "unknown";
      if (!actionTypes[action]) {
        actionTypes[action] = { count: 0, timeSaved: 0 };
      }
      actionTypes[action].count++;
      actionTypes[action].timeSaved += log.details?.timeSavedMinutes ?? 0;
    });

    // Generate suggestions based on patterns
    const suggestions: Array<{
      category: string;
      priority: "high" | "medium" | "low";
      title: string;
      description: string;
      potentialImpact: string;
      actionItems: string[];
    }> = [];

    // Suggestion 1: Automation opportunities
    const manualActions = Object.entries(actionTypes)
      .filter(([action]) => !action.includes("automated"))
      .sort((a, b) => b[1].count - a[1].count);

    if (manualActions.length > 0 && manualActions[0][1].count > 5) {
      suggestions.push({
        category: "Automation",
        priority: "high",
        title: "Automate High-Frequency Tasks",
        description: `You have ${manualActions[0][1].count} manual ${manualActions[0][0]} actions. Automating these could save significant time.`,
        potentialImpact: `+${Math.round(manualActions[0][1].timeSaved * 0.3)} minutes/month`,
        actionItems: [
          "Set up workflow automation for repetitive tasks",
          "Create templates for common actions",
          "Enable AI-powered auto-completion",
        ],
      });
    }

    // Suggestion 2: Revenue tracking
    const revenueGap = auditLogs.length > 0 && filteredRevenue.length === 0;
    if (revenueGap) {
      suggestions.push({
        category: "Revenue Tracking",
        priority: "high",
        title: "Start Tracking Revenue Events",
        description: "You're saving time but not tracking revenue impact. Connect revenue sources to see true ROI.",
        potentialImpact: "Unlock full ROI visibility",
        actionItems: [
          "Connect payment processor (Stripe/PayPal)",
          "Log invoice payments as revenue events",
          "Track subscription renewals",
        ],
      });
    }

    // Suggestion 3: Efficiency improvements
    const avgTimeSaved = auditLogs.reduce(
      (sum: number, log: any) => sum + (log.details?.timeSavedMinutes ?? 0),
      0
    ) / Math.max(1, auditLogs.length);

    if (avgTimeSaved < 10) {
      suggestions.push({
        category: "Efficiency",
        priority: "medium",
        title: "Increase Task Efficiency",
        description: "Your average time saved per action is below optimal. Focus on high-impact activities.",
        potentialImpact: "+50% time savings potential",
        actionItems: [
          "Prioritize tasks with highest time-saving potential",
          "Use AI agents for complex workflows",
          "Batch similar tasks together",
        ],
      });
    }

    // Suggestion 4: Hourly rate optimization
    const hourlyRate = 50; // Default rate - can be customized per user

    if (hourlyRate < 75) {
      suggestions.push({
        category: "Pricing",
        priority: "medium",
        title: "Review Your Hourly Rate",
        description: "Your hourly rate may be undervalued. Consider market rates for your expertise.",
        potentialImpact: `+$${Math.round((100 - hourlyRate) * (auditLogs.reduce((sum: number, log: any) => sum + (log.details?.timeSavedMinutes ?? 0), 0) / 60))}/month`,
        actionItems: [
          "Research industry standard rates",
          "Factor in your expertise and results",
          "Update rate in ROI settings",
        ],
      });
    }

    // Suggestion 5: Consistency
    const daysWithActivity = new Set(
      auditLogs.map((log: any) => new Date(log.createdAt).toDateString())
    ).size;

    if (daysWithActivity < historicalDays * 0.5) {
      suggestions.push({
        category: "Consistency",
        priority: "low",
        title: "Maintain Consistent Activity",
        description: "Regular activity tracking helps identify patterns and optimize ROI over time.",
        potentialImpact: "Better trend analysis",
        actionItems: [
          "Set daily activity goals",
          "Enable automatic time tracking",
          "Review weekly progress",
        ],
      });
    }

    return suggestions;
  },
});

/**
 * Simulate ROI scenario with different parameters
 */
export const simulateROIScenario = query({
  args: {
    businessId: v.id("businesses"),
    userId: v.id("users"),
    hourlyRate: v.number(),
    hoursPerDay: v.number(),
    efficiencyGain: v.number(), // Percentage
    days: v.number(),
  },
  handler: async (ctx, args) => {
    const timeSavedPerDay = args.hoursPerDay * (args.efficiencyGain / 100);
    const revenuePerDay = timeSavedPerDay * args.hourlyRate;

    const totalTimeSaved = timeSavedPerDay * args.days;
    const totalRevenue = revenuePerDay * args.days;

    return {
      scenario: {
        hourlyRate: args.hourlyRate,
        hoursPerDay: args.hoursPerDay,
        efficiencyGain: args.efficiencyGain,
        days: args.days,
      },
      results: {
        dailyTimeSaved: Math.round(timeSavedPerDay * 10) / 10,
        dailyRevenue: Math.round(revenuePerDay),
        totalTimeSaved: Math.round(totalTimeSaved * 10) / 10,
        totalRevenue: Math.round(totalRevenue),
        annualizedRevenue: Math.round((totalRevenue / args.days) * 365),
      },
    };
  },
});

/**
 * Get AI-powered budget reallocation suggestions
 */
export const getBudgetReallocation = query({
  args: {
    businessId: v.id("businesses"),
    currentBudget: v.object({
      automation: v.number(),
      training: v.number(),
      tools: v.number(),
      marketing: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    // Analyze current ROI by category
    const historicalDays = 30;
    const startTime = Date.now() - historicalDays * 24 * 60 * 60 * 1000;

    const auditLogs = await ctx.db
      .query("audit_logs")
      .filter((q: any) =>
        q.and(
          q.eq(q.field("businessId"), args.businessId),
          q.gte(q.field("createdAt"), startTime)
        )
      )
      .collect();

    // Categorize time savings
    const categoryImpact: Record<string, number> = {
      automation: 0,
      training: 0,
      tools: 0,
      marketing: 0,
    };

    auditLogs.forEach((log: any) => {
      const action = log.action || "";
      const timeSaved = log.details?.timeSavedMinutes ?? 0;

      if (action.includes("workflow") || action.includes("automated")) {
        categoryImpact.automation += timeSaved;
      } else if (action.includes("agent") || action.includes("ai")) {
        categoryImpact.tools += timeSaved;
      } else if (action.includes("campaign") || action.includes("social")) {
        categoryImpact.marketing += timeSaved;
      } else {
        categoryImpact.training += timeSaved;
      }
    });

    // Calculate ROI per dollar for each category
    const totalBudget = Object.values(args.currentBudget).reduce((a, b) => a + b, 0);
    const categoryROI: Record<string, number> = {};

    Object.keys(args.currentBudget).forEach((category) => {
      const budget = args.currentBudget[category as keyof typeof args.currentBudget];
      const impact = categoryImpact[category] || 0;
      categoryROI[category] = budget > 0 ? impact / budget : 0;
    });

    // Generate optimal allocation
    const totalImpact = Object.values(categoryImpact).reduce((a, b) => a + b, 0);
    const optimalAllocation: Record<string, number> = {};

    Object.keys(args.currentBudget).forEach((category) => {
      const impactRatio = totalImpact > 0 ? categoryImpact[category] / totalImpact : 0.25;
      optimalAllocation[category] = Math.round(totalBudget * impactRatio);
    });

    return {
      current: args.currentBudget,
      optimal: optimalAllocation,
      recommendations: Object.keys(args.currentBudget).map((category) => {
        const current = args.currentBudget[category as keyof typeof args.currentBudget];
        const optimal = optimalAllocation[category];
        const change = optimal - current;
        const changePercent = current > 0 ? Math.round((change / current) * 100) : 0;

        return {
          category,
          currentBudget: current,
          recommendedBudget: optimal,
          change,
          changePercent,
          roi: Math.round(categoryROI[category] * 100) / 100,
          reasoning:
            change > 0
              ? `High ROI category - increase investment by $${change}`
              : change < 0
              ? `Lower ROI - reallocate $${Math.abs(change)} to higher-impact areas`
              : "Current allocation is optimal",
        };
      }),
    };
  },
});