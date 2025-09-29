// Industry playbook generators and aggregation

import { PLAYBOOK_CATEGORIES, INDUSTRIES, generatePlaybookKey } from "./constants";

// Solopreneur (industry-specific)
const generateSolopreneurPlaybooks = (industry: string, displayName: string) => [
  {
    playbook_key: generatePlaybookKey(industry, "momentum_capsule"),
    display_name: `${displayName} Momentum Capsule`,
    version: "v1.0",
    tier: "solopreneur",
    triggers: [{ type: "http", path: `/api/playbooks/${industry}_momentum_capsule/trigger`, method: "POST" }],
    input_schema: { type: "object", required: ["businessId"] },
    output_schema: { type: "object" },
    steps: [
      {
        step_id: "content_1",
        name: "Create momentum content",
        agent_key: "content_creation",
        action: "create_momentum_content",
        input_map: { industry_context: industry, brand_voice: "$.company_profile.brand_voice" },
        output_map: { content: "$.steps.content_1.output" },
      },
    ],
    metadata: { industry, category: PLAYBOOK_CATEGORIES.CONTENT_OPS, owner_role: "solopreneur", human_in_loop: false, auto_execute: true, audit: true },
    active: false,
  },
  {
    playbook_key: generatePlaybookKey(industry, "weekly_newsletter"),
    display_name: `${displayName} Weekly Newsletter`,
    version: "v1.0",
    tier: "solopreneur",
    triggers: [{ type: "scheduled", cron: "0 9 * * 1" }],
    input_schema: { type: "object", required: ["businessId"] },
    output_schema: { type: "object" },
    steps: [
      {
        step_id: "newsletter_1",
        name: "Generate newsletter content",
        agent_key: "content_creation",
        action: "create_newsletter_draft",
        input_map: { industry_focus: industry, weekly_theme: "$.external.trending_topics" },
        output_map: { newsletter: "$.steps.newsletter_1.output" },
      },
    ],
    metadata: { industry, category: PLAYBOOK_CATEGORIES.CONTENT_OPS, owner_role: "solopreneur", human_in_loop: false, auto_execute: true, audit: true },
    active: false,
  },
  {
    playbook_key: generatePlaybookKey(industry, "lead_nurture"),
    display_name: `${displayName} Lead Nurture Sequence`,
    version: "v1.0",
    tier: "solopreneur",
    triggers: [{ type: "event", event_name: "lead.captured" }],
    input_schema: { type: "object", required: ["leadId", "businessId"] },
    output_schema: { type: "object" },
    steps: [
      {
        step_id: "nurture_1",
        name: "Create nurture sequence",
        agent_key: "marketing_automation",
        action: "create_nurture_sequence",
        input_map: { lead_profile: "$.leadId", industry_context: industry },
        output_map: { sequence: "$.steps.nurture_1.output" },
      },
    ],
    metadata: { industry, category: PLAYBOOK_CATEGORIES.GROWTH, owner_role: "solopreneur", human_in_loop: false, auto_execute: true, audit: true },
    active: false,
  },
  {
    playbook_key: generatePlaybookKey(industry, "quick_analytics"),
    display_name: `${displayName} Quick Analytics`,
    version: "v1.0",
    tier: "solopreneur",
    triggers: [{ type: "scheduled", cron: "0 8 * * 1" }],
    input_schema: { type: "object", required: ["businessId"] },
    output_schema: { type: "object" },
    steps: [
      {
        step_id: "analytics_1",
        name: "Generate analytics summary",
        agent_key: "data_analysis",
        action: "generate_weekly_summary",
        input_map: { industry_metrics: industry, timeframe: "7d" },
        output_map: { summary: "$.steps.analytics_1.output" },
      },
    ],
    metadata: { industry, category: PLAYBOOK_CATEGORIES.ANALYTICS, owner_role: "solopreneur", human_in_loop: false, auto_execute: true, audit: true },
    active: false,
  },
  {
    playbook_key: generatePlaybookKey(industry, "schedule_helper"),
    display_name: `${displayName} Schedule Helper`,
    version: "v1.0",
    tier: "solopreneur",
    triggers: [{ type: "http", path: `/api/playbooks/${industry}_schedule_helper/trigger`, method: "POST" }],
    input_schema: { type: "object", required: ["businessId", "content_type"] },
    output_schema: { type: "object" },
    steps: [
      {
        step_id: "schedule_1",
        name: "Optimize schedule",
        agent_key: "marketing_automation",
        action: "optimize_content_schedule",
        input_map: { content_type: "$.content_type", industry_patterns: industry },
        output_map: { schedule: "$.steps.schedule_1.output" },
      },
    ],
    metadata: { industry, category: PLAYBOOK_CATEGORIES.OPS, owner_role: "solopreneur", human_in_loop: false, auto_execute: true, audit: true },
    active: false,
  },
];

// Startup
const generateStartupPlaybooks = (industry: string, displayName: string) => [
  {
    playbook_key: generatePlaybookKey(industry, "ab_experiment"),
    display_name: `${displayName} A/B Experiment Runner`,
    version: "v1.0",
    tier: "startup",
    triggers: [{ type: "http", path: `/api/playbooks/${industry}_ab_experiment/trigger`, method: "POST" }],
    input_schema: { type: "object", required: ["businessId", "experiment_type"] },
    output_schema: { type: "object" },
    steps: [
      {
        step_id: "experiment_1",
        name: "Setup A/B test",
        agent_key: "data_analysis",
        action: "setup_ab_test",
        input_map: { experiment_type: "$.experiment_type", industry_context: industry },
        output_map: { experiment: "$.steps.experiment_1.output" },
      },
    ],
    metadata: { industry, category: PLAYBOOK_CATEGORIES.GROWTH, owner_role: "growth", human_in_loop: false, auto_execute: true, audit: true },
    active: false,
  },
  {
    playbook_key: generatePlaybookKey(industry, "growth_loop"),
    display_name: `${displayName} Growth Loop Optimizer`,
    version: "v1.0",
    tier: "startup",
    triggers: [{ type: "scheduled", cron: "0 10 * * 1" }],
    input_schema: { type: "object", required: ["businessId"] },
    output_schema: { type: "object" },
    steps: [
      {
        step_id: "growth_1",
        name: "Analyze growth metrics",
        agent_key: "data_analysis",
        action: "analyze_growth_metrics",
        input_map: { industry_benchmarks: industry, timeframe: "30d" },
        output_map: { analysis: "$.steps.growth_1.output" },
      },
    ],
    metadata: { industry, category: PLAYBOOK_CATEGORIES.GROWTH, owner_role: "growth", human_in_loop: false, auto_execute: true, audit: true },
    active: false,
  },
  {
    playbook_key: generatePlaybookKey(industry, "support_triage"),
    display_name: `${displayName} Support Triage`,
    version: "v1.0",
    tier: "startup",
    triggers: [{ type: "event", event_name: "support.ticket_created" }],
    input_schema: { type: "object", required: ["ticketId", "businessId"] },
    output_schema: { type: "object" },
    steps: [
      {
        step_id: "triage_1",
        name: "Classify and route ticket",
        agent_key: "customer_support",
        action: "classify_ticket",
        input_map: { ticket_id: "$.ticketId", industry_context: industry },
        output_map: { classification: "$.steps.triage_1.output" },
      },
    ],
    metadata: { industry, category: PLAYBOOK_CATEGORIES.SUPPORT, owner_role: "support", human_in_loop: true, auto_execute: true, audit: true },
    active: false,
  },
  {
    playbook_key: generatePlaybookKey(industry, "team_review"),
    display_name: `${displayName} Team Performance Review`,
    version: "v1.0",
    tier: "startup",
    triggers: [{ type: "scheduled", cron: "0 9 1 * *" }],
    input_schema: { type: "object", required: ["businessId"] },
    output_schema: { type: "object" },
    steps: [
      {
        step_id: "review_1",
        name: "Generate team metrics",
        agent_key: "data_analysis",
        action: "generate_team_metrics",
        input_map: { industry_context: industry, period: "monthly" },
        output_map: { metrics: "$.steps.review_1.output" },
      },
    ],
    metadata: { industry, category: PLAYBOOK_CATEGORIES.ANALYTICS, owner_role: "management", human_in_loop: true, auto_execute: true, audit: true },
    active: false,
  },
  {
    playbook_key: generatePlaybookKey(industry, "crm_sync"),
    display_name: `${displayName} CRM Sync & Update`,
    version: "v1.0",
    tier: "startup",
    triggers: [{ type: "scheduled", cron: "0 */6 * * *" }],
    input_schema: { type: "object", required: ["businessId"] },
    output_schema: { type: "object" },
    steps: [
      {
        step_id: "sync_1",
        name: "Sync CRM data",
        agent_key: "sales_intelligence",
        action: "sync_crm_data",
        input_map: { industry_context: industry, sync_type: "incremental" },
        output_map: { sync_result: "$.steps.sync_1.output" },
      },
    ],
    metadata: { industry, category: PLAYBOOK_CATEGORIES.OPS, owner_role: "sales", human_in_loop: false, auto_execute: true, audit: true },
    active: false,
  },
  {
    playbook_key: generatePlaybookKey(industry, "churn_prevention"),
    display_name: `${displayName} Churn Prevention`,
    version: "v1.0",
    tier: "startup",
    triggers: [{ type: "event", event_name: "user.churn_risk_detected" }],
    input_schema: { type: "object", required: ["userId", "businessId"] },
    output_schema: { type: "object" },
    steps: [
      {
        step_id: "prevention_1",
        name: "Create retention campaign",
        agent_key: "marketing_automation",
        action: "create_retention_campaign",
        input_map: { user_id: "$.userId", industry_context: industry },
        output_map: { campaign: "$.steps.prevention_1.output" },
      },
    ],
    metadata: { industry, category: PLAYBOOK_CATEGORIES.GROWTH, owner_role: "growth", human_in_loop: false, auto_execute: true, audit: true },
    active: false,
  },
];

// SME
const generateSmePlaybooks = (industry: string, displayName: string) => [
  {
    playbook_key: generatePlaybookKey(industry, "governance_review"),
    display_name: `${displayName} Governance Review`,
    version: "v1.0",
    tier: "sme",
    triggers: [{ type: "scheduled", cron: "0 9 1 * *" }],
    input_schema: { type: "object", required: ["businessId"] },
    output_schema: { type: "object" },
    steps: [
      {
        step_id: "governance_1",
        name: "Run governance checks",
        agent_key: "compliance_risk",
        action: "run_governance_audit",
        input_map: { industry_regulations: industry, scope: "monthly" },
        output_map: { audit_result: "$.steps.governance_1.output" },
      },
    ],
    metadata: { industry, category: PLAYBOOK_CATEGORIES.GOVERNANCE, owner_role: "compliance", human_in_loop: true, auto_execute: false, audit: true },
    active: false,
  },
  {
    playbook_key: generatePlaybookKey(industry, "approval_chain"),
    display_name: `${displayName} Approval Chain Manager`,
    version: "v1.0",
    tier: "sme",
    triggers: [{ type: "event", event_name: "approval.required" }],
    input_schema: { type: "object", required: ["approvalId", "businessId"] },
    output_schema: { type: "object" },
    steps: [
      {
        step_id: "approval_1",
        name: "Route approval request",
        agent_key: "operations_optimization",
        action: "route_approval",
        input_map: { approval_id: "$.approvalId", industry_context: industry },
        output_map: { routing: "$.steps.approval_1.output" },
      },
    ],
    metadata: { industry, category: PLAYBOOK_CATEGORIES.GOVERNANCE, owner_role: "management", human_in_loop: true, auto_execute: true, audit: true },
    active: false,
  },
  {
    playbook_key: generatePlaybookKey(industry, "sla_monitor"),
    display_name: `${displayName} SLA Monitor`,
    version: "v1.0",
    tier: "sme",
    triggers: [{ type: "scheduled", cron: "*/15 * * * *" }],
    input_schema: { type: "object", required: ["businessId"] },
    output_schema: { type: "object" },
    steps: [
      {
        step_id: "sla_1",
        name: "Check SLA compliance",
        agent_key: "operations_optimization",
        action: "check_sla_compliance",
        input_map: { industry_standards: industry, check_type: "realtime" },
        output_map: { sla_status: "$.steps.sla_1.output" },
      },
    ],
    metadata: { industry, category: PLAYBOOK_CATEGORIES.GOVERNANCE, owner_role: "operations", human_in_loop: false, auto_execute: true, audit: true },
    active: false,
  },
  {
    playbook_key: generatePlaybookKey(industry, "compliance_check"),
    display_name: `${displayName} Compliance Checker`,
    version: "v1.0",
    tier: "sme",
    triggers: [{ type: "http", path: `/api/playbooks/${industry}_compliance_check/trigger`, method: "POST" }],
    input_schema: { type: "object", required: ["businessId", "check_type"] },
    output_schema: { type: "object" },
    steps: [
      {
        step_id: "compliance_1",
        name: "Run compliance check",
        agent_key: "compliance_risk",
        action: "run_compliance_check",
        input_map: { check_type: "$.check_type", industry_regulations: industry },
        output_map: { compliance_result: "$.steps.compliance_1.output" },
      },
    ],
    metadata: { industry, category: PLAYBOOK_CATEGORIES.GOVERNANCE, owner_role: "compliance", human_in_loop: true, auto_execute: false, audit: true },
    active: false,
  },
  {
    playbook_key: generatePlaybookKey(industry, "cross_dept_sync"),
    display_name: `${displayName} Cross-Department Sync`,
    version: "v1.0",
    tier: "sme",
    triggers: [{ type: "scheduled", cron: "0 14 * * 1" }],
    input_schema: { type: "object", required: ["businessId"] },
    output_schema: { type: "object" },
    steps: [
      {
        step_id: "sync_1",
        name: "Coordinate departments",
        agent_key: "strategic_planning",
        action: "coordinate_departments",
        input_map: { industry_context: industry, sync_type: "weekly" },
        output_map: { coordination: "$.steps.sync_1.output" },
      },
    ],
    metadata: { industry, category: PLAYBOOK_CATEGORIES.OPS, owner_role: "management", human_in_loop: true, auto_execute: true, audit: true },
    active: false,
  },
];

// Enterprise
const generateEnterprisePlaybooks = (industry: string, displayName: string) => [
  {
    playbook_key: generatePlaybookKey(industry, "global_rollout"),
    display_name: `${displayName} Global Rollout Manager`,
    version: "v1.0",
    tier: "enterprise",
    triggers: [{ type: "http", path: `/api/playbooks/${industry}_global_rollout/trigger`, method: "POST" }],
    input_schema: { type: "object", required: ["businessId", "rollout_plan"] },
    output_schema: { type: "object" },
    steps: [
      {
        step_id: "rollout_1",
        name: "Coordinate global rollout",
        agent_key: "strategic_planning",
        action: "coordinate_global_rollout",
        input_map: { rollout_plan: "$.rollout_plan", industry_context: industry },
        output_map: { rollout_status: "$.steps.rollout_1.output" },
      },
    ],
    metadata: { industry, category: PLAYBOOK_CATEGORIES.OPS, owner_role: "executive", human_in_loop: true, auto_execute: false, audit: true },
    active: false,
  },
  {
    playbook_key: generatePlaybookKey(industry, "risk_assessment"),
    display_name: `${displayName} Enterprise Risk Assessment`,
    version: "v1.0",
    tier: "enterprise",
    triggers: [{ type: "scheduled", cron: "0 9 1 */3 *" }],
    input_schema: { type: "object", required: ["businessId"] },
    output_schema: { type: "object" },
    steps: [
      {
        step_id: "risk_1",
        name: "Assess enterprise risks",
        agent_key: "compliance_risk",
        action: "assess_enterprise_risks",
        input_map: { industry_context: industry, assessment_scope: "quarterly" },
        output_map: { risk_assessment: "$.steps.risk_1.output" },
      },
    ],
    metadata: { industry, category: PLAYBOOK_CATEGORIES.GOVERNANCE, owner_role: "risk", human_in_loop: true, auto_execute: false, audit: true },
    active: false,
  },
  {
    playbook_key: generatePlaybookKey(industry, "executive_summary"),
    display_name: `${displayName} Executive Summary Generator`,
    version: "v1.0",
    tier: "enterprise",
    triggers: [{ type: "scheduled", cron: "0 8 * * 1" }],
    input_schema: { type: "object", required: ["businessId"] },
    output_schema: { type: "object" },
    steps: [
      {
        step_id: "summary_1",
        name: "Generate executive summary",
        agent_key: "data_analysis",
        action: "generate_executive_summary",
        input_map: { industry_context: industry, timeframe: "weekly" },
        output_map: { summary: "$.steps.summary_1.output" },
      },
    ],
    metadata: { industry, category: PLAYBOOK_CATEGORIES.ANALYTICS, owner_role: "executive", human_in_loop: false, auto_execute: true, audit: true },
    active: false,
  },
  {
    playbook_key: generatePlaybookKey(industry, "multi_tenant_ops"),
    display_name: `${displayName} Multi-Tenant Operations`,
    version: "v1.0",
    tier: "enterprise",
    triggers: [{ type: "event", event_name: "tenant.operation_required" }],
    input_schema: { type: "object", required: ["tenantId", "businessId", "operation"] },
    output_schema: { type: "object" },
    steps: [
      {
        step_id: "ops_1",
        name: "Execute multi-tenant operation",
        agent_key: "operations_optimization",
        action: "execute_multi_tenant_operation",
        input_map: { tenant_id: "$.tenantId", operation: "$.operation", industry_context: industry },
        output_map: { operation_result: "$.steps.ops_1.output" },
      },
    ],
    metadata: { industry, category: PLAYBOOK_CATEGORIES.OPS, owner_role: "operations", human_in_loop: true, auto_execute: false, audit: true },
    active: false,
  },
];

// Aggregate all industries
export const generateIndustryPlaybooks = () => {
  const all: any[] = [];
  INDUSTRIES.forEach(({ key, display }) => {
    all.push(...generateSolopreneurPlaybooks(key, display));
    all.push(...generateStartupPlaybooks(key, display));
    all.push(...generateSmePlaybooks(key, display));
    all.push(...generateEnterprisePlaybooks(key, display));
  });
  return all;
};

export const INDUSTRY_PLAYBOOKS = generateIndustryPlaybooks();

export { INDUSTRIES }; // re-export for convenience
