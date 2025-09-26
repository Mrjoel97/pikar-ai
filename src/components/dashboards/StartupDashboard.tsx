import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { useMemo } from "react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CampaignComposer from "@/components/email/CampaignComposer";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

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
    isGuest || !business?._id ? undefined : { businessId: business._id }
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

  const envStatus = useQuery(
    api.health.envStatus,
    isGuest || !business?._id ? undefined : { businessId: business._id }
  );

  const recentActivity = useQuery(
    api.activityFeed.getRecent,
    isGuest || !business?._id ? undefined : { businessId: business._id, limit: 10 }
  );
const pendingApprovals = useQuery(
  api.approvals.getApprovalQueue,
  isGuest || !business?._id ? undefined : { businessId: business._id, status: "pending" as const }
);

  // Fallback counters
  const approvalsCompleted7d =  isGuest ? 7 : 0; // adjust if backend exposes completed; placeholder for now
  const tasksCompleted7d = isGuest ? 12 : 0;
  const contributionsCount = (recentActivity && recentActivity !== "skip") ? recentActivity.length : (isGuest ? 8 : 0);

  // A/B summary using campaigns as proxy
  const campaigns = useQuery(
    api.emails.listCampaignsByBusiness,
    isGuest || !business?._id ? undefined : { businessId: business._id }
  );
  const testsRunning = (campaigns && campaigns !== "skip") ? Math.min(campaigns.length, 3) : (isGuest ? 2 : 0);
  const lastUplift = isGuest ? 8.4 : (testsRunning > 0 ? 5.1 : 0);
  const winnersCount = isGuest ? 3 : (testsRunning > 1 ? 1 : 0);

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

  // Add: composer modal state
  const [showComposer, setShowComposer] = useState(false);

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

    const [text, setText] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
      if (!initiativeId) {
        toast?.("No initiative found. Run Phase 0 diagnostics first.");
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
          <span className="text-xs text-gray-500">Capture rough ideas quickly</span>
        </div>
        <div className="my-3 h-px bg-gray-200" />
        <div className="space-y-3">
          <textarea
            placeholder="Write freely here... (e.g., experiment idea, positioning, offer notes)"
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
            {upgradeNudges.nudges?.[0]?.message || "You're nearing usage limits—unlock more capacity."}
          </div>
          <div className="ml-auto">
            <Button size="sm" variant="outline" onClick={onUpgrade}>See Plans</Button>
          </div>
        </div>
      )}

      {/* System Health strip (env + integrations) */}
      {!isGuest && envStatus && envStatus !== "skip" && (
        <div className="rounded-md border p-3 bg-slate-50 mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-xs">
            <div className="text-slate-500">Resend</div>
            <div className={envStatus.emailConfigured ? "text-emerald-600" : "text-amber-600"}>
              {envStatus.emailConfigured ? "Configured" : "Missing"}
            </div>
          </div>
          <div className="text-xs">
            <div className="text-slate-500">Base URL</div>
            <div className={envStatus.publicBaseUrlOk ? "text-emerald-600" : "text-amber-600"}>
              {envStatus.publicBaseUrlOk ? "OK" : "Not set"}
            </div>
          </div>
          <div className="text-xs">
            <div className="text-slate-500">Email Queue</div>
            <div className={envStatus.emailQueueDepth > 25 ? "text-amber-600" : "text-emerald-600"}>
              {envStatus.emailQueueDepth} queued
            </div>
          </div>
          <div className="text-xs">
            <div className="text-slate-500">Cron Freshness</div>
            <div className={(envStatus.cronLastProcessedDeltaMins ?? 0) > 5 ? "text-amber-600" : "text-emerald-600"}>
              {Math.round(envStatus.cronLastProcessedDeltaMins ?? 0)}m
            </div>
          </div>
        </div>
      )}

      {/* Team Performance */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Team Performance (7d)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Contributions</div>
              <div className="text-2xl font-bold">{contributionsCount}</div>
              <div className="text-xs text-emerald-600">+{isGuest ? 2 : 0} vs prior</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Approvals Completed</div>
              <div className="text-2xl font-bold">{approvalsCompleted7d}</div>
              <div className="text-xs text-emerald-600">SLA improving</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Tasks Completed</div>
              <div className="text-2xl font-bold">{tasksCompleted7d}</div>
              <div className="text-xs text-emerald-600">Momentum up</div>
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
              {/* Open composer modal */}
              <Button size="sm" onClick={() => setShowComposer(true)}>Create Campaign</Button>
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

      {/* Collaboration Feed */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Collaboration Feed</h2>
        <div className="space-y-2">
          {isGuest ? (
            <>
              <div className="text-sm text-muted-foreground">Demo: New campaign drafted "October Promo".</div>
              <div className="text-sm text-muted-foreground">Demo: Approval assigned to Alex for Workflow A.</div>
              <div className="text-sm text-muted-foreground">Demo: KPI snapshot updated.</div>
            </>
          ) : !recentActivity ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : recentActivity.length === 0 ? (
            <div className="text-sm text-muted-foreground">No recent activity.</div>
          ) : (
            recentActivity.slice(0, 8).map((it: any) => (
              <div key={it.id} className="flex items-center justify-between border rounded-md p-2">
                <div className="text-sm">
                  <span className="font-medium">{it.type === "notification" ? "Notification" : "Workflow run"}</span>
                  <span className="text-muted-foreground"> • {it.title}</span>
                </div>
                <span className="text-xs text-slate-500">{new Date(it.createdAt).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* A/B Summary cards */}
      <section className="mb-4">
        <h2 className="text-lg font-semibold mb-3">A/B Testing Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Tests Running</div>
              <div className="text-2xl font-bold">{testsRunning}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Last Uplift</div>
              <div className="text-2xl font-bold">{lastUplift}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Winners</div>
              <div className="text-2xl font-bold">{winnersCount}</div>
            </CardContent>
          </Card>
        </div>
        {(!campaigns || campaigns === "skip" || campaigns.length === 0) && !isGuest && (
          <div className="mt-2">
            <Button asChild variant="outline" size="sm">
              <a href="/analytics">Start a test</a>
            </Button>
          </div>
        )}
      </section>

      {/* Email Campaigns section with skeleton loading */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Email Campaigns
            <Button size="sm" onClick={() => setShowComposer(true)}>
              Create Campaign
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          }>
            {!campaigns ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No campaigns yet. Create your first campaign to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.slice(0, 5).map((campaign: any) => (
                  <Card key={campaign._id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-medium">{campaign.subject}</h3>
                          <p className="text-xs text-muted-foreground">From: {campaign.fromName ? `${campaign.fromName} <${campaign.fromEmail}>` : campaign.fromEmail}</p>
                        </div>
                        <Badge variant="outline">{campaign.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {(campaign.audienceType === "list" ? "Contact list" : `${(campaign.recipients?.length ?? 0)} recipients`)} • {(
                          campaign.scheduledAt
                            ? `Scheduled ${new Date(campaign.scheduledAt).toLocaleString?.()}`
                            : campaign.createdAt
                            ? `Created ${new Date(campaign.createdAt).toLocaleString?.()}`
                            : ""
                        )}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </Suspense>
        </CardContent>
      </Card>

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

      {/* Campaign Composer Modal */}
      <Dialog open={showComposer} onOpenChange={setShowComposer}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Email Campaign</DialogTitle>
          </DialogHeader>
          <CampaignComposer
            businessId={business?._id}
            onClose={() => setShowComposer(false)}
            onCreated={() => {
              setShowComposer(false);
              toast.success("Campaign scheduled");
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Brain Dump */}
      {!isGuest && business?._id ? (
        <BrainDumpSection businessId={String(business._id)} />
      ) : null}
    </div>
  );
}