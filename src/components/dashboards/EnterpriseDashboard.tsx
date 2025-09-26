import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery as useConvexQuery } from "convex/react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

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
  onUpgrade 
}: EnterpriseDashboardProps) {
  const [region, setRegion] = useState<string>("global");
  const [unit, setUnit] = useState<string>("all");

  // Live KPIs when authenticated
  const kpiDoc = !isGuest && business?._id
    ? useQuery(api.kpis.getSnapshot, { businessId: business._id })
    : undefined;

  // Add: derive businessId from props
  const businessId = !isGuest ? business?._id : null;

  const approvals = useQuery(
    api.approvals.getApprovalQueue,
    isGuest || !businessId ? "skip" : { businessId, status: "pending" as const }
  );

  const auditLatest = useQuery(
    api.audit.listForBusiness,
    isGuest || !businessId ? "skip" : { businessId, limit: 5 }
  );

  const agents = isGuest ? demoData?.agents || [] : [];
  const workflows = isGuest ? demoData?.workflows || [] : [];
  const kpis = isGuest ? (demoData?.kpis || {}) : (kpiDoc || {});
  const tasks = isGuest ? demoData?.tasks || [] : [];

  const approveSelf = useMutation(api.approvals.approveSelf);
  const rejectSelf = useMutation(api.approvals.rejectSelf);

  // Add: Feature flags query and toggle mutation
  const featureFlags = useQuery(
    api.featureFlags.getFeatureFlags,
    isGuest || !businessId ? "skip" : { businessId }
  );
  const toggleFlag = useMutation(api.featureFlags.toggleFeatureFlag);

  // Add: sparkline utility
  const Sparkline = ({ values, color = "bg-emerald-600" }: { values: number[]; color?: string }) => (
    <div className="flex items-end gap-1 h-12">
      {values.map((v, i) => (
        <div key={i} className={`${color} w-2 rounded-sm`} style={{ height: `${Math.max(6, Math.min(100, v))}%` }} />
      ))}
    </div>
  );
  const mkTrend = (base?: number): number[] => {
    const b = typeof base === "number" && !Number.isNaN(base) ? base : 60;
    const arr: number[] = [];
    for (let i = 0; i < 12; i++) {
      const jitter = ((i % 3 === 0 ? 1 : -1) * (6 + (i % 4))) / 2;
      arr.push(Math.max(5, Math.min(100, b + jitter)));
    }
    return arr;
  };

  // Add: diagnostics mutation
  const runDiagnostics = useMutation(api.initiatives.runPhase0Diagnostics);

  // Add: unify important KPI values for rendering across data sources
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

  // Memoize trends to avoid recompute on each render
  const revenueTrend = useMemo(
    () => mkTrend((unifiedRevenue ? Math.min(100, (unifiedRevenue / 5000) % 100) : 70)),
    [unifiedRevenue]
  );
  const efficiencyTrend = useMemo(
    () => mkTrend(unifiedGlobalEfficiency ?? 75),
    [unifiedGlobalEfficiency]
  );

  // Add: tier helper and LockedRibbon
  const tierRank: Record<string, number> = { solopreneur: 1, startup: 2, sme: 3, enterprise: 4 };
  const hasTier = (required: keyof typeof tierRank) => (tierRank[tier] ?? 1) >= tierRank[required];

  const LockedRibbon = ({ label = "Enterprise feature" }: { label?: string }) => (
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

  const enforceGovernanceForBiz = useMutation(api.governance.enforceGovernanceForBusiness);
  // Fetch SLA summary (skip in guest / when no business)
  const slaSummary = useConvexQuery(
    api.approvals.getSlaSummary,
    isGuest || !businessId ? "skip" : { businessId }
  );

  // Minimal draggable widget grid (persisted in localStorage)
  const defaultWidgets: Array<{ key: string; title: string; content: React.ReactNode }> = [
    { key: "ops", title: "Ops Health", content: <div className="text-sm text-muted-foreground">Uptime 99.9%, MTTR 1.8h</div> },
    { key: "growth", title: "Growth Pulse", content: <div className="text-sm text-muted-foreground">Signups +12%, Churn 2.1%</div> },
    { key: "governance", title: "Governance Score", content: <div className="text-sm text-muted-foreground">Compliant 94%</div> },
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

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, key: string) => {
    e.dataTransfer.setData("text/widget", key);
  };
  const onDropCard = (e: React.DragEvent<HTMLDivElement>, targetKey: string) => {
    const sourceKey = e.dataTransfer.getData("text/widget");
    if (!sourceKey || sourceKey === targetKey) return;
    const order = [...widgetOrder];
    const from = order.indexOf(sourceKey);
    const to = order.indexOf(targetKey);
    if (from === -1 || to === -1) return;
    order.splice(from, 1);
    order.splice(to, 0, sourceKey);
    setWidgetOrder(order);
  };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  // Add: BrainDumpSection for Enterprise
  function BrainDumpSection({ businessId }: { businessId: string }) {
    const initiatives = useQuery(
      api.initiatives.getByBusiness as any,
      businessId ? { businessId } : "skip"
    );
    const initiativeId =
      initiatives && initiatives.length > 0 ? initiatives[0]._id : null;

    const dumps = useQuery(
      api.initiatives.listBrainDumpsByInitiative as any,
      initiativeId ? { initiativeId, limit: 10 } : "skip"
    );
    const addDump = useMutation(api.initiatives.addBrainDump as any);

    const [text, setText] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
      if (!initiativeId) {
        toast("No initiative found. Run Diagnostics first.");
        return;
      }
      const content = text.trim();
      if (!content) {
        toast("Please enter your idea first.");
        return;
      }
      try {
        setSaving(true);
        await addDump({ initiativeId, content });
        setText("");
        toast("Saved to Brain Dump");
      } catch (e: any) {
        toast(e?.message || "Failed to save brain dump");
      } finally {
        setSaving(false);
      }
    };

    return (
      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Brain Dump</h2>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Capture rough ideas for strategic initiatives
              </span>
              <Badge variant="outline">Enterprise</Badge>
            </div>
            <Separator className="my-3" />
            <Textarea
              placeholder="Write freely here... (e.g., initiative idea, risks, opportunities)"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-24"
            />
            <div className="flex justify-end mt-3">
              <Button onClick={handleSave} disabled={saving || !initiativeId}>
                {saving ? "Saving..." : "Save Idea"}
              </Button>
            </div>
            <Separator className="my-4" />
            <div className="space-y-2">
              <div className="text-sm font-medium">Recent ideas</div>
              <div className="space-y-2">
                {Array.isArray(dumps) && dumps.length > 0 ? (
                  dumps.map((d: any) => (
                    <div key={String(d._id)} className="rounded-md border p-3 text-sm">
                      <div className="text-muted-foreground text-xs mb-1">
                        {new Date(d.createdAt).toLocaleString()}
                      </div>
                      <div className="whitespace-pre-wrap">{d.content}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground text-sm">No entries yet.</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add: Upgrade nudge banner */}
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

      {/* Global Overview Banner */}
      <section className="rounded-lg border p-4 bg-gradient-to-r from-emerald-50 to-blue-50">
        <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="text-sm text-muted-foreground">
            {slaSummary && slaSummary !== "skip"
              ? `SLA: ${slaSummary.overdueCount} overdue, ${slaSummary.dueSoonCount} due soon`
              : null}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                if (!business?._id) return;
                try {
                  const id = await runDiagnostics({ businessId: business._id });
                  toast.success("Diagnostics started");
                } catch (e: any) {
                  toast.error(e?.message || "Failed to run diagnostics");
                }
              }}
              disabled={!business?._id}
            >
              Run Diagnostics
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                if (!business?._id) return;
                try {
                  const res = await enforceGovernanceForBiz({ businessId: business._id });
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
        </div>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold mb-1">Global Overview</h2>
            <p className="text-sm text-muted-foreground">
              Multi-region performance and critical system health at a glance
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global</SelectItem>
                <SelectItem value="na">North America</SelectItem>
                <SelectItem value="eu">Europe</SelectItem>
                <SelectItem value="apac">APAC</SelectItem>
              </SelectContent>
            </Select>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Business Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Revenue</h3>
              <p className="text-2xl font-bold">${(unifiedRevenue as number)?.toLocaleString?.() ?? 0}</p>
              <p className="text-xs text-green-600">+12% YoY</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Global Efficiency</h3>
              <p className="text-2xl font-bold">{unifiedGlobalEfficiency ?? 0}%</p>
              <p className="text-xs text-green-600">+3% from last quarter</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Compliance Score</h3>
              <p className="text-2xl font-bold">{kpis.complianceScore ?? 0}%</p>
              <p className="text-xs text-blue-600">Stable</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Risk Score</h3>
              <p className="text-2xl font-bold text-green-600">{kpis.riskScore ?? 0}</p>
              <p className="text-xs text-green-600">Low risk profile</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* KPI Trends */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Global KPI Trends</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Revenue (Global)</h3>
                <span className="text-xs text-emerald-700">${(unifiedRevenue as number)?.toLocaleString?.() ?? 0}</span>
              </div>
              <Sparkline values={revenueTrend} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Global Efficiency</h3>
                <span className="text-xs text-emerald-700">{unifiedGlobalEfficiency ?? 0}%</span>
              </div>
              <Sparkline values={efficiencyTrend} color="bg-emerald-500" />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Command Widgets */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Command Widgets</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <h3 className="font-medium mb-2">Global Operations</h3>
              <Button className="w-full">Manage</Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <h3 className="font-medium mb-2">Crisis Management</h3>
              <Button variant="outline" className="w-full">Standby</Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <h3 className="font-medium mb-2">Innovation Hub</h3>
              <Button className="w-full">Explore</Button>
            </CardContent>
          </Card>
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="p-4 text-center">
              <h3 className="font-medium mb-2">Custom Widget</h3>
              <p className="text-xs text-muted-foreground mb-2">Drag & drop available</p>
              <Button variant="outline" size="sm">Customize</Button>
              {/* Add: gating ribbon for non-enterprise roles */}
              {!hasTier("enterprise") && (
                <div className="mt-3">
                  <LockedRibbon label="Custom widget grid is Enterprise+" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Custom Widget Grid */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Custom Widget Grid</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {widgetOrder.map((key) => {
            const w = widgetsByKey[key];
            if (!w) return null;
            return (
              <Card
                key={w.key}
                draggable
                onDragStart={(e) => onDragStart(e, w.key)}
                onDragOver={onDragOver}
                onDrop={(e) => onDropCard(e, w.key)}
                className="border-dashed"
                title="Drag to reorder"
              >
                <CardHeader className="pb-2">
                  <CardTitle>{w.title}</CardTitle>
                </CardHeader>
                <CardContent>{w.content}</CardContent>
              </Card>
            );
          })}
        </div>
        {!hasTier("enterprise") && (
          <div className="pt-2">
            <div className="rounded-md border p-2 mt-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="border-amber-300 text-amber-700">Locked</Badge>
                <span>Drag-and-drop persistence is Enterprise+</span>
                <Button size="sm" variant="outline" onClick={onUpgrade} className="ml-auto">Upgrade</Button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Strategic Initiatives */}
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

      {/* Telemetry Summary */}
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
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Enterprise Controls */}
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
              {/* Add: gating ribbon if not enterprise */}
              {!hasTier("enterprise") && (
                <div className="pt-2 border-t mt-2">
                  <LockedRibbon label="Advanced controls are Enterprise+" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Integration Status (placeholder) */}
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

          {/* Approvals & Audit quick glance */}
          <Card className="xl:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle>Approvals & Audit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-2">Pending Approvals</div>
                {isGuest ? (
                  <div className="text-sm text-muted-foreground">Demo: 4 pending enterprise approvals.</div>
                ) : !approvals ? (
                  <div className="text-sm text-muted-foreground">Loading…</div>
                ) : approvals.length === 0 ? (
                  <div className="text-sm text-muted-foreground">None pending.</div>
                ) : (
                  approvals.slice(0, 3).map((a: any) => (
                    <div key={a._id} className="flex items-center justify-between border rounded-md p-2">
                      <span className="text-sm">WF {String(a.workflowId).slice(-6)}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{a.priority}</Badge>
                        {!isGuest && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  await approveSelf({ id: a._id });
                                  toast.success("Approved");
                                } catch (e: any) {
                                  toast.error(e?.message || "Failed to approve");
                                }
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={async () => {
                                try {
                                  await rejectSelf({ id: a._id });
                                  toast.success("Rejected");
                                } catch (e: any) {
                                  toast.error(e?.message || "Failed to reject");
                                }
                              }}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div>
                <div className="text-sm font-medium mb-2">Recent Audit</div>
                {isGuest ? (
                  <div className="text-sm text-muted-foreground">Demo: Policy update, Role change, Integration key rotated.</div>
                ) : !auditLatest ? (
                  <div className="text-sm text-muted-foreground">Loading…</div>
                ) : auditLatest.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No recent events.</div>
                ) : (
                  auditLatest.slice(0, 3).map((e: any) => (
                    <div key={e._id} className="text-xs text-muted-foreground">
                      {new Date(e.createdAt).toLocaleDateString()} — {e.entityType}: {e.action}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Feature Flags Management */}
          <Card className="xl:col-span-1" id="feature-flags">
            <CardHeader className="pb-2">
              <CardTitle>Feature Flags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isGuest ? (
                <div className="text-sm text-muted-foreground">
                  Demo: Feature flags available for enterprise admins.
                </div>
              ) : !featureFlags ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : featureFlags.length === 0 ? (
                <div className="text-sm text-muted-foreground">No flags configured.</div>
              ) : (
                featureFlags.slice(0, 6).map((f: any) => (
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
              {!isGuest && featureFlags && !hasTier("enterprise") && (
                <div className="pt-2 border-t mt-2">
                  <LockedRibbon label="Full flag management is Enterprise+" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Enterprise Shortcuts */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Enterprise Shortcuts</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Integrations</div>
                <div className="text-xs text-muted-foreground">CRMs, Analytics, Billing</div>
              </div>
              <Button size="sm" variant="outline" disabled>Open</Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Initiatives for Enterprise */}
      <div className="mt-6">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Initiatives for Enterprise</CardTitle>
            <CardDescription>
              Govern strategic programs with clear OKRs, portfolio visibility, and compliant workflows at scale.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Ensure alignment and traceability: initiatives link to KPIs, owners, and standardized execution.
            </p>
            <Button asChild size="sm" variant="default">
              <a href="/initiatives">Open Initiatives</a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Brain Dump */}
      {!isGuest && business?._id ? (
        <BrainDumpSection businessId={String(business._id)} />
      ) : null}
    </div>
  );
}