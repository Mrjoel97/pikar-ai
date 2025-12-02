import { v } from "convex/values";
import { mutation, query, action, internalMutation } from "./_generated/server";
import { api, internal as internalApi } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Query: List all report templates
export const listTemplates = query({
  args: {},
  handler: async (ctx: any) => {
    return await ctx.db.query("reportTemplates").collect();
  },
});

// Query: List generated reports for a business
export const listGeneratedReports = query({
  args: {
    businessId: v.id("businesses"),
    framework: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
    let query = ctx.db
      .query("generatedReports")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId))
      .order("desc");

    const reports = await query.collect();

    if (args.framework) {
      return reports.filter((r: any) => r.framework === args.framework);
    }

    return reports;
  },
});

// Enhanced: Get report template with full details
export const getTemplate = query({
  args: { templateId: v.id("reportTemplates") },
  handler: async (ctx: any, args) => {
    return await ctx.db.get(args.templateId);
  },
});

// Enhanced: Create custom report template
export const createTemplate = mutation({
  args: {
    name: v.string(),
    framework: v.string(),
    sections: v.array(v.object({
      title: v.string(),
      queryType: v.string(),
      description: v.string(),
    })),
  },
  handler: async (ctx: any, args) => {
    return await ctx.db.insert("reportTemplates", {
      name: args.name,
      framework: args.framework,
      sections: args.sections,
      createdAt: Date.now(),
    });
  },
});

// Enhanced: Schedule report generation
export const scheduleReport = mutation({
  args: {
    businessId: v.id("businesses"),
    templateId: v.id("reportTemplates"),
    frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    recipients: v.array(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx: any, args) => {
    const nextRun = calculateNextRun(args.frequency);
    
    return await ctx.db.insert("scheduledReports", {
      businessId: args.businessId,
      templateId: args.templateId,
      frequency: args.frequency,
      recipients: args.recipients,
      isActive: args.isActive,
      nextRunAt: nextRun,
      createdAt: Date.now(),
    });
  },
});

// Enhanced: Get scheduled reports
export const getScheduledReports = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx: any, args) => {
    const schedules = await ctx.db
      .query("scheduledReports")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId))
      .collect();

    return await Promise.all(
      schedules.map(async (schedule: any) => {
        const template = await ctx.db.get(schedule.templateId);
        return {
          ...schedule,
          templateName: template?.name || "Unknown",
          framework: template?.framework || "Unknown",
        };
      })
    );
  },
});

// Enhanced: Update scheduled report
export const updateScheduledReport = mutation({
  args: {
    scheduleId: v.id("scheduledReports"),
    isActive: v.optional(v.boolean()),
    recipients: v.optional(v.array(v.string())),
    frequency: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))),
  },
  handler: async (ctx: any, args) => {
    const { scheduleId, ...updates } = args;
    
    if (updates.frequency) {
      const nextRun = calculateNextRun(updates.frequency);
      await ctx.db.patch(scheduleId, { ...updates, nextRunAt: nextRun });
    } else {
      await ctx.db.patch(scheduleId, updates);
    }
  },
});

// Enhanced: Delete scheduled report
export const deleteScheduledReport = mutation({
  args: { scheduleId: v.id("scheduledReports") },
  handler: async (ctx: any, args) => {
    await ctx.db.delete(args.scheduleId);
  },
});

// Enhanced: Get report history
export const getReportHistory = query({
  args: {
    businessId: v.id("businesses"),
    framework: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: any, args) => {
    let query = ctx.db
      .query("generatedReports")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId))
      .order("desc");

    const reports = await query.take(args.limit || 50);

    if (args.framework) {
      return reports.filter((r: any) => r.framework === args.framework);
    }

    return await Promise.all(
      reports.map(async (report: any) => {
        const template = await ctx.db.get(report.templateId);
        return {
          ...report,
          templateName: template?.name || "Unknown",
        };
      })
    );
  },
});

// Enhanced: Generate compliance report with evidence
export const generateComplianceReport: any = action({
  args: {
    businessId: v.id("businesses"),
    templateId: v.id("reportTemplates"),
    dateRange: v.object({
      start: v.number(),
      end: v.number(),
    }),
    departments: v.optional(v.array(v.string())),
    evidenceIds: v.optional(v.array(v.id("_storage"))),
    changeNotes: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
    // Get template
    const template = await ctx.runQuery(api.complianceReports.getTemplate, {
      templateId: args.templateId,
    });

    if (!template) {
      throw new Error("Template not found");
    }

    // Collect compliance data based on framework
    const reportData = await collectComplianceData(ctx, {
      businessId: args.businessId,
      framework: template.framework,
      dateRange: args.dateRange,
      departments: args.departments,
      sections: template.sections,
    });

    // Generate report document
    const reportDocument = generateReportDocument({
      template,
      data: reportData,
      dateRange: args.dateRange,
      evidenceIds: args.evidenceIds,
      changeNotes: args.changeNotes,
    });

    // Store report
    const reportId = await ctx.runMutation(internalApi.complianceReports.storeReport, {
      businessId: args.businessId,
      templateId: args.templateId,
      framework: template.framework,
      reportData: JSON.stringify(reportDocument),
      dateRange: args.dateRange,
      evidenceIds: args.evidenceIds,
      changeNotes: args.changeNotes,
    });

    return { reportId, reportData: reportDocument };
  },
});

// Internal: Store generated report
export const storeReport = internalMutation({
  args: {
    businessId: v.id("businesses"),
    templateId: v.id("reportTemplates"),
    framework: v.string(),
    reportData: v.string(),
    dateRange: v.object({
      start: v.number(),
      end: v.number(),
    }),
    evidenceIds: v.optional(v.array(v.id("_storage"))),
    changeNotes: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
    // Check for previous version
    const previousReports = await ctx.db
      .query("generatedReports")
      .withIndex("by_business", (q: any) => q.eq("businessId", args.businessId))
      .filter((q: any) => q.eq(q.field("framework"), args.framework))
      .order("desc")
      .take(1);

    const previousVersion = previousReports[0];
    const version = previousVersion ? (previousVersion.version || 1) + 1 : 1;

    return await ctx.db.insert("generatedReports", {
      businessId: args.businessId,
      templateId: args.templateId,
      framework: args.framework,
      reportData: args.reportData,
      dateRange: args.dateRange,
      generatedAt: Date.now(),
      version,
      changeNotes: args.changeNotes,
      previousVersionId: previousVersion?._id,
    });
  },
});

// Enhanced: Distribute report via email
export const distributeReport = action({
  args: {
    reportId: v.id("generatedReports"),
    recipients: v.array(v.string()),
  },
  handler: async (ctx: any, args) => {
    const report = await ctx.runQuery(internalApi.complianceReports.getReportById, {
      reportId: args.reportId,
    });

    if (!report) {
      throw new Error("Report not found");
    }

    // Update report with distribution info
    await ctx.runMutation(internalApi.complianceReports.markReportDistributed, {
      reportId: args.reportId,
      recipients: args.recipients,
    });

    // In production, integrate with email service (Resend)
    // For now, return success
    return { success: true, recipients: args.recipients };
  },
});

// Internal: Get report by ID
export const getReportById = query({
  args: { reportId: v.id("generatedReports") },
  handler: async (ctx: any, args) => {
    return await ctx.db.get(args.reportId);
  },
});

// Internal: Mark report as distributed
export const markReportDistributed = internalMutation({
  args: {
    reportId: v.id("generatedReports"),
    recipients: v.array(v.string()),
  },
  handler: async (ctx: any, args) => {
    await ctx.db.patch(args.reportId, {
      emailedTo: args.recipients,
      emailedAt: Date.now(),
    });
  },
});

// Helper: Calculate next run time
function calculateNextRun(frequency: "daily" | "weekly" | "monthly"): number {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  
  switch (frequency) {
    case "daily":
      return now + day;
    case "weekly":
      return now + 7 * day;
    case "monthly":
      return now + 30 * day;
  }
}

// Helper: Collect compliance data
async function collectComplianceData(
  ctx: any,
  params: {
    businessId: Id<"businesses">;
    framework: string;
    dateRange: { start: number; end: number };
    departments?: string[];
    sections: any[];
  }
) {
  const data: any = {
    framework: params.framework,
    dateRange: params.dateRange,
    sections: [],
  };

  // Collect data for each section based on queryType
  for (const section of params.sections) {
    const sectionData = await collectSectionData(ctx, {
      businessId: params.businessId,
      queryType: section.queryType,
      dateRange: params.dateRange,
      departments: params.departments,
    });

    data.sections.push({
      title: section.title,
      description: section.description,
      data: sectionData,
    });
  }

  return data;
}

// Helper: Collect section-specific data
async function collectSectionData(
  ctx: any,
  params: {
    businessId: Id<"businesses">;
    queryType: string;
    dateRange: { start: number; end: number };
    departments?: string[];
  }
) {
  // Query different tables based on queryType
  switch (params.queryType) {
    case "audit_logs":
      return await ctx.runQuery(api.audit.searchAuditLogs, {
        businessId: params.businessId,
        startDate: params.dateRange.start,
        endDate: params.dateRange.end,
      });
    
    case "incidents":
      return await ctx.runQuery(api.governance.getIncidents, {
        businessId: params.businessId,
      });
    
    case "risks":
      return await ctx.runQuery(api.riskAnalytics.getRiskRegister, {
        businessId: params.businessId,
      });
    
    case "policies":
      return await ctx.runQuery(api.policyManagement.listPolicies, {
        businessId: params.businessId,
      });
    
    case "compliance_checks":
      return await ctx.runQuery(api.governance.getComplianceChecks, {
        businessId: params.businessId,
      });
    
    default:
      return [];
  }
}

// Helper: Generate report document
function generateReportDocument(params: {
  template: any;
  data: any;
  dateRange: { start: number; end: number };
  evidenceIds?: Id<"_storage">[];
  changeNotes?: string;
}) {
  return {
    title: `${params.template.framework} Compliance Report`,
    framework: params.template.framework,
    generatedAt: new Date().toISOString(),
    dateRange: {
      start: new Date(params.dateRange.start).toISOString(),
      end: new Date(params.dateRange.end).toISOString(),
    },
    version: params.data.version || 1,
    changeNotes: params.changeNotes,
    sections: params.data.sections,
    evidenceCount: params.evidenceIds?.length || 0,
    summary: {
      totalFindings: params.data.sections.reduce((acc: number, s: any) => acc + (s.data?.length || 0), 0),
      criticalIssues: 0, // Calculate based on severity
      recommendations: [], // Extract from data
    },
  };
}

// Export internal functions
const internal = {
  complianceReports: {
    getReportById,
    storeReport,
    markReportDistributed,
  },
};