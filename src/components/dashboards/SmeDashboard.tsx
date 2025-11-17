import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import * as React from "react";
import { useNavigate } from "react-router";
import { RoiDashboard } from "./RoiDashboard";
import { ExperimentDashboard } from "@/components/experiments/ExperimentDashboard";
import { ExperimentCreator } from "@/components/experiments/ExperimentCreator";
import { Id } from "@/convex/_generated/dataModel";
import { MarketingDashboard } from "@/components/departments/MarketingDashboard";
import { SalesDashboard } from "@/components/departments/SalesDashboard";
import { OpsDashboard } from "@/components/departments/OpsDashboard";
import { FinanceDashboard } from "@/components/departments/FinanceDashboard";
import { GovernanceScoreCard } from "@/components/governance/GovernanceScoreCard";
import { EscalationQueue } from "@/components/governance/EscalationQueue";
import { GovernanceAutomationSettings } from "@/components/governance/GovernanceAutomationSettings";
import { Shield, AlertTriangle } from "lucide-react";
import { ComplianceReportGenerator } from "@/components/compliance/ComplianceReportGenerator";
import { ReportLibrary } from "@/components/compliance/ReportLibrary";
import { RiskHeatmap } from "@/components/risk/RiskHeatmap";
import { RiskTrendChart } from "@/components/risk/RiskTrendChart";
import { HandoffQueue } from "@/components/workflows/HandoffQueue";
import { CrossDepartmentMetrics } from "@/components/workflows/CrossDepartmentMetrics";
import { SystemHealthStrip } from "@/components/dashboard/SystemHealthStrip";
import { LazyLoadErrorBoundary } from "@/components/common/LazyLoadErrorBoundary";
import { type SmeDashboardProps } from "@/types/dashboard";
import { lazy, Suspense } from "react";
import { useAuth } from "@/hooks/use-auth";
import { isGuestMode } from "@/lib/guestUtils";
import { demoData as importedDemoData } from "@/lib/demoData";

// Lazy load heavy SME components
const DepartmentTabs = lazy(() =>
  import("./sme/DepartmentTabs").then((m) => ({
    default: m.DepartmentTabs,
  }))
);
const GovernancePanel = lazy(() =>
  import("./sme/GovernancePanel").then((m) => ({
    default: m.GovernancePanel,
  }))
);
const ComplianceRisk = lazy(() =>
  import("./sme/ComplianceRisk").then((m) => ({
    default: m.ComplianceRisk,
  }))
);
const IntegrationHub = lazy(() =>
  import("@/components/integrations/IntegrationHub").then((m) => ({
    default: m.IntegrationHub,
  }))
);

export function SmeDashboard() {
  const { user } = useAuth();
  const isGuest = isGuestMode();
  const demoData = importedDemoData;
  
  // Get business from user profile
  const business = useQuery(
    api.users.getCurrentBusiness,
    !isGuest && user ? {} : "skip"
  );
  
  const tier = business?.tier || "sme";
  const onUpgrade = () => {
    window.location.href = "/pricing";
  };

  // Fix: derive businessId from current props first
  const businessId = !isGuest ? business?._id : null;

  // Fetch latest KPI snapshot when authenticated
  const kpiDoc = useQuery(
    api.kpis.getSnapshot,
    !isGuest && businessId ? { businessId } : undefined
  );

  const agents = isGuest ? (demoData?.sme?.agents || []) : [];
  const workflows = isGuest ? (demoData?.sme?.workflows || []) : [];
  const kpis = isGuest ? (demoData?.sme?.kpis || {}) : (kpiDoc || {});
  const tasks = isGuest ? (demoData?.sme?.tasks || []) : [];

  const pendingApprovals = useQuery(
    api.approvals.getApprovalQueue,
    isGuest || !businessId
      ? undefined
      : { businessId, status: "pending" as const }
  );

  const auditHighlights = useQuery(
    api.audit.listForBusiness,
    isGuest || !businessId
      ? undefined
      : { businessId, limit: 5 }
  );

  const approveSelf = useMutation(api.approvals.approveSelf);
  const rejectSelf = useMutation(api.approvals.rejectSelf);

  const featureFlags = useQuery(
    api.featureFlags.getFeatureFlags,
    isGuest || !businessId ? undefined : { businessId }
  );
  const toggleFlag = useMutation(api.featureFlags.toggleFeatureFlag);

  const enforceGovernanceForBiz = useMutation(api.governance.enforceGovernanceForBusiness);
  // Fetch SLA summary (skip in guest / when no business)
  const slaSummary = !isGuest && businessId ? useQuery(api.approvals.getSlaSummary, { businessId }) : undefined;
  const auditLatest = !isGuest && businessId ? useQuery(api.audit.listForBusiness, { businessId, limit: 10 }) : undefined;

  const pendingEscalations = useQuery(
    api.governanceAutomation.getEscalations,
    !isGuest && businessId ? { businessId, status: "pending" as const } : undefined
  );

  // Add: Feature flag checks for tier-specific features
  const smeFlags = useQuery(
    api.featureFlags.getFeatureFlags,
    !isGuest && businessId ? { businessId } : undefined
  );
  
  const crmEnabled = !!smeFlags?.find((f: any) => f.flagName === "crm_integration")?.isEnabled;
  const abTestingEnabled = !!smeFlags?.find((f: any) => f.flagName === "ab_testing")?.isEnabled;
  const roiDashboardEnabled = !!smeFlags?.find((f: any) => f.flagName === "roi_dashboard")?.isEnabled;
  const complianceReportsEnabled = !!smeFlags?.find((f: any) => f.flagName === "compliance_reports")?.isEnabled;
  const riskAnalyticsEnabled = !!smeFlags?.find((f: any) => f.flagName === "risk_analytics")?.isEnabled;
  const governanceAutomationEnabled = !!smeFlags?.find((f: any) => f.flagName === "governance_automation")?.isEnabled;
  const departmentDashboardsEnabled = !!smeFlags?.find((f: any) => f.flagName === "department_dashboards")?.isEnabled;

  const UpgradeCTA = ({ feature }: { feature: string }) => (
    <Card className="border-dashed border-2 border-gray-300">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <h3 className="font-semibold mb-2">Contact Sales</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upgrade to Enterprise for {feature}
        </p>
        <Button onClick={onUpgrade} size="sm">
          Contact Sales
        </Button>
      </CardContent>
    </Card>
  );

  // Add: sparkline utility
  const Sparkline = ({ values, color = "bg-emerald-600" }: { values: number[]; color?: string }) => (
    <div className="flex items-end gap-1 h-12">
      {values.map((v, i) => (
        <div key={i} className={`${color} w-2 rounded-sm`} style={{ height: `${Math.max(6, Math.min(100, v))}%` }} />
      ))}
    </div>
  );
  const mkTrend = (base?: number): number[] => {
    const b = typeof base === "number" && !Number.isNaN(base) ? base : 50;
    const arr: number[] = [];
    for (let i = 0; i < 12; i++) {
      const jitter = ((i % 2 === 0 ? 1 : -1) * (5 + (i % 5))) / 2;
      arr.push(Math.max(5, Math.min(100, b + jitter)));
    }
    return arr;
  };

  const complianceTrend = mkTrend(kpis?.complianceScore ?? 85);
  const riskTrend = mkTrend(100 - (kpis?.riskScore ?? 15));

  // Add: tier helper and LockedRibbon
  const tierRank: Record<string, number> = { solopreneur: 1, startup: 2, sme: 3, enterprise: 4 };
  const hasTier = (required: keyof typeof tierRank) => (tierRank[tier] ?? 1) >= tierRank[required];

  const LockedRibbon = ({ label = "Higher tier feature" }: { label?: string }) => (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Badge variant="outline" className="border-amber-300 text-amber-700">Locked</Badge>
      <span>{label}</span>
      <Button size="sm" variant="outline" onClick={onUpgrade} className="ml-auto">
        Upgrade
      </Button>
    </div>
  );

  // Add: telemetry-driven nudges banner
  const upgradeNudges = useQuery(
    api.telemetry.getUpgradeNudges,
    isGuest || !businessId ? undefined : { businessId }
  );

  const smeTier = "sme";
  const smeAgents = useQuery(api.aiAgents.listRecommendedByTier, { tier: smeTier, limit: 3 });
  const smeAgentsEnabled = !!smeFlags?.find((f: any) => f.flagName === "sme_insights")?.isEnabled;
  const nav = useNavigate();

  // CRM Integration Status - gated by feature flag
  const crmConnections = useQuery(
    api.crmIntegrations.listConnections,
    isGuest || !businessId || !crmEnabled ? undefined : { businessId: businessId as Id<"businesses"> }
  );
  const crmConflicts = useQuery(
    api.crmIntegrations.listConflicts,
    isGuest || !businessId || !crmEnabled ? undefined : { businessId: businessId as Id<"businesses">, limit: 10 }
  );

  // A/B Testing State - gated by feature flag
  const [showExperimentCreator, setShowExperimentCreator] = React.useState(false);

  // ROI Dashboard State - gated by feature flag
  const [showRoiDashboard, setShowRoiDashboard] = React.useState(false);

  // Add: Risk Analytics queries - gated by feature flag
  const riskMatrix = useQuery(
    api.riskAnalytics.getRiskMatrix,
    isGuest || !businessId || !riskAnalyticsEnabled ? undefined : { businessId }
  );

  const riskTrend30d = useQuery(
    api.riskAnalytics.getRiskTrend,
    isGuest || !businessId || !riskAnalyticsEnabled ? undefined : { businessId, days: 30 }
  );

  const riskTrend90d = useQuery(
    api.riskAnalytics.getRiskTrend,
    isGuest || !businessId || !riskAnalyticsEnabled ? undefined : { businessId, days: 90 }
  );

  function BrainDumpSection({ businessId }: { businessId: string }) {
    const initiatives = useQuery(
      api.initiatives.getByBusiness as any,
      businessId ? { businessId } : undefined
    );
    const initiativeId =
      initiatives && initiatives.length > 0 ? initiatives[0]._id : null;

    const dumps = useQuery(
      api.initiatives.listBrainDumpsByInitiative as any,
      initiativeId ? { initiativeId, limit: 10 } : undefined
    );
    const addDump = useMutation(api.initiatives.addBrainDump as any);

    const [text, setText] = React.useState("");
    const [saving, setSaving] = React.useState(false);

    const handleSave = async () => {
      if (!initiativeId) {
        toast?.("No initiative found. Initialize initiatives first.");
        return;
      }
      const content = text.trim();
      if (!content) {
        toast?.("Please enter your idea first.");
        return;
      }
      try {
        setSaving(true);
        await addDump({ initiativeId, content });
        setText("");
        toast?.("Saved to Brain Dump");
      } catch (e: any) {
        toast?.(e?.message || "Failed to save brain dump");
      } finally {
        setSaving(false);
      }
    };

    return (
      <section className="mt-6 border rounded-md p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Brain Dump</h3>
          <span className="text-xs text-gray-500">Capture rough ideas for SME initiatives</span>
        </div>
        <div className="my-3 h-px bg-gray-200" />
        <div className="space-y-3">
          <textarea
            placeholder="Write freely here... (e.g., governance improvements, process ideas)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-24 w-full rounded-md border p-2 text-sm"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving || !initiativeId}
              className="px-3 py-1.5 rounded-md text-white bg-emerald-600 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Idea"}
            </button>
          </div>
        </div>
        <div className="my-4 h-px bg-gray-200" />
        <div className="space-y-2">
          <div className="text-sm font-medium">Recent ideas</div>
          <div className="space-y-2">
            {Array.isArray(dumps) && dumps.length > 0 ? (
              dumps.map((d: any) => (
                <div key={d._id?.toString() || `dump-${Math.random()}`} className="rounded-md border p-3 text-sm">
                  <div className="text-gray-500 text-xs mb-1">
                    {new Date(d.createdAt).toLocaleString()}
                  </div>
                  <div className="whitespace-pre-wrap">{d.content}</div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-sm">No entries yet.</div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Helper function for feature flag checks
  const isFeatureEnabled = (flagName: string) => {
    return !!smeFlags?.find((f: any) => f.flagName === flagName)?.isEnabled;
  };

  return (
    <div className="space-y-6">
      {/* System Health Strip - SME+ */}
      {!isGuest && business?._id && (
        <SystemHealthStrip businessId={business._id} isGuest={isGuest} />
      )}

      {/* Add: Upgrade nudge banner */}
      {!isGuest && upgradeNudges && upgradeNudges.showBanner && (
        <div className="rounded-md border p-3 bg-amber-50 flex items-center gap-3">
          <Badge variant="outline" className="border-amber-300 text-amber-700">Upgrade</Badge>
          <div className="text-sm">
            {upgradeNudges.nudges?.[0]?.reason || "Unlock more workflows and premium analytics."}
          </div>
          <div className="ml-auto">
            <Button size="sm" variant="outline" onClick={onUpgrade}>See Plans</Button>
          </div>
        </div>
      )}

      {/* Executive Summary */}
      <section className="rounded-lg border p-4 bg-gradient-to-r from-blue-50 to-emerald-50 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Revenue</div>
              <div className="text-2xl font-bold">${(kpiDoc as any)?.revenue?.toLocaleString?.() ?? (isGuest ? "120,400" : "—")}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">ROI</div>
              <div className="text-2xl font-bold">{(kpiDoc as any)?.roi ?? (isGuest ? 142 : "—")}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Compliance</div>
              <div className="text-2xl font-bold">{(kpiDoc as any)?.complianceScore ?? (isGuest ? 92 : "—")}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">High Risks</div>
              <div className="text-2xl font-bold text-red-600">
                {riskMatrix?.highRisks ?? (isGuest ? 3 : 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <LazyLoadErrorBoundary moduleName="Department Tabs">
        <Suspense fallback={<div className="text-muted-foreground">Loading departments...</div>}>
          <DepartmentTabs businessId={businessId || ""} isGuest={isGuest} kpiDoc={kpiDoc} />
        </Suspense>
      </LazyLoadErrorBoundary>

      <div className="grid gap-6 lg:grid-cols-2">
        <LazyLoadErrorBoundary moduleName="Governance Panel">
          <Suspense fallback={<div className="text-muted-foreground">Loading governance...</div>}>
            <GovernancePanel businessId={businessId || ""} isGuest={isGuest} governanceAutomationEnabled={governanceAutomationEnabled} hasTier={hasTier} LockedRibbon={LockedRibbon} />
          </Suspense>
        </LazyLoadErrorBoundary>

        <LazyLoadErrorBoundary moduleName="Compliance & Risk">
          <Suspense fallback={<div className="text-muted-foreground">Loading compliance...</div>}>
            <ComplianceRisk businessId={businessId || ""} isGuest={isGuest} kpis={kpis} riskAnalyticsEnabled={riskAnalyticsEnabled} LockedRibbon={LockedRibbon} />
          </Suspense>
        </LazyLoadErrorBoundary>
      </div>

      <LazyLoadErrorBoundary moduleName="Integration Hub">
        <Suspense fallback={<div className="text-muted-foreground">Loading integrations...</div>}>
          <IntegrationHub businessId={businessId || ""} tier={tier} />
        </Suspense>
      </LazyLoadErrorBoundary>
    </div>
  );
}