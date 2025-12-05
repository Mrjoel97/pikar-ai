import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get compliance status by location
 */
export const getLocationCompliance = query({
  args: {
    businessId: v.id("businesses"),
    locationId: v.optional(v.id("locations")),
  },
  handler: async (ctx, args) => {
    const locations = args.locationId
      ? [await ctx.db.get(args.locationId)]
      : await ctx.db
          .query("locations")
          .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
          .filter((q) => q.eq(q.field("isActive"), true))
          .collect();

    const complianceData = [];

    for (const location of locations) {
      if (!location) continue;

      const workflows = await ctx.db
        .query("workflows")
        .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
        .filter((q) => q.eq(q.field("locationId"), location._id))
        .collect();

      const total = workflows.length;
      const compliant = workflows.filter(
        (w) => !w.governanceHealth || w.governanceHealth.score >= 80
      ).length;

      const violations = await ctx.db
        .query("governanceViolations")
        .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
        .collect();

      const locationViolations = violations.filter((v) => {
        const workflow = workflows.find((w) => w._id === v.workflowId);
        return !!workflow;
      });

      const openViolations = locationViolations.filter((v) => v.status === "open").length;
      const criticalViolations = locationViolations.filter(
        (v) => v.severity === "critical" && v.status === "open"
      ).length;

      complianceData.push({
        locationId: location._id,
        locationName: location.name,
        locationCode: location.code,
        complianceScore: total > 0 ? Math.round((compliant / total) * 100) : 100,
        totalWorkflows: total,
        compliantWorkflows: compliant,
        openViolations,
        criticalViolations,
        status: criticalViolations > 0
          ? "critical"
          : openViolations > 5
          ? "warning"
          : "healthy",
      });
    }

    return complianceData.sort((a, b) => a.complianceScore - b.complianceScore);
  },
});

/**
 * Track compliance audit for a location
 */
export const recordComplianceAudit = mutation({
  args: {
    locationId: v.id("locations"),
    auditType: v.string(),
    auditor: v.string(),
    findings: v.array(v.object({
      category: v.string(),
      severity: v.union(v.literal("critical"), v.literal("high"), v.literal("medium"), v.literal("low")),
      description: v.string(),
    })),
    overallScore: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const location = await ctx.db.get(args.locationId);
    if (!location) throw new Error("Location not found");

    const auditId = await ctx.db.insert("locationAudits", {
      businessId: location.businessId,
      locationId: args.locationId,
      auditType: args.auditType,
      auditor: args.auditor,
      findings: args.findings,
      overallScore: args.overallScore,
      notes: args.notes,
      status: "completed",
      auditDate: Date.now(),
      createdAt: Date.now(),
    });

    await ctx.db.insert("audit_logs", {
      businessId: location.businessId,
      action: "compliance_audit_completed",
      entityType: "location",
      entityId: args.locationId,
      details: {
        auditId,
        auditType: args.auditType,
        score: args.overallScore,
        findingsCount: args.findings.length,
      },
      createdAt: Date.now(),
    });

    return auditId;
  },
});

/**
 * Get compliance audit history for a location
 */
export const getAuditHistory = query({
  args: {
    locationId: v.id("locations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let audits = await ctx.db
      .query("locationAudits")
      .withIndex("by_location", (q) => q.eq("locationId", args.locationId))
      .order("desc")
      .collect();

    if (args.limit) {
      audits = audits.slice(0, args.limit);
    }

    return audits;
  },
});

/**
 * Get compliance trends across locations
 */
export const getComplianceTrends = query({
  args: {
    businessId: v.id("businesses"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const now = Date.now();
    const startTime = now - days * 24 * 60 * 60 * 1000;

    const locations = await ctx.db
      .query("locations")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const trends = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      let totalScore = 0;
      let locationCount = 0;

      for (const location of locations) {
        const workflows = await ctx.db
          .query("workflows")
          .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
          .filter((q) => q.eq(q.field("locationId"), location._id))
          .collect();

        const total = workflows.length;
        if (total > 0) {
          const compliant = workflows.filter(
            (w) => !w.governanceHealth || w.governanceHealth.score >= 80
          ).length;
          totalScore += Math.round((compliant / total) * 100);
          locationCount++;
        }
      }

      const avgScore = locationCount > 0 ? Math.round(totalScore / locationCount) : 100;

      trends.push({
        date: date.toISOString().split("T")[0],
        averageComplianceScore: avgScore,
        locationsTracked: locationCount,
      });
    }

    return trends;
  },
});
