import { v } from "convex/values";
import { mutation, query, action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Query: Get report templates
export const listTemplates = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("reportTemplates").collect();
  },
});

// Query: Get scheduled reports for a business
export const listScheduledReports = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scheduledReports")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
  },
});

// Query: Get generated reports for a business
export const listGeneratedReports = query({
  args: { 
    businessId: v.id("businesses"),
    framework: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("generatedReports")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId));
    
    const reports = await query.collect();
    
    if (args.framework) {
      return reports.filter(r => r.framework === args.framework);
    }
    
    return reports;
  },
});

// Mutation: Create a scheduled report
export const createScheduledReport = mutation({
  args: {
    businessId: v.id("businesses"),
    templateId: v.id("reportTemplates"),
    frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    recipients: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Not authenticated");

    const reportId = await ctx.db.insert("scheduledReports", {
      businessId: args.businessId,
      templateId: args.templateId,
      frequency: args.frequency,
      recipients: args.recipients,
      isActive: true,
      createdAt: Date.now(),
      lastRunAt: undefined,
      nextRunAt: Date.now() + 24 * 60 * 60 * 1000, // Tomorrow
    });

    return reportId;
  },
});

// Mutation: Delete a scheduled report
export const deleteScheduledReport = mutation({
  args: { reportId: v.id("scheduledReports") },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Not authenticated");

    await ctx.db.delete(args.reportId);
  },
});

// Action: Generate compliance report
export const generateComplianceReport = action({
  args: {
    businessId: v.id("businesses"),
    templateId: v.id("reportTemplates"),
    dateRange: v.object({
      start: v.number(),
      end: v.number(),
    }),
    departments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args): Promise<Id<"generatedReports">> => {
    const template = await ctx.runQuery(api.complianceReports.getTemplate, {
      templateId: args.templateId,
    });

    if (!template) {
      throw new Error("Template not found");
    }

    // Aggregate data based on template sections
    const reportData: any = {};
    
    for (const section of template.sections) {
      // Run queries for each section
      reportData[section.title] = await aggregateSectionData(ctx, section, args);
    }

    // Store the generated report
    const reportId = await ctx.runMutation(internal.complianceReports.storeGeneratedReport, {
      businessId: args.businessId,
      templateId: args.templateId,
      framework: template.framework,
      dateRange: args.dateRange,
      departments: args.departments,
      data: reportData,
    });

    return reportId;
  },
});

// Internal query: Get template
export const getTemplate = query({
  args: { templateId: v.id("reportTemplates") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.templateId);
  },
});

// Internal mutation: Store generated report
export const storeGeneratedReport = internalMutation({
  args: {
    businessId: v.id("businesses"),
    templateId: v.id("reportTemplates"),
    framework: v.string(),
    data: v.any(),
    dateRange: v.object({
      start: v.number(),
      end: v.number(),
    }),
    departments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("generatedReports", {
      businessId: args.businessId,
      templateId: args.templateId,
      framework: args.framework,
      reportData: JSON.stringify(args.data),
      dateRange: args.dateRange,
      generatedAt: Date.now(),
      downloadUrl: undefined, // Will be set after PDF generation
    });
  },
});

// Internal queries for section data
export const getAuditLogs = query({
  args: {
    businessId: v.id("businesses"),
    dateRange: v.object({
      start: v.number(),
      end: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("audit_logs")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), args.dateRange.start),
          q.lte(q.field("createdAt"), args.dateRange.end)
        )
      )
      .collect();

    return {
      totalLogs: logs.length,
      byAction: logs.reduce((acc: any, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {}),
    };
  },
});

export const getAccessControls = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("businessId"), args.businessId))
      .collect();

    return {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.emailVerificationTime).length,
    };
  },
});

export const getDataProcessing = query({
  args: {
    businessId: v.id("businesses"),
    dateRange: v.object({
      start: v.number(),
      end: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    return {
      totalContacts: contacts.length,
      byStatus: contacts.reduce((acc: any, contact) => {
        acc[contact.status] = (acc[contact.status] || 0) + 1;
        return acc;
      }, {}),
    };
  },
});

// Cron action: Generate scheduled reports
export const generateScheduledReports = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    const dueReports = await ctx.db
      .query("scheduledReports")
      .filter((q) =>
        q.and(
          q.eq(q.field("isActive"), true),
          q.lte(q.field("nextRunAt"), now)
        )
      )
      .collect();

    for (const report of dueReports) {
      // Schedule the generation action
      await ctx.scheduler.runAfter(0, internal.complianceReports.generateAndEmailReport, {
        scheduledReportId: report._id,
      });

      // Update next run time
      const nextRun = calculateNextRun(report.frequency, now);
      await ctx.db.patch(report._id, {
        lastRunAt: now,
        nextRunAt: nextRun,
      });
    }
  },
});

// Helper to calculate next run time
function calculateNextRun(frequency: string, from: number): number {
  const day = 24 * 60 * 60 * 1000;
  switch (frequency) {
    case "daily":
      return from + day;
    case "weekly":
      return from + 7 * day;
    case "monthly":
      return from + 30 * day;
    default:
      return from + day;
  }
}

// Internal action: Generate and email report
export const generateAndEmailReport = internalMutation({
  args: { scheduledReportId: v.id("scheduledReports") },
  handler: async (ctx, args) => {
    const scheduled = await ctx.db.get(args.scheduledReportId);
    if (!scheduled) return;

    // Generate the report (simplified - in production, call the full generation action)
    // Then email to recipients
    // This is a placeholder for the full implementation
  },
});

// Helper function to aggregate section data
async function aggregateSectionData(ctx: any, section: any, args: any): Promise<any> {
  // This is a simplified implementation
  // In production, you'd have specific queries for each section type
  
  switch (section.queryType) {
    case "audit_logs":
      return await ctx.runQuery(api.complianceReports.getAuditLogs, {
        businessId: args.businessId,
        dateRange: args.dateRange,
      });
    
    case "access_controls":
      return await ctx.runQuery(api.complianceReports.getAccessControls, {
        businessId: args.businessId,
      });
    
    case "data_processing":
      return await ctx.runQuery(api.complianceReports.getDataProcessing, {
        businessId: args.businessId,
        dateRange: args.dateRange,
      });
    
    default:
      return { message: "No data available" };
  }
}