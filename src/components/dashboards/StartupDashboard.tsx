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

  // Add: Growth metrics query
  const growthMetrics = useQuery(
    api.kpis.getGrowthMetrics,
    isGuest || !business?._id ? undefined : { businessId: business._id, timeRange: "30d" }
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

  const teamPerformance = useQuery(
    api.telemetry.getTeamPerformanceMetrics,
    isGuest || !business?._id ? undefined : { businessId: business._id, days: 7 }
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
    isGuest || !business?._id ? undefined : { businessId: business._id }
  );

  const approvalMetrics = useQuery(
    api.approvalAnalytics.getApprovalMetrics,
    isGuest || !business?._id ? undefined : { businessId: business._id, timeRange: 7 }
  );

  const incompleteOnboarding = teamOnboarding?.filter((t: any) => !t.completedAt).length || 0;

  // Add queries for social media data
  const connectedAccounts = useQuery(
    api.socialIntegrations.listConnectedAccounts,
    isGuest || !business?._id ? undefined : { businessId: business._id }
  );

  const upcomingPosts = useQuery(
    api.socialPosts.getUpcomingPosts,
    isGuest || !business?._id ? undefined : { businessId: business._id, limit: 5 }
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
      {/* Pending Team Onboarding Alert */}
      {!isGuest && incompleteOnboarding > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {incompleteOnboarding} team member{incompleteOnboarding > 1 ? "s" : ""} pending onboarding
            </p>
            <p className="text-xs text-muted-foreground">Help them get started to improve team productivity</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => nav("/team")}>
            Manage Team
          </Button>
        </div>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Contributions</div>
              <div className="text-2xl font-bold">
                {teamPerformance?.summary.totalContributions || (isGuest ? 27 : 0)}
              </div>
              <div className="text-xs text-emerald-600">+{isGuest ? 2 : 0} vs prior</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Approvals Completed</div>
              <div className="text-2xl font-bold">
                {teamPerformance?.summary.totalApprovals || (isGuest ? 7 : 0)}
              </div>
              <div className="text-xs text-emerald-600">SLA improving</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Tasks Completed</div>
              <div className="text-2xl font-bold">
                {teamPerformance?.summary.totalTasks || (isGuest ? 12 : 0)}
              </div>
              <div className="text-xs text-emerald-600">Momentum up</div>
            </CardContent>
          </Card>
        </div>

        {/* Team Leaderboard */}
        {teamPerformance && teamPerformance.teamMembers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Team Leaderboard
              </CardTitle>
              <CardDescription>Top contributors this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teamPerformance.teamMembers.slice(0, 5).map((member: { userId: string; name: string; contributions: number; approvals: number; tasks: number }, idx: number) => (
                  <div key={member.userId} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                      idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                      idx === 1 ? 'bg-gray-100 text-gray-700' :
                      idx === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{member.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{member.userId}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{member.contributions}</div>
                      <div className="text-xs text-muted-foreground">contributions</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Guest mode fallback leaderboard */}
        {isGuest && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Team Leaderboard
              </CardTitle>
              <CardDescription>Top contributors this week (Demo)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Sarah Chen", email: "sarah@demo.com", contributions: 15 },
                  { name: "Mike Johnson", email: "mike@demo.com", contributions: 12 },
                  { name: "Alex Rivera", email: "alex@demo.com", contributions: 8 },
                ].map((member, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                      idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                      idx === 1 ? 'bg-gray-100 text-gray-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{member.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{member.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{member.contributions}</div>
                      <div className="text-xs text-muted-foreground">contributions</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Approval Health Card - Add after Team Performance section */}
      {!isGuest && approvalMetrics && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  Approval Health
                </CardTitle>
                <CardDescription>Key approval metrics for the past 7 days</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => nav("/approval-analytics")}>
                View Details
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Avg Time</div>
                <div className="text-2xl font-bold">{approvalMetrics.avgTimeHours}h</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Overdue</div>
                <div className={`text-2xl font-bold ${approvalMetrics.overdueCount > 0 ? "text-amber-600" : ""}`}>
                  {approvalMetrics.overdueCount}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="text-2xl font-bold">{approvalMetrics.totalApprovals}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Growth Metrics Dashboard */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Growth Metrics Dashboard</h2>
            <p className="text-sm text-muted-foreground">Track funnel performance, CAC, and customer acquisition</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics?.summary.totalRevenue?.toLocaleString() || kpis.totalRevenue?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">Total revenue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.summary.activeCustomers || kpis.activeCustomers || 0}</div>
              <p className="text-xs text-muted-foreground">Active customers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Conversion</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.summary.conversionRate || kpis.conversionRate || 0}%</div>
              <p className="text-xs text-muted-foreground">Visitor to customer</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg CAC</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics?.summary.avgCAC || 0}</div>
              <p className="text-xs text-muted-foreground">Customer acquisition</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg LTV</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics?.summary.avgLTV || 0}</div>
              <p className="text-xs text-muted-foreground">Lifetime value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">LTV:CAC</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.summary.ltvcacRatio || 0}x</div>
              <p className="text-xs text-muted-foreground">Ratio</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>Customer journey from visitor to conversion</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics?.conversionFunnel || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="stage" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981">
                    {(metrics?.conversionFunnel || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b"][index % 4]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* CAC by Channel */}
          <Card>
            <CardHeader>
              <CardTitle>CAC by Channel</CardTitle>
              <CardDescription>Customer acquisition cost across channels</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics?.cacByChannel || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="channel" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="cac" fill="#ef4444" name="CAC ($)" />
                  <Bar yAxisId="right" dataKey="customers" fill="#10b981" name="Customers" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Growth Trends</CardTitle>
            <CardDescription>Revenue, CAC, and customer trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics?.trends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue ($)" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="cac" stroke="#ef4444" name="CAC ($)" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="customers" stroke="#3b82f6" name="Customers" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
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

      {/* Social Media Hub Section - NEW */}
      {!isGuest && business?._id && (
        <section className="mb-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Twitter className="h-5 w-5" />
                    Social Media Hub
                  </CardTitle>
                  <CardDescription>
                    Multi-platform scheduler with AI-powered content suggestions
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => nav("/social")}>
                  Open Full Manager
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="border rounded-lg p-3">
                  <div className="text-sm text-muted-foreground">Scheduled Posts</div>
                  <div className="text-2xl font-bold">
                    {upcomingPosts?.length || 0}
                  </div>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="text-sm text-muted-foreground">Connected Platforms</div>
                  <div className="text-2xl font-bold">
                    {connectedAccounts?.length || 0}/3
                  </div>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="text-sm text-muted-foreground">Posts This Month</div>
                  <div className="text-2xl font-bold">
                    {isGuest ? 12 : 0}
                  </div>
                </div>
              </div>

              {/* Quick Post Composer */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Quick Post</h3>
                <PostComposer
                  businessId={business._id as Id<"businesses">}
                  userId={business._id as Id<"users">}
                  onPostCreated={() => {
                    toast.success("Post created successfully!");
                  }}
                />
              </div>

              {/* Upcoming Posts Preview */}
              {upcomingPosts && upcomingPosts.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Upcoming Posts</h3>
                  <div className="space-y-2">
                    {upcomingPosts.slice(0, 3).map((post: any) => (
                      <div key={post._id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{post.content}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(post.scheduledAt!).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                          {post.platforms.map((platform: string) => {
                            const Icon = platform === "twitter" ? Twitter : 
                                       platform === "linkedin" ? Linkedin : Facebook;
                            return <Icon key={platform} className="h-4 w-4 text-muted-foreground" />;
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Features Badge */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium">AI Features Available</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">Content Generation</Badge>
                    <Badge variant="secondary">Hashtag Suggestions</Badge>
                    <Badge variant="secondary">Optimal Timing</Badge>
                  </div>
                </div>
              </div>

              {/* 30-Day Social Media Analytics */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Analytics (Last 30 Days)</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="border rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">Total Posts</div>
                    <div className="text-xl font-bold">{isGuest ? 24 : upcomingPosts?.length || 0}</div>
                    <div className="text-xs text-emerald-600">+12% vs prev</div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">Engagement</div>
                    <div className="text-xl font-bold">{isGuest ? "3.2k" : "0"}</div>
                    <div className="text-xs text-emerald-600">+8% vs prev</div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">Reach</div>
                    <div className="text-xl font-bold">{isGuest ? "12.5k" : "0"}</div>
                    <div className="text-xs text-emerald-600">+15% vs prev</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

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