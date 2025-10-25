import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo, useEffect, useCallback, lazy, Suspense } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router";
import { Id } from "@/convex/_generated/dataModel";
import { Shield, AlertTriangle, Globe, Zap, FileText, Palette, Lock } from "lucide-react";
import { SystemHealthStrip } from "@/components/dashboard/SystemHealthStrip";
import { GlobalSocialSection } from "./enterprise/GlobalSocialSection";
import { EnterpriseShortcuts } from "./enterprise/EnterpriseShortcuts";
import { LockedRibbon } from "./enterprise/LockedRibbon";
import type { EnterpriseDashboardProps } from "@/types/dashboard";
import { EnterpriseControls } from "./enterprise/EnterpriseControls";
import { IntegrationStatus } from "./enterprise/IntegrationStatus";
import { withMutationErrorHandling } from "@/lib/dashboardErrorHandling";
import { LazyLoadErrorBoundary } from "@/components/common/LazyLoadErrorBoundary";

// Lazy-load heavy components to reduce initial bundle
const RoiDashboard = lazy(() =>
  import("./RoiDashboard").then((m) => ({ default: m.RoiDashboard })),
);
const ExperimentDashboard = lazy(() =>
  import("@/components/experiments/ExperimentDashboard").then((m) => ({
    default: m.ExperimentDashboard,
  })),
);
const ExperimentCreator = lazy(() =>
  import("@/components/experiments/ExperimentCreator").then((m) => ({
    default: m.ExperimentCreator,
  })),
);
// Lazy load all heavy components for better code splitting
const GlobalOverview = lazy(() =>
  import("./enterprise/GlobalOverview").then((m) => ({
    default: m.GlobalOverview,
  }))
);
const WidgetGrid = lazy(() =>
  import("./enterprise/WidgetGrid").then((m) => ({
    default: m.WidgetGrid,
  }))
);
const ApprovalsAudit = lazy(() =>
  import("./enterprise/ApprovalsAudit").then((m) => ({
    default: m.ApprovalsAudit,
  }))
);
const StrategicInitiatives = lazy(() =>
  import("./enterprise/StrategicInitiatives").then((m) => ({
    default: m.StrategicInitiatives,
  }))
);
const SystemTelemetry = lazy(() =>
  import("./enterprise/SystemTelemetry").then((m) => ({
    default: m.SystemTelemetry,
  }))
);
const ExecutiveAgentInsights = lazy(() =>
  import("./enterprise/ExecutiveAgentInsights").then((m) => ({
    default: m.ExecutiveAgentInsights,
  }))
);
const AdvancedPanels = lazy(() =>
  import("./enterprise/AdvancedPanels").then((m) => ({
    default: m.AdvancedPanels,
  }))
);
const BrainDumpSection = lazy(() =>
  import("./enterprise/BrainDumpSection").then((m) => ({
    default: m.BrainDumpSection,
  }))
);
const SocialCommandCenter = lazy(() =>
  import("./enterprise/SocialCommandCenter").then((m) => ({
    default: m.SocialCommandCenter,
  }))
);
const StrategicCommandCenter = lazy(() =>
  import("./enterprise/StrategicCommandCenter").then((m) => ({
    default: m.StrategicCommandCenter,
  }))
);
const IntegrationHub = lazy(() =>
  import("@/components/integrations/IntegrationHub").then((m) => ({
    default: m.IntegrationHub,
  }))
);

/**
 * EnterpriseDashboard Component
 * 
 * Main dashboard view for Enterprise tier users. Provides comprehensive
 * business intelligence, global command centers, strategic initiatives,
 * system telemetry, and enterprise-specific controls.
 * 
 * Features:
 * - Global Command Center with multi-region data aggregation
 * - Strategic Command Center for initiative tracking
 * - Social Command Center for multi-brand social media management
 * - Draggable widget grid with local storage persistence
 * - Integration hub with health monitoring
 * - Feature flag management with tier-based gating
 * - Approval workflows and audit trail
 * - A/B testing and ROI dashboards
 * - Enterprise shortcuts (Branding, SCIM, SSO, KMS, Custom APIs)
 * 
 * @param {EnterpriseDashboardProps} props - Component props
 * @returns {JSX.Element} Rendered enterprise dashboard
 */
export function EnterpriseDashboard() {
  const [region, setRegion] = useState<string>("global");
  const [unit, setUnit] = useState<string>("all");

  const kpiDoc = useQuery(
    api.kpis.getSnapshot,
    !isGuest && business?._id ? { businessId: business._id } : undefined
  );

  const businessId = !isGuest && business?._id ? business._id : null;

  const approvals = useQuery(
    api.approvals.getApprovalQueue,
    isGuest || !businessId ? undefined : { businessId, status: "pending" as const }
  );
  const auditLatest = useQuery(
    api.audit.listForBusiness,
    isGuest || !businessId ? undefined : { businessId, limit: 5 }
  );

  const agents = isGuest ? demoData?.agents || [] : [];
  const workflows = isGuest ? demoData?.workflows || [] : [];
  const kpis = isGuest ? (demoData?.kpis || {}) : (kpiDoc || {});
  const tasks = isGuest ? demoData?.tasks || [] : [];

  const approveSelf = useMutation(api.approvals.approveSelf);
  const rejectSelf = useMutation(api.approvals.rejectSelf);

  const featureFlags = useQuery(
    api.featureFlags.getFeatureFlags,
    isGuest || !businessId ? undefined : { businessId }
  );
  const toggleFlag = useMutation(api.featureFlags.toggleFeatureFlag);

  /**
   * Check if a specific feature flag is enabled for the current business
   * 
   * @param {string} flagName - Name of the feature flag to check
   * @returns {boolean} True if the flag is enabled, false otherwise
   */
  const isFeatureEnabled = (flagName: string): boolean => {
    if (isGuest) return false;
    if (!featureFlags || !Array.isArray(featureFlags)) return false;
    const flag = featureFlags.find((f: any) => f.flagName === flagName);
    return flag?.isEnabled ?? false;
  };

  /**
   * Generate trend data for sparkline visualizations
   * 
   * Creates a 12-point trend array with alternating jitter around a base value.
   * Memoized to prevent unnecessary recalculations.
   * 
   * @param {number} [base=60] - Base value for the trend (0-100)
   * @returns {number[]} Array of 12 trend values with jitter
   */
  const mkTrend = useCallback((base?: number): number[] => {
    const b = typeof base === "number" && !Number.isNaN(base) ? base : 60;
    const arr: number[] = [];
    for (let i = 0; i < 12; i++) {
      const jitter = ((i % 3 === 0 ? 1 : -1) * (6 + (i % 4))) / 2;
      arr.push(Math.max(5, Math.min(100, b + jitter)));
    }
    return arr;
  }, []);

  const runDiagnostics = useMutation(api.initiatives.runPhase0Diagnostics);

  const unifiedRevenue =
    typeof (kpis?.revenue) === "number"
      ? kpis.revenue
      : typeof (kpis?.totalRevenue) === "number"
      ? kpis.totalRevenue
      : 0;

  const unifiedGlobalEfficiency =
    typeof (kpis?.globalEfficiency) === "number"
      ? kpis.globalEfficiency
      : typeof (kpis?.engagement) === "number"
      ? kpis.engagement
      : 0;

  const revenueTrend = useMemo(
    () => mkTrend((unifiedRevenue ? Math.min(100, (unifiedRevenue / 5000) % 100) : 70)),
    [unifiedRevenue]
  );
  const efficiencyTrend = useMemo(
    () => mkTrend(unifiedGlobalEfficiency ?? 75),
    [unifiedGlobalEfficiency]
  );

  const tierRank: Record<string, number> = { solopreneur: 1, startup: 2, sme: 3, enterprise: 4 };
  const hasTier = (required: keyof typeof tierRank) => (tierRank[tier] ?? 1) >= tierRank[required];

  const upgradeNudges = useQuery(
    api.telemetry.getUpgradeNudges,
    isGuest || !business?._id ? undefined : { businessId: business._id }
  );

  const enforceGovernanceForBiz = useMutation(api.governance.enforceGovernanceForBusiness);
  const slaSummary = useQuery(
    api.approvals.getSlaSummary,
    isGuest || !businessId ? undefined : { businessId }
  );

  const defaultWidgets: Array<{ key: string; title: string; content: React.ReactNode }> = [
    { key: "ops", title: "Ops Health", content: <div className="text-sm text-muted-foreground">Uptime 99.9%, MTTR 1.8h</div> },
    { key: "growth", title: "Growth Pulse", content: <div className="text-sm text-muted-foreground">Signups +12%, Churn 2.1%</div> },
    { key: "governance", title: "Governance Score", content: <div className="text-sm text-muted-foreground">Compliant 94%</div> },
    { 
      key: "social", 
      title: "Global Social Command", 
      content: (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Active Brands</span>
            <span className="font-semibold">12</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Posts Today</span>
            <span className="font-semibold">847</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Crisis Alerts</span>
            <Badge variant="outline" className="border-green-300 text-green-700">0</Badge>
          </div>
        </div>
      )
    },
  ];

  const [widgetOrder, setWidgetOrder] = useState<Array<string>>(() => {
    try {
      const saved = localStorage.getItem("ent_widget_order");
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultWidgets.map(w => w.key);
  });

  useEffect(() => {
    try {
      localStorage.setItem("ent_widget_order", JSON.stringify(widgetOrder));
    } catch {}
  }, [widgetOrder]);

  const widgetsByKey = useMemo(
    () => Object.fromEntries(defaultWidgets.map(w => [w.key, w])),
    [defaultWidgets]
  );

  const nav = useNavigate();

  const crmConnections = useQuery(
    api.crmIntegrations.listConnections,
    isGuest || !businessId ? undefined : { businessId }
  );
  const crmConflicts = useQuery(
    api.crmIntegrations.listConflicts,
    isGuest || !businessId ? undefined : { businessId, limit: 10 }
  );

  const [showExperimentCreator, setShowExperimentCreator] = useState(false);
  const [showRoiDashboard, setShowRoiDashboard] = useState(false);

  // Derived helpers
  const slaSummaryText = useMemo(
    () =>
      slaSummary && typeof slaSummary !== "string"
        ? `SLA: ${slaSummary.overdueCount ?? 0} overdue, ${slaSummary.dueSoonCount ?? 0} due soon`
        : null,
    [slaSummary]
  );

  /**
   * Run Phase 0 diagnostics for the current business
   * 
   * Triggers a comprehensive diagnostic check of workflows, agents,
   * and system health. Displays success/error toast notifications.
   */
  const handleRunDiagnostics = useCallback(async () => {
    if (!business?._id) return;
    await withMutationErrorHandling(
      () => runDiagnostics({ businessId: business._id }),
      "diagnostics",
      "Diagnostics started"
    );
  }, [business?._id, runDiagnostics]);

  /**
   * Enforce governance policies for all workflows in the business
   * 
   * Validates and updates workflows to ensure compliance with
   * governance rules (SLA floors, approval requirements, etc.).
   * Displays count of updated workflows in success toast.
   */
  const handleEnforceGovernance = useCallback(async () => {
    if (!business?._id) return;
    const result = await withMutationErrorHandling(
      () => enforceGovernanceForBiz({ businessId: business._id }),
      "governance enforcement"
    );
    if (result) {
      toast.success(`Governance updated for ${result.count ?? 0} workflows`);
    }
  }, [business?._id, enforceGovernanceForBiz]);

  /**
   * Approve a pending approval request
   * 
   * @param {string} id - ID of the approval to approve
   */
  const handleApprove = useCallback(async (id: string) => {
    await withMutationErrorHandling(
      () => approveSelf({ id: id as any }),
      "approval",
      "Approved",
      "APPROVE"
    );
  }, [approveSelf]);

  /**
   * Reject a pending approval request
   * 
   * @param {string} id - ID of the approval to reject
   */
  const handleReject = useCallback(async (id: string) => {
    await withMutationErrorHandling(
      () => rejectSelf({ id: id as any }),
      "rejection",
      "Rejected",
      "REJECT"
    );
  }, [rejectSelf]);

  // ent agents (kept as-is)
  const entTier = "enterprise";
  const entFlags = useQuery(api.featureFlags.getFeatureFlags, {});
  const entAgents = useQuery(api.aiAgents.listRecommendedByTier, { tier: entTier, limit: 3 });
  const entAgentsEnabled = !!entFlags?.find((f: any) => f.flagName === "enterprise_governance")?.isEnabled;

  // Feature flag checks for enterprise features
  const brandingPortalEnabled = isFeatureEnabled("branding_portal");
  const scimProvisioningEnabled = isFeatureEnabled("scim_provisioning");
  const ssoConfigurationEnabled = isFeatureEnabled("sso_configuration");
  const kmsEncryptionEnabled = isFeatureEnabled("kms_encryption");
  const apiWebhooksEnabled = isFeatureEnabled("api_webhooks");
  const whiteLabelEnabled = isFeatureEnabled("white_label");
  const globalSocialCommandEnabled = isFeatureEnabled("global_social_command");

  return (
    <div className="space-y-6">
      <LazyLoadErrorBoundary moduleName="Global Overview">
        <Suspense fallback={<div className="text-muted-foreground">Loading global overview...</div>}>
          <GlobalOverview />
        </Suspense>
      </LazyLoadErrorBoundary>

      <LazyLoadErrorBoundary moduleName="Widget Grid">
        <Suspense fallback={<div className="text-muted-foreground">Loading widgets...</div>}>
          <WidgetGrid />
        </Suspense>
      </LazyLoadErrorBoundary>

      <div className="grid gap-6 lg:grid-cols-2">
        <LazyLoadErrorBoundary moduleName="Strategic Command Center">
          <Suspense fallback={<div className="text-muted-foreground">Loading strategic command...</div>}>
            <StrategicCommandCenter />
          </Suspense>
        </LazyLoadErrorBoundary>

        <LazyLoadErrorBoundary moduleName="Social Command Center">
          <Suspense fallback={<div className="text-muted-foreground">Loading social command...</div>}>
            <SocialCommandCenter />
          </Suspense>
        </LazyLoadErrorBoundary>
      </div>

      <LazyLoadErrorBoundary moduleName="Approvals & Audit">
        <Suspense fallback={<div className="text-muted-foreground">Loading approvals...</div>}>
          <ApprovalsAudit />
        </Suspense>
      </LazyLoadErrorBoundary>

      <LazyLoadErrorBoundary moduleName="Strategic Initiatives">
        <Suspense fallback={<div className="text-muted-foreground">Loading initiatives...</div>}>
          <StrategicInitiatives />
        </Suspense>
      </LazyLoadErrorBoundary>

      <LazyLoadErrorBoundary moduleName="System Telemetry">
        <Suspense fallback={<div className="text-muted-foreground">Loading telemetry...</div>}>
          <SystemTelemetry />
        </Suspense>
      </LazyLoadErrorBoundary>

      <LazyLoadErrorBoundary moduleName="Executive Agent Insights">
        <Suspense fallback={<div className="text-muted-foreground">Loading agent insights...</div>}>
          <ExecutiveAgentInsights />
        </Suspense>
      </LazyLoadErrorBoundary>

      <LazyLoadErrorBoundary moduleName="Advanced Panels">
        <Suspense fallback={<div className="text-muted-foreground">Loading advanced panels...</div>}>
          <AdvancedPanels />
        </Suspense>
      </LazyLoadErrorBoundary>

      <LazyLoadErrorBoundary moduleName="Integration Status">
        <Suspense fallback={<div className="text-muted-foreground">Loading integration status...</div>}>
          <IntegrationStatus />
        </Suspense>
      </LazyLoadErrorBoundary>

      <LazyLoadErrorBoundary moduleName="Enterprise Controls">
        <Suspense fallback={<div className="text-muted-foreground">Loading controls...</div>}>
          <EnterpriseControls />
        </Suspense>
      </LazyLoadErrorBoundary>
    </div>
  );
}