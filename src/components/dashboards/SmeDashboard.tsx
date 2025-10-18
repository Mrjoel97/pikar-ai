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
import { lazy, Suspense } from "react";
import type { SmeDashboardProps } from "@/types/dashboard";
import { DepartmentTabs } from "./sme/DepartmentTabs";
import { GovernancePanel } from "./sme/GovernancePanel";
import { ComplianceRisk } from "./sme/ComplianceRisk";
import { IntegrationHub } from "@/components/integrations/IntegrationHub";

export function SmeDashboard({ 
  business, 
  demoData, 
  isGuest, 
  tier, 
  onUpgrade 
}: SmeDashboardProps) {
  // Fix: derive businessId from current props first
  const businessId = !isGuest ? business?._id : null;

  // Fetch latest KPI snapshot when authenticated
  const kpiDoc = useQuery(
    api.kpis.getSnapshot,
    !isGuest && businessId ? { businessId } : undefined
  );

  const agents = isGuest ? demoData?.agents || [] : [];
  const workflows = isGuest ? demoData?.workflows || [] : [];
  const kpis = isGuest ? (demoData?.kpis || {}) : (kpiDoc || {});
  const tasks = isGuest ? demoData?.tasks || [] : [];

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
                <div key={String(d._id)} className="rounded-md border p-3 text-sm">
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
    <div className="space-y-6 p-6">
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

      {/* Governance Panel Component */}
      <GovernancePanel 
        businessId={businessId}
        isGuest={isGuest}
        governanceAutomationEnabled={governanceAutomationEnabled}
        hasTier={hasTier}
        LockedRibbon={LockedRibbon}
      />

      {/* Compliance & Risk Component */}
      <ComplianceRisk 
        businessId={businessId}
        isGuest={isGuest}
        kpis={kpis}
        riskAnalyticsEnabled={riskAnalyticsEnabled}
        LockedRibbon={LockedRibbon}
      />

      {/* Pending Approvals by Department */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Pending Approvals by Department</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((task: any) => (
            <Card key={task.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{task.title}</h3>
                  <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'}>
                    {task.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">Due: {task.dueDate}</p>
                <Button size="sm" className="w-full">
                  Review & Approve
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Department Views - gated by feature flag */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Department Views</h2>
        {departmentDashboardsEnabled ? (
          <>
            <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="text-sm text-muted-foreground">
                {slaSummary
                  ? `SLA: ${slaSummary.overdueCount} overdue, ${slaSummary.dueSoonCount} due soon`
                  : null}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  if (!business?._id) return;
                  try {
                    const res = await enforceGovernanceForBiz({ businessId: business?._id });
                    toast.success(`Governance updated for ${res.count ?? 0} workflows`);
                  } catch (e: any) {
                    toast.error(e?.message || "Failed to enforce governance");
                  }
                }}
                disabled={!business?._id}
              >
                Enforce Governance
              </Button>
            </div>
            <DepartmentTabs 
              businessId={businessId}
              isGuest={isGuest}
              kpiDoc={kpiDoc}
            />
          </>
        ) : (
          <Card className="border-dashed border-2 border-amber-300">
            <CardContent className="p-4">
              <LockedRibbon label="Department Dashboards require SME tier or higher" />
            </CardContent>
          </Card>
        )}
      </section>

      {/* Department Performance */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Department Performance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Marketing</h3>
              <p className="text-2xl font-bold">94%</p>
              <p className="text-xs text-green-600">+2% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Sales</h3>
              <p className="text-2xl font-bold">91%</p>
              <p className="text-xs text-green-600">+5% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Operations</h3>
              <p className="text-2xl font-bold">88%</p>
              <p className="text-xs text-yellow-600">-1% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Finance</h3>
              <p className="text-2xl font-bold">96%</p>
              <p className="text-xs text-green-600">+3% from last month</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Feature Toggles for SME */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Feature Toggles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="space-y-3 p-4">
              {isGuest ? (
                <div className="text-sm text-muted-foreground">
                  Demo: Feature toggles visible. Sign in to manage.
                </div>
              ) : !featureFlags ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : featureFlags.length === 0 ? (
                <div className="text-sm text-muted-foreground">No feature flags configured.</div>
              ) : (
                featureFlags.slice(0, 8).map((f: any) => (
                  <div key={f._id} className="flex items-center justify-between border rounded-md p-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{f.flagName}</span>
                      <span className="text-xs text-muted-foreground">
                        {f.isEnabled ? "Enabled" : "Disabled"} • Rollout: {f.rolloutPercentage}%
                      </span>
                    </div>
                    {!isGuest && (
                      <Button
                        size="sm"
                        variant={f.isEnabled ? "destructive" : "outline"}
                        onClick={async () => {
                          try {
                            await toggleFlag({ flagId: f._id });
                            toast.success(f.isEnabled ? "Flag disabled" : "Flag enabled");
                          } catch (e: any) {
                            toast.error(e?.message || "Failed to toggle flag");
                          }
                        }}
                      >
                        {f.isEnabled ? "Disable" : "Enable"}
                      </Button>
                    )}
                  </div>
                ))
              )}
              {!isGuest && featureFlags && featureFlags.length > 8 && (
                <div className="text-xs text-muted-foreground">
                  Showing 8 of {featureFlags.length} flags.
                </div>
              )}
            </CardContent>
          </Card>
          {/* Secondary card for context/help */}
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">About Feature Toggles</h3>
              <p className="text-sm text-muted-foreground">
                Use flags to safely roll out capabilities by department or percentage. Admins can enable or disable features instantly.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CRM Integration Status - gated by feature flag */}
      {!isGuest && businessId && crmEnabled && (
        <section>
          <h2 className="text-xl font-semibold mb-4">CRM Integration</h2>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>CRM Sync Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!crmConnections ? (
                <div className="text-sm text-muted-foreground">Loading CRM status…</div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Connected Platforms</span>
                    <Badge variant="outline">{crmConnections?.length || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pending Conflicts</span>
                    <Badge variant={crmConflicts && crmConflicts.length > 0 ? "destructive" : "outline"}>
                      {crmConflicts?.length || 0}
                    </Badge>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => nav("/crm")}
                  >
                    Manage CRM
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Show locked ribbon if CRM is not enabled */}
      {!isGuest && businessId && !crmEnabled && (
        <Card className="border-dashed border-2 border-amber-300">
          <CardContent className="p-4">
            <LockedRibbon label="CRM Integration requires Startup tier or higher" />
          </CardContent>
        </Card>
      )}

      {/* A/B Testing Summary - gated by feature flag */}
      {!isGuest && business?._id && abTestingEnabled && (
        <section>
          <h2 className="text-xl font-semibold mb-4">A/B Testing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Experiment Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <ExperimentDashboard businessId={business?._id as Id<"businesses">} />
                <Button 
                  size="sm" 
                  className="w-full mt-3"
                  onClick={() => setShowExperimentCreator(true)}
                >
                  Create New Experiment
                </Button>
              </CardContent>
            </Card>

            <Card className="border-dashed">
              <CardHeader className="pb-2">
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => nav("/workflows")}
                >
                  Create Campaign
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => nav("/invoices")}
                >
                  Manage Invoices
                </Button>
                {roiDashboardEnabled && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowRoiDashboard(true)}
                  >
                    View ROI Dashboard
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Show locked ribbon if A/B testing is not enabled */}
      {!isGuest && business?._id && !abTestingEnabled && (
        <Card className="border-dashed border-2 border-amber-300">
          <CardContent className="p-4">
            <LockedRibbon label="A/B Testing requires Startup tier or higher" />
          </CardContent>
        </Card>
      )}

      {/* Brain Dump */}
      {!isGuest && business?._id ? (
        <BrainDumpSection businessId={String(business?._id)} />
      ) : null}

      {/* Experiment Creator Modal - gated by feature flag */}
      {showExperimentCreator && !isGuest && business?._id && abTestingEnabled && (
        <ExperimentCreator
          businessId={business?._id as Id<"businesses">}
          onComplete={() => setShowExperimentCreator(false)}
          onCancel={() => setShowExperimentCreator(false)}
        />
      )}

      {/* ROI Dashboard Modal - gated by feature flag */}
      {showRoiDashboard && !isGuest && business?._id && roiDashboardEnabled && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">ROI Dashboard</h2>
              <Button size="sm" variant="ghost" onClick={() => setShowRoiDashboard(false)}>
                Close
              </Button>
            </div>
            <div className="p-4">
              <RoiDashboard 
                businessId={business?._id}
                userId={business?.ownerId}
              />
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Initiatives for SMEs</CardTitle>
            <CardDescription>
              Align cross-functional initiatives with KPIs and standardized workflows for dependable delivery.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Balance throughput and quality: coordinate teams, timelines, and automation using initiatives.
            </p>
            <Button asChild size="sm" variant="default">
              <a href="/initiatives">Open Initiatives</a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {smeAgentsEnabled && Array.isArray(smeAgents) && smeAgents.length > 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {smeAgents.map(a => (
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

      {Array.isArray(smeAgents) && smeAgents.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {smeAgents.map(a => (
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

      {Array.isArray(smeAgents) && smeAgents[0] && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Agent Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {smeAgents[0].short_desc}
            </div>
            <div>
              <Button onClick={() => nav(`/agents?agent=${encodeURIComponent(smeAgents[0].agent_key)}`)}>
                Open {smeAgents[0].display_name}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Integrations Hub - SME+ Feature */}
      <section className="relative">
        {!isFeatureEnabled("advanced_integrations") && (
          <LockedRibbon label="Advanced Integrations requires SME tier or higher" />
        )}
        <div className={!isFeatureEnabled("advanced_integrations") ? "pointer-events-none opacity-50" : ""}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Integration Hub</h2>
            <Button size="sm" variant="outline" onClick={() => nav("/integrations")}>
              View All Integrations
            </Button>
          </div>
          <Suspense fallback={<div className="rounded-md border p-4 text-sm text-muted-foreground">Loading integrations...</div>}>
            {!isGuest && business?._id && isFeatureEnabled("advanced_integrations") ? (
              <IntegrationHub businessId={business._id} tier={tier} isGuest={isGuest} />
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">
                    {isGuest ? "Sign in to access the Integration Hub" : "Upgrade to SME tier to unlock Advanced Integrations"}
                  </p>
                </CardContent>
              </Card>
            )}
          </Suspense>
        </div>
      </section>
    </div>
  );
}