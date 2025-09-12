import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation, useAction } from "convex/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Input } from "@/components/ui/input";
import { LogOut, MessageSquare, BarChart3, Bot, Brain, TrendingUp, Building2, Loader2, Settings, Plus, Search } from "lucide-react";
import type { FullAppInspectionReport } from "@/convex/inspector";
import { SolopreneurDashboardHeader } from "@/components/dashboards/SolopreneurDashboard";
import { StartupDashboardHeader } from "@/components/dashboards/StartupDashboard";
import { SmeDashboardHeader } from "@/components/dashboards/SmeDashboard";
import { EnterpriseDashboardHeader } from "@/components/dashboards/EnterpriseDashboard";
import { Sidebar } from "@/components/layout/Sidebar";
import { StatCard } from "@/components/dashboard/StatCard";
import { AgentRow } from "@/components/dashboard/rows/AgentRow";
import { WorkflowRow } from "@/components/dashboard/rows/WorkflowRow";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, XCircle, Flag, Clock } from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMemo } from "react";

// Add: simple Dev Debug Panel component (rendered only in dev or with ?debug=1)
function DevDebugPanel(props: { data: Record<string, unknown> }) {
  // ... keep existing code (none here, this is a new component)
  const entries = Object.entries(props.data || {});
  if (!entries.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 w-[320px] max-h-[50vh] overflow-auto rounded-lg border border-muted-foreground/20 bg-background/95 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Dev Debug</div>
      <pre className="whitespace-pre-wrap break-words text-xs leading-snug">
        {JSON.stringify(props.data, null, 2)}
      </pre>
      <div className="mt-2 text-[10px] text-muted-foreground">Tip: hide with ?debug=0</div>
    </div>
  );
}

function JourneyBand({ initiative }: { initiative: any | null | undefined }) {
  const phaseRaw = (initiative as any)?.phase ?? "not started";
  const phases = ["not started", "planning", "execution", "review", "complete"] as const;
  const currentIndex = Math.max(0, phases.indexOf(phaseRaw as any));
  const percent = Math.round((currentIndex / (phases.length - 1)) * 100);

  return (
    <div className="rounded-lg border bg-white dark:bg-slate-900 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Initiative Journey</div>
          <div className="mt-1 flex items-center gap-2">
            <div className="text-lg font-semibold capitalize">{phaseRaw}</div>
            <Badge variant="secondary">{percent}%</Badge>
          </div>
        </div>
        <div className="w-48 md:w-64">
          <div className="h-2 w-full rounded bg-muted">
            <div className="h-2 rounded bg-foreground" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
        {phases.map((p, i) => (
          <div key={p} className={`flex items-center gap-1 ${i <= currentIndex ? "text-foreground" : ""}`}>
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                i <= currentIndex ? "bg-foreground" : "bg-muted-foreground/30"
              }`}
            />
            <span className="capitalize">{p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Add: Solopreneur Quick Actions (minimal - Send Newsletter)
function SolopreneurQuickActions({
  businessId,
  defaultFrom,
}: {
  businessId: string;
  defaultFrom: string;
}) {
  const sendTestEmail = useAction(api.emailsActions.sendTestEmail);

  const [open, setOpen] = useState(false);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("Weekly newsletter");
  const [preview, setPreview] = useState("This week's highlights");
  const [from, setFrom] = useState(defaultFrom);

  const onSend = async () => {
    try {
      if (!to) {
        toast("Please enter a recipient email");
        return;
      }
      await sendTestEmail({
        from,
        to,
        subject,
        previewText: preview || undefined,
        businessId: businessId as any,
        blocks: [
          { type: "text", content: "Hello! Here are this week's highlights." },
          { type: "button", label: "Read more", url: "https://pikar.ai" },
          { type: "footer", includeUnsubscribe: true },
        ],
      });
      toast("Email sent");
      setOpen(false);
    } catch (e: any) {
      toast(`Failed to send: ${e?.message || String(e)}`);
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-sm">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="default">Send Newsletter</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send test newsletter</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-1">
                <label className="text-sm">From</label>
                <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Acme <news@acme.com>" />
              </div>
              <div className="grid gap-1">
                <label className="text-sm">To</label>
                <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="you@example.com" />
              </div>
              <div className="grid gap-1">
                <label className="text-sm">Subject</label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Weekly newsletter" />
              </div>
              <div className="grid gap-1">
                <label className="text-sm">Preview text</label>
                <Input value={preview} onChange={(e) => setPreview(e.target.value)} placeholder="This week's highlights" />
              </div>
              <div className="grid gap-1">
                <label className="text-sm">Body (auto-generated from blocks)</label>
                <Textarea value={"Hello! Here are this week's highlights.\n\n[Read more]"} disabled />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={onSend}>Send</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Stubs for other quick actions to be implemented later without breaking structure */}
        <Button size="sm" variant="secondary" disabled>Post to Social (soon)</Button>
        <Button size="sm" variant="secondary" disabled>Check Analytics (soon)</Button>
      </CardContent>
    </Card>
  );
}

// Add: Today's Focus (Top 3 Tasks)
function TodaysFocus({ businessId }: { businessId: string }) {
  const tasks = useQuery(api.tasks.topThreeForBusiness, { businessId: businessId as any });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Today's Focus</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!tasks?.length ? (
          <div className="text-sm text-muted-foreground">No tasks yet. Create your first focus task to get started.</div>
        ) : (
          tasks.map((t: any) => (
            <div key={t._id} className="flex items-start justify-between border rounded-md p-3">
              <div>
                <div className="font-medium">{t.title}</div>
                {t.description ? <div className="text-xs text-muted-foreground mt-1">{t.description}</div> : null}
              </div>
              <div className="text-xs px-2 py-1 rounded bg-secondary">
                {t.urgent ? "Urgent" : t.priority}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// Add: Recent Activity (Notifications)
function RecentActivity({ userId }: { userId: string }) {
  const notifications = useQuery(api.notifications.getUserNotifications, { userId: userId as any, limit: 5 });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!notifications?.length ? (
          <div className="text-sm text-muted-foreground">No recent activity yet.</div>
        ) : (
          notifications.map((n: any) => (
            <div key={n._id} className="flex items-start justify-between border rounded-md p-3">
              <div>
                <div className="font-medium">{n.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{n.message}</div>
              </div>
              <div className="text-xs px-2 py-1 rounded bg-secondary">
                {n.type}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// Add: Dev-only seed button (?debug=1)
function DevSeedButton() {
  const seedForCurrentUser = useAction(api.seed.seedForCurrentUser);
  const [loading, setLoading] = useState(false);

  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const show = params.get("debug") === "1";

  if (!show) return null;
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          setLoading(true);
          await seedForCurrentUser({});
          toast("Seeded demo data");
        } catch (e: any) {
          toast(`Seed failed: ${e?.message || String(e)}`);
        } finally {
          setLoading(false);
        }
      }}
      disabled={loading}
    >
      {loading ? "Seeding..." : "Seed Demo Data"}
    </Button>
  );
}

export default function Dashboard() {
  const { isLoading: authLoading, isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();

  // Deduplicate user query: use a single currentUserDoc for all downstream usages
  const currentUserDoc = useQuery(api.users.currentUser);

  // Gate business queries by auth to avoid unauthenticated errors
  const currentBusiness = useQuery(
    api.businesses.currentUserBusiness,
    isAuthenticated ? {} : "skip"
  );
  const businesses = useQuery(
    api.businesses.getByOwner,
    isAuthenticated ? {} : "skip"
  );

  const agents = useQuery(
    api.aiAgents.getByBusiness,
    currentBusiness ? { businessId: currentBusiness._id } : "skip" // use "skip" per Convex types
  );
  const workflows = useQuery(
    api.workflows.getByBusiness,
    currentBusiness ? { businessId: currentBusiness._id } : "skip" // use "skip" per Convex types
  );
  const initiative = useQuery(
    api.initiatives.getByBusiness,
    currentBusiness ? { businessId: currentBusiness._id } : "skip" // use "skip" per Convex types
  );
  const diagnostics = useQuery(
    api.diagnostics.getLatest,
    currentBusiness ? { businessId: currentBusiness._id } : "skip" // use "skip" per Convex types
  );

  // Add helper selectors near existing user/business context hooks
  const pendingApprovals = useQuery(
    api.approvals.pendingByUser,
    currentUserDoc && currentBusiness
      ? { userId: currentUserDoc._id, businessId: currentBusiness._id, limit: 5 }
      : "skip"
  );

  const approveApproval = useMutation(api.approvals.approve);
  const rejectApproval = useMutation(api.approvals.reject);

  const topTasks = useQuery(
    api.tasks.topThreeForBusiness,
    currentBusiness ? { businessId: currentBusiness._id } : "skip"
  );

  const kpisLatest = useQuery(
    api.kpis.latestForBusiness,
    currentBusiness ? { businessId: currentBusiness._id } : "skip"
  );

  const upgradeNudges = useQuery(
    api.telemetry.getUpgradeNudges,
    currentBusiness ? { businessId: currentBusiness._id } : "skip"
  );

  // Inspector state
  const [inspectionOpen, setInspectionOpen] = useState(false);
  const [isRunningInspection, setIsRunningInspection] = useState(false);
  const [inspectionReport, setInspectionReport] = useState<FullAppInspectionReport | null>(null);
  const runInspection = useAction(api.inspector.runInspection);

  // Queries for Sprint 1 sections (keep hook order stable; gate by "skip")
  const businessIdForQueries =
    currentBusiness ? { businessId: currentBusiness._id } : "skip";
  const kpi = useQuery(api.kpis.getSnapshot, businessIdForQueries);
  const focusTasks = useQuery(api.tasks.listTopFocus, businessIdForQueries);
  const nudges = useQuery(api.nudges.getUpgradeNudges, businessIdForQueries);
  const updateTaskStatus = useMutation(api.tasks.updateStatus);

  // Additional queries/mutations for compact widgets (gate with "skip" via existing variable)
  const approvals = useQuery(api.approvals.getApprovalQueue, businessIdForQueries);
  const flags = useQuery(api.featureFlags.getFeatureFlags, businessIdForQueries);
  const telemetryAnalytics = useQuery(api.telemetry.getEventAnalytics, businessIdForQueries);

  const toggleFlag = useMutation(api.featureFlags.toggleFeatureFlag);
  const processApproval = useMutation(api.approvals.processApproval);
  const trackEventMutation = useMutation(api.telemetry.trackEvent);

  // Due Soon steps query (gate with "skip")
  const dueSoonSteps = useQuery(
    api.workflowAssignments.getStepsDueSoon,
    currentUserDoc ? { userId: currentUserDoc._id, hoursAhead: 48 } : "skip"
  );

  // Sidebar tier-specific items
  const tier = (currentBusiness as any)?.tier as string | undefined;
  const baseItems: Array<{ label: string; icon: React.ComponentType<any>; to: string }> = [
    { label: "Dashboard", icon: BarChart3, to: "/dashboard" },
    { label: "AI Agents", icon: Bot, to: "/agents" },
    { label: "Workflows", icon: Brain, to: "/workflows" },
    { label: "Analytics", icon: BarChart3, to: "/analytics" },
  ];
  const tierExtras: Record<string, Array<{ label: string; icon: React.ComponentType<any>; to: string }>> = {
    solopreneur: [
      { label: "Initiatives", icon: TrendingUp, to: "/initiatives" },
    ],
    startup: [
      { label: "Initiatives", icon: TrendingUp, to: "/initiatives" },
      { label: "Business", icon: Building2, to: "/business" },
    ],
    sme: [
      { label: "Initiatives", icon: TrendingUp, to: "/initiatives" },
      { label: "Business", icon: Building2, to: "/business" },
    ],
    enterprise: [
      { label: "Initiatives", icon: TrendingUp, to: "/initiatives" },
      { label: "Business", icon: Building2, to: "/business" },
    ],
  };
  const sidebarItems = [
    ...baseItems,
    ...((tier && tierExtras[tier]) || []),
  ];

  // Email campaigns: queries & actions
  const campaigns = useQuery(
    api.emails.listCampaignsByBusiness,
    currentBusiness ? { businessId: currentBusiness._id } : "skip"
  );
  const sendTestEmail = useAction(api.emailsActions.sendTestEmail);
  const createCampaign = useMutation(api.emails.createCampaign);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailFrom, setEmailFrom] = useState((user as any)?.email || "no-reply@yourdomain.com");
  const [emailPreview, setEmailPreview] = useState("");
  const [recipientsRaw, setRecipientsRaw] = useState("");
  // Add schedule datetime state for email campaigns
  const [scheduledAt, setScheduledAt] = useState("");
  const tz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const [blocks, setBlocks] = useState<Array<any>>([
    { type: "text", content: "Hi there," },
    { type: "text", content: "Here is an update from our team." },
    { type: "button", label: "Learn more", url: "https://example.com" },
    { type: "footer", includeUnsubscribe: true },
  ]);

  const addBlock = (type: "text" | "button" | "footer") => {
    if (type === "text") setBlocks((b) => [...b, { type: "text", content: "New text..." }]);
    if (type === "button") setBlocks((b) => [...b, { type: "button", label: "Click me", url: "https://example.com" }]);
    if (type === "footer") setBlocks((b) => [...b, { type: "footer", includeUnsubscribe: true }]);
  };
  const moveBlock = (i: number, dir: -1 | 1) => {
    setBlocks((arr) => {
      const copy = [...arr];
      const j = i + dir;
      if (j < 0 || j >= copy.length) return copy;
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
      return copy;
    });
  };
  const removeBlock = (i: number) => setBlocks((arr) => arr.filter((_, idx) => idx !== i));

  // Add mutations for seeding
  const seedTasks = useMutation(api.tasks.seedDemoTasksForBusiness);
  const seedKpis = useMutation(api.kpis.seedDemoKpisSnapshot);

  // Redirects
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && businesses !== undefined && (businesses as any[]).length === 0) {
      navigate("/onboarding");
    }
  }, [authLoading, isAuthenticated, businesses, navigate]);

  if (authLoading || currentBusiness === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Only treat null as "no business"; don't blank the page during loading
  if (!isAuthenticated) {
    return null;
  }

  const stats = [
    {
      title: "Active Agents",
      value: agents?.filter((a: any) => a.status === "active").length ?? 0,
      icon: Bot,
      description: "AI agents running",
    },
    {
      title: "Workflows",
      value: workflows?.filter((w: any) => w.status === "active").length ?? 0,
      icon: Brain,
      description: "Active workflows",
    },
    {
      title: "Success Rate",
      value:
        agents && agents.length > 0
          ? Math.round(
              agents.reduce((acc: number, a: any) => acc + (a.metrics?.successRate ?? 0), 0) /
                agents.length
            )
          : 0,
      icon: TrendingUp,
      description: "Average success rate",
      suffix: "%",
    },
    {
      title: "Total Runs",
      value: agents?.reduce((acc: number, a: any) => acc + (a.metrics?.totalRuns ?? 0), 0) ?? 0,
      icon: BarChart3,
      description: "Total executions",
    },
  ];

  const isHelpEnabled = Array.isArray(flags) && flags.some((f: any) => f.flagName === "help_chat" && !!f.isEnabled);

  const handleRunInspection = async () => {
    setIsRunningInspection(true);
    try {
      const result = await runInspection({});
      setInspectionReport(result as FullAppInspectionReport);
    } finally {
      setIsRunningInspection(false);
    }
  };

  const downloadReport = () => {
    if (!inspectionReport) return;
    const blob = new Blob([JSON.stringify(inspectionReport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inspection-report-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const label = (status || "").toUpperCase();
    return <Badge>{label}</Badge>;
  };

  const renderTodayFocus = () => {
    if (topTasks === undefined) return null;
    if (topTasks === null || topTasks.length === 0) {
      return (
        <div className="rounded-lg border p-4">
          <div className="font-medium">Today's Focus</div>
          <div className="text-sm text-muted-foreground mt-1">No tasks yet.</div>
        </div>
      );
    }
    return (
      <div className="rounded-lg border p-4">
        <div className="font-medium mb-2">Today's Focus</div>
        <ul className="space-y-2">
          {topTasks.map((t: any) => (
            <li key={t._id} className="flex items-start justify-between">
              <div>
                <div className="font-medium">{t.title}</div>
                {t.description ? (
                  <div className="text-sm text-muted-foreground">{t.description}</div>
                ) : null}
                <div className="text-xs mt-1">
                  {t.urgent ? "Urgent • " : ""}
                  Priority: {t.priority}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderPerformanceSnapshot = () => {
    if (kpisLatest === undefined) return null;
    const k = kpisLatest;
    return (
      <div className="rounded-lg border p-4">
        <div className="font-medium mb-3">Performance Snapshot</div>
        {k ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Visitors" value={k.visitors} delta={k.visitorsDelta} />
            <KpiCard label="Subscribers" value={k.subscribers} delta={k.subscribersDelta} />
            <KpiCard label="Engagement" value={`${k.engagement}%`} delta={k.engagementDelta} />
            <KpiCard label="Revenue" value={`$${k.revenue.toLocaleString()}`} delta={k.revenueDelta} />
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No KPI data yet.</div>
        )}
      </div>
    );
  };

  function KpiCard({ label, value, delta }: { label: string; value: any; delta?: number }) {
    const positive = (delta ?? 0) >= 0;
    return (
      <div className="rounded-md border p-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-semibold mt-1">{value ?? "—"}</div>
        <div className={`text-xs mt-1 ${positive ? "text-emerald-600" : "text-rose-600"}`}>
          {delta !== undefined ? `${positive ? "▲" : "▼"} ${Math.abs(delta)}%` : "—"}
        </div>
      </div>
    );
  }

  const renderApprovals = () => {
    if (pendingApprovals === undefined) return null;
    if (!pendingApprovals || pendingApprovals.length === 0) {
      return (
        <div className="rounded-lg border p-4">
          <div className="font-medium">Pending Approvals</div>
          <div className="text-sm text-muted-foreground mt-1">Nothing pending.</div>
        </div>
      );
    }
    return (
      <div className="rounded-lg border p-4">
        <div className="font-medium mb-2">Pending Approvals</div>
        <ul className="space-y-2">
          {pendingApprovals.map((r: any) => (
            <li key={r._id} className="flex items-center justify-between">
              <div>
                <div className="font-medium">{r.priority.toUpperCase()} • {r.status}</div>
                <div className="text-xs text-muted-foreground">Workflow Step: {String(r.stepId)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-2 py-1 rounded bg-emerald-600 text-white text-xs"
                  onClick={async () => {
                    try {
                      await approveApproval({ id: r._id, approvedBy: currentUserDoc!._id });
                      toast.success("Approved");
                    } catch (e: any) {
                      toast.error(e?.message ?? "Approve failed");
                    }
                  }}
                >
                  Approve
                </button>
                <button
                  className="px-2 py-1 rounded bg-rose-600 text-white text-xs"
                  onClick={async () => {
                    try {
                      await rejectApproval({ id: r._id, rejectedBy: currentUserDoc!._id });
                      toast.success("Rejected");
                    } catch (e: any) {
                      toast.error(e?.message ?? "Reject failed");
                    }
                  }}
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderUpgradeNudge = () => {
    // Behind implicit flag: only show if backend says so
    if (upgradeNudges === undefined || !upgradeNudges?.showBanner) return null;
    const first = upgradeNudges.nudges[0];
    return (
      <div className="rounded-lg border p-4 bg-amber-50">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm">
            <span className="font-medium">Upgrade</span>: {first?.message}
          </div>
          <a
            href="#"
            onClick={() =>
              toast.info("Upgrade flow coming soon")
            }
            className="text-xs underline"
          >
            Learn more
          </a>
        </div>
      </div>
    );
  };

  const renderTierHeader = () => {
    const tier = (currentBusiness as any)?.tier as string | undefined;
    switch (tier) {
      case "solopreneur":
        return <SolopreneurDashboardHeader />;
      case "startup":
        return <StartupDashboardHeader />;
      case "sme":
        return <SmeDashboardHeader />;
      case "enterprise":
        return <EnterpriseDashboardHeader />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Sidebar extracted */}
      <Sidebar
        items={sidebarItems}
        userDisplay={(user as any)?.name || (user as any)?.email || "User"}
        planLabel={(tier || "Plan").toString().charAt(0).toUpperCase() + (tier || "Plan").toString().slice(1)}
        onNavigate={(to) => navigate(to)}
        onLogout={() => signOut()}
      />

      {/* Main content shifted for sidebar on md+ */}
      <div className="md:pl-72 min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8 space-y-6">
          {renderTierHeader()}

          {/* Header with subtle entrance animation */}
          <motion.div
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22, mass: 0.7 }}
          >
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back! Here's what's happening with {(currentBusiness?.name ?? "your business")}.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/business")}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button onClick={() => navigate("/agents")}>
                <Plus className="h-4 w-4 mr-2" />
                New Agent
              </Button>
            </div>
          </motion.div>

          {/* Stats Grid with container/child stagger */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.08, delayChildren: 0.05 },
              },
            }}
          >
            {stats.map((stat) => (
              <motion.div
                key={stat.title}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 24 } },
                }}
                whileHover={{ y: -2 }}
              >
                <StatCard
                  title={stat.title}
                  value={stat.value}
                  description={stat.description}
                  suffix={stat.suffix}
                  icon={stat.icon}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Today's Focus */}
          {renderTodayFocus()}

          {/* Compact action row */}
          <div className="flex items-center justify-end -mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const business = currentBusiness;
                  if (!business) {
                    toast("No business selected");
                    return;
                  }
                  await seedKpis({
                    businessId: business._id,
                    visitors: 1240,
                    subscribers: 86,
                    engagement: 37,
                    revenue: 2150,
                    visitorsDelta: 9,
                    subscribersDelta: 6,
                    engagementDelta: 4,
                    revenueDelta: 12,
                  } as any);
                  toast("Seeded KPI snapshot");
                } catch {
                  toast("Failed to seed KPIs");
                }
              }}
            >
              Seed KPIs
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={async () => {
                try {
                  const business = currentBusiness;
                  if (!business) {
                    toast("No business selected");
                    return;
                  }
                  await seedTasks({ businessId: business._id, count: 3 } as any);
                  toast("Seeded demo tasks");
                } catch {
                  toast("Failed to seed tasks");
                }
              }}
            >
              Seed Tasks
            </Button>
          </div>

          {/* Performance Snapshot */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
            <StatCard
              title="Visitors"
              value={kpi?.visitors ?? 0}
              delta={kpi?.visitorsDelta ?? 0}
              suffix=""
            />
            <StatCard
              title="Subscribers"
              value={kpi?.subscribers ?? 0}
              delta={kpi?.subscribersDelta ?? 0}
              suffix=""
            />
            <StatCard
              title="Engagement"
              value={kpi?.engagement ?? 0}
              delta={kpi?.engagementDelta ?? 0}
              suffix="%"
            />
            <StatCard
              title="Revenue"
              value={kpi?.revenue ?? 0}
              delta={kpi?.revenueDelta ?? 0}
              prefix="$"
            />
          </div>

          {/* Upgrade Nudges Banner */}
          {Array.isArray(nudges) && nudges.length > 0 && (
            <div className="mb-4 rounded-lg border bg-gradient-to-r from-amber-50 to-orange-50 p-4 text-sm">
              <div className="font-medium mb-1">You're growing fast</div>
              <ul className="list-disc pl-5 space-y-1">
                {nudges.map((n) => (
                  <li key={n.key}>
                    {n.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Initiative Journey moved below greeting & stats (already positioned here) */}
          <JourneyBand initiative={initiative} />

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="agents">Agents</TabsTrigger>
              <TabsTrigger value="workflows">Workflows</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest updates from your AI agents</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <motion.div
                      className="space-y-4"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      variants={{
                        hidden: { opacity: 0, y: 8 },
                        show: { opacity: 1, y: 0 },
                      }}
                    >
                      {agents?.slice(0, 5).map((agent: any) => (
                        <motion.div
                          key={agent._id}
                          variants={{
                            hidden: { opacity: 0, y: 8 },
                            show: { opacity: 1, y: 0 },
                          }}
                        >
                          <div className="flex items-center space-x-4">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                agent.status === "active"
                                  ? "bg-green-500"
                                  : agent.status === "training"
                                  ? "bg-yellow-500"
                                  : "bg-gray-500"
                              }`}
                            />
                            {((agent.metrics?.successRate ?? 0) >= 60) ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium">{agent.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(agent.metrics?.totalRuns ?? 0)} runs • {(agent.metrics?.successRate ?? 0)}% success
                              </p>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {agent.metrics?.lastRun
                                ? new Date(agent.metrics.lastRun).toLocaleDateString()
                                : "Never"}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      {(!agents || agents.length === 0) && (
                        <motion.div
                          className="text-center py-8"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ type: "spring", stiffness: 260, damping: 22 }}
                        >
                          <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-sm text-muted-foreground">No agents created yet</p>
                          <Button onClick={() => navigate("/agents")}>
                            Create Your First Agent
                          </Button>
                        </motion.div>
                      )}
                    </motion.div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common tasks and shortcuts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <motion.div
                      className="grid grid-cols-2 gap-4"
                      initial="hidden"
                      animate="show"
                      variants={{
                        hidden: { opacity: 0 },
                        show: {
                          opacity: 1,
                          transition: { staggerChildren: 0.07, delayChildren: 0.05 },
                        },
                      }}
                    >
                      {[
                        { icon: Bot, label: "New Agent", to: "/agents" },
                        { icon: Brain, label: "New Workflow", to: "/workflows" },
                        { icon: BarChart3, label: "View Analytics", to: "/analytics" },
                        { icon: Building2, label: "Business Settings", to: "/business" },
                      ].map((qa) => (
                        <motion.div
                          key={qa.label}
                          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                          whileHover={{ y: -2 }}
                        >
                          <Button
                            variant="outline"
                            className="h-24 flex-col"
                            onClick={() => navigate(qa.to)}
                          >
                            <qa.icon className="h-5 w-5 mb-2" />
                            <span className="text-sm">{qa.label}</span>
                          </Button>
                        </motion.div>
                      ))}
                      {isHelpEnabled && (
                        <motion.div
                          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                          whileHover={{ y: -2 }}
                        >
                          <Button
                            variant="outline"
                            className="h-24 flex-col"
                            onClick={() => {
                              toast("Connecting you to support…");
                            }}
                          >
                            <MessageSquare className="h-5 w-5 mb-2" />
                            <span className="text-sm">Get Help</span>
                          </Button>
                        </motion.div>
                      )}
                    </motion.div>
                  </CardContent>
                </Card>

                {/* Initiative Status */}
                <div className="grid grid-cols-1 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Initiative Status</CardTitle>
                      <CardDescription>Current phase for your primary initiative</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Phase</div>
                        <div className="text-lg font-semibold capitalize">
                          {(initiative as any)?.phase || "not started"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => navigate("/initiatives")}>
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Compact widgets row: Approvals, Feature Flags, Telemetry Debug */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* Pending Approvals */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Pending Approvals
                    </CardTitle>
                    <CardDescription>Quick review of items awaiting action</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(approvals ?? []).length === 0 ? (
                      <div className="text-sm text-muted-foreground">No pending items</div>
                    ) : (
                      (approvals ?? []).slice(0, 5).map((a: any) => (
                        <div key={a._id} className="flex items-center justify-between rounded-md border p-2">
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{a.comments || "Approval Request"}</div>
                            <div className="text-xs text-muted-foreground">
                              Priority: <span className="capitalize">{a.priority}</span> • Status: {a.status}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  await processApproval({ approvalId: a._id, action: "approve" });
                                  toast("Approved");
                                } catch (e) {
                                  toast("Failed to approve");
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
                                  await processApproval({ approvalId: a._id, action: "reject" });
                                  toast("Rejected");
                                } catch (e) {
                                  toast("Failed to reject");
                                }
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Feature Flags */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Flag className="h-4 w-4 text-amber-600" />
                      Feature Flags
                    </CardTitle>
                    <CardDescription>Toggle features scoped to this business</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(flags ?? []).length === 0 ? (
                      <div className="text-sm text-muted-foreground">No flags configured</div>
                    ) : (
                      (flags ?? []).slice(0, 6).map((f: any) => (
                        <div key={f._id} className="flex items-center justify-between rounded-md border p-2">
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{f.flagName}</div>
                            <div className="text-xs text-muted-foreground">
                              {f.rolloutPercentage}% rollout
                              {f.conditions?.userTier && (
                                <> • Users: {Array.isArray(f.conditions.userTier) ? f.conditions.userTier.join(", ") : ""}</>
                              )}
                              {f.conditions?.businessTier && (
                                <> • Tiers: {Array.isArray(f.conditions.businessTier) ? f.conditions.businessTier.join(", ") : ""}</>
                              )}
                            </div>
                          </div>
                          <Switch
                            checked={!!f.isEnabled}
                            onCheckedChange={async () => {
                              try {
                                await toggleFlag({ flagId: f._id });
                                toast(`Flag ${f.isEnabled ? "disabled" : "enabled"}`);
                              } catch (e) {
                                toast("Failed to toggle flag");
                              }
                            }}
                          />
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Telemetry Debug */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Telemetry Debug</CardTitle>
                    <CardDescription>Quick stats and a test event logger</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-md border p-2">
                        <div className="text-xl font-semibold">
                          {telemetryAnalytics?.totalEvents ?? 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Events</div>
                      </div>
                      <div className="rounded-md border p-2">
                        <div className="text-xl font-semibold">
                          {telemetryAnalytics?.uniqueUsers ?? 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Users</div>
                      </div>
                      <div className="rounded-md border p-2">
                        <div className="text-xl font-semibold">
                          {telemetryAnalytics?.uniqueSessions ?? 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Sessions</div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          const business = currentBusiness;
                          if (!business) {
                            toast("No business selected");
                            return;
                          }
                          await trackEventMutation({
                            businessId: business._id,
                            eventName: "debug_click",
                            eventData: { location: "dashboard_telemetry_debug" },
                          } as any);
                          toast("Logged test event");
                        } catch (e) {
                          toast("Failed to log event");
                        }
                      }}
                    >
                      Log Test Event
                    </Button>
                  </CardContent>
                </Card>

                {/* Due Soon list */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      Due Soon
                    </CardTitle>
                    <CardDescription>Steps due in the next 48 hours</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(dueSoonSteps ?? []).length === 0 ? (
                      <div className="text-sm text-muted-foreground">Nothing due soon</div>
                    ) : (
                      (dueSoonSteps ?? []).slice(0, 5).map((s: any) => (
                        <div key={s._id} className="flex items-center justify-between rounded-md border p-2">
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{s.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {s.workflow?.name ? `${s.workflow.name} • ` : ""}
                              <span className="capitalize">{s.status?.replace("_", " ")}</span>
                              {s.dueDate && (
                                <>
                                  {" • Due "}
                                  {new Date(s.dueDate).toLocaleString()}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Agents tab: animate list */}
            <TabsContent value="agents">
              <Card>
                <CardHeader>
                  <CardTitle>AI Agents</CardTitle>
                  <CardDescription>Manage your AI-powered automation agents</CardDescription>
                </CardHeader>
                <CardContent>
                  <motion.div
                    className="space-y-4"
                    initial="hidden"
                    animate="show"
                    variants={{ hidden: { opacity: 1 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
                  >
                    {agents?.map((agent: any) => (
                      <motion.div key={agent._id} variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
                        <AgentRow agent={agent} />
                      </motion.div>
                    ))}
                    {(!agents || agents.length === 0) && (
                      <motion.div
                        className="text-center py-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground mb-4">No agents created yet</p>
                        <Button onClick={() => navigate("/agents")}>Create Your First Agent</Button>
                      </motion.div>
                    )}
                  </motion.div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Workflows tab: animate list */}
            <TabsContent value="workflows">
              <Card>
                <CardHeader>
                  <CardTitle>Workflows</CardTitle>
                  <CardDescription>Automated business processes and agent orchestration</CardDescription>
                </CardHeader>
                <CardContent>
                  <motion.div
                    className="space-y-4"
                    initial="hidden"
                    animate="show"
                    variants={{ hidden: { opacity: 1 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
                  >
                    {workflows?.map((workflow: any) => (
                      <motion.div key={workflow._id} variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
                        <WorkflowRow workflow={workflow} />
                      </motion.div>
                    ))}
                    {(!workflows || workflows.length === 0) && (
                      <motion.div
                        className="text-center py-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground mb-4">No workflows created yet</p>
                        <Button onClick={() => navigate("/workflows")}>Create Your First Workflow</Button>
                      </motion.div>
                    )}
                  </motion.div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics tab remains unchanged */}
            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>Performance insights and metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">Analytics dashboard coming soon</p>
                    <Button onClick={() => navigate("/analytics")}>View Full Analytics</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Email Campaigns (Designer + Scheduler) */}
          <Card>
            <CardHeader>
              <CardTitle>Email Campaigns</CardTitle>
              <CardDescription>Design, test, and schedule emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-muted-foreground">
                  Recent: {(campaigns ?? []).length} scheduled/sent
                </div>
                <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
                  <DialogTrigger asChild>
                    <Button>New Campaign</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create Email Campaign</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Editor */}
                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <Label>From</Label>
                          <Input value={emailFrom} onChange={(e) => setEmailFrom(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                          <Label>Subject</Label>
                          <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                          <Label>Preview Text</Label>
                          <Input value={emailPreview} onChange={(e) => setEmailPreview(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                          <Label>Recipients (comma-separated)</Label>
                          <Textarea
                            value={recipientsRaw}
                            onChange={(e) => setRecipientsRaw(e.target.value)}
                            placeholder="alice@example.com, bob@example.com"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="grid gap-2">
                            <Label>Schedule (local)</Label>
                            <Input
                              type="datetime-local"
                              value={scheduledAt}
                              onChange={(e) => setScheduledAt(e.target.value)}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>Timezone</Label>
                            <Input value={tz} readOnly />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Blocks</Label>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => addBlock("text")}>Add Text</Button>
                              <Button size="sm" variant="outline" onClick={() => addBlock("button")}>Add Button</Button>
                              <Button size="sm" variant="outline" onClick={() => addBlock("footer")}>Add Footer</Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {blocks.map((b, i) => (
                              <div key={i} className="rounded-md border p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="text-xs uppercase tracking-wide text-muted-foreground">{b.type}</div>
                                  <div className="flex gap-1">
                                    <Button size="icon" variant="ghost" onClick={() => moveBlock(i, -1)}>↑</Button>
                                    <Button size="icon" variant="ghost" onClick={() => moveBlock(i, 1)}>↓</Button>
                                    <Button size="icon" variant="ghost" onClick={() => removeBlock(i)}>✕</Button>
                                  </div>
                                </div>
                                {b.type === "text" && (
                                  <Textarea
                                    value={b.content ?? ""}
                                    onChange={(e) =>
                                      setBlocks((arr) => arr.map((x, idx) => (idx === i ? { ...x, content: e.target.value } : x)))
                                    }
                                  />
                                )}
                                {b.type === "button" && (
                                  <div className="grid grid-cols-2 gap-2">
                                    <Input
                                      placeholder="Label"
                                      value={b.label ?? ""}
                                      onChange={(e) =>
                                        setBlocks((arr) => arr.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)))
                                      }
                                    />
                                    <Input
                                      placeholder="https://example.com"
                                      value={b.url ?? ""}
                                      onChange={(e) =>
                                        setBlocks((arr) => arr.map((x, idx) => (idx === i ? { ...x, url: e.target.value } : x)))
                                      }
                                    />
                                  </div>
                                )}
                                {b.type === "footer" && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Switch
                                      checked={!!b.includeUnsubscribe}
                                      onCheckedChange={(val) =>
                                        setBlocks((arr) => arr.map((x, idx) => (idx === i ? { ...x, includeUnsubscribe: !!val } : x)))
                                      }
                                    />
                                    <span>Include unsubscribe link</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Preview */}
                      <div className="space-y-3">
                        <div className="rounded-md border p-3">
                          <div className="text-sm text-muted-foreground mb-2">Preview</div>
                          <div className="space-y-3">
                            <div className="text-sm"><span className="font-medium">From:</span> {emailFrom}</div>
                            <div className="text-sm"><span className="font-medium">Subject:</span> {emailSubject}</div>
                            <div className="text-xs text-muted-foreground">{emailPreview}</div>
                            <div className="h-px bg-border" />
                            <div className="prose prose-sm max-w-none">
                              {blocks.map((b, i) => (
                                <div key={i} className="mb-3">
                                  {b.type === "text" && <div dangerouslySetInnerHTML={{ __html: b.content || "" }} />}
                                  {b.type === "button" && (
                                    <a className="inline-block bg-foreground text-background px-3 py-2 rounded-md"
                                       href={b.url || "#"} target="_blank" rel="noreferrer">
                                      {b.label || "Button"}
                                    </a>
                                  )}
                                  {b.type === "footer" && (
                                    <div className="text-xs text-muted-foreground">
                                      {b.includeUnsubscribe ? "Unsubscribe link will be included" : "No unsubscribe link"}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <DialogFooter className="gap-2">
                      <Button
                        variant="outline"
                        onClick={async () => {
                          try {
                            const to = (user as any)?.email;
                            if (!to) {
                              toast("No user email to send test");
                              return;
                            }
                            const business = currentBusiness;
                            if (!business) {
                              toast("No business selected");
                              return;
                            }
                            await sendTestEmail({
                              from: emailFrom,
                              to,
                              subject: emailSubject || "(no subject)",
                              previewText: emailPreview || "",
                              businessId: business._id,
                              blocks,
                            } as any);
                            toast("Test email sent");
                          } catch (e) {
                            toast("Failed to send test");
                          }
                        }}
                      >
                        Send Test
                      </Button>
                      <Button
                        onClick={async () => {
                          try {
                            if (!emailSubject || !emailFrom) {
                              toast("From and Subject are required");
                              return;
                            }
                            if (!scheduledAt) {
                              toast("Select a schedule time");
                              return;
                            }
                            const recipients = recipientsRaw
                              .split(",")
                              .map((s) => s.trim())
                              .filter((s) => s.length > 0);
                            if (recipients.length === 0) {
                              toast("Add at least one recipient");
                              return;
                            }
                            const local = new Date(scheduledAt);
                            const scheduledUtcMs = local.getTime();
                            const business = currentBusiness;
                            if (!business) {
                              toast("No business selected");
                              return;
                            }
                            await createCampaign({
                              businessId: business._id,
                              createdBy: currentUserDoc!._id,
                              subject: emailSubject,
                              from: emailFrom,
                              previewText: emailPreview || "",
                              blocks,
                              recipients,
                              timezone: tz,
                              scheduledAt: scheduledUtcMs,
                            } as any);
                            toast("Campaign scheduled");
                            setEmailOpen(false);
                            setEmailSubject("");
                            setEmailPreview("");
                            setRecipientsRaw("");
                            setScheduledAt("");
                          } catch (e) {
                            toast("Failed to schedule");
                          }
                        }}
                      >
                        Schedule
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Tiny list of recent campaigns */}
              <div className="rounded-md border divide-y">
                {(campaigns ?? []).length === 0 ? (
                  <div className="text-sm text-muted-foreground p-3">No campaigns yet</div>
                ) : (
                  (campaigns ?? []).map((c: any) => (
                    <div key={c._id} className="flex items-center justify-between p-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{c.subject}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(c.scheduledAt).toLocaleString()} • {c.status}
                        </div>
                      </div>
                      <Badge>{(c.status || "").toUpperCase()}</Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* System Health Inspector */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                System Health Inspector
                <Dialog open={inspectionOpen} onOpenChange={setInspectionOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Search className="h-4 w-4 mr-2" />
                      Run Inspection
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[state=open]:slide-in-from-top-4 data-[state=closed]:slide-out-to-top-2">
                    <DialogHeader>
                      <DialogTitle>Pikar AI Feature Implementation Report</DialogTitle>
                    </DialogHeader>

                    <motion.div
                      className="space-y-4"
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 280, damping: 24, mass: 0.6 }}
                    >
                      <div className="flex gap-2">
                        <Button onClick={handleRunInspection} disabled={isRunningInspection} size="sm">
                          {isRunningInspection ? "Running..." : "Run Inspection"}
                        </Button>

                        {inspectionReport && (
                          <Button onClick={downloadReport} variant="outline" size="sm">
                            Export JSON
                          </Button>
                        )}
                      </div>

                      {isRunningInspection && (
                        <div className="space-y-2">
                          <Progress value={undefined} className="w-full" />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                              <Skeleton key={i} className="h-12 w-full" />
                            ))}
                          </div>
                        </div>
                      )}

                      {inspectionReport && (
                        <div className="space-y-4">
                          {/* Summary */}
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg">Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                                <div>
                                  <div className="text-2xl font-bold text-green-600">
                                    {inspectionReport.summary.passes}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Passed</div>
                                </div>
                                <div>
                                  <div className="text-2xl font-bold text-amber-600">
                                    {inspectionReport.summary.warnings}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Warnings</div>
                                </div>
                                <div>
                                  <div className="text-2xl font-bold text-red-600">
                                    {inspectionReport.summary.failures}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Failed</div>
                                </div>
                                <div>
                                  <div className="text-2xl font-bold text-red-800">
                                    {inspectionReport.summary.critical_failures}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Critical</div>
                                </div>
                                <div>
                                  <div className="text-2xl font-bold">
                                    {inspectionReport.summary.total_checks}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Total</div>
                                </div>
                              </div>

                              {inspectionReport.summary.escalation_required && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                  <div className="text-red-800 font-medium">⚠️ Escalation Required</div>
                                  <div className="text-red-700 text-sm">
                                    Critical failures detected. DevOps and Compliance teams should be notified.
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>

                          <Separator />

                          {/* Results Table */}
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Module</TableHead>
                                  <TableHead>Check</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Evidence</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {inspectionReport.results.map(
                                  (result: FullAppInspectionReport["results"][number], index: number) => (
                                    <TableRow key={index}>
                                      <TableCell className="font-medium">{result.module}</TableCell>
                                      <TableCell>{result.check}</TableCell>
                                      <TableCell>{getStatusBadge(result.status)}</TableCell>
                                      <TableCell>
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div className="max-w-xs truncate cursor-help">{result.evidence}</div>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-sm">
                                              <p>{result.evidence}</p>
                                              {result.triggered_ai_tasks && result.triggered_ai_tasks.length > 0 && (
                                                <div className="mt-2">
                                                  <div className="font-medium">Suggested AI Tasks:</div>
                                                  <ul className="list-disc list-inside text-sm">
                                                    {result.triggered_ai_tasks.map((task: string, i: number) => (
                                                      <li key={i}>{task}</li>
                                                    ))}
                                                  </ul>
                                                </div>
                                              )}
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </TableCell>
                                    </TableRow>
                                  )
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Run comprehensive validation of all Pikar AI features and modules to identify implementation gaps.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}