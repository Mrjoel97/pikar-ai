import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

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
      ? "skip"
      : { businessId, status: "pending" as const }
  );

  const auditHighlights = useQuery(
    api.audit.listForBusiness,
    isGuest || !businessId
      ? "skip"
      : { businessId, limit: 5 }
  );

  const approveSelf = useMutation(api.approvals.approveSelf);
  const rejectSelf = useMutation(api.approvals.rejectSelf);

  const featureFlags = useQuery(
    api.featureFlags.getFeatureFlags,
    isGuest || !businessId ? "skip" : { businessId }
  );
  const toggleFlag = useMutation(api.featureFlags.toggleFeatureFlag);

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
    isGuest || !business?._id ? "skip" : { businessId: business._id }
  );

  return (
    <div className="space-y-6">
      {/* Add: Upgrade nudge banner */}
      {!isGuest && upgradeNudges && upgradeNudges.showBanner && (
        <div className="rounded-md border p-3 bg-amber-50 flex items-center gap-3">
          <Badge variant="outline" className="border-amber-300 text-amber-700">Upgrade</Badge>
          <div className="text-sm">
            {upgradeNudges.nudges?.[0]?.message || "Unlock more workflows and premium analytics."}
          </div>
          <div className="ml-auto">
            <Button size="sm" variant="outline" onClick={onUpgrade}>See Plans</Button>
          </div>
        </div>
      )}

      {/* Governance Panel */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Governance Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Compliance Score</h3>
              <p className="text-2xl font-bold text-green-600">{kpis.complianceScore}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Risk Score</h3>
              <p className="text-2xl font-bold text-yellow-600">{kpis.riskScore}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Department Efficiency</h3>
              <p className="text-2xl font-bold">{kpis.departmentEfficiency}%</p>
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
              pendingApprovals.slice(0, 6).map((a) => (
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
              auditHighlights.map((e) => (
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
        <Tabs defaultValue="marketing" className="w-full">
          <TabsList className="grid grid-cols-4 max-w-full">
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="finance">Finance</TabsTrigger>
          </TabsList>

          <TabsContent value="marketing" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Campaign Performance</h3>
                  <p className="text-2xl font-bold">94%</p>
                  <p className="text-xs text-green-600">+2% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Brand Consistency</h3>
                  <p className="text-2xl font-bold">91%</p>
                  <p className="text-xs text-green-600">+1% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Content Calendar</h3>
                  <p className="text-sm text-muted-foreground">Upcoming: 7 scheduled posts</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Pipeline Health</h3>
                  <p className="text-2xl font-bold">$240k</p>
                  <p className="text-xs text-green-600">+5% QoQ</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Conversion Rate</h3>
                  <p className="text-2xl font-bold">12.4%</p>
                  <p className="text-xs text-green-600">+0.6% WoW</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Territory Performance</h3>
                  <p className="text-sm text-muted-foreground">Top: West Coast</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="operations" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Process Efficiency</h3>
                  <p className="text-2xl font-bold">88%</p>
                  <p className="text-xs text-yellow-600">-1% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Automation Status</h3>
                  <p className="text-sm text-muted-foreground">Active automations: 14</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Resource Utilization</h3>
                  <p className="text-2xl font-bold">72%</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="finance" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Budget vs. Actual</h3>
                  <p className="text-sm text-muted-foreground">Within 3% of plan</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">ROI by Initiative</h3>
                  <p className="text-2xl font-bold">1.8x</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Cost Center Analysis</h3>
                  <p className="text-sm text-muted-foreground">Top variance: Ops</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
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
                featureFlags.slice(0, 8).map((f) => (
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
    </div>
  );
}