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
import { useNavigate } from "react-router";
import { ExperimentDashboard } from "@/components/experiments/ExperimentDashboard";
import { ExperimentCreator } from "@/components/experiments/ExperimentCreator";
import { ContentCalendar } from "@/components/calendar/ContentCalendar";
import { RoiDashboard } from "@/components/dashboards/RoiDashboard";
import type { Id } from "@/convex/_generated/dataModel";
import { Link as LinkIcon } from "lucide-react";
import { TeamOnboardingWizard } from "@/components/onboarding/TeamOnboardingWizard";
import {
  Twitter,
  Linkedin,
  Facebook,
  Sparkles,
  AlertCircle,
  Check,
  X,
  Trophy,
  TrendingUp,
  DollarSign,
  Users,
  Target,
} from "lucide-react";
import { SocialMediaManager } from "@/components/social/SocialMediaManager";
import { PostComposer } from "@/components/social/PostComposer";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell,
  FunnelChart,
  Funnel,
} from "recharts";
import { SystemHealthStrip } from "@/components/dashboard/SystemHealthStrip";
import type { StartupDashboardProps } from "@/types/dashboard";
import React, { lazy, Suspense } from "react";
import { LazyLoadErrorBoundary } from "@/components/common/LazyLoadErrorBoundary";

// Lazy load heavy Startup components
const TeamPerformance = lazy(() =>
  import("./startup/TeamPerformance").then((m) => ({
    default: m.TeamPerformance,
  }))
);
const GrowthMetrics = lazy(() =>
  import("./startup/GrowthMetrics").then((m) => ({
    default: m.GrowthMetrics,
  }))
);
const CampaignList = lazy(() =>
  import("./startup/CampaignList").then((m) => ({
    default: m.CampaignList,
  }))
);
const GoalsDashboardWidget = lazy(() =>
  import("./startup/GoalsDashboardWidget").then((m) => ({
    default: m.GoalsDashboardWidget,
  }))
);
const ApprovalWorkflow = lazy(() =>
  import("@/components/social/ApprovalWorkflow").then((m) => ({
    default: m.ApprovalWorkflow,
  }))
);
const CollaborationFeed = lazy(() =>
  import("./startup/CollaborationFeed").then((m) => ({
    default: m.CollaborationFeed,
  }))
);
const WorkflowAssignments = lazy(() =>
  import("./startup/WorkflowAssignments").then((m) => ({
    default: m.WorkflowAssignments,
  }))
);
const CustomerJourneyMap = lazy(() =>
  import("./startup/CustomerJourneyMap").then((m) => ({
    default: m.CustomerJourneyMap,
  }))
);
const RevenueAttribution = lazy(() =>
  import("./startup/RevenueAttribution").then((m) => ({
    default: m.RevenueAttribution,
  }))
);
const ContentCalendar = lazy(() =>
  import("@/components/calendar/ContentCalendar").then((m) => ({
    default: m.ContentCalendar,
  }))
);

export function StartupDashboard() {
  const agents = isGuest ? demoData?.agents || [] : [];
  const workflows = isGuest ? demoData?.workflows || [] : [];
  const kpis = isGuest ? (demoData?.kpis || {
    totalRevenue: 0,
    activeCustomers: 0,
    conversionRate: 0,
    teamProductivity: 0,
    taskCompletion: 0
  }) : {
    totalRevenue: 0,
    activeCustomers: 0,
    conversionRate: 0,
    teamProductivity: 0,
    taskCompletion: 0
  };
  const tasks = isGuest ? demoData?.tasks || [] : [];

  // Define businessId early before any queries that depend on it
  const businessId = !isGuest ? business?._id : null;

  const runDiagnostics = useMutation(api.initiatives.runPhase0Diagnostics);

  // Add: Growth metrics query
  const growthMetrics = useQuery(
    api.kpis.getGrowthMetrics,
    isGuest || !businessId ? undefined : { businessId, timeRange: "30d" }
  );

  // Use growth metrics or fallback to demo data
  const metrics = growthMetrics || (isGuest ? {
    summary: {
      totalRevenue: 45000,
      activeCustomers: 127,
      conversionRate: 3.2,
      avgCAC: 125,
      avgLTV: 850,
      ltvcacRatio: 6.8,
    },
    conversionFunnel: [
      { stage: "Visitors", count: 5000, rate: 100 },
      { stage: "Leads", count: 800, rate: 16 },
      { stage: "Qualified", count: 320, rate: 6.4 },
      { stage: "Customers", count: 160, rate: 3.2 },
    ],
    trends: [
      { date: "Week 1", revenue: 8500, cac: 135, customers: 22 },
      { date: "Week 2", revenue: 9200, cac: 128, customers: 25 },
      { date: "Week 3", revenue: 10100, cac: 122, customers: 28 },
      { date: "Week 4", revenue: 11200, cac: 118, customers: 31 },
      { date: "Week 5", revenue: 12000, cac: 125, customers: 35 },
    ],
    cacByChannel: [
      { channel: "Organic", cac: 45, customers: 50 },
      { channel: "Paid Social", cac: 180, customers: 35 },
      { channel: "Email", cac: 25, customers: 40 },
      { channel: "Referral", cac: 15, customers: 42 },
    ],
  } : null);

  const upgradeNudges = useQuery(
    api.telemetry.getUpgradeNudges,
    isGuest || !businessId ? undefined : { businessId }
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
    isGuest || !businessId ? undefined : { businessId }
  );

  const recentActivity = useQuery(
    api.activityFeed.getRecent,
    isGuest || !businessId ? undefined : { businessId, limit: 10 }
  );
const pendingApprovals = useQuery(
  api.approvals.getApprovalQueue,
  isGuest || !businessId ? undefined : { businessId, status: "pending" as const }
);

  // Fallback counters
  const approvalsCompleted7d =  isGuest ? 7 : 0; // adjust if backend exposes completed; placeholder for now
  const tasksCompleted7d = isGuest ? 12 : 0;
  const contributionsCount = (recentActivity && recentActivity !== "skip") ? recentActivity.length : (isGuest ? 8 : 0);

  // A/B summary using campaigns as proxy
  const campaigns = useQuery(
    api.emails.listCampaignsByBusiness,
    isGuest || !businessId ? undefined : { businessId }
  );
  const testsRunning = (campaigns && campaigns !== "skip") ? Math.min(campaigns.length, 3) : (isGuest ? 2 : 0);
  const lastUplift = isGuest ? 8.4 : (testsRunning > 0 ? 5.1 : 0);
  const winnersCount = isGuest ? 3 : (testsRunning > 1 ? 1 : 0);

  const teamPerformance = useQuery(
    api.telemetry.getTeamPerformanceMetrics,
    isGuest || !businessId ? undefined : { businessId, days: 7 }
  );

  const approveSelf = useMutation(api.approvals.approveSelf);
  const rejectSelf = useMutation(api.approvals.rejectSelf);

  const tierRank: Record<string, number> = { solopreneur: 1, startup: 2, sme: 3, enterprise: 4 };
  const hasTier = (required: keyof typeof tierRank) =>
    (tierRank[tier as keyof typeof tierRank] ?? 1) >= tierRank[required];

  const startupTier = "startup";
  const startupFlags = useQuery(api.featureFlags.getFeatureFlags, {});
  const startupAgents = useQuery(api.aiAgents.listRecommendedByTier, { tier: startupTier, limit: 3 });
  const startupAgentsEnabled = !!startupFlags?.find((f: any) => f.flagName === "startup_growth_panels")?.isEnabled;
  const nav = useNavigate();

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
  const [showExperimentCreator, setShowExperimentCreator] = useState(false);

  // Add queries for team onboarding and approval health
  const teamOnboarding = useQuery(
    api.teamOnboarding.listTeamOnboarding,
    isGuest || !businessId ? undefined : { businessId }
  );

  const approvalMetrics = useQuery(
    api.approvalAnalytics.getApprovalMetrics,
    isGuest || !businessId ? undefined : { businessId, timeRange: 7 }
  );

  const incompleteOnboarding = teamOnboarding?.filter((t: any) => !t.completedAt).length || 0;

  // Add queries for social media data
  const connectedAccounts = useQuery(
    api.socialIntegrations.listConnectedAccounts,
    isGuest || !businessId ? undefined : { businessId }
  );

  const upcomingPosts = useQuery(
    api.socialPosts.getUpcomingPosts,
    isGuest || !businessId ? undefined : { businessId, limit: 5 }
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
      {/* System Health Strip - Startup+ */}
      {!isGuest && business?._id && (
        <SystemHealthStrip businessId={business._id} isGuest={isGuest} />
      )}

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

      <div className="grid gap-6 lg:grid-cols-2">
        <LazyLoadErrorBoundary moduleName="Team Performance">
          <Suspense fallback={<div className="text-muted-foreground">Loading team performance...</div>}>
            <TeamPerformance />
          </Suspense>
        </LazyLoadErrorBoundary>

        <LazyLoadErrorBoundary moduleName="Workflow Assignments">
          <Suspense fallback={<div className="text-muted-foreground">Loading workflows...</div>}>
            <WorkflowAssignments />
          </Suspense>
        </LazyLoadErrorBoundary>
      </div>

      <LazyLoadErrorBoundary moduleName="Customer Journey Map">
        <Suspense fallback={<div className="text-muted-foreground">Loading customer journey...</div>}>
          <CustomerJourneyMap />
        </Suspense>
      </LazyLoadErrorBoundary>

      <LazyLoadErrorBoundary moduleName="Revenue Attribution">
        <Suspense fallback={<div className="text-muted-foreground">Loading revenue data...</div>}>
          <RevenueAttribution />
        </Suspense>
      </LazyLoadErrorBoundary>

      <LazyLoadErrorBoundary moduleName="Growth Metrics">
        <Suspense fallback={<div className="text-muted-foreground">Loading growth metrics...</div>}>
          <GrowthMetrics />
        </Suspense>
      </LazyLoadErrorBoundary>

      <LazyLoadErrorBoundary moduleName="Campaign List">
        <Suspense fallback={<div className="text-muted-foreground">Loading campaigns...</div>}>
          <CampaignList />
        </Suspense>
      </LazyLoadErrorBoundary>

      <LazyLoadErrorBoundary moduleName="Collaboration Feed">
        <Suspense fallback={<div className="text-muted-foreground">Loading collaboration feed...</div>}>
          <CollaborationFeed />
        </Suspense>
      </LazyLoadErrorBoundary>

      <LazyLoadErrorBoundary moduleName="Goals Dashboard">
        <Suspense fallback={<div className="text-muted-foreground">Loading goals...</div>}>
          <GoalsDashboardWidget />
        </Suspense>
      </LazyLoadErrorBoundary>

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
        <div className="mt-4 flex gap-2">
          {!isGuest && business?._id && (
            <Button onClick={() => setShowExperimentCreator(true)}>
              Create A/B Test
            </Button>
          )}
          {(!campaigns || campaigns === "skip" || campaigns.length === 0) && !isGuest && (
            <Button asChild variant="outline" size="sm">
              <a href="/analytics">View Analytics</a>
            </Button>
          )}
        </div>
      </section>

      {/* A/B Testing Experiments Dashboard */}
      {!isGuest && business?._id && (
        <section className="mb-6">
          <ExperimentDashboard businessId={business._id as Id<"businesses">} />
        </section>
      )}

      {/* Email Campaigns - Now using sub-component */}
      <Suspense fallback={<Card className="p-4"><CardContent className="text-sm text-muted-foreground">Loading campaigns…</CardContent></Card>}>
        <CampaignList campaigns={campaigns} onCreateCampaign={() => setShowComposer(true)} />
      </Suspense>

      {/* CRM Sync Status */}
      {!isGuest && business?._id && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3">CRM Integration</h2>
          <Card>
            <CardContent className="p-4">
              <Suspense fallback={<Skeleton className="h-20 w-full" />}>
                <CRMSyncCard businessId={business._id} />
              </Suspense>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Content Calendar Section */}
      {!isGuest && business?._id && (
        <section className="mb-6">
          <ContentCalendar 
            businessId={business._id} 
            userId={business._id}
          />
        </section>
      )}

      {/* Social Post Approval Workflow Section - NEW */}
      {!isGuest && business?._id && (
        <section className="mb-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    Social Post Approvals
                  </CardTitle>
                  <CardDescription>
                    Review and approve scheduled social media posts
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ApprovalWorkflow businessId={business._id as Id<"businesses">} />
            </CardContent>
          </Card>
        </section>
      )}

      {/* Social Media Hub Section - NEW */}

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
            businessId={business?._id!}
            onClose={() => setShowComposer(false)}
            onCreated={() => {
              setShowComposer(false);
              toast.success("Campaign scheduled");
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Experiment Creator Modal */}
      {business?._id && (
        <Dialog open={showExperimentCreator} onOpenChange={setShowExperimentCreator}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create A/B Test Experiment</DialogTitle>
            </DialogHeader>
            <ExperimentCreator
              businessId={business._id as Id<"businesses">}
              onComplete={() => {
                setShowExperimentCreator(false);
                toast.success("Experiment created successfully!");
              }}
              onCancel={() => setShowExperimentCreator(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {!isGuest && business?._id ? (
        <BrainDumpSection businessId={String(business._id)} />
      ) : null}

      {startupAgentsEnabled && Array.isArray(startupAgents) && startupAgents.length > 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {startupAgents.map(a => (
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

      {Array.isArray(startupAgents) && startupAgents.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {startupAgents.map(a => (
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

      {Array.isArray(startupAgents) && startupAgents[0] && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Agent Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {startupAgents[0].short_desc}
            </div>
            <div>
              <Button onClick={() => nav(`/agents?agent=${encodeURIComponent(startupAgents[0].agent_key)}`)}>
                Open {startupAgents[0].display_name}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CRMSyncCard({ businessId }: { businessId: string }) {
  const syncStatus = useQuery(
    api.crmIntegrations.getSyncStatus,
    { businessId: businessId as Id<"businesses"> }
  );

  if (!syncStatus) {
    return <div className="text-sm text-muted-foreground">Loading sync status...</div>;
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <LinkIcon className="h-5 w-5 text-muted-foreground" />
        <div>
          <div className="font-medium">
            {syncStatus.connections > 0 ? `${syncStatus.connections} CRM Connected` : "No CRM Connected"}
          </div>
          {syncStatus.lastSync && (
            <div className="text-xs text-muted-foreground">
              Last sync: {new Date(syncStatus.lastSync).toLocaleString()}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {syncStatus.pendingConflicts > 0 && (
          <Badge variant="destructive">
            {syncStatus.pendingConflicts} Conflicts
          </Badge>
        )}
        <Button size="sm" variant="outline" asChild>
          <a href="/crm">Manage</a>
        </Button>
      </div>
    </div>
  );
}

export default StartupDashboard;