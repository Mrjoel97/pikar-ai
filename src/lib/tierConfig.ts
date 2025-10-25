import { 
  BarChart3, 
  Users, 
  Target, 
  Briefcase, 
  TrendingUp, 
  Shield, 
  Settings, 
  FileText, 
  Globe, 
  Zap,
  CheckCircle,
  AlertTriangle,
  Building,
  GitBranch,
  Calendar,
  Network,
  Map,
  Building2,
  Database
} from "lucide-react";

export type TierType = "solopreneur" | "startup" | "sme" | "enterprise";

export interface TierConfig {
  name: string;
  label: string;
  description: string;
  enabledFeatures: string[];
  sidebarItems: Array<{
    label: string;
    icon: any;
    to: string;
    feature?: string;
  }>;
  dashboardSections: string[];
  upgradeMessage: string;
  nextTier?: TierType;
  featureHighlights: string[];
}

export const tierConfigs: Record<TierType, TierConfig> = {
  solopreneur: {
    name: "solopreneur",
    label: "Solopreneur",
    description: "Perfect for individual entrepreneurs",
    enabledFeatures: [
      "today_focus",
      "performance_snapshot", 
      "quick_actions",
      "recent_activity",
      "basic_agents",
      "content_creation",
      "email_automation",
      "solopreneur_exec_assistant",
      "voice_notes",
      "invoice_management",
      "content_calendar",
      "schedule_assistant",
      "agent_insights",
      "content_capsule"
    ],
    sidebarItems: [
      { label: "Dashboard", icon: BarChart3, to: "/dashboard" },
      { label: "Today's Focus", icon: Target, to: "/dashboard", feature: "today_focus" },
      { label: "AI Agents", icon: Zap, to: "/agents", feature: "basic_agents" },
      { label: "Workflows", icon: GitBranch, to: "/workflows" },
      { label: "Initiatives", icon: Target, to: "/initiatives" },
      { label: "Content Calendar", icon: Calendar, to: "/content-calendar", feature: "content_calendar" },
      { label: "Quick Actions", icon: CheckCircle, to: "/dashboard", feature: "quick_actions" },
      { label: "Performance", icon: TrendingUp, to: "/analytics", feature: "performance_snapshot" }
    ],
    dashboardSections: [
      "today_focus",
      "performance_snapshot", 
      "quick_actions",
      "recent_activity"
    ],
    upgradeMessage: "Upgrade to Startup for team features and advanced workflows",
    nextTier: "startup",
    featureHighlights: [
      "3 Core Agents",
      "Complete Solo Biz Toolkit",
      "Personal Brand Builder",
      "Task Automation Suite",
      "Learning Center: Solopreneur Courses",
      "Templates & Market Research",
      "Email Support",
    ]
  },
  startup: {
    name: "startup",
    label: "Startup",
    description: "Built for growing teams",
    enabledFeatures: [
      "team_performance",
      "growth_metrics",
      "active_initiatives", 
      "approvals_tray",
      "advanced_agents",
      "team_workflows",
      "basic_analytics",
      "crm_integration",
      "ab_testing",
      "social_media_hub",
      "team_onboarding",
      "approval_analytics",
      "roi_dashboard"
    ],
    sidebarItems: [
      { label: "Dashboard", icon: BarChart3, to: "/dashboard" },
      { label: "Team Performance", icon: Users, to: "/analytics", feature: "team_performance" },
      { label: "AI Agents", icon: Zap, to: "/agents", feature: "advanced_agents" },
      { label: "Workflows", icon: GitBranch, to: "/workflows", feature: "team_workflows" },
      { label: "Initiatives", icon: Target, to: "/initiatives", feature: "active_initiatives" },
      { label: "CRM Hub", icon: Network, to: "/crm-integration-hub", feature: "crm_integration" },
      { label: "Customer Journey", icon: Map, to: "/customer-journey" },
      { label: "Content Calendar", icon: Calendar, to: "/content-calendar" },
      { label: "Approvals", icon: CheckCircle, to: "/dashboard", feature: "approvals_tray" },
      { label: "Analytics", icon: TrendingUp, to: "/analytics", feature: "basic_analytics" }
    ],
    dashboardSections: [
      "team_performance",
      "growth_metrics",
      "active_initiatives",
      "approvals_tray"
    ],
    upgradeMessage: "Upgrade to SME for governance and compliance features",
    nextTier: "sme",
    featureHighlights: [
      "10 AI Agents",
      "Advanced Analytics",
      "Priority Support",
      "Team Collaboration",
    ]
  },
  sme: {
    name: "sme",
    label: "SME",
    description: "Enterprise-grade governance for mid-market",
    enabledFeatures: [
      "governance_panel",
      "pending_approvals",
      "department_tabs",
      "compliance_monitoring",
      "advanced_workflows",
      "department_analytics",
      "risk_management",
      "crm_integration",
      "ab_testing",
      "roi_dashboard",
      "compliance_reports",
      "risk_analytics",
      "governance_automation",
      "department_dashboards"
    ],
    sidebarItems: [
      { label: "Dashboard", icon: BarChart3, to: "/dashboard" },
      { label: "Governance", icon: Shield, to: "/dashboard", feature: "governance_panel" },
      { label: "AI Agents", icon: Zap, to: "/agents" },
      { label: "Workflows", icon: GitBranch, to: "/workflows", feature: "advanced_workflows" },
      { label: "Initiatives", icon: Target, to: "/initiatives" },
      { label: "CRM Hub", icon: Network, to: "/crm-integration-hub", feature: "crm_integration" },
      { label: "Customer Journey", icon: Map, to: "/customer-journey" },
      { label: "Vendor Management", icon: Building2, to: "/vendor-management" },
      { label: "Content Calendar", icon: Calendar, to: "/content-calendar" },
      { label: "Approvals", icon: CheckCircle, to: "/dashboard", feature: "pending_approvals" },
      { label: "Departments", icon: Building, to: "/business", feature: "department_tabs" },
      { label: "Compliance", icon: FileText, to: "/analytics", feature: "compliance_monitoring" },
      { label: "Analytics", icon: TrendingUp, to: "/analytics", feature: "department_analytics" }
    ],
    dashboardSections: [
      "governance_panel",
      "pending_approvals",
      "department_tabs",
      "compliance_summary"
    ],
    upgradeMessage: "Contact sales to upgrade to Enterprise command center",
    nextTier: "enterprise",
    featureHighlights: [
      "Unlimited Agents",
      "Custom Workflows",
      "API Access",
      "Dedicated Support",
    ]
  },
  enterprise: {
    name: "enterprise",
    label: "Enterprise",
    description: "Full command center for large organizations",
    enabledFeatures: [
      "global_overview",
      "command_center",
      "telemetry_summary",
      "strategic_initiatives",
      "global_compliance",
      "enterprise_analytics",
      "custom_workflows",
      "advanced_governance",
      "branding_portal",
      "scim_provisioning",
      "sso_configuration",
      "kms_encryption",
      "api_webhooks",
      "white_label",
      "global_social_command",
      "crm_integration",
      "ab_testing",
      "roi_dashboard"
    ],
    sidebarItems: [
      { label: "Command Center", icon: Globe, to: "/dashboard" },
      { label: "Global Overview", icon: BarChart3, to: "/dashboard", feature: "global_overview" },
      { label: "AI Agents", icon: Zap, to: "/agents" },
      { label: "Workflows", icon: GitBranch, to: "/workflows", feature: "custom_workflows" },
      { label: "Initiatives", icon: Target, to: "/initiatives", feature: "strategic_initiatives" },
      { label: "Portfolio", icon: Briefcase, to: "/portfolio-dashboard" },
      { label: "Data Warehouse", icon: Database, to: "/data-warehouse" },
      { label: "CRM Hub", icon: Network, to: "/crm-integration-hub", feature: "crm_integration" },
      { label: "Customer Journey", icon: Map, to: "/customer-journey" },
      { label: "Vendor Management", icon: Building2, to: "/vendor-management" },
      { label: "Content Calendar", icon: Calendar, to: "/content-calendar" },
      { label: "Governance", icon: Shield, to: "/dashboard", feature: "advanced_governance" },
      { label: "Business Units", icon: Building, to: "/business" },
      { label: "Compliance", icon: FileText, to: "/analytics", feature: "global_compliance" },
      { label: "Analytics", icon: TrendingUp, to: "/analytics", feature: "enterprise_analytics" },
      { label: "Settings", icon: Settings, to: "/dashboard" }
    ],
    dashboardSections: [
      "global_overview",
      "strategic_initiatives", 
      "telemetry_summary",
      "command_widgets"
    ],
    upgradeMessage: "You have access to all Enterprise features",
    nextTier: undefined,
    featureHighlights: [
      "White-label Solution",
      "Custom Integrations",
      "SLA Guarantee",
      "On-premise Option",
    ]
  }
};

export function getTierConfig(tier: TierType): TierConfig {
  return tierConfigs[tier] || tierConfigs.solopreneur;
}

export function canShowFeature(feature: string, tier: TierType): boolean {
  const config = getTierConfig(tier);
  return config.enabledFeatures.includes(feature);
}

export function getUpgradeMessage(currentTier: TierType): string {
  const config = getTierConfig(currentTier);
  return config.upgradeMessage;
}