import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { useMemo } from "react";

interface StartupDashboardProps {
  business: any;
  demoData: any;
  isGuest: boolean;
  tier: string;
  onUpgrade: () => void;
}

export function StartupDashboard({ 
  business, 
  demoData, 
  isGuest, 
  tier, 
  onUpgrade 
}: StartupDashboardProps) {
  const agents = isGuest ? demoData?.agents || [] : [];
  const workflows = isGuest ? demoData?.workflows || [] : [];
  const kpis = isGuest ? demoData?.kpis || {} : {};
  const tasks = isGuest ? demoData?.tasks || [] : [];

  const runDiagnostics = useMutation(api.initiatives.runPhase0Diagnostics);

  const upgradeNudges = useQuery(
    api.telemetry.getUpgradeNudges,
    isGuest || !business?._id ? "skip" : { businessId: business._id }
  );

  const UpgradeCTA = ({ feature }: { feature: string }) => (
    <Card className="border-dashed border-2 border-gray-300">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <h3 className="font-semibold mb-2">Upgrade to SME</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Get {feature} with governance features
        </p>
        <Button onClick={onUpgrade} size="sm">
          Upgrade to SME
        </Button>
      </CardContent>
    </Card>
  );

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
    for (let i = 0; i < 10; i++) {
      const jitter = ((i % 2 === 0 ? 1 : -1) * (6 + (i % 4))) / 2;
      arr.push(Math.max(5, Math.min(100, b + jitter)));
    }
    return arr;
  };

  const revenueTrend = useMemo(
    () => mkTrend((kpis?.totalRevenue ? Math.min(100, (kpis.totalRevenue / 2000) % 100) : 55)),
    [kpis?.totalRevenue]
  );
  const productivityTrend = useMemo(
    () => mkTrend(kpis?.teamProductivity ?? 70),
    [kpis?.teamProductivity]
  );

  const pendingApprovals = useQuery(
    api.approvals.pendingForBusiness,
    isGuest || !business?._id ? "skip" : { businessId: business._id, limit: 6 }
  );

  const approveSelf = useMutation(api.approvals.approveSelf);
  const rejectSelf = useMutation(api.approvals.rejectSelf);

  const tierRank: Record<string, number> = { solopreneur: 1, startup: 2, sme: 3, enterprise: 4 };
  const hasTier = (required: keyof typeof tierRank) =>
    (tierRank[tier as keyof typeof tierRank] ?? 1) >= tierRank[required];

  const LockedRibbon = ({ label = "Feature requires upgrade" }: { label?: string }) => (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Badge variant="outline" className="border-amber-300 text-amber-700">Locked</Badge>
      <span>{label}</span>
      <Button size="sm" variant="outline" onClick={onUpgrade} className="ml-auto">
        Upgrade
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Add: Upgrade nudge banner */}
      {!isGuest && upgradeNudges && upgradeNudges.showBanner && (
        <div className="rounded-md border p-3 bg-amber-50 flex items-center gap-3">
          <Badge variant="outline" className="border-amber-300 text-amber-700">Upgrade</Badge>
          <div className="text-sm">
            {upgradeNudges.nudges?.[0]?.message || "You're nearing usage limits—unlock more capacity."}
          </div>
          <div className="ml-auto">
            <Button size="sm" variant="outline" onClick={onUpgrade}>See Plans</Button>
          </div>
        </div>
      )}

      {/* Team Performance */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Team Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Active Agents</h3>
              <p className="text-2xl font-bold">{agents.filter((a: any) => a.status === 'active').length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Team Productivity</h3>
              <p className="text-2xl font-bold">{kpis.teamProductivity}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Customer Satisfaction</h3>
              <p className="text-2xl font-bold">{kpis.customerSatisfaction}/5</p>
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
                <h3 className="text-sm font-medium text-muted-foreground">Revenue Trend</h3>
                <span className="text-xs text-emerald-700">Last 10 periods</span>
              </div>
              <Sparkline values={revenueTrend} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Team Productivity</h3>
                <span className="text-xs text-emerald-700">
                  {(kpis?.teamProductivity ?? 0)}%
                </span>
              </div>
              <Sparkline values={productivityTrend} color="bg-emerald-500" />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Growth Metrics */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Growth Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Revenue</h3>
              <p className="text-2xl font-bold">${kpis.totalRevenue?.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Customers</h3>
              <p className="text-2xl font-bold">{kpis.activeCustomers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Conversion</h3>
              <p className="text-2xl font-bold">{kpis.conversionRate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Task Completion</h3>
              <p className="text-2xl font-bold">{kpis.taskCompletion}%</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Active Initiatives */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Active Initiatives</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflows.slice(0, 4).map((workflow: any) => (
            <Card key={workflow.id}>
              <CardContent className="p-4">
                <h3 className="font-medium">{workflow.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Status: {workflow.status}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-emerald-600 h-2 rounded-full" 
                    style={{ width: `${workflow.completionRate}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {workflow.completionRate}% complete
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick Team Actions (Right Sidebar analogue) */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Quick Team Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Start New Campaign</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Assign owners, set objectives, and launch with a template.
              </p>
              <Button size="sm">Create Campaign</Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Review Pending Approvals</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Unblock initiatives awaiting review or sign-off.
              </p>
              <Button variant="outline" size="sm" disabled={!hasTier("sme")}>Open Approvals</Button>
              {!hasTier("sme") && (
                <div className="mt-3">
                  <LockedRibbon label="Approvals panel is SME+" />
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Schedule Team Meeting</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Align on goals, blockers, and next actions.
              </p>
              <Button variant="outline" size="sm">Schedule</Button>
              {!hasTier("sme") && (
                <div className="mt-3">
                  <LockedRibbon label="Advanced collaboration is SME+" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add: Run Diagnostics action */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Run Phase 0 Diagnostics</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Generate a discovery snapshot from your onboarding profile.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (!business?._id) {
                    toast.error("Sign in or complete onboarding first");
                    return;
                  }
                  try {
                    await runDiagnostics({ businessId: business._id });
                    toast.success("Diagnostics started");
                  } catch (e: any) {
                    toast.error(e?.message || "Failed to run diagnostics");
                  }
                }}
                disabled={!business?._id}
              >
                Run Diagnostics
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* System Health (Bottom) */}
      <section>
        <h2 className="text-xl font-semibold mb-4">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Integrations Status</h3>
              <p className="text-2xl font-bold">
                {(isGuest ? demoData?.integrationsOk : true) ? "Healthy" : "Issues"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {(isGuest ? demoData?.integrationsCount ?? 5 : 5)} connected
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Automation Performance</h3>
              <p className="text-2xl font-bold">
                {(isGuest ? demoData?.automationSuccessRate ?? 97 : 97)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Success rate past 7 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Data Sync</h3>
              <p className="text-2xl font-bold">
                {(isGuest ? demoData?.dataSyncStatus ?? "Up-to-date" : "Up-to-date")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Last sync: {(isGuest ? demoData?.lastSync ?? "2m ago" : "2m ago")}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pending Approvals */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Pending Approvals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(
            (Array.isArray(pendingApprovals) && pendingApprovals.length > 0
              ? pendingApprovals
              : tasks.filter((t: any) => t.priority === "high")
            ) as any[]
          ).map((item: any) => {
            const id = String(item._id ?? item.id ?? Math.random());
            const title =
              String(item.title ?? item.name ?? "Approval Required");
            const sub =
              item.dueDate
                ? `Due: ${item.dueDate}`
                : item.requester
                ? `Requester: ${item.requester}`
                : item.owner
                ? `Owner: ${item.owner}`
                : "Action required";
            return (
              <Card key={id}>
                <CardContent className="p-4">
                  <h3 className="font-medium">{title}</h3>
                  <p className="text-sm text-muted-foreground">{sub}</p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={async () => {
                        if (!item?._id) {
                          toast.info("This is demo data");
                          return;
                        }
                        try {
                          await approveSelf({ id: item._id });
                          toast.success("Approved");
                        } catch (e: any) {
                          toast.error(e?.message || "Failed to approve");
                        }
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        try {
                          window.location.href = "/workflows";
                        } catch {
                          // no-op
                        }
                      }}
                    >
                      Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {!isGuest && <UpgradeCTA feature="Advanced Governance" />}
          {!hasTier("sme") && (
            <div className="md:col-span-2">
              <LockedRibbon label="Full approvals workflow is SME+" />
            </div>
          )}
        </div>
      </section>

      <div className="mt-6">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Initiatives for Startups</CardTitle>
            <CardDescription>
              Prioritize 2–3 strategic initiatives and attach workflows to accelerate learning and growth.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Drive focus with clear outcomes, owners, and linked workflows that unblock execution.
            </p>
            <Button asChild size="sm" variant="default">
              <a href="/initiatives">Open Initiatives</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}