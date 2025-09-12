export type Tier = "solopreneur" | "startup" | "sme" | "enterprise";

type SidebarItem = { label: string; icon: string; to: string };

export type TierFeatureFlags = {
  showQuickActions: boolean;
  showTodaysFocus: boolean;
  showRecentActivity: boolean;
  showInitiativeJourney: boolean;
  showApprovals: boolean;
  showFeatureFlags: boolean;
  showTelemetry: boolean;
  showDueSoon: boolean;
  showEmailCampaigns: boolean;
};

type TierConfigEntry = {
  label: string;
  sidebar: SidebarItem[];
  features: TierFeatureFlags;
};

export const TierConfig: Record<Tier, TierConfigEntry> = {
  solopreneur: {
    label: "Solopreneur",
    sidebar: [
      { label: "Dashboard", icon: "BarChart3", to: "/dashboard" },
      { label: "AI Agents", icon: "Bot", to: "/agents" },
      { label: "Workflows", icon: "Brain", to: "/workflows" },
      { label: "Analytics", icon: "BarChart3", to: "/analytics" },
      { label: "Initiatives", icon: "TrendingUp", to: "/initiatives" },
    ],
    features: {
      showQuickActions: true,
      showTodaysFocus: true,
      showRecentActivity: true,
      showInitiativeJourney: true,
      showApprovals: false,
      showFeatureFlags: false,
      showTelemetry: false,
      showDueSoon: true,
      showEmailCampaigns: true,
    },
  },
  startup: {
    label: "Startup",
    sidebar: [
      { label: "Dashboard", icon: "BarChart3", to: "/dashboard" },
      { label: "AI Agents", icon: "Bot", to: "/agents" },
      { label: "Workflows", icon: "Brain", to: "/workflows" },
      { label: "Analytics", icon: "BarChart3", to: "/analytics" },
      { label: "Initiatives", icon: "TrendingUp", to: "/initiatives" },
      { label: "Business", icon: "Building2", to: "/business" },
    ],
    features: {
      showQuickActions: false,
      showTodaysFocus: true,
      showRecentActivity: true,
      showInitiativeJourney: true,
      showApprovals: true,
      showFeatureFlags: false,
      showTelemetry: true,
      showDueSoon: true,
      showEmailCampaigns: true,
    },
  },
  sme: {
    label: "SME",
    sidebar: [
      { label: "Dashboard", icon: "BarChart3", to: "/dashboard" },
      { label: "AI Agents", icon: "Bot", to: "/agents" },
      { label: "Workflows", icon: "Brain", to: "/workflows" },
      { label: "Analytics", icon: "BarChart3", to: "/analytics" },
      { label: "Initiatives", icon: "TrendingUp", to: "/initiatives" },
      { label: "Business", icon: "Building2", to: "/business" },
    ],
    features: {
      showQuickActions: false,
      showTodaysFocus: true,
      showRecentActivity: true,
      showInitiativeJourney: true,
      showApprovals: true,
      showFeatureFlags: true,
      showTelemetry: true,
      showDueSoon: true,
      showEmailCampaigns: true,
    },
  },
  enterprise: {
    label: "Enterprise",
    sidebar: [
      { label: "Dashboard", icon: "BarChart3", to: "/dashboard" },
      { label: "AI Agents", icon: "Bot", to: "/agents" },
      { label: "Workflows", icon: "Brain", to: "/workflows" },
      { label: "Analytics", icon: "BarChart3", to: "/analytics" },
      { label: "Initiatives", icon: "TrendingUp", to: "/initiatives" },
      { label: "Business", icon: "Building2", to: "/business" },
    ],
    features: {
      showQuickActions: false,
      showTodaysFocus: true,
      showRecentActivity: true,
      showInitiativeJourney: true,
      showApprovals: true,
      showFeatureFlags: true,
      showTelemetry: true,
      showDueSoon: true,
      showEmailCampaigns: true,
    },
  },
};

// icon registry: keep label->lucide mapping in consumer to avoid dynamic imports here.
