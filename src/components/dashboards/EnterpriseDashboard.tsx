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
import { GlobalOverview } from "./enterprise/GlobalOverview";
import { WidgetGrid } from "./enterprise/WidgetGrid";
import { ApprovalsAudit } from "./enterprise/ApprovalsAudit";
import { StrategicInitiatives } from "./enterprise/StrategicInitiatives";
import { SystemTelemetry } from "./enterprise/SystemTelemetry";
import { ExecutiveAgentInsights } from "./enterprise/ExecutiveAgentInsights";
const AdvancedPanels = lazy(() =>
  import("./enterprise/AdvancedPanels").then((m) => ({
    default: m.AdvancedPanels,
  })),
);
const BrainDumpSection = lazy(() =>
  import("./enterprise/BrainDumpSection").then((m) => ({
    default: m.BrainDumpSection,
  })),
);
const SocialCommandCenter = lazy(() =>
  import("./enterprise/SocialCommandCenter").then((m) => ({
    default: m.SocialCommandCenter,
  })),
);
const StrategicCommandCenter = lazy(() =>
  import("./enterprise/StrategicCommandCenter").then((m) => ({
    default: m.StrategicCommandCenter,
  })),
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
export function EnterpriseDashboard({
  business,
  demoData,
  isGuest,
  tier,
  onUpgrade,
}: EnterpriseDashboardProps) {
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
    <div className="space-y-6 p-6">
      {/* System Health Strip - Enterprise */}
      {!isGuest && business?._id && (
        <SystemHealthStrip businessId={business._id} isGuest={isGuest} />
      )}

      {/* Global Command Center */}
      <GlobalOverview
        businessId={businessId}
        region={region}
        setRegion={setRegion}
        unit={unit}
        setUnit={setUnit}
        onRunDiagnostics={handleRunDiagnostics}
        onEnforceGovernance={handleEnforceGovernance}
        slaSummaryText={slaSummaryText}
      />

      {/* Strategic Command Center */}
      <Suspense fallback={<div className="rounded-md border p-4 text-sm text-muted-foreground">Loading strategic center…</div>}>
        <StrategicCommandCenter businessId={businessId || undefined} />
      </Suspense>

      {/* Social Command Center */}
      <Suspense fallback={<div className="rounded-md border p-4 text-sm text-muted-foreground">Loading social center…</div>}>
        <SocialCommandCenter businessId={businessId} />
      </Suspense>

      <Suspense fallback={<div className="rounded-md border p-4 text-sm text-muted-foreground">Loading widgets…</div>}>
        <WidgetGrid
          widgetOrder={widgetOrder}
          setWidgetOrder={setWidgetOrder}
          widgetsByKey={widgetsByKey}
          onUpgrade={onUpgrade}
        />
      </Suspense>

      <GlobalSocialSection
        globalSocialCommandEnabled={globalSocialCommandEnabled}
        whiteLabelEnabled={whiteLabelEnabled}
        brandingPortalEnabled={brandingPortalEnabled}
        apiWebhooksEnabled={apiWebhooksEnabled}
        onOpenSocialManager={() => nav("/social")}
        onOpenBranding={() => nav("/branding")}
        onOpenWorkflows={() => nav("/workflows")}
        onOpenApiDocs={() => nav("/api-docs")}
        onOpenWebhooks={() => nav("/webhooks")}
        onOpenAnalytics={() => nav("/analytics")}
        onUpgrade={onUpgrade}
      />

      {/* Advanced Integrations Hub - Enterprise Enhanced */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Integration Hub</h2>
          <Button size="sm" variant="outline" onClick={() => nav("/integrations")}>
            Manage All Integrations
          </Button>
        </div>
        <Suspense fallback={<div className="rounded-md border p-4 text-sm text-muted-foreground">Loading integrations...</div>}>
          {!isGuest && business?._id ? (
            <IntegrationHub businessId={business._id} tier={tier} isGuest={isGuest} />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Sign in to access the Integration Hub</p>
              </CardContent>
            </Card>
          )}
        </Suspense>
      </section>

      <StrategicInitiatives workflows={workflows} />

      <SystemTelemetry agents={agents} demoData={demoData} />

      <section>
        <h2 className="text-xl font-semibold mb-4">Enterprise Controls</h2>
        <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
          <EnterpriseControls hasTier={hasTier} onUpgrade={onUpgrade} />
          <IntegrationStatus />
          <Card className="xl:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle>Approvals & Audit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ApprovalsAudit
                isGuest={isGuest}
                approvals={approvals}
                auditLatest={auditLatest}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      <EnterpriseShortcuts
        businessId={business?._id ? String(business._id) : null}
        brandingPortalEnabled={brandingPortalEnabled}
        scimProvisioningEnabled={scimProvisioningEnabled}
        ssoConfigurationEnabled={ssoConfigurationEnabled}
        kmsEncryptionEnabled={kmsEncryptionEnabled}
        onOpenBranding={() => nav("/branding")}
        onOpenDataWarehouse={() => nav("/enterprise/data-warehouse")}
        onOpenSecurity={() => nav("/enterprise/security")}
        onOpenScim={() => nav("/scim-provisioning")}
        onOpenSso={() => nav("/sso-configuration")}
        onOpenKms={() => nav("/kms-configuration")}
        onOpenApiBuilder={() => nav("/api/builder")}
        onOpenSupport={() => nav("/support")}
        onUpgrade={onUpgrade}
      />

      {!isGuest && business?._id && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Experiment Dashboard</h2>
          <Card>
            <CardContent className="p-4">
              <Suspense fallback={<div className="text-sm text-muted-foreground">Loading experiment dashboard…</div>}>
                <ExperimentDashboard businessId={business._id as Id<"businesses">} />
              </Suspense>
            </CardContent>
          </Card>
        </section>
      )}

      {!isGuest && business?._id ? (
        <Suspense fallback={<div className="text-sm text-muted-foreground">Loading Brain Dump…</div>}>
          <BrainDumpSection businessId={String(business._id)} />
        </Suspense>
      ) : null}

      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading panels…</div>}>
        <AdvancedPanels
          isGuest={isGuest}
          businessId={businessId ? String(businessId) : null}
          crmConnections={crmConnections}
          crmConflicts={crmConflicts}
          onOpenExperiments={() => setShowExperimentCreator(true)}
          onOpenRoi={() => setShowRoiDashboard(true)}
          onOpenCrm={() => nav("/crm")}
        />
      </Suspense>

      {showExperimentCreator && !isGuest && business?._id && (
        <Suspense fallback={<div className="text-sm text-muted-foreground p-4">Loading experiment creator…</div>}>
          <ExperimentCreator
            businessId={business._id as Id<"businesses">}
            onComplete={() => setShowExperimentCreator(false)}
            onCancel={() => setShowExperimentCreator(false)}
          />
        </Suspense>
      )}

      {showRoiDashboard && !isGuest && business?._id && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">ROI Dashboard</h2>
              <Button size="sm" variant="ghost" onClick={() => setShowRoiDashboard(false)}>
                Close
              </Button>
            </div>
            <div className="p-4">
              <Suspense fallback={<div className="text-sm text-muted-foreground">Loading ROI analytics…</div>}>
                <RoiDashboard businessId={business._id} userId={business.ownerId} />
              </Suspense>
            </div>
          </div>
        </div>
      )}

      {entAgentsEnabled && Array.isArray(entAgents) && entAgents.length > 0 && (
        <ExecutiveAgentInsights entAgents={entAgents} onNavigate={nav} />
      )}
    </div>
  );
}