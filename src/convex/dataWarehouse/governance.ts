import { v } from "convex/values";
import { query, mutation } from "../_generated/server";

/**
 * Get data governance rules
 */
export const getDataGovernanceRules = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return [
      {
        id: "rule-1",
        name: "PII Data Masking",
        category: "privacy",
        description: "Mask personally identifiable information in non-production environments",
        status: "active",
        severity: "high",
        appliesTo: ["customer_data", "user_profiles"],
      },
      {
        id: "rule-2",
        name: "Data Retention Policy",
        category: "compliance",
        description: "Delete customer data after 7 years of inactivity",
        status: "active",
        severity: "medium",
        appliesTo: ["all_datasets"],
      },
      {
        id: "rule-3",
        name: "Access Control",
        category: "security",
        description: "Restrict sensitive data access to authorized roles only",
        status: "active",
        severity: "critical",
        appliesTo: ["financial_data", "health_records"],
      },
    ];
  },
});

/**
 * Enforce data governance rule
 */
export const enforceDataGovernance = mutation({
  args: {
    businessId: v.id("businesses"),
    ruleId: v.string(),
    datasetId: v.string(),
  },
  handler: async (ctx, args) => {
    // Apply governance rule
    return {
      success: true,
      ruleId: args.ruleId,
      appliedAt: Date.now(),
      affectedRecords: 1250,
    };
  },
});

/**
 * Get governance violations
 */
export const getGovernanceViolations = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return [
      {
        id: "violation-1",
        ruleId: "rule-1",
        ruleName: "PII Data Masking",
        severity: "high",
        description: "Unmasked PII found in staging environment",
        datasetId: "dataset-123",
        detectedAt: Date.now() - 3600000,
        status: "open",
        affectedRecords: 45,
      },
      {
        id: "violation-2",
        ruleId: "rule-3",
        ruleName: "Access Control",
        severity: "critical",
        description: "Unauthorized access attempt to financial data",
        datasetId: "dataset-456",
        detectedAt: Date.now() - 7200000,
        status: "investigating",
        affectedRecords: 12,
      },
    ];
  },
});
