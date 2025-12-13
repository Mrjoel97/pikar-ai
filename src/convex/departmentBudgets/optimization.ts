import { v } from "convex/values";
import { query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Get AI-powered budget optimization suggestions
 */
export const getOptimizationSuggestions = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const fiscalYear = new Date().getFullYear();
    
    const allocations = await ctx.db
      .query("departmentBudgets")
      .withIndex("by_business_and_year", (q: any) =>
        q.eq("businessId", args.businessId).eq("fiscalYear", fiscalYear)
      )
      .collect();

    const actuals = await ctx.db
      .query("departmentBudgetActuals")
      .withIndex("by_business_and_year", (q: any) =>
        q.eq("businessId", args.businessId).eq("fiscalYear", fiscalYear)
      )
      .collect();

    const suggestions: Array<{
      department: string;
      type: "reallocation" | "efficiency" | "cost_reduction" | "investment";
      priority: "high" | "medium" | "low";
      title: string;
      description: string;
      potentialSavings: number;
      actionItems: string[];
    }> = [];

    for (const allocation of allocations) {
      const deptActuals = actuals.filter((a: any) => a.department === allocation.department);
      const spent = deptActuals.reduce((sum: any, a: any) => sum + a.amount, 0);
      const utilization = spent / allocation.amount;

      // Under-utilized budget
      if (utilization < 0.6) {
        suggestions.push({
          department: allocation.department,
          type: "reallocation",
          priority: "high",
          title: "Reallocate Unused Budget",
          description: `${allocation.department} has used only ${Math.round(utilization * 100)}% of allocated budget`,
          potentialSavings: Math.round(allocation.amount - spent),
          actionItems: [
            "Review department needs and adjust allocation",
            "Reallocate to high-demand departments",
            "Consider reducing next year's budget",
          ],
        });
      }

      // High burn rate
      if (utilization > 0.85 && new Date().getMonth() < 9) {
        suggestions.push({
          department: allocation.department,
          type: "cost_reduction",
          priority: "high",
          title: "Implement Cost Controls",
          description: `${allocation.department} is on track to exceed budget`,
          potentialSavings: 0,
          actionItems: [
            "Review and approve all expenses over $1000",
            "Identify non-essential spending",
            "Negotiate better rates with vendors",
          ],
        });
      }

      // Category analysis
      const categorySpend: Record<string, number> = {};
      deptActuals.forEach((actual: any) => {
        categorySpend[actual.category] = (categorySpend[actual.category] || 0) + actual.amount;
      });

      const topCategory = Object.entries(categorySpend)
        .sort(([, a], [, b]) => (b as number) - (a as number))[0];

      if (topCategory && topCategory[1] > spent * 0.4) {
        suggestions.push({
          department: allocation.department,
          type: "efficiency",
          priority: "medium",
          title: "Optimize Major Expense Category",
          description: `${topCategory[0]} accounts for ${Math.round((topCategory[1] / spent) * 100)}% of spending`,
          potentialSavings: Math.round(topCategory[1] * 0.15),
          actionItems: [
            `Review all ${topCategory[0]} expenses`,
            "Consolidate vendors for better rates",
            "Explore automation opportunities",
          ],
        });
      }
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  },
});

/**
 * Simulate budget scenario
 */
export const simulateBudgetScenario = query({
  args: {
    businessId: v.id("businesses"),
    adjustments: v.array(
      v.object({
        department: v.string(),
        newAllocation: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const fiscalYear = new Date().getFullYear();
    
    const allocations = await ctx.db
      .query("departmentBudgets")
      .withIndex("by_business_and_year", (q: any) =>
        q.eq("businessId", args.businessId).eq("fiscalYear", fiscalYear)
      )
      .collect();

    const actuals = await ctx.db
      .query("departmentBudgetActuals")
      .withIndex("by_business_and_year", (q: any) =>
        q.eq("businessId", args.businessId).eq("fiscalYear", fiscalYear)
      )
      .collect();

    const currentTotal = allocations.reduce((sum: any, a: any) => sum + a.amount, 0);
    const newTotal = args.adjustments.reduce((sum, a) => sum + a.newAllocation, 0);

    const results = args.adjustments.map((adj) => {
      const current = allocations.find((a: any) => a.department === adj.department);
      const deptActuals = actuals.filter((a: any) => a.department === adj.department);
      const spent = deptActuals.reduce((sum: any, a: any) => sum + a.amount, 0);
      
      const currentAllocation = current?.amount || 0;
      const change = adj.newAllocation - currentAllocation;
      const newUtilization = currentAllocation > 0 ? (spent / adj.newAllocation) * 100 : 0;

      return {
        department: adj.department,
        currentAllocation,
        newAllocation: adj.newAllocation,
        change,
        changePercent: currentAllocation > 0 ? Math.round((change / currentAllocation) * 100) : 0,
        currentUtilization: currentAllocation > 0 ? Math.round((spent / currentAllocation) * 100) : 0,
        newUtilization: Math.round(newUtilization),
        impact: change > 0 ? "increased_capacity" : change < 0 ? "reduced_capacity" : "no_change",
      };
    });

    return {
      currentTotal,
      newTotal,
      totalChange: newTotal - currentTotal,
      departments: results,
      feasibility: newTotal <= currentTotal * 1.1 ? "feasible" : "requires_approval",
    };
  },
});

/**
 * Get budget reallocation recommendations
 */
export const getReallocationRecommendations = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const fiscalYear = new Date().getFullYear();
    
    const allocations = await ctx.db
      .query("departmentBudgets")
      .withIndex("by_business_and_year", (q: any) =>
        q.eq("businessId", args.businessId).eq("fiscalYear", fiscalYear)
      )
      .collect();

    const actuals = await ctx.db
      .query("departmentBudgetActuals")
      .withIndex("by_business_and_year", (q: any) =>
        q.eq("businessId", args.businessId).eq("fiscalYear", fiscalYear)
      )
      .collect();

    // Find under-utilized and over-utilized departments
    const analysis = allocations.map((allocation: any) => {
      const deptActuals = actuals.filter((a: any) => a.department === allocation.department);
      const spent = deptActuals.reduce((sum: any, a: any) => sum + a.amount, 0);
      const utilization = spent / allocation.amount;
      const monthsElapsed = new Date().getMonth() + 1;
      const projected = monthsElapsed > 0 ? (spent / monthsElapsed) * 12 : spent;

      return {
        department: allocation.department,
        allocated: allocation.amount,
        spent,
        utilization,
        projected,
        surplus: allocation.amount - projected,
        deficit: projected - allocation.amount,
      };
    });

    const underUtilized = analysis.filter(d => d.surplus > 0 && d.utilization < 0.7);
    const overUtilized = analysis.filter(d => d.deficit > 0);

    const recommendations = [];

    // Generate reallocation suggestions
    const totalSurplus = underUtilized.reduce((sum, d) => sum + d.surplus, 0);
    const totalDeficit = overUtilized.reduce((sum, d) => sum + d.deficit, 0);

    if (totalSurplus > 0 && totalDeficit > 0) {
      const reallocatable = Math.min(totalSurplus, totalDeficit);
      
      recommendations.push({
        type: "reallocation",
        title: "Reallocate Surplus Budget",
        description: `Move $${Math.round(reallocatable / 1000)}K from under-utilized to over-utilized departments`,
        from: underUtilized.map(d => ({
          department: d.department,
          amount: Math.round(d.surplus * (reallocatable / totalSurplus)),
        })),
        to: overUtilized.map(d => ({
          department: d.department,
          amount: Math.round(d.deficit * (reallocatable / totalDeficit)),
        })),
        impact: "Prevents budget overruns while utilizing available funds",
      });
    }

    return recommendations;
  },
});
