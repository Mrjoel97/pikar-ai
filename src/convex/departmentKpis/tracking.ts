import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const trackKpi = mutation({
  args: {
    businessId: v.id("businesses"),
    department: v.string(),
    name: v.string(),
    value: v.number(),
    unit: v.string(),
    period: v.string(),
  },
  handler: async (ctx, args) => {
    const kpiId = await ctx.db.insert("departmentKpis", {
      businessId: args.businessId,
      department: args.department,
      name: args.name,
      value: args.value,
      unit: args.unit,
      period: args.period,
      recordedAt: Date.now(),
      createdAt: Date.now(),
    });
    return kpiId;
  },
});

export const getKpiHistory = query({
  args: {
    businessId: v.id("businesses"),
    department: v.string(),
    name: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let kpis = await ctx.db
      .query("departmentKpis")
      .withIndex("by_department", (q) =>
        q.eq("businessId", args.businessId).eq("department", args.department)
      )
      .filter((q) => q.eq(q.field("name"), args.name))
      .order("desc")
      .collect();

    if (args.limit) {
      return kpis.slice(0, args.limit);
    }
    return kpis;
  },
});

export const getDepartmentKpis = query({
  args: {
    businessId: v.id("businesses"),
    department: v.string(),
  },
  handler: async (ctx, args) => {
    const kpis = await ctx.db
      .query("departmentKpis")
      .withIndex("by_department", (q) =>
        q.eq("businessId", args.businessId).eq("department", args.department)
      )
      .collect();

    // Group by KPI name and get latest value
    const grouped = kpis.reduce((acc: any, kpi) => {
      if (!acc[kpi.name] || kpi.recordedAt > acc[kpi.name].recordedAt) {
        acc[kpi.name] = kpi;
      }
      return acc;
    }, {});

    return Object.values(grouped);
  },
});

export const getAllDepartmentsKpis = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const kpis = await ctx.db
      .query("departmentKpis")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    const byDepartment = kpis.reduce((acc: any, kpi) => {
      if (!acc[kpi.department]) {
        acc[kpi.department] = [];
      }
      acc[kpi.department].push(kpi);
      return acc;
    }, {});

    return byDepartment;
  },
});