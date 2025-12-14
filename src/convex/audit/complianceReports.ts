"use node";
import { v } from "convex/values";
import { action, query, mutation } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * Generate a compliance report based on audit logs
 */
export const generateComplianceReport = action({
  args: {
    businessId: v.id("businesses"),
    framework: v.union(
      v.literal("SOC2"),
      v.literal("GDPR"),
      v.literal("HIPAA"),
      v.literal("ISO27001"),
      v.literal("PCI-DSS")
    ),
    startDate: v.number(),
    endDate: v.number(),
    includeRemediation: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Fetch audit logs for the period
    const logs = await ctx.runQuery(internal.audit.listForBusiness, {
      businessId: args.businessId,
      limit: 10000,
    });

    const filteredLogs = logs.filter(
      (log: any) => log.createdAt >= args.startDate && log.createdAt <= args.endDate
    );

    // Analyze logs based on framework requirements
    const analysis = analyzeComplianceFramework(args.framework, filteredLogs);

    // Generate report structure
    const report = {
      framework: args.framework,
      period: {
        start: args.startDate,
        end: args.endDate,
      },
      generatedAt: Date.now(),
      summary: {
        totalEvents: filteredLogs.length,
        criticalEvents: analysis.critical.length,
        complianceScore: analysis.score,
        violations: analysis.violations.length,
      },
      sections: analysis.sections,
      recommendations: analysis.recommendations,
      auditTrail: filteredLogs.slice(0, 100), // Include sample
    };

    return report;
  },
});

// Helper functions
function analyzeComplianceFramework(framework: string, logs: any[]) {
  const critical = logs.filter((log: any) => 
    log.action.includes("delete") || 
    log.action.includes("security") ||
    log.entityType === "user"
  );

  const violations = logs.filter((log: any) =>
    log.action.includes("violation") || 
    log.action.includes("failed")
  );

  // Calculate compliance score (0-100)
  const score = Math.max(0, 100 - (violations.length / logs.length) * 100);

  const sections = generateFrameworkSections(framework, logs);
  const recommendations = generateRecommendations(framework, violations);

  return { critical, violations, score, sections, recommendations };
}

function generateFrameworkSections(framework: string, logs: any[]) {
  const sections: any[] = [];

  if (framework === "SOC2") {
    sections.push(
      { name: "Access Controls", events: logs.filter((l: any) => l.entityType === "user").length },
      { name: "Change Management", events: logs.filter((l: any) => l.action.includes("update")).length },
      { name: "Monitoring", events: logs.length }
    );
  } else if (framework === "GDPR") {
    sections.push(
      { name: "Data Processing", events: logs.filter((l: any) => l.entityType === "contact").length },
      { name: "Consent Management", events: logs.filter((l: any) => l.action.includes("consent")).length },
      { name: "Data Subject Rights", events: logs.filter((l: any) => l.action.includes("delete")).length }
    );
  }

  return sections;
}

function generateRecommendations(framework: string, violations: any[]) {
  const recommendations: string[] = [];

  if (violations.length > 10) {
    recommendations.push("High number of violations detected. Review access controls and permissions.");
  }

  if (framework === "SOC2") {
    recommendations.push("Implement regular access reviews and multi-factor authentication.");
  } else if (framework === "GDPR") {
    recommendations.push("Ensure data processing agreements are in place with all third parties.");
  }

  return recommendations;
}

function calculateNextRun(frequency: string, from: number): number {
  const day = 24 * 60 * 60 * 1000;
  if (frequency === "weekly") return from + 7 * day;
  if (frequency === "monthly") return from + 30 * day;
  if (frequency === "quarterly") return from + 90 * day;
  if (frequency === "annually") return from + 365 * day;
  return from + day;
}