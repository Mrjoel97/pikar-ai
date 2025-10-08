import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery as useConvexQuery } from "convex/react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router";
import { Id } from "@/convex/_generated/dataModel";
import { Shield, AlertTriangle, Globe, Zap, FileText, Palette, Lock } from "lucide-react";

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
const GlobalOverview = lazy(() =>
  import("./enterprise/GlobalOverview").then((m) => ({
    default: m.GlobalOverview,
  })),
);
const WidgetGrid = lazy(() =>
  import("./enterprise/WidgetGrid").then((m) => ({ default: m.WidgetGrid })),
);
const ApprovalsAudit = lazy(() =>
  import("./enterprise/ApprovalsAudit").then((m) => ({
    default: m.ApprovalsAudit,
  })),
);
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

interface EnterpriseDashboardProps {
  business: any;
  demoData: any;
  isGuest: boolean;
  tier: string;
  onUpgrade: () => void;
}

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

  const businessId = !isGuest ? business?._id : null;

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

  // Feature flag helpers
  const isFeatureEnabled = (flagName: string): boolean => {
    if (isGuest) return false;
    if (!featureFlags || !Array.isArray(featureFlags)) return false;
    const flag = featureFlags.find((f: any) => f.flagName === flagName);
    return flag?.isEnabled ?? false;
  };

  const LockedRibbon = ({ label = "Feature requires upgrade" }: { label?: string }) => (
    <div className="absolute inset-0 bg-black/5 backdrop-blur-[2px] rounded-lg flex items-center justify-center z-10">
      <div className="flex items-center gap-2 bg-white/90 px-4 py-2 rounded-full shadow-lg border border-amber-300">
        <Lock className="h-4 w-4 text-amber-600" />
        <span className="text-sm font-medium text-amber-700">{label}</span>
        <Button size="sm" variant="outline" onClick={onUpgrade} className="ml-2">
          Upgrade
        </Button>
      </div>
    </div>
  );

  // sparkline helper now in GlobalOverview; we keep trend generator here
  const mkTrend = (base?: number): number[] => {
    const b = typeof base === "number" && !Number.isNaN(base) ? base : 60;
    const arr: number[] = [];
    for (let i = 0; i < 12; i++) {
      const jitter = ((i % 3 === 0 ? 1 : -1) * (6 + (i % 4))) / 2;
      arr.push(Math.max(5, Math.min(100, b + jitter)));
    }
    return arr;
  };

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

  const widgetsByKey: Record<string, { key: string; title: string; content: React.ReactNode }> =
    Object.fromEntries(defaultWidgets.map(w => [w.key, w]));

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
  const slaSummaryText =
    slaSummary && typeof slaSummary !== "string"
      ? `SLA: ${slaSummary.overdueCount ?? 0} overdue, ${slaSummary.dueSoonCount ?? 0} due soon`
      : null;

  // Handlers
  const handleRunDiagnostics = async () => {
    if (!business?._id) return;
    try {
      await runDiagnostics({ businessId: business._id });
      toast.success("Diagnostics started");
    } catch (e: any) {
      toast.error(e?.message || "Failed to run diagnostics");
    }
  };

  const handleEnforceGovernance = async () => {
    if (!business?._id) return;
    try {
      const res = await enforceGovernanceForBiz({ businessId: business._id });
      toast.success(`Governance updated for ${res.count ?? 0} workflows`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to enforce governance");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveSelf({ id: id as any });
      toast.success("Approved");
    } catch (e: any) {
      toast.error(e?.message || "Failed to approve");
    }
  };
  const handleReject = async (id: string) => {
    try {
      await rejectSelf({ id: id as any });
      toast.success("Rejected");
    } catch (e: any) {
      toast.error(e?.message || "Failed to reject");
    }
  };

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
      {!isGuest && upgradeNudges && upgradeNudges.showBanner && (
        <div className="rounded-md border p-3 bg-amber-50 flex items-center gap-3">
          <Badge variant="outline" className="border-amber-300 text-amber-700">Upgrade</Badge>
          <div className="text-sm">
            {upgradeNudges.nudges?.[0]?.message || "Unlock more capacity and premium features."}
          </div>
          <div className="ml-auto">
            <Button size="sm" variant="outline" onClick={onUpgrade}>See Plans</Button>
          </div>
        </div>
      )}

      <Suspense fallback={<div className="rounded-md border p-4 text-sm text-muted-foreground">Loading overview…</div>}>
        <GlobalOverview
          region={region}
          setRegion={setRegion}
          unit={unit}
          setUnit={setUnit}
          unifiedRevenue={unifiedRevenue}
          unifiedGlobalEfficiency={unifiedGlobalEfficiency}
          revenueTrend={revenueTrend}
          efficiencyTrend={efficiencyTrend}
          onRunDiagnostics={handleRunDiagnostics}
          onEnforceGovernance={handleEnforceGovernance}
          slaSummaryText={slaSummaryText}
        />
      </Suspense>

      <Suspense fallback={<div className="rounded-md border p-4 text-sm text-muted-foreground">Loading widgets…</div>}>
        <WidgetGrid
          hasEnterprise={hasTier("enterprise")}
          widgetOrder={widgetOrder}
          setWidgetOrder={setWidgetOrder}
          widgetsByKey={widgetsByKey}
          onUpgrade={onUpgrade}
        />
      </Suspense>

      {/* Global Social Command Center - with feature flag */}
      <section className="relative">
        {!globalSocialCommandEnabled && <LockedRibbon label="Global Social Command requires Enterprise tier" />}
        <div className={!globalSocialCommandEnabled ? "pointer-events-none opacity-50" : ""}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-emerald-600" />
              <h2 className="text-xl font-semibold">Global Social Command Center</h2>
            </div>
            <Button size="sm" variant="outline" onClick={() => nav("/social")} disabled={!globalSocialCommandEnabled}>
              Open Full Manager
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Multi-Brand Management */}
            <Card className="relative">
              {!whiteLabelEnabled && <LockedRibbon label="White-label features require Enterprise tier" />}
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Multi-Brand Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Active Brands</span>
                    <span className="font-semibold">12</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Connected Platforms</span>
                    <span className="font-semibold">48</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Scheduled Posts</span>
                    <span className="font-semibold">2,341</span>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="w-full" onClick={() => nav("/branding")} disabled={!brandingPortalEnabled}>
                  Manage Brands
                </Button>
              </CardContent>
            </Card>

            {/* Advanced AI Orchestration */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  AI Orchestration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">AI-Generated Posts</span>
                    <span className="font-semibold">1,847</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Avg Engagement</span>
                    <span className="font-semibold text-green-600">+34%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Auto-Optimized</span>
                    <Badge variant="outline" className="border-emerald-300 text-emerald-700">Active</Badge>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="w-full" onClick={() => nav("/agents")}>
                  Configure AI Agents
                </Button>
              </CardContent>
            </Card>

            {/* Crisis Management */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Crisis Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Active Alerts</span>
                    <Badge variant="outline" className="border-green-300 text-green-700">0</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Sentiment Score</span>
                    <span className="font-semibold text-green-600">94%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Response Time</span>
                    <span className="font-semibold">2.3 min</span>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="w-full" onClick={() => nav("/workflows")}>
                  Crisis Workflows
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* API Access & White-Label Reporting */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Card className="relative">
              {!apiWebhooksEnabled && <LockedRibbon label="API & Webhooks require Enterprise tier" />}
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  API Access & Documentation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Integrate social media management into your existing systems with our comprehensive API.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => nav("/api-docs")} disabled={!apiWebhooksEnabled}>
                    View API Docs
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => nav("/webhooks")} disabled={!apiWebhooksEnabled}>
                    Webhooks
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="relative">
              {!whiteLabelEnabled && <LockedRibbon label="White-label reporting requires Enterprise tier" />}
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  White-Label Social Reporting
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Generate branded reports for clients with custom logos, colors, and domains.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => nav("/branding")} disabled={!brandingPortalEnabled}>
                    Customize Branding
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => nav("/analytics")}>
                    Export Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Global Performance Overview */}
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Global Performance Overview</CardTitle>
              <CardDescription>Cross-brand social media metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 border rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Total Reach</div>
                  <div className="text-xl font-bold">12.4M</div>
                  <div className="text-xs text-green-600">+18% vs last month</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Engagement Rate</div>
                  <div className="text-xl font-bold">4.7%</div>
                  <div className="text-xs text-green-600">+0.8% vs last month</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Response Time</div>
                  <div className="text-xl font-bold">2.3 min</div>
                  <div className="text-xs text-green-600">-1.2 min vs last month</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">ROI</div>
                  <div className="text-xl font-bold">3.8x</div>
                  <div className="text-xs text-green-600">+0.4x vs last month</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Strategic Initiatives</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {workflows.slice(0, 6).map((workflow: any) => (
            <Card key={workflow.id}>
              <CardContent className="p-4">
                <h3 className="font-medium">{workflow.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Status: {workflow.status}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full"
                    style={{ width: `${workflow.completionRate}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {workflow.completionRate}% complete
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">System Telemetry</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Active AI Agents</h3>
              <div className="space-y-2">
                {agents.slice(0, 4).map((agent: any) => (
                  <div key={agent.id} className="flex items-center justify-between">
                    <span className="text-sm">{agent.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{agent.efficiency}%</span>
                      <div className={`w-2 h-2 rounded-full ${
                        agent.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Critical Alerts</h3>
              <div className="space-y-2">
                {(demoData?.notifications || [])
                  .filter((n: any) => n.type === 'urgent' || n.type === 'warning')
                  .slice(0, 3)
                  .map((notification: any) => (
                    <div key={notification.id} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        notification.type === 'urgent' ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                      <span className="text-sm">{notification.message}</span>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Enterprise Controls</h2>
        <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="xl:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle>Enterprise Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">SSO & RBAC</span>
                <Button size="sm" disabled>Manage</Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API Access</span>
                <Button size="sm" disabled>Configure</Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Integrations</span>
                <Button size="sm" disabled>Open</Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Contact support to enable enterprise controls.
              </div>
              {!hasTier("enterprise") && (
                <div className="pt-2 border-t mt-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="border-amber-300 text-amber-700">Locked</Badge>
                    <span>Advanced controls are Enterprise+</span>
                    <Button size="sm" variant="outline" onClick={onUpgrade} className="ml-auto">Upgrade</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="xl:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle>Integration Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">CRM</span>
                <Badge variant="outline" className="border-emerald-300 text-emerald-700">Connected</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Analytics</span>
                <Badge variant="outline" className="border-amber-300 text-amber-700">Attention</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Billing</span>
                <Badge variant="outline" className="border-slate-300 text-slate-700">Not linked</Badge>
              </div>
              <div className="text-xs text-muted-foreground">Integration health overview (static preview).</div>
            </CardContent>
          </Card>

          <Card className="xl:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle>Approvals & Audit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Suspense fallback={<div className="text-sm text-muted-foreground">Loading approvals…</div>}>
                <ApprovalsAudit
                  isGuest={isGuest}
                  approvals={approvals}
                  auditLatest={auditLatest}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Enterprise Shortcuts</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="relative">
            {!brandingPortalEnabled && <LockedRibbon label="Branding Portal requires Enterprise tier" />}
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Branding</div>
                <div className="text-xs text-muted-foreground">White-label customization</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => nav("/branding")} disabled={!brandingPortalEnabled}>
                Customize
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Feature Flags</div>
                <div className="text-xs text-muted-foreground">Manage rollout</div>
              </div>
              <a href="#feature-flags"><Button size="sm" variant="outline">Open</Button></a>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Audit Export</div>
                <div className="text-xs text-muted-foreground">CSV for compliance</div>
              </div>
              {business?._id ? (
                <a href={`/api/audit/export?businessId=${business._id}`} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="outline">Download</Button>
                </a>
              ) : (
                <Button size="sm" variant="outline" disabled>Download</Button>
              )}
            </CardContent>
          </Card>
          <Card className="relative">
            {!scimProvisioningEnabled && <LockedRibbon label="SCIM Provisioning requires Enterprise tier" />}
            <CardContent className="p-6">
              <div className="text-sm font-medium">SCIM Provisioning</div>
              <div className="text-xs text-muted-foreground mt-1">User sync from IdP</div>
              <Button size="sm" className="mt-4 w-full" onClick={() => nav("/scim-provisioning")} disabled={!scimProvisioningEnabled}>
                Configure
              </Button>
            </CardContent>
          </Card>
          <Card className="relative">
            {!ssoConfigurationEnabled && <LockedRibbon label="SSO Configuration requires Enterprise tier" />}
            <CardContent className="p-6">
              <div className="text-sm font-medium">SSO Configuration</div>
              <div className="text-xs text-muted-foreground mt-1">SAML & OIDC setup</div>
              <Button size="sm" className="mt-4 w-full" onClick={() => nav("/sso-configuration")} disabled={!ssoConfigurationEnabled}>
                Configure
              </Button>
            </CardContent>
          </Card>
          <Card className="relative">
            {!kmsEncryptionEnabled && <LockedRibbon label="KMS Encryption requires Enterprise tier" />}
            <CardContent className="p-6">
              <div className="text-sm font-medium">Encryption (KMS)</div>
              <div className="text-xs text-muted-foreground mt-1">Secure key management</div>
              <Button size="sm" className="mt-4 w-full" onClick={() => nav("/kms-configuration")} disabled={!kmsEncryptionEnabled}>
                Configure
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

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
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {entAgents.map(a => (
            <Button
              key={a.agent_key}
              variant="secondary"
              className="justify-start"
              onClick={() => nav(`/agents?agent=${encodeURIComponent(a.agent_key)}`)}
              title={a.short_desc}
            >
              {a.display_name}
            </Button>
          ))}
        </div>
      )}

      {Array.isArray(entAgents) && entAgents.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {entAgents.map(a => (
            <Button
              key={`tg-${a.agent_key}`}
              size="sm"
              variant="outline"
              onClick={() => nav(`/agents?agent=${encodeURIComponent(a.agent_key)}`)}
            >
              Use with {a.display_name}
            </Button>
          ))}
        </div>
      )}

      {Array.isArray(entAgents) && entAgents[0] && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Executive Agent Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {entAgents[0].short_desc}
            </div>
            <div>
              <Button onClick={() => nav(`/agents?agent=${encodeURIComponent(entAgents[0].agent_key)}`)}>
                Open {entAgents[0].display_name}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}