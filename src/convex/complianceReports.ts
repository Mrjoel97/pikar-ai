import { v } from "convex/values";
import { query, mutation, action, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Query: List all report templates
export const listTemplates = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("reportTemplates").collect();
  },
});

// Query: List generated reports for a business
export const listGeneratedReports = query({
  args: {
    businessId: v.id("businesses"),
    framework: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("generatedReports")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc");

    const reports = await query.collect();

    if (args.framework) {
      return reports.filter((r) => r.framework === args.framework);
    }

    return reports;
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
  handler: async (ctx, args) => {
    const template: any = await ctx.runQuery("complianceReports:getTemplate" as any, {
      templateId: args.templateId,
    });

    if (!template) {
      throw new Error("Template not found");
    }

    // Collect compliance data based on framework
    const reportData = {
      framework: template.framework,
      dateRange: args.dateRange,
      departments: args.departments,
      metrics: {
        totalAuditLogs: 0,
        accessControls: 0,
        dataProcessing: 0,
      },
      timestamp: Date.now(),
    };

    // Store the generated report
    const reportId = await ctx.runMutation("complianceReports:storeGeneratedReport" as any, {
      businessId: args.businessId,
      templateId: args.templateId,
      framework: template.framework,
      data: reportData,
      dateRange: args.dateRange,
      departments: args.departments,
    });

    return reportId;
  },
});

// Query: Get template by ID
export const getTemplate = query({
  args: { templateId: v.id("reportTemplates") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.templateId);
  },
});

// Internal action: Generate and email report
export const generateAndEmailReport = action({
  args: { scheduledReportId: v.id("scheduledReports") },
  handler: async (ctx, args) => {
    const scheduled = await (ctx as any).runQuery("complianceReports:getScheduledReport" as any, {
      reportId: args.scheduledReportId,
    });
    
    if (!scheduled) return;

    const template = await (ctx as any).runQuery("complianceReports:getTemplate" as any, {
      templateId: scheduled.templateId,
    });

    if (!template) return;

    // Generate the full compliance report
    const dateRange = {
      start: Date.now() - 30 * 24 * 60 * 60 * 1000, // Last 30 days
      end: Date.now(),
    };

    const reportId = await (ctx as any).runAction("complianceReports:generateComplianceReport" as any, {
      businessId: scheduled.businessId,
      templateId: scheduled.templateId,
      dateRange,
      departments: undefined,
    });

    // Get email configuration
    const cfg: any = await (ctx as any).runQuery("emailConfig:getByBusiness" as any, {
      businessId: scheduled.businessId,
    });

    const RESEND_KEY: string | undefined = (cfg?.resendApiKey as string | undefined) || process.env.RESEND_API_KEY;

    if (!RESEND_KEY) {
      console.warn("[COMPLIANCE] No RESEND_API_KEY available. Cannot email report.");
      return;
    }

    // Import Resend dynamically
    const { Resend } = await import("resend");
    const resend = new Resend(RESEND_KEY);

    const fromEmail = cfg?.fromEmail || process.env.FROM_EMAIL || "reports@pikar.ai";
    const fromName = cfg?.fromName || "Pikar AI Compliance";

    // Send email to all recipients
    for (const recipient of scheduled.recipients) {
      try {
        await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: recipient,
          subject: `${template.framework} Compliance Report - ${new Date().toLocaleDateString()}`,
          html: `
            <h2>${template.framework} Compliance Report</h2>
            <p>Your scheduled compliance report has been generated.</p>
            <p><strong>Period:</strong> ${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}</p>
            <p><strong>Framework:</strong> ${template.framework}</p>
            <p>Please review the attached report for detailed compliance metrics.</p>
          `,
        });

        // Update report with email tracking
        await (ctx as any).runMutation("complianceReports:updateReportEmailStatus" as any, {
          reportId,
          recipient,
        });
      } catch (error) {
        console.error(`[COMPLIANCE] Failed to email report to ${recipient}:`, error);
      }
    }

    // Audit log
    await (ctx as any).runMutation("audit:log" as any, {
      businessId: scheduled.businessId,
      userId: "system",
      action: "compliance_report_emailed",
      details: {
        reportId,
        framework: template.framework,
        recipients: scheduled.recipients,
      },
    });
  },
});

// Query: Get scheduled report by ID
export const getScheduledReport = query({
  args: { reportId: v.id("scheduledReports") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.reportId);
  },
});

// Query: Get report versions
export const getReportVersions = query({
  args: {
    businessId: v.id("businesses"),
    templateId: v.id("reportTemplates"),
    framework: v.string(),
  },
  handler: async (ctx, args) => {
    const reports = await ctx.db
      .query("generatedReports")
      .withIndex("by_template_and_framework", (q) =>
        q.eq("templateId", args.templateId).eq("framework", args.framework)
      )
      .filter((q) => q.eq(q.field("businessId"), args.businessId))
      .order("desc")
      .collect();

    return reports;
  },
});

// Mutation: Update report email status
export const updateReportEmailStatus = internalMutation({
  args: {
    reportId: v.id("generatedReports"),
    recipient: v.string(),
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) return;

    const emailedTo = report.emailedTo || [];
    if (!emailedTo.includes(args.recipient)) {
      emailedTo.push(args.recipient);
    }

    await ctx.db.patch(args.reportId, {
      emailedTo,
      emailedAt: Date.now(),
    });
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
    changeNotes: v.optional(v.string()),
    previousVersionId: v.optional(v.id("generatedReports")),
  },
  handler: async (ctx, args) => {
    // Get the latest version number for this report type
    const existingReports = await ctx.db
      .query("generatedReports")
      .withIndex("by_template_and_framework", (q) =>
        q.eq("templateId", args.templateId).eq("framework", args.framework)
      )
      .filter((q) => q.eq(q.field("businessId"), args.businessId))
      .order("desc")
      .take(1);

    const version = existingReports.length > 0 ? (existingReports[0].version || 1) + 1 : 1;

    return await ctx.db.insert("generatedReports", {
      businessId: args.businessId,
      templateId: args.templateId,
      framework: args.framework,
      reportData: JSON.stringify(args.data),
      dateRange: args.dateRange,
      generatedAt: Date.now(),
      downloadUrl: undefined,
      version,
      changeNotes: args.changeNotes,
      previousVersionId: args.previousVersionId || (existingReports.length > 0 ? existingReports[0]._id : undefined),
      emailedTo: undefined,
      emailedAt: undefined,
    });
  },
});