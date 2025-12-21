import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get cost forecast for agents (30/60/90 days)
 */
export const getCostForecast = query({
  args: {
    businessId: v.id("businesses"),
    agentId: v.optional(v.id("aiAgents")),
    days: v.optional(v.union(v.literal(30), v.literal(60), v.literal(90))),
  },
  handler: async (ctx, args) => {
    const forecastDays = args.days || 30;
    const agents = args.agentId
      ? [await ctx.db.get(args.agentId)]
      : await ctx.db
          .query("aiAgents")
          .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
          .collect();

    const forecasts = await Promise.all(
      agents.filter(a => a).map(async (agent) => {
        if (!agent) return null;

        // Get historical execution data
        const historicalDays = 30;
        const executions = await ctx.db
          .query("agentExecutions")
          .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
          .filter((q) => q.gte(q.field("startedAt"), Date.now() - historicalDays * 24 * 60 * 60 * 1000))
          .collect();

        // Calculate current costs
        const avgExecutionsPerDay = executions.length / historicalDays;
        const costPerExecution = 0.01; // $0.01 per execution
        const currentDailyCost = avgExecutionsPerDay * costPerExecution;

        // Forecast with growth factor
        const growthRate = 1.05; // 5% monthly growth assumption
        const dailyForecasts = [];
        
        for (let day = 1; day <= forecastDays; day++) {
          const growthFactor = Math.pow(growthRate, day / 30);
          const forecastedCost = currentDailyCost * growthFactor;
          
          dailyForecasts.push({
            day,
            date: new Date(Date.now() + day * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            cost: forecastedCost,
            executions: Math.round(forecastedCost / costPerExecution),
          });
        }

        const totalForecastedCost = dailyForecasts.reduce((sum, d) => sum + d.cost, 0);

        return {
          agentId: agent._id,
          agentName: agent.name,
          currentDailyCost,
          forecastPeriod: forecastDays,
          totalForecastedCost,
          dailyForecasts,
          confidence: 0.80,
        };
      })
    );

    return forecasts.filter(f => f !== null);
  },
});

/**
 * Get cost optimization scenarios
 */
export const getCostOptimizationScenarios = query({
  args: {
    businessId: v.id("businesses"),
    agentId: v.optional(v.id("aiAgents")),
  },
  handler: async (ctx, args) => {
    const agents = args.agentId
      ? [await ctx.db.get(args.agentId)]
      : await ctx.db
          .query("aiAgents")
          .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
          .collect();

    const scenarios = await Promise.all(
      agents.filter(a => a).map(async (agent) => {
        if (!agent) return null;

        const executions = await ctx.db
          .query("agentExecutions")
          .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
          .filter((q) => q.gte(q.field("startedAt"), Date.now() - 30 * 24 * 60 * 60 * 1000))
          .collect();

        const currentMonthlyCost = executions.length * 0.01;

        // Scenario 1: Optimize execution frequency
        const scenario1 = {
          name: "Reduce Execution Frequency",
          description: "Optimize scheduling to reduce unnecessary executions by 20%",
          monthlySavings: currentMonthlyCost * 0.20,
          implementation: "medium",
          impact: "low",
        };

        // Scenario 2: Improve error rate
        const errorRate = executions.length > 0
          ? (executions.filter(e => e.status === "failed").length / executions.length)
          : 0;
        const scenario2 = {
          name: "Reduce Error Rate",
          description: "Fix errors to avoid wasted executions",
          monthlySavings: currentMonthlyCost * errorRate,
          implementation: "high",
          impact: "medium",
        };

        // Scenario 3: Batch processing
        const scenario3 = {
          name: "Implement Batch Processing",
          description: "Process multiple items per execution",
          monthlySavings: currentMonthlyCost * 0.30,
          implementation: "high",
          impact: "high",
        };

        return {
          agentId: agent._id,
          agentName: agent.name,
          currentMonthlyCost,
          scenarios: [scenario1, scenario2, scenario3],
          totalPotentialSavings: scenario1.monthlySavings + scenario2.monthlySavings + scenario3.monthlySavings,
        };
      })
    );

    return scenarios.filter(s => s !== null);
  },
});

/**
 * Get ROI projections for agents
 */
export const getROIProjections = query({
  args: {
    businessId: v.id("businesses"),
    agentId: v.optional(v.id("aiAgents")),
    months: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const projectionMonths = args.months || 12;
    const agents = args.agentId
      ? [await ctx.db.get(args.agentId)]
      : await ctx.db
          .query("aiAgents")
          .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
          .collect();

    const projections = await Promise.all(
      agents.filter(a => a).map(async (agent) => {
        if (!agent) return null;

        const executions = await ctx.db
          .query("agentExecutions")
          .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
          .filter((q) => q.gte(q.field("startedAt"), Date.now() - 30 * 24 * 60 * 60 * 1000))
          .collect();

        const monthlyCost = executions.length * 0.01;
        const estimatedValuePerExecution = 0.50; // $0.50 value per successful execution
        const successfulExecutions = executions.filter(e => e.status === "completed" || e.status === "success").length;
        const monthlyValue = successfulExecutions * estimatedValuePerExecution;
        const monthlyROI = monthlyCost > 0 ? ((monthlyValue - monthlyCost) / monthlyCost) * 100 : 0;

        // Project ROI over time
        const monthlyProjections = [];
        let cumulativeCost = 0;
        let cumulativeValue = 0;

        for (let month = 1; month <= projectionMonths; month++) {
          const growthFactor = Math.pow(1.05, month - 1); // 5% monthly growth
          const projectedCost = monthlyCost * growthFactor;
          const projectedValue = monthlyValue * growthFactor;
          
          cumulativeCost += projectedCost;
          cumulativeValue += projectedValue;

          monthlyProjections.push({
            month,
            cost: projectedCost,
            value: projectedValue,
            roi: ((projectedValue - projectedCost) / projectedCost) * 100,
            cumulativeROI: ((cumulativeValue - cumulativeCost) / cumulativeCost) * 100,
          });
        }

        return {
          agentId: agent._id,
          agentName: agent.name,
          currentMonthlyROI: monthlyROI,
          projections: monthlyProjections,
          breakEvenMonth: monthlyProjections.findIndex(p => p.cumulativeROI > 0) + 1,
        };
      })
    );

    return projections.filter(p => p !== null);
  },
});