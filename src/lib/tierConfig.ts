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
  Workflow
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
      "email_automation"
    ],
    sidebarItems: [
      { label: "Dashboard", icon: BarChart3, to: "/dashboard" },
      { label: "Today's Focus", icon: Target, to: "/dashboard", feature: "today_focus" },
      { label: "AI Agents", icon: Zap, to: "/agents", feature: "basic_agents" },
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
    nextTier: "startup"
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
      "basic_analytics"
    ],
    sidebarItems: [
      { label: "Dashboard", icon: BarChart3, to: "/dashboard" },
      { label: "Team Performance", icon: Users, to: "/analytics", feature: "team_performance" },
      { label: "AI Agents", icon: Zap, to: "/agents", feature: "advanced_agents" },
      { label: "Workflows", icon: Workflow, to: "/workflows", feature: "team_workflows" },
      { label: "Initiatives", icon: Target, to: "/initiatives", feature: "active_initiatives" },
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
    nextTier: "sme"
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
      "risk_management"
    ],
    sidebarItems: [
      { label: "Dashboard", icon: BarChart3, to: "/dashboard" },
      { label: "Governance", icon: Shield, to: "/dashboard", feature: "governance_panel" },
      { label: "AI Agents", icon: Zap, to: "/agents" },
      { label: "Workflows", icon: Workflow, to: "/workflows", feature: "advanced_workflows" },
      { label: "Initiatives", icon: Target, to: "/initiatives" },
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
    nextTier: "enterprise"
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
      "advanced_governance"
    ],
    sidebarItems: [
      { label: "Command Center", icon: Globe, to: "/dashboard" },
      { label: "Global Overview", icon: BarChart3, to: "/dashboard", feature: "global_overview" },
      { label: "AI Agents", icon: Zap, to: "/agents" },
      { label: "Workflows", icon: Workflow, to: "/workflows", feature: "custom_workflows" },
      { label: "Initiatives", icon: Target, to: "/initiatives", feature: "strategic_initiatives" },
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
    nextTier: undefined
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