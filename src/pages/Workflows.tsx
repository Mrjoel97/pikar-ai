import { Suspense, useState, useEffect, useMemo } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { isGuestMode, getSelectedTier } from "@/lib/guestUtils";
import { getAllBuiltInTemplates } from "@/lib/templatesClient";
import WorkflowBuilder from "@/components/workflows/WorkflowBuilder";
import WorkflowExecutionViewer from "@/components/workflows/WorkflowExecutionViewer";
import WorkflowAnalytics from "@/components/workflows/WorkflowAnalytics";
import WorkflowListView from "@/components/workflows/WorkflowListView";
import WorkflowCreateDialog from "@/components/workflows/WorkflowCreateDialog";
import { StartupHealthCheck, GovernanceHealthCheck } from "@/components/workflows/WorkflowHealthIndicators";
import { Play, Clock, Webhook } from "lucide-react";

function getTriggerIcon(type: string) {
  switch (type) {
    case "manual":
      return <Play className="h-4 w-4 text-muted-foreground" />;
    case "schedule":
      return <Clock className="h-4 w-4 text-muted-foreground" />;
    case "webhook":
      return <Webhook className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Play className="h-4 w-4 text-muted-foreground" />;
  }
}

function getGovernanceIssues(wf: any, tier?: string) {
  const steps: any[] = Array.isArray(wf?.pipeline) ? wf.pipeline : [];
  const approvals = steps.filter((s) => (s?.kind || s?.type) === "approval");
  const hasApproval = approvals.length > 0;
  const approvalsMissingRole = approvals.some((s: any) => {
    const role = s?.approverRole || s?.config?.approverRole;
    return !role || String(role).trim().length === 0;
  });

  const delayVal = (s: any) => (s?.delayMinutes ?? s?.config?.delayMinutes ?? 0);
  const minDelay = tier === "enterprise" ? 60 : 30;
  const hasSlaDelay = steps.some((s: any) => {
    const k = s?.kind || s?.type;
    return k === "delay" && delayVal(s) >= minDelay;
  });

  const hasDescription = !!(wf?.description && String(wf.description).trim().length > 0);

  const issues: string[] = [];
  if (!hasApproval) issues.push("Missing approval step");
  if (approvalsMissingRole) issues.push("Approver role missing");
  if (!hasSlaDelay) issues.push(`Missing SLA delay (≥ ${minDelay}m)`);
  if (!hasDescription) issues.push("Description missing");

  if (tier === "enterprise") {
    const threshold = wf?.approval?.threshold ?? 0;
    if (!(threshold >= 2 || approvals.length >= 2)) {
      issues.push("Approval threshold < 2 or fewer than 2 approvals");
    }
  }
  return issues;
}

export default function Workflows() {
  const navigate = useNavigate();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [newWorkflowOpen, setNewWorkflowOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editedPipelines, setEditedPipelines] = useState<Record<string, any[]>>({});
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [tplSearch, setTplSearch] = useState<string>("");
  const [tplTier, setTplTier] = useState<string>("all");
  const [isCopyingId, setIsCopyingId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("list");
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [workflowsCursor, setWorkflowsCursor] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const guestMode = isGuestMode();
  const selectedTier = getSelectedTier();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchFilter]);

  const businesses = useQuery(api.businesses.getUserBusinesses, {});
  const firstBizId = businesses?.[0]?._id;

  const workflows = useQuery(
    api.workflows.listWorkflows,
    firstBizId ? {
      businessId: firstBizId,
      paginationOpts: { numItems: 50, cursor: workflowsCursor },
      search: debouncedSearch || undefined,
    } : "skip"
  );

  const guestTemplates = useMemo(() => {
    if (!guestMode) return [];
    const all = getAllBuiltInTemplates();
    const tier = selectedTier as any;
    return all.filter((t: any) => !tier || t.tier === tier);
  }, [guestMode, selectedTier]);

  const upsertWorkflow = useMutation(api.workflows.upsertWorkflow);
  const simulateWorkflow = useAction(api.workflows.simulateWorkflow);
  const checkCompliance = useAction(api.workflows.checkMarketingCompliance);
  const estimateRoi = useAction(api.workflows.estimateRoi);

  const handleSimulate = async (workflowId: Id<"workflows">) => {
    try {
      const result = await simulateWorkflow({ workflowId });
      toast.success(`Simulation complete: ${result.steps.length} steps, ~${Math.round(result.estimatedDurationMs / 60000)} minutes`);
    } catch (error: any) {
      toast.error(error?.message || "Simulation failed");
    }
  };

  const handleComplianceCheck = async (workflowId: Id<"workflows">) => {
    try {
      const workflow = workflows?.page?.find((w: any) => w._id === workflowId);
      if (!workflow) return;
      
      const result = await checkCompliance({
        businessId: workflow.businessId,
        subjectType: "workflow",
        subjectId: workflowId,
        content: `${workflow.name} ${workflow.description || ""} ${JSON.stringify(workflow.pipeline)}`,
      });
      
      const highIssues = result.findings.filter((f: any) => f.severity === "high").length;
      if (highIssues > 0) {
        toast.error(`Compliance check: ${highIssues} high-priority issues found`);
      } else {
        toast.success(`Compliance check passed: ${result.findings.length} total findings`);
      }
    } catch (error: any) {
      toast.error(error?.message || "Compliance check failed");
    }
  };

  const handleEstimateRoi = async (workflowId: Id<"workflows">) => {
    try {
      const result = await estimateRoi({ workflowId });
      toast.success(`ROI estimated: ${(result.estimatedRoi * 100).toFixed(1)}% with ${(result.successRate * 100).toFixed(1)}% success rate`);
    } catch (error: any) {
      toast.error(error?.message || "ROI estimation failed");
    }
  };

  const handleCreateWorkflow = async (data: any) => {
    await upsertWorkflow(data);
    toast.success("Workflow created successfully");
  };

  const savePipeline = async (wf: any) => {
    try {
      const pipeline = editedPipelines[wf._id] ?? wf.pipeline;
      const tier = (businesses?.[0]?.tier as string | undefined);

      if (tier === "sme" || tier === "enterprise") {
        const issues = getGovernanceIssues({ ...wf, pipeline }, tier);
        if (issues.length > 0) {
          toast.error("Governance check failed", { description: issues.join(" • ") });
          return;
        }
      }

      await upsertWorkflow({
        id: wf._id,
        businessId: wf.businessId,
        name: wf.name,
        description: wf.description,
        trigger: wf.trigger,
        approval: wf.approval,
        pipeline,
        template: !!wf.template,
        tags: wf.tags || [],
      } as any);
      toast.success("Pipeline saved");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save pipeline");
    }
  };

  const toggleExpand = (wf: any) => {
    if (!editedPipelines[wf._id]) {
      setEditedPipelines((prev) => ({
        ...prev,
        [wf._id]: (wf.pipeline || []).map((x: any) => ({ ...x }))
      }));
    }
    setExpanded((prev) => ({ ...prev, [wf._id]: !prev[wf._id] }));
  };

  if (authLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse h-8 w-40 rounded bg-muted mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 rounded-lg bg-muted" />
          <div className="h-32 rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !guestMode) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Sign in to manage workflows.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button onClick={() => navigate("/auth")}>Sign In</Button>
            <Button variant="outline" onClick={() => navigate("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (guestMode) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Orchestration & Workflows (Demo)</h1>
            <p className="text-sm text-muted-foreground">
              Viewing demo workflows for your selected tier. Sign in to create and run workflows.
            </p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          {guestTemplates ? guestTemplates.length : 0} demo workflow{(guestTemplates?.length || 0) === 1 ? "" : "s"} found
        </div>

        <div className="grid gap-4">
          {(guestTemplates || []).map((template: any) => (
            <Card key={template._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTriggerIcon(template.trigger.type)}
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge variant="secondary">Demo</Badge>
                  </div>
                </div>
                {template.description && (
                  <CardDescription>{template.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Steps: {template.pipeline?.length ?? 0}</span>
                  <span>Trigger: {template.trigger.type}</span>
                  {template.trigger.cron && <span>Schedule: {template.trigger.cron}</span>}
                  {template.trigger.eventKey && <span>Event: {template.trigger.eventKey}</span>}
                  {template.approval?.required && <span>Approval Required</span>}
                </div>
                {template.tags?.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {template.tags.map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}
                <div className="mt-3 text-xs text-muted-foreground">
                  Actions like simulate, compliance scan, and editing require signing in.
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflows</h1>
          <p className="text-muted-foreground">
            Design, execute, and monitor automated workflows
          </p>
        </div>
      </div>

      <WorkflowCreateDialog
        open={newWorkflowOpen}
        onOpenChange={setNewWorkflowOpen}
        businessId={firstBizId || ""}
        tier={businesses?.[0]?.tier}
        onSubmit={handleCreateWorkflow}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Workflows</TabsTrigger>
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          {selectedRunId && <TabsTrigger value="execution">Execution</TabsTrigger>}
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">All Workflows</h2>
              <p className="text-sm text-muted-foreground">Manage and monitor your automated workflows</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setNewWorkflowOpen(true)}>New Workflow</Button>
              <Button variant="outline" onClick={() => setTemplatesOpen(true)}>Browse Templates</Button>
            </div>
          </div>

          <Suspense fallback={
            <div className="grid gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="animate-pulse space-y-2">
                    <div className="h-6 w-3/4 rounded bg-muted" />
                    <div className="h-4 w-full rounded bg-muted" />
                    <div className="flex gap-2">
                      <div className="h-8 w-20 rounded bg-muted" />
                      <div className="h-8 w-24 rounded bg-muted" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          }>
            <WorkflowListView
              workflows={workflows}
              businesses={businesses || []}
              searchFilter={searchFilter}
              onSearchChange={setSearchFilter}
              expanded={expanded}
              editedPipelines={editedPipelines}
              roleFilter={roleFilter}
              onRoleFilterChange={setRoleFilter}
              onToggleExpand={toggleExpand}
              onSimulate={handleSimulate}
              onComplianceCheck={handleComplianceCheck}
              onEstimateRoi={handleEstimateRoi}
              onViewExecutions={setSelectedWorkflow}
              onSavePipeline={savePipeline}
              onEditPipeline={(workflowId, pipeline) => setEditedPipelines(prev => ({ ...prev, [workflowId]: pipeline }))}
              onLoadMore={() => setWorkflowsCursor(workflows?.continueCursor || null)}
            />
          </Suspense>

          {(() => {
            const tier = (businesses?.[0]?.tier as string | undefined);
            const workflowList = workflows?.page || [];
            
            if (tier === "startup") {
              return <StartupHealthCheck workflows={workflowList} />;
            } else if (tier === "sme" || tier === "enterprise") {
              return <GovernanceHealthCheck workflows={workflowList} tier={tier} />;
            }
            return null;
          })()}
        </TabsContent>

        <TabsContent value="builder">
          {firstBizId ? (
            <WorkflowBuilder
              businessId={firstBizId}
              onSave={() => setActiveTab("list")}
            />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No business found. Complete onboarding first.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          {firstBizId ? (
            <WorkflowAnalytics businessId={firstBizId} />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No business found. Complete onboarding first.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {selectedRunId && (
          <TabsContent value="execution">
            <WorkflowExecutionViewer runId={selectedRunId} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}