import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
/* removed unused internal import to avoid deep type instantiation */

/**
 * Get budget allocations for a business
 */
export const getBudgetAllocations = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    fiscalYear: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      // Guest-safe: return demo data
      return {
        fiscalYear: 2024,
        departments: [
          {
            department: "Marketing",
            allocated: 300000,
            spent: 245000,
            remaining: 55000,
            variance: -18.3,
            forecast: 290000,
            alerts: ["On track to underspend by $10K"],
          },
          {
            department: "Sales",
            allocated: 400000,
            spent: 385000,
            remaining: 15000,
            variance: -3.8,
            forecast: 405000,
            alerts: ["Projected to exceed budget by $5K"],
          },
          {
            department: "Operations",
            allocated: 250000,
            spent: 198000,
            remaining: 52000,
            variance: -20.8,
            forecast: 240000,
            alerts: [],
          },
          {
            department: "Finance",
            allocated: 150000,
            spent: 142000,
            remaining: 8000,
            variance: -5.3,
            forecast: 148000,
            alerts: [],
          },
        ],
      };
    }

    const fiscalYear = args.fiscalYear || new Date().getFullYear();
    
    // Fetch budget allocations
    const allocations = await ctx.db
      .query("departmentBudgets")
      .withIndex("by_business_and_year", (q) =>
        q.eq("businessId", args.businessId as Id<"businesses">).eq("fiscalYear", fiscalYear)
      )
      .collect();

    // Fetch actual spending
    const actuals = await ctx.db
      .query("departmentBudgetActuals")
      .withIndex("by_business_and_year", (q) =>
        q.eq("businessId", args.businessId as Id<"businesses">).eq("fiscalYear", fiscalYear)
      )
      .collect();

    // Aggregate by department
    const departments = ["Marketing", "Sales", "Operations", "Finance"];
    const result = departments.map((dept) => {
      const allocation = allocations.find((a) => a.department === dept);
      const deptActuals = actuals.filter((a) => a.department === dept);
      
      const allocated = allocation?.amount || 0;
      const spent = deptActuals.reduce((sum, a) => sum + a.amount, 0);
      const remaining = allocated - spent;
      const variance = allocated > 0 ? ((spent - allocated) / allocated) * 100 : 0;
      
      // Simple forecast: current spend rate extrapolated
      const monthsElapsed = new Date().getMonth() + 1;
      const forecast = monthsElapsed > 0 ? (spent / monthsElapsed) * 12 : spent;
      
      // Generate alerts
      const alerts: string[] = [];
      if (variance > 10) {
        alerts.push(`Over budget by ${variance.toFixed(1)}%`);
      } else if (forecast > allocated * 1.05) {
        alerts.push(`Projected to exceed budget by $${((forecast - allocated) / 1000).toFixed(0)}K`);
      } else if (variance < -20) {
        alerts.push(`Significantly under budget (${Math.abs(variance).toFixed(1)}% remaining)`);
      }

      return {
        department: dept,
        allocated,
        spent,
        remaining,
        variance,
        forecast,
        alerts,
      };
    });

    return {
      fiscalYear,
      departments: result,
    };
  },
});

/**
 * Get budget trend over time
 */
export const getBudgetTrend = query({
  args: {
    businessId: v.optional(v.id("businesses")),
    department: v.optional(v.string()),
    months: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.businessId) {
      // Demo data
      return [
        { month: "Jan", allocated: 25000, spent: 22000, forecast: 24000 },
        { month: "Feb", allocated: 25000, spent: 23500, forecast: 24500 },
        { month: "Mar", allocated: 25000, spent: 24200, forecast: 25000 },
        { month: "Apr", allocated: 25000, spent: 24800, forecast: 25200 },
      ];
    }

    const months = args.months || 12;
    const now = Date.now();
    const cutoff = now - months * 30 * 24 * 60 * 60 * 1000;

    const actuals = await ctx.db
      .query("departmentBudgetActuals")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId as Id<"businesses">))
      .filter((q) => q.gte(q.field("date"), cutoff))
      .collect();

    // Group by month
    const monthlyData: Record<string, { spent: number; count: number }> = {};
    actuals.forEach((actual) => {
      if (args.department && actual.department !== args.department) return;
      
      const date = new Date(actual.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      
      if (!monthlyData[key]) {
        monthlyData[key] = { spent: 0, count: 0 };
      }
      monthlyData[key].spent += actual.amount;
      monthlyData[key].count++;
    });

    // Convert to array and add forecast
    const result = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, data]) => {
        const [year, month] = key.split("-");
        const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString("default", { month: "short" });
        
        return {
          month: monthName,
          allocated: 25000, // Would fetch from allocations
          spent: data.spent,
          forecast: data.spent * 1.05, // Simple 5% buffer
        };
      });

    return result;
  },
});

/**
 * Create or update budget allocation
 */
export const setBudgetAllocation = mutation({
  args: {
    businessId: v.id("businesses"),
    department: v.string(),
    fiscalYear: v.number(),
    amount: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Check if allocation exists
    const existing = await ctx.db
      .query("departmentBudgets")
      .withIndex("by_business_and_year", (q) =>
        q.eq("businessId", args.businessId).eq("fiscalYear", args.fiscalYear)
      )
      .filter((q) => q.eq(q.field("department"), args.department))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        amount: args.amount,
        notes: args.notes,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      const id = await ctx.db.insert("departmentBudgets", {
        businessId: args.businessId,
        department: args.department,
        fiscalYear: args.fiscalYear,
        amount: args.amount,
        notes: args.notes || "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return id;
    }
  },
});

/**
 * Record actual spending
 */
export const recordActualSpend = mutation({
  args: {
    businessId: v.id("businesses"),
    department: v.string(),
    amount: v.number(),
    date: v.number(),
    category: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const fiscalYear = new Date(args.date).getFullYear();

    const id = await ctx.db.insert("departmentBudgetActuals", {
      businessId: args.businessId,
      department: args.department,
      fiscalYear,
      amount: args.amount,
      date: args.date,
      category: args.category,
      description: args.description || "",
      createdAt: Date.now(),
    });

    // Check for budget alerts using string-based reference to avoid deep type instantiation
    await ctx.scheduler.runAfter(
      0,
      "departmentBudgets:checkBudgetAlerts" as any,
      {
        businessId: args.businessId,
        department: args.department,
        fiscalYear,
      }
    );

    return id;
  },
});

/**
 * Adjust forecast
 */
export const adjustForecast = mutation({
  args: {
    businessId: v.id("businesses"),
    department: v.string(),
    fiscalYear: v.number(),
    newForecast: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Store forecast adjustment
    const id = await ctx.db.insert("departmentBudgetForecasts", {
      businessId: args.businessId,
      department: args.department,
      fiscalYear: args.fiscalYear,
      forecastAmount: args.newForecast,
      reason: args.reason,
      createdAt: Date.now(),
      createdBy: identity.email || "unknown",
    });

    // Audit log
    await ctx.db.insert("audit_logs", {
      businessId: args.businessId,
      action: "forecast_adjustment",
      entityType: "department_budget",
      entityId: args.department,
      details: {
        fiscalYear: args.fiscalYear,
        newForecast: args.newForecast,
        reason: args.reason,
      },
      createdAt: Date.now(),
    });

    return id;
  },
});

/**
 * Internal: Check budget alerts
 */
export const checkBudgetAlerts = internalMutation({
  args: {
    businessId: v.id("businesses"),
    department: v.string(),
    fiscalYear: v.number(),
  },
  handler: async (ctx, args) => {
    // Get allocation
    const allocation = await ctx.db
      .query("departmentBudgets")
      .withIndex("by_business_and_year", (q) =>
        q.eq("businessId", args.businessId).eq("fiscalYear", args.fiscalYear)
      )
      .filter((q) => q.eq(q.field("department"), args.department))
      .first();

    if (!allocation) return;

    // Get actuals
    const actuals = await ctx.db
      .query("departmentBudgetActuals")
      .withIndex("by_business_and_year", (q) =>
        q.eq("businessId", args.businessId).eq("fiscalYear", args.fiscalYear)
      )
      .filter((q) => q.eq(q.field("department"), args.department))
      .collect();

    const spent = actuals.reduce((sum, a) => sum + a.amount, 0);
    const variance = ((spent - allocation.amount) / allocation.amount) * 100;

    // Determine recipient user for system alert (business owner)
    const business = await ctx.db.get(args.businessId);
    if (!business) {
      return; // no business context; skip alert
    }
    const alertUserId = business.ownerId;

    // Check existence using take(1) to avoid non-existent .first()
    const [existingAlert] = await ctx.db
      .query("notifications")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "system_alert"),
          q.eq(q.field("title"), `Budget Alert: ${args.department} ${args.fiscalYear}`)
        )
      )
      .take(1);

    if (!existingAlert) {
      await ctx.db.insert("notifications", {
        businessId: args.businessId,
        userId: alertUserId, // required by schema
        type: "system_alert",
        title: `Budget Alert: ${args.department} ${args.fiscalYear}`,
        message:
          spent > allocation.amount
            ? `${args.department} has exceeded budget by $${(((spent - allocation.amount) / 1000) | 0)}K`
            : `${args.department} is at ${(100 - Math.abs(variance)).toFixed(0)}% of budget`,
        data: {
          kind: "budget",
          department: args.department,
          fiscalYear: args.fiscalYear,
          allocated: allocation.amount,
          spent,
          variance,
        },
        isRead: false,
        priority: spent > allocation.amount ? "high" : "medium", // required by schema
        createdAt: Date.now(),
      });
    }
  },
});