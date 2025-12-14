import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const generateRiskReport = mutation({
  args: {
    businessId: v.id("businesses"),
    title: v.string(),
    reportType: v.union(
      v.literal("executive_summary"),
      v.literal("detailed_analysis"),
      v.literal("trend_report"),
      v.literal("compliance_report")
    ),
    period: v.object({
      start: v.number(),
      end: v.number(),
    }),
    generatedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const scenarios = await ctx.db
      .query("riskScenarios")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => 
        q.and(
          q.gte(q.field("createdAt"), args.period.start),
          q.lte(q.field("createdAt"), args.period.end)
        )
      )
      .collect();

    const mitigations = await ctx.db
      .query("riskMitigations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => 
        q.and(
          q.gte(q.field("createdAt"), args.period.start),
          q.lte(q.field("createdAt"), args.period.end)
        )
      )
      .collect();

    const totalRisks = scenarios.length;
    const criticalRisks = scenarios.filter(s => (s.probability || 0) * (s.impact || 0) >= 16).length;
    const mitigatedRisks = mitigations.filter(m => m.status === "completed").length;
    const avgRiskScore = scenarios.reduce((sum, s) => sum + ((s.probability || 0) * (s.impact || 0)), 0) / totalRisks || 0;

    const summary = `Risk report for period ${new Date(args.period.start).toLocaleDateString()} to ${new Date(args.period.end).toLocaleDateString()}`;
    
    const keyFindings = [
      `Total risk scenarios: ${totalRisks}`,
      `Critical risks identified: ${criticalRisks}`,
      `Mitigations completed: ${mitigatedRisks}`,
    ];

    const recommendations = [
      "Continue monitoring critical risk scenarios",
      "Implement planned mitigation strategies",
      "Review and update risk assessments quarterly",
    ];

    const reportId = await ctx.db.insert("riskReports", {
      businessId: args.businessId,
      title: args.title,
      reportType: args.reportType,
      period: args.period,
      timeRange: args.period,
      summary,
      keyFindings,
      recommendations,
      metrics: {
        totalRisks,
        criticalRisks,
        mitigatedRisks,
        averageRiskScore: avgRiskScore,
      },
      generatedBy: args.generatedBy,
      generatedAt: Date.now(),
    });

    return reportId;
  },
});

export const listReports = query({
  args: { 
    businessId: v.id("businesses"),
    reportType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let reports = await ctx.db
      .query("riskReports")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .collect();

    if (args.reportType) {
      reports = reports.filter(r => r.reportType === args.reportType);
    }

    return reports;
  },
});

export const getReport = query({
  args: { reportId: v.id("riskReports") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.reportId);
  },
});