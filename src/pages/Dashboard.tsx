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

function JourneyBand() {
  const navigate = useNavigate();
  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.05 },
    },
  };
  const item = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 24, mass: 0.6 } },
  };

  const phases: Array<{ id: number; name: string; description: string; actions: Array<{ label: string; onClick: () => void }> }> = [
    {
      id: 0,
      name: "Onboarding",
      description: "Define industry, model, goals and connect integrations.",
      actions: [{ label: "Guided Onboarding", onClick: () => navigate("/onboarding") }],
    },
    {
      id: 1,
      name: "Discovery",
      description: "Analyze signals; clarify target customers.",
      actions: [{ label: "Open Analytics", onClick: () => navigate("/analytics") }],
    },
    {
      id: 2,
      name: "Planning",
      description: "Draft strategy; add checkpoints & assumptions.",
      actions: [{ label: "Open Workflows", onClick: () => navigate("/workflows") }],
    },
    {
      id: 3,
      name: "Foundation",
      description: "Baseline setup: domains, CRM, payments.",
      actions: [{ label: "Onboarding Checks", onClick: () => navigate("/onboarding") }],
    },
    {
      id: 4,
      name: "Execution",
      description: "Run campaigns and orchestrations.",
      actions: [{ label: "Orchestrate", onClick: () => navigate("/workflows") }],
    },
    {
      id: 5,
      name: "Scale",
      description: "Duplicate winners; expand markets.",
      actions: [{ label: "Analytics", onClick: () => navigate("/analytics") }],
    },
    {
      id: 6,
      name: "Sustain",
      description: "Continuous improvement & audits.",
      actions: [{ label: "Compliance", onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }) }],
    },
  ];

  return (
    <Card className="mb-8">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Initiative Journey</CardTitle>
        <CardDescription>Track from setup to sustainability</CardDescription>
      </CardHeader>
      <CardContent>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {phases.map((p) => (
            <motion.div
              key={p.id}
              variants={item}
              whileHover={{ y: -2, scale: 1.01 }}
              className="rounded-lg border p-4 bg-background hover:shadow-sm transition-shadow"
            >
              <div className="text-sm font-medium">{p.name}</div>
              <div className="text-xs text-muted-foreground mb-3">{p.description}</div>
              <div className="flex flex-wrap gap-2">
                {p.actions.map((a, i) => (
                  <Button key={i} variant="outline" size="sm" onClick={a.onClick}>
                    {a.label}
                  </Button>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { isLoading: authLoading, isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();

  const currentBusiness = useQuery(api.businesses.currentUserBusiness);
  const businesses = useQuery(api.businesses.getByOwner);
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !currentBusiness) {
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
                Welcome back! Here's what's happening with {currentBusiness.name}.
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
          <div className="mb-6 rounded-lg border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Today's Focus</h3>
              <span className="text-xs text-muted-foreground">
                Top 3 tasks prioritized by urgency and priority
              </span>
            </div>
            <div className="space-y-2">
              {(focusTasks ?? []).length === 0 ? (
                <div className="text-sm text-muted-foreground">No tasks yet. Great time to create a quick win.</div>
              ) : (
                (focusTasks ?? []).map((t) => (
                  <div
                    key={t._id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={t.status === "done"}
                        onChange={async (e) => {
                          try {
                            await updateTaskStatus({
                              taskId: t._id,
                              status: e.target.checked ? "done" : "todo",
                            });
                            toast("Task updated");
                          } catch (err: any) {
                            toast("Failed to update task");
                          }
                        }}
                      />
                      <div>
                        <div className="text-sm font-medium">{t.title}</div>
                        {t.description && (
                          <div className="text-xs text-muted-foreground">{t.description}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {t.urgent && (
                        <span className="text-[10px] rounded bg-red-100 px-2 py-0.5 text-red-700">Urgent</span>
                      )}
                      <span className="text-[10px] rounded bg-slate-100 px-2 py-0.5 capitalize">
                        {t.priority}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
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
          <JourneyBand />

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
                      initial="hidden"
                      animate="show"
                      variants={{
                        hidden: { opacity: 1 },
                        show: {
                          opacity: 1,
                          transition: { staggerChildren: 0.06 },
                        },
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
                          <Button className="mt-2" onClick={() => navigate("/agents")}>
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
                    </motion.div>
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