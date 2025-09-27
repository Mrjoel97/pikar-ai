import { useQuery, useMutation, useQuery as useConvexQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import * as React from "react";
import { useNavigate } from "react-router";

interface SmeDashboardProps {
  business: any;
  demoData: any;
  isGuest: boolean;
  tier: string;
  onUpgrade: () => void;
}

export function SmeDashboard({ 
  business, 
  demoData, 
  isGuest, 
  tier, 
  onUpgrade 
}: SmeDashboardProps) {
  // Fetch latest KPI snapshot when authenticated
  const kpiDoc = !isGuest && business?._id
    ? useQuery(api.kpis.getSnapshot, { businessId: business._id })
    : undefined;

  const agents = isGuest ? demoData?.agents || [] : [];
  const workflows = isGuest ? demoData?.workflows || [] : [];
  const kpis = isGuest ? (demoData?.kpis || {}) : (kpiDoc || {});
  const tasks = isGuest ? demoData?.tasks || [] : [];

  // Fix: derive businessId from current props (not `props`)
  const businessId = !isGuest ? business?._id : null;

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
    isGuest || !businessId ? "skip" : { businessId }
  );
  const toggleFlag = useMutation(api.featureFlags.toggleFeatureFlag);

  const enforceGovernanceForBiz = useMutation(api.governance.enforceGovernanceForBusiness);
  // Fetch SLA summary (skip in guest / when no business)
  const slaSummary = !isGuest && business?._id ? useQuery(api.approvals.getSlaSummary, { businessId: business._id }) : undefined;
  const auditLatest = !isGuest && business?._id ? useQuery(api.audit.listForBusiness, { businessId: business._id, limit: 10 }) : undefined;

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
    isGuest || !business?._id ? undefined : { businessId: business._id }
  );

  const smeTier = "sme";
  const smeFlags = useQuery(api.featureFlags.getFeatureFlags, {});
  const smeAgents = useQuery(api.aiAgents.listRecommendedByTier, { tier: smeTier, limit: 3 });
  const smeAgentsEnabled = !!smeFlags?.find((f: any) => f.flagName === "sme_insights")?.isEnabled;
  const nav = useNavigate();

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

  return (
    <div className="space-y-6">
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
              <div className="text-sm text-muted-foreground">Risk Alerts</div>
              <div className="text-2xl font-bold">{slaSummary ? (slaSummary.overdue + slaSummary.dueSoon) : (isGuest ? 3 : 0)}</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Governance Panel */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Governance Panel</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle>Checklist Progress</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {isGuest ? (
                <div>MMR enforced, SLA ≥ 24h, Approver roles configured. 4/5 checks passed.</div>
              ) : (
                <div>Key policies enforced. SLA floors and approvals configured. Review workflows for issues.</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle>Audit Highlights</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {isGuest ? (
                <>
                  <div className="text-xs text-muted-foreground">Policy update recorded</div>
                  <div className="text-xs text-muted-foreground">Approval overdue warning sent</div>
                </>
              ) : !auditLatest ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : auditLatest.length === 0 ? (
                <div className="text-sm text-muted-foreground">No recent events.</div>
              ) : (
                auditLatest.slice(0, 6).map((e: any) => (
                  <div key={e._id} className="text-xs text-muted-foreground">
                    {new Date(e.createdAt).toLocaleDateString()} — {e.entityType}: {e.action}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* KPI Trends */}
      <section>
        <h2 className="text-xl font-semibold mb-4">KPI Trends</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Compliance Score</h3>
                <span className="text-xs text-emerald-700">{kpis?.complianceScore ?? 0}%</span>
              </div>
              <Sparkline values={complianceTrend} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Risk (Lower is Better)</h3>
                <span className="text-xs text-emerald-700">{kpis?.riskScore ?? 0}</span>
              </div>
              <Sparkline values={riskTrend} color="bg-emerald-500" />
            </CardContent>
          </Card>
        </div>
      </section>

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

      {/* Governance & Audit data hooks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Governance Panel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isGuest ? (
              <div className="text-sm text-muted-foreground">
                Demo: 3 pending approvals across departments.
              </div>
            ) : !pendingApprovals ? (
              <div className="text-sm text-muted-foreground">Loading approvals…</div>
            ) : pendingApprovals.length === 0 ? (
              <div className="text-sm text-muted-foreground">No pending approvals.</div>
            ) : (
              pendingApprovals.slice(0, 6).map((a: any) => (
                <div key={a._id} className="flex items-center justify-between border rounded-md p-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Workflow {String(a.workflowId).slice(-6)}</span>
                    <span className="text-xs text-muted-foreground">
                      Step {String(a.stepId).slice(-6)} • Requested {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        a.priority === "urgent" ? "border-red-300 text-red-700" :
                        a.priority === "high" ? "border-amber-300 text-amber-700" :
                        "border-slate-300 text-slate-700"
                      }
                    >
                      {a.priority}
                    </Badge>
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
            {/* Add: gating ribbon if governance approval actions are Enterprise+ */}
            {!isGuest && !hasTier("enterprise") && (
              <div className="pt-2 border-t mt-2">
                <LockedRibbon label="Advanced governance automation is Enterprise+" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audit Trail Highlights */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Audit Trail Highlights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isGuest ? (
              <div className="text-sm text-muted-foreground">
                Demo: 5 latest policy and permission changes.
              </div>
            ) : !auditHighlights ? (
              <div className="text-sm text-muted-foreground">Loading audit logs…</div>
            ) : auditHighlights.length === 0 ? (
              <div className="text-sm text-muted-foreground">No recent audit events.</div>
            ) : (
              auditHighlights.map((e: any) => (
                <div key={e._id} className="flex items-start gap-3">
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {new Date(e.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{e.entityType}</div>
                    <div className="text-xs text-muted-foreground">{e.action}</div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Department Views (Tabbed Center Section) */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Department Views</h2>
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
        <section className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Departments</h2>
            <Button asChild size="sm" variant="outline"><a href="/analytics">Open Analytics</a></Button>
          </div>
          <Tabs defaultValue="marketing" className="w-full">
            <TabsList>
              <TabsTrigger value="marketing">Marketing</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="ops">Ops</TabsTrigger>
              <TabsTrigger value="finance">Finance</TabsTrigger>
            </TabsList>
            <TabsContent value="marketing">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Leads</div><div className="text-2xl font-bold">{isGuest ? 312 : ((kpiDoc as any)?.marketingLeads ?? "—")}</div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">CTR</div><div className="text-2xl font-bold">{isGuest ? "3.2%" : (((kpiDoc as any)?.ctr ?? 0) + "%")}</div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Subs</div><div className="text-2xl font-bold">{isGuest ? 124 : ((kpiDoc as any)?.subscribers ?? "—")}</div></CardContent></Card>
              </div>
            </TabsContent>
            <TabsContent value="sales">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Pipeline</div><div className="text-2xl font-bold">${isGuest ? "540k" : ((kpiDoc as any)?.pipeline ?? "—")}</div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Win Rate</div><div className="text-2xl font-bold">{isGuest ? "27%" : (((kpiDoc as any)?.winRate ?? 0) + "%")}</div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Cycle</div><div className="text-2xl font-bold">{isGuest ? "18d" : (((kpiDoc as any)?.cycleDays ?? 0) + "d")}</div></CardContent></Card>
              </div>
            </TabsContent>
            <TabsContent value="ops">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">On-time</div><div className="text-2xl font-bold">{isGuest ? "96%" : (((kpiDoc as any)?.onTime ?? 0) + "%")}</div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Tickets</div><div className="text-2xl font-bold">{isGuest ? 42 : ((kpiDoc as any)?.tickets ?? "—")}</div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">MTTR</div><div className="text-2xl font-bold">{isGuest ? "2.4h" : (((kpiDoc as any)?.mttrHrs ?? 0) + "h")}</div></CardContent></Card>
              </div>
            </TabsContent>
            <TabsContent value="finance">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">MRR</div><div className="text-2xl font-bold">${isGuest ? "80,200" : ((kpiDoc as any)?.mrr ?? "—")}</div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Gross Margin</div><div className="text-2xl font-bold">{isGuest ? "72%" : (((kpiDoc as any)?.gm ?? 0) + "%")}</div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Runway</div><div className="text-2xl font-bold">{isGuest ? "14m" : (((kpiDoc as any)?.runwayMonths ?? 0) + "m")}</div></CardContent></Card>
              </div>
            </TabsContent>
          </Tabs>
        </section>
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

      {/* Compliance Summary */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Compliance & Risk</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Recent Compliance Activities</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm">Quarterly audit completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  <span className="text-sm">New regulation review pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-sm">Policy update scheduled</span>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Hide upgrade prompt for guests */}
          {!isGuest && (
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">Executive Controls</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Generate executive reports and automate approvals.
                </p>
                <LockedRibbon label="Executive actions are Enterprise+" />
              </CardContent>
            </Card>
          )}
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

      {/* Brain Dump */}
      {!isGuest && business?._id ? (
        <BrainDumpSection businessId={String(business._id)} />
      ) : null}

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
    </div>
  );
}