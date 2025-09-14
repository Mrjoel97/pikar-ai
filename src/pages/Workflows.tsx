import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { useState, useEffect, type ChangeEvent } from "react";
import { useMemo } from "react";
import { Play, BarChart3, Clock, Webhook, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { isGuestMode, getSelectedTier } from "@/lib/guestUtils";
import { getAllBuiltInTemplates } from "@/lib/templatesClient";

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

function estimateRoiBadge(wf: any): { label: string; variant: "default" | "secondary" | "destructive" } {
  const steps = Array.isArray(wf?.pipeline) ? wf.pipeline.length : 0;
  const approvals = (wf?.pipeline || []).filter((s: any) => (s?.kind || s?.type) === "approval").length;
  const score = steps + approvals * 1.5;
  if (score >= 6) return { label: "Est. ROI: High", variant: "default" };
  if (score >= 3) return { label: "Est. ROI: Medium", variant: "secondary" };
  return { label: "Est. ROI: Quick Win", variant: "secondary" };
}

function extractApproverRoles(wf: any): string[] {
  const roles = new Set<string>();
  const steps: any[] = Array.isArray(wf?.pipeline) ? wf.pipeline : [];
  for (const s of steps) {
    const kind = s?.kind || s?.type;
    if (kind === "approval") {
      const role = s?.approverRole || s?.config?.approverRole;
      if (role && typeof role === "string") roles.add(role);
    }
  }
  return Array.from(roles);
}

// Add: Governance issues helper for SME/Enterprise
function getGovernanceIssues(wf: any, tier?: string) {
  const steps: any[] = Array.isArray(wf?.pipeline) ? wf.pipeline : [];
  const approvals = steps.filter((s) => (s?.kind || s?.type) === "approval");
  const hasApproval = approvals.length > 0;
  const approvalsMissingRole = approvals.some((s: any) => {
    const role = s?.approverRole || s?.config?.approverRole;
    return !role || String(role).trim().length === 0;
  });

  const delayVal = (s: any) => (s?.delayMinutes ?? s?.config?.delayMinutes ?? 0);
  const minDelay = tier === "enterprise" ? 60 : 30; // SME: 30m, Enterprise: 60m
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

  // Enterprise: require multi-approver (threshold >= 2 or at least 2 approval steps)
  if (tier === "enterprise") {
    const threshold = wf?.approval?.threshold ?? 0;
    if (!(threshold >= 2 || approvals.length >= 2)) {
      issues.push("Approval threshold < 2 or fewer than 2 approvals");
    }
  }
  return issues;
}

export default function WorkflowsPage() {
  const navigate = useNavigate();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [newWorkflowOpen, setNewWorkflowOpen] = useState(false);
  const [triggerDialogOpen, setTriggerDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editedPipelines, setEditedPipelines] = useState<Record<string, any[]>>({});
  const [templateTierFilter, setTemplateTierFilter] = useState<string>("all");
  const [templateIndustryFilter, setTemplateIndustryFilter] = useState<string>("all");
  const [templateSearch, setTemplateSearch] = useState<string>("");
  const [templateSort, setTemplateSort] = useState<"recommended" | "newest" | "name">("recommended");
  const guestMode = isGuestMode();
  const selectedTier = getSelectedTier();
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [tplSearch, setTplSearch] = useState<string>("");
  const [tplTier, setTplTier] = useState<string>("all");
  const [isCopyingId, setIsCopyingId] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  // Add: Role filter state
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Add pagination and debounce state
  const [workflowsCursor, setWorkflowsCursor] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchFilter]);

  const businesses = useQuery(api.businesses.getUserBusinesses, {});
  const firstBizId = businesses?.[0]?._id;

  // Update workflows query for pagination
  const workflows = useQuery(
    api.workflows.listWorkflows,
    firstBizId ? {
      businessId: firstBizId,
      paginationOpts: { numItems: 50, cursor: workflowsCursor },
      search: debouncedSearch || undefined,
    } : "skip"
  );
  const simulateWorkflowAction = useAction(api.workflows.simulateWorkflow);
  const complianceScanAction = useAction(api.workflows.checkMarketingCompliance);
  const guestTemplates = useMemo(() => {
    if (!guestMode) return [];
    const all = getAllBuiltInTemplates();
    const tier = selectedTier as any;
    return all.filter((t: any) => !tier || t.tier === tier);
  }, [guestMode, selectedTier]);
  const executions = useQuery(api.workflows.getExecutions,
    selectedWorkflow ? {
      workflowId: selectedWorkflow as any,
      paginationOpts: { numItems: 10, cursor: null }
    } : "skip");

  const upsertWorkflow = useMutation(api.workflows.upsertWorkflow);
  const seedTasksForBiz = useMutation(api.tasks.seedDemoTasksForBusiness);
  const seedContactsAction = useAction(((api as any).contacts?.seedContacts) || ({} as any));
  const seedKpisForBiz = useMutation((api as any).kpis?.seedDemoForBusiness || ({} as any));

  // Add action hooks after existing hooks
  const simulateWorkflow = useAction(api.workflows.simulateWorkflow);
  const checkCompliance = useAction(api.workflows.checkMarketingCompliance);
  const estimateRoi = useAction(api.workflows.estimateRoi);

  // Add handlers
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
      const workflow = workflows?.find(w => w._id === workflowId);
      if (!workflow) return;
      
      const result = await checkCompliance({
        businessId: workflow.businessId,
        subjectType: "workflow",
        subjectId: workflowId,
        content: `${workflow.name} ${workflow.description || ""} ${JSON.stringify(workflow.pipeline)}`,
      });
      
      const highIssues = result.findings.filter(f => f.severity === "high").length;
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

  useEffect(() => {
    if (!newWorkflowOpen) return;
    const tier = (businesses?.[0]?.tier as string | undefined) || (selectedTier as string | undefined);

    if (tier === "solopreneur") {
      const defaultPipeline = [
        { kind: "collect", title: "Collect recent wins", source: "notes" },
        { kind: "agent", title: "Draft LinkedIn + email blurb", agentPrompt: "Draft a LinkedIn post and an email blurb based on collected wins." },
        { kind: "approval", approverRole: "Owner", title: "Quick review" },
        { kind: "delay", delayMinutes: 15, title: "Schedule buffer (optional)" },
      ];
      setFormData(prev => ({
        ...prev,
        name: prev.name || "Brand Booster",
        description: prev.description || "Quick weekly post + email draft with a short review.",
        triggerType: "manual",
        approvalRequired: true,
        approvalThreshold: 1,
        pipeline: JSON.stringify(defaultPipeline, null, 2),
        tags: prev.tags || "brand-booster, quick-win"
      }));
    } else if (tier === "startup") {
      const defaultPipeline = [
        { kind: "agent", title: "Draft deliverable", agentPrompt: "Create the initial draft for team review." },
        { kind: "approval", approverRole: "Manager", title: "Team approval" },
        { kind: "delay", delayMinutes: 60, title: "SLA buffer" },
        { kind: "notify", channel: "email", title: "Handoff to next role" },
      ];
      setFormData(prev => ({
        ...prev,
        name: prev.name || "Standard Handoff",
        description: prev.description || "Approval + SLA buffer for consistent handoff.",
        triggerType: "manual",
        approvalRequired: true,
        approvalThreshold: 1,
        pipeline: JSON.stringify(defaultPipeline, null, 2),
        tags: prev.tags || "standardize, handoff, alignment"
      }));
    } else if (tier === "sme") {
      const defaultPipeline = [
        { kind: "agent", title: "Draft deliverable", agentPrompt: "Create a draft for review." },
        { kind: "approval", approverRole: "Team Lead", title: "Primary approval" },
        { kind: "delay", delayMinutes: 30, title: "SLA buffer" },
        { kind: "notify", channel: "email", title: "Handoff notification" },
      ];
      setFormData(prev => ({
        ...prev,
        name: prev.name || "Governed Workflow",
        description: prev.description || "Governed SME workflow with approval and SLA delay.",
        triggerType: "manual",
        approvalRequired: true,
        approvalThreshold: 1,
        pipeline: JSON.stringify(defaultPipeline, null, 2),
        tags: prev.tags || "governance, sme"
      }));
    } else if (tier === "enterprise") {
      const defaultPipeline = [
        { kind: "agent", title: "Agent prepares output", agentPrompt: "Prepare deliverable for dual approval." },
        { kind: "approval", approverRole: "Compliance Lead", title: "Compliance approval" },
        { kind: "approval", approverRole: "Manager", title: "Manager approval" },
        { kind: "delay", delayMinutes: 60, title: "SLA buffer" },
        { kind: "notify", channel: "email", title: "Handoff notification" },
      ];
      setFormData(prev => ({
        ...prev,
        name: prev.name || "Enterprise Standard",
        description: prev.description || "Enterprise workflow with two-stage approval and SLA.",
        triggerType: "manual",
        approvalRequired: true,
        approvalThreshold: 2,
        pipeline: JSON.stringify(defaultPipeline, null, 2),
        tags: prev.tags || "governance, enterprise, compliance"
      }));
    }
  }, [newWorkflowOpen, businesses, selectedTier]);

  const handleCopyTemplate = async (template: any) => {
    if (!firstBizId) {
      toast.error("No business found. Complete onboarding first.");
      return;
    }
    try {
      setIsCopyingId(String(template._id));
      await upsertWorkflow({
        businessId: firstBizId as any,
        name: template.name,
        description: template.description || undefined,
        trigger: template.trigger || { type: "manual" },
        approval: template.approval || { required: false, threshold: 1 },
        pipeline: Array.isArray(template.pipeline) ? template.pipeline : [],
        template: false,
        tags: Array.isArray(template.tags) ? template.tags : [],
      } as any);
      toast.success("Template copied to your workflows");
      setTemplatesOpen(false);
      navigate("/workflows");
    } catch (e: any) {
      toast.error(e?.message || "Failed to copy template");
    } finally {
      setIsCopyingId(null);
    }
  };

  const handleSeedDemoData = async () => {
    if (!firstBizId) {
      toast.error("No business found. Complete onboarding first.");
      return;
    }
    try {
      setIsSeeding(true);
      toast("Seeding demo data…");
      const results = await Promise.allSettled([
        seedTasksForBiz({ businessId: firstBizId as any }),
        seedContactsAction({ businessId: firstBizId as any }),
        // KPI seeding may not exist in some builds; guard call and swallow error
        (async () => {
          try {
            if ((api as any).kpis?.seedDemoForBusiness) {
              await seedKpisForBiz({ businessId: firstBizId as any });
            }
          } catch {
            // ignore optional KPI seed errors
          }
        })(),
      ]);
      const failed = results.filter(r => r.status === "rejected").length;
      if (failed === 0) {
        toast.success("Demo data seeded");
      } else {
        toast.error(`Some seeding steps failed (${failed}). Check logs and retry.`);
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to seed demo data");
    } finally {
      setIsSeeding(false);
    }
  };

  const modalTemplates = useMemo(() => {
    const all = getAllBuiltInTemplates();
    const tier = tplTier === "all" ? null : (tplTier as any);
    const q = (tplSearch || "").trim().toLowerCase();
    let items = all;
    if (tier !== null) items = items.filter((t: any) => t.tier === tier);
    if (q) {
      items = items.filter((t: any) => {
        const name = String(t.name || "").toLowerCase();
        const desc = String(t.description || "").toLowerCase();
        const tags: string[] = Array.isArray(t.tags) ? t.tags.map((x: any) => String(x).toLowerCase()) : [];
        return name.includes(q) || desc.includes(q) || tags.some((tag) => tag.includes(q));
      });
    }
    return items;
  }, [tplTier, tplSearch]);

  const handleCreateWorkflow = async () => {
    if (!firstBizId || !formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      let pipeline;
      try {
        pipeline = JSON.parse(formData.pipeline);
      } catch {
        toast.error("Invalid pipeline JSON");
        return;
      }

      const baseTags = formData.tags.split(",").map(t => t.trim()).filter(Boolean);
      const biz = businesses?.[0];
      const enrichTags = [
        ...(biz?.tier ? ["tier:" + biz.tier] : []),
        ...(biz?.industry ? ["industry:" + biz.industry] : []),
      ];
      await upsertWorkflow({
        businessId: firstBizId,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        trigger: {
          type: formData.triggerType,
          cron: formData.triggerType === "schedule" ? formData.cron : undefined,
          eventKey: formData.triggerType === "webhook" ? formData.eventKey : undefined
        },
        approval: {
          required: formData.approvalRequired,
          threshold: formData.approvalThreshold
        },
        pipeline,
        template: formData.saveAsTemplate,
        tags: Array.from(new Set([...baseTags, ...(formData.saveAsTemplate ? enrichTags : [])]))
      });

      toast.success("Workflow created successfully");
      setNewWorkflowOpen(false);
      setFormData({
        name: "",
        description: "",
        triggerType: "manual",
        cron: "",
        eventKey: "",
        approvalRequired: false,
        approvalThreshold: 1,
        pipeline: JSON.stringify([
          { kind: "agent", input: "Process request" },
          { kind: "approval", approverRole: "manager" }
        ], null, 2),
        tags: "",
        saveAsTemplate: false,
      });
    } catch (error) {
      toast.error("Failed to create workflow");
    }
  };

  // Helpers for Startup enforcement and health checks
  const getHandoffIssues = (wf: any) => {
    const steps: any[] = Array.isArray(wf?.pipeline) ? wf.pipeline : [];
    const hasApproval = steps.some((s) => (s?.kind || s?.type) === "approval");
    const approvalsMissingRole = steps.some((s) => {
      const k = s?.kind || s?.type;
      const role = s?.approverRole || s?.config?.approverRole;
      return k === "approval" && (!role || String(role).trim().length === 0);
    });
    const hasSlaDelay = steps.some((s) => {
      const k = s?.kind || s?.type;
      const delay = s?.delayMinutes ?? s?.config?.delayMinutes ?? 0;
      return k === "delay" && delay > 0;
    });
    const hasDescription = !!(wf?.description && String(wf.description).trim().length > 0);

    const issues: string[] = [];
    if (!hasApproval) issues.push("Missing approval step");
    if (approvalsMissingRole) issues.push("Approver role missing");
    if (!hasSlaDelay) issues.push("Missing SLA delay");
    if (!hasDescription) issues.push("Description missing");
    return issues;
  };

  // Quick-add helpers (top-level)
  const addApprovalAtEnd = (wf: any) => {
    const biz = businesses?.[0];
    const defaultApproval = getDefaultApproverForTier(biz?.tier);
    setEditedPipelines((prev) => {
      const current = prev[wf._id] ? [...prev[wf._id]] : (wf.pipeline || []).map((x: any) => ({ ...x }));
      current.push({ kind: "approval", approverRole: defaultApproval });
      return { ...prev, [wf._id]: current };
    });
  };
  const addDelayAtEnd = (wf: any, minutes = 60) => {
    setEditedPipelines((prev) => {
      const current = prev[wf._id] ? [...prev[wf._id]] : (wf.pipeline || []).map((x: any) => ({ ...x }));
      current.push({ kind: "delay", delayMinutes: minutes });
      return { ...prev, [wf._id]: current };
    });
  };

  const addSecondApprovalAtEnd = (wf: any) => {
    const biz = businesses?.[0];
    const defaultApproval = getDefaultApproverForTier(biz?.tier);
    setEditedPipelines((prev) => {
      const current = prev[wf._id] ? [...prev[wf._id]] : (wf.pipeline || []).map((x: any) => ({ ...x }));
      // Use a distinct enterprise-leaning role if default equals Manager
      const secondRole = defaultApproval === "Manager" ? "Compliance Lead" : "Manager";
      current.push({ kind: "approval", approverRole: secondRole });
      return { ...prev, [wf._id]: current };
    });
  };

  const handleSimulate = async (workflow: any) => {
    try {
      const result = await simulateWorkflowAction({ workflowId: workflow._id });
      toast.success("Simulation complete", { description: `Steps: ${result.summary?.totalSteps ?? 0}, Agent: ${result.summary?.agentSteps ?? 0}, Approval: ${result.summary?.approvalSteps ?? 0}` });
      console.log("Simulation result", result);
    } catch (e: any) {
      toast.error(e?.message || "Simulation failed");
    }
  };

  const handleComplianceScan = async (workflow: any) => {
    if (!firstBizId) return;
    try {
      const content = [workflow.name, workflow.description, JSON.stringify(workflow.pipeline)].filter(Boolean).join(" ");
      const result = await complianceScanAction({
        businessId: firstBizId as any,
        subjectType: "workflow",
        subjectId: String(workflow._id),
        content,
      } as any);
      const flags = result?.flags?.length ?? 0;
      const status = result?.status ?? "unknown";
      toast.success(`Compliance: ${status}`, { description: `${flags} potential flags` });
      console.log("Compliance result", result);
    } catch (e: any) {
      toast.error(e?.message || "Compliance scan failed");
    }
  };

  const getStepKind = (s: any) => s?.kind || s?.type;

  const ensureLocalPipeline = (wf: any) => {
    if (!wf) return;
    setEditedPipelines((prev) => {
      if (prev[wf._id]) return prev;
      return { ...prev, [wf._id]: (wf.pipeline || []).map((x: any) => ({ ...x })) };
    });
  };

  const toggleExpand = (wf: any) => {
    ensureLocalPipeline(wf);
    setExpanded((prev) => ({ ...prev, [wf._id]: !prev[wf._id] }));
  };

  const toggleMMR = (wf: any, index: number, value: boolean) => {
    setEditedPipelines((prev) => {
      const current = prev[wf._id] ? [...prev[wf._id]] : (wf.pipeline || []).map((x: any) => ({ ...x }));
      const step = { ...current[index] };
      step.mmrRequired = value;
      const next = current[index + 1];
      const nextKind = next?.kind || next?.type;

      if (value) {
        // Auto-insert an approval step after this agent if not present
        if (nextKind !== "approval") {
          const biz = businesses?.[0];
          current.splice(index + 1, 0, { kind: "approval", approverRole: getDefaultApproverForTier(biz?.tier), autoInserted: true });
        }
      } else {
        // Remove auto-inserted approval if it exists right after
        if (nextKind === "approval" && next?.autoInserted) {
          current.splice(index + 1, 1);
        }
      }

      current[index] = step;
      return { ...prev, [wf._id]: current };
    });
  };
  const setStepField = (wf: any, index: number, patch: Record<string, any>) => {
    setEditedPipelines((prev) => {
      const current = prev[wf._id] ? [...prev[wf._id]] : (wf.pipeline || []).map((x: any) => ({ ...x }));
      current[index] = { ...current[index], ...patch };
      return { ...prev, [wf._id]: current };
    });
  };
  const getDefaultApproverForTier = (tier?: string) => {
    switch (tier) {
      case "solopreneur": return "Owner";
      case "startup": return "Manager";
      case "sme": return "Team Lead";
      case "enterprise": return "Compliance Lead";
      default: return "Manager";
    }
  };

  const addStep = (wf: any, index: number, kind: "agent" | "approval" | "delay" | "branch") => {
    const biz = businesses?.[0];
    const defaultApproval = getDefaultApproverForTier(biz?.tier);
    setEditedPipelines((prev) => {
      const current = prev[wf._id] ? [...prev[wf._id]] : (wf.pipeline || []).map((x: any) => ({ ...x }));
      const base: any = kind === "agent" ? { kind: "agent", title: "New Agent Step", agentPrompt: "" }
        : kind === "approval" ? { kind: "approval", approverRole: defaultApproval }
        : kind === "delay" ? { kind: "delay", delayMinutes: 60 }
        : { kind: "branch", condition: { metric: "metric", op: ">", value: 0 }, onTrueNext: (index + 2), onFalseNext: (index + 3) };
      current.splice(index + 1, 0, base);
      return { ...prev, [wf._id]: current };
    });
  };

  const removeStep = (wf: any, index: number) => {
    setEditedPipelines((prev) => {
      const current = prev[wf._id] ? [...prev[wf._id]] : (wf.pipeline || []).map((x: any) => ({ ...x }));
      if (current.length <= 1) return prev; // keep at least one step
      current.splice(index, 1);
      return { ...prev, [wf._id]: current };
    });
  };

  const moveStep = (wf: any, index: number, delta: number) => {
    setEditedPipelines((prev) => {
      const current = prev[wf._id] ? [...prev[wf._id]] : (wf.pipeline || []).map((x: any) => ({ ...x }));
      const newIndex = index + delta;
      if (newIndex < 0 || newIndex >= current.length) return prev;
      const [item] = current.splice(index, 1);
      current.splice(newIndex, 0, item);
      return { ...prev, [wf._id]: current };
    });
  };

  // Enforce Startup standards on save
  const savePipeline = async (wf: any) => {
    try {
      const pipeline = editedPipelines[wf._id] ?? wf.pipeline;
      const tier = (businesses?.[0]?.tier as string | undefined);

      if (tier === "startup") {
        const issues = getHandoffIssues({ ...wf, pipeline });
        if (issues.length > 0) {
          toast.error("Standards check failed", { description: issues.join(" • ") });
          return;
        }
      } else if (tier === "sme" || tier === "enterprise") {
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
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Orchestration & Workflows</h1>
          <p className="text-sm text-muted-foreground">Manage automated workflows and templates.</p>
        </div>

        <Dialog open={newWorkflowOpen} onOpenChange={setNewWorkflowOpen}>
          <DialogTrigger asChild>
            <Button>New Workflow</Button>
          </DialogTrigger>
          <div className="hidden md:flex items-center gap-2 ml-2">
            <Button variant="outline" onClick={() => setTemplatesOpen(true)}>
              Browse Templates
            </Button>
            <Button variant="secondary" onClick={handleSeedDemoData} disabled={isSeeding}>
              {isSeeding ? "Seeding…" : "Seed Demo Data"}
            </Button>
          </div>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
              <DialogDescription>Configure your automated workflow</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Workflow name"
                  />
                </div>
                <div>
                  <Label htmlFor="trigger">Trigger Type</Label>
                  <Select value={formData.triggerType} onValueChange={(value: any) => setFormData(prev => ({ ...prev, triggerType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="schedule">Schedule</SelectItem>
                      <SelectItem value="webhook">Webhook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                />
              </div>

              {formData.triggerType === "schedule" && (
                <div>
                  <Label htmlFor="cron">Cron Schedule</Label>
                  <Input
                    id="cron"
                    value={formData.cron}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, cron: e.target.value }))}
                    placeholder="0 9 * * 1 (Every Monday at 9 AM)"
                  />
                </div>
              )}

              {formData.triggerType === "webhook" && (
                <div>
                  <Label htmlFor="eventKey">Event Key</Label>
                  <Input
                    id="eventKey"
                    value={formData.eventKey}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, eventKey: e.target.value }))}
                    placeholder="unique-event-key"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="approval"
                  checked={formData.approvalRequired}
                  onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, approvalRequired: checked }))}
                />
                <Label htmlFor="approval">Require Approval</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="template"
                  checked={formData.saveAsTemplate}
                  onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, saveAsTemplate: checked }))}
                />
                <Label htmlFor="template">Save as Template</Label>
              </div>

              {formData.approvalRequired && (
                <div>
                  <Label htmlFor="threshold">Approval Threshold</Label>
                  <Input
                    id="threshold"
                    type="number"
                    value={formData.approvalThreshold}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, approvalThreshold: parseInt(e.target.value) || 1 }))}
                    min="1"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="pipeline">Pipeline (JSON)</Label>
                <Textarea
                  id="pipeline"
                  value={formData.pipeline}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, pipeline: e.target.value }))}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="marketing, automation"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setNewWorkflowOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateWorkflow}>Create Workflow</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={templatesOpen} onOpenChange={setTemplatesOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Templates</DialogTitle>
              <DialogDescription>Search and copy a template into your workspace</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1 relative">
                <Input
                  value={tplSearch}
                  onChange={(e) => setTplSearch(e.target.value)}
                  placeholder="Search templates..."
                />
                <Search className="h-4 w-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              <Select value={tplTier} onValueChange={setTplTier}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="solopreneur">Solopreneur</SelectItem>
                  <SelectItem value="startup">Startup</SelectItem>
                  <SelectItem value="sme">SME</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-xs text-muted-foreground">
              {modalTemplates ? modalTemplates.length : 0} template{(modalTemplates?.length || 0) === 1 ? "" : "s"} found
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {
                /* Recommended for your tier */
              }
              {(() => {
                const tierForReco = (tplTier === "all" ? (businesses?.[0]?.tier || selectedTier) : tplTier) as string | undefined;
                const items = Array.isArray(modalTemplates) ? modalTemplates : [];
                let recommended: any[] = [];

                if (tierForReco === "solopreneur") {
                  recommended = items.filter((t: any) =>
                    (String(t._id || "").includes("brand-booster")) ||
                    (Array.isArray(t.tags) && t.tags.includes("brand-booster"))
                  ).slice(0, 3);
                } else if (tierForReco === "startup") {
                  recommended = items.filter((t: any) =>
                    Array.isArray(t.tags) && (t.tags.includes("standardize") || t.tags.includes("handoff"))
                  ).slice(0, 3);
                }

                if (!recommended.length) return null;
                return (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Recommended for your tier</div>
                    <div className="space-y-2">
                      {recommended.map((t: any) => (
                        <div key={`reco-${t._id}`} className="border rounded-md p-3 bg-muted/30">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-medium truncate">{t.name}</div>
                              {t.description && <div className="text-xs text-muted-foreground truncate">{t.description}</div>}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleCopyTemplate(t)}
                              disabled={!firstBizId || isCopyingId === String(t._id)}
                            >
                              {isCopyingId === String(t._id) ? "Copying…" : "Copy"}
                            </Button>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-3">
                            <span>Steps: {t.pipeline?.length ?? 0}</span>
                            <span>Trigger: {t.trigger?.type ?? "manual"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {(modalTemplates || []).map((t: any) => (
                <div key={t._id} className="border rounded-md p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{t.name}</div>
                      {t.description && <div className="text-xs text-muted-foreground truncate">{t.description}</div>}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleCopyTemplate(t)}
                      disabled={!firstBizId || isCopyingId === String(t._id)}
                    >
                      {isCopyingId === String(t._id) ? "Copying…" : "Copy"}
                    </Button>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground flex items-center gap-3">
                    <span>Steps: {t.pipeline?.length ?? 0}</span>
                    <span>Trigger: {t.trigger?.type ?? "manual"}</span>
                  </div>
                  {Array.isArray(t.tags) && t.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {t.tags.slice(0, 6).map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {(modalTemplates || []).length === 0 && (
                <div className="text-sm text-muted-foreground">No templates match your search.</div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Add search input */}
      <div className="mb-4">
        <Input
          placeholder="Search workflows..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Workflows list with suspense and skeleton */}
      <Suspense fallback={
        <div className="grid gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-3" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
            </Card>
          ))}
        </div>
      }>
        {!workflows ? (
          // Loading skeleton
          <div className="grid gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-3" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </Card>
            ))}
          </div>
        ) : workflows.page?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {debouncedSearch ? "No matching workflows" : "No workflows yet"}
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {workflows.page?.map((workflow: any) => (
                <Card key={workflow._id} className="p-4">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTriggerIcon(workflow.trigger.type)}
                        <CardTitle className="text-lg">{workflow.name}</CardTitle>
                        {workflow.template && <Badge variant="secondary">Template</Badge>}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleSimulate(workflow)}>
                          Simulate
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleComplianceCheck(workflow)}>
                          Check Compliance
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEstimateRoi(workflow)}>
                          Estimate ROI
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setSelectedWorkflow(workflow._id)}>
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Executions
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => toggleExpand(workflow)}>
                          {expanded[workflow._id] ? "Hide" : "Pipeline"}
                        </Button>
                      </div>
                    </div>
                    {workflow.description && (
                      <CardDescription>{workflow.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Steps: {workflow.pipeline?.length ?? 0}</span>
                      <span>Trigger: {workflow.trigger.type}</span>
                      {workflow.trigger.cron && <span>Schedule: {workflow.trigger.cron}</span>}
                      {workflow.trigger.eventKey && <span>Event: {workflow.trigger.eventKey}</span>}
                      {workflow.approval.required && <span>Approval Required</span>}
                    </div>
                    {/* ROI badge */}
                    <div className="mt-2">
                      {(() => {
                        const roi = estimateRoiBadge(workflow);
                        return <Badge variant={roi.variant}>{roi.label}</Badge>;
                      })()}
                    </div>
                    {/* Add: Handoff Health indicator */}
                    {(() => {
                      const issues = getHandoffIssues(workflow);
                      const tier = (businesses?.[0]?.tier as string | undefined);
                      const label = (tier === "sme" || tier === "enterprise") ? "Governance Health" : "Handoff Health";
                      if (issues.length === 0) {
                        return (
                          <div className="mt-2">
                            <Badge variant="secondary" className="text-xs">{label}: Good</Badge>
                          </div>
                        );
                      }
                      return (
                        <div className="mt-2 flex flex-wrap gap-1">
                          <Badge variant="destructive" className="text-xs">{label}: Needs Attention</Badge>
                          {issues.map((it, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{it}</Badge>
                          ))}
                        </div>
                      );
                    })()}
                    {workflow.tags?.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {(workflow.tags ?? []).map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    )}
                    {/* Roles as clickable chips */}
                    {(() => {
                      const roles = extractApproverRoles(workflow);
                      if (!roles.length) return null;
                      return (
                        <div className="mt-2 flex flex-wrap items-center gap-1">
                          {roles.map((r) => (
                            <Button
                              key={r}
                              size="sm"
                              variant={roleFilter === r ? "default" : "outline"}
                              className="h-7"
                              onClick={() => setRoleFilter(r)}
                            >
                              {r}
                            </Button>
                          ))}
                        </div>
                      );
                    })()}
                  </CardContent>

                  {expanded[workflow._id] && (
                    <div className="border-t pt-3 space-y-2">
                      {/* Add: Inline prompt + Quick-add for startup */}
                      {(() => {
                        const tier = (businesses?.[0]?.tier as string | undefined);
                        if (tier !== "startup") return null;
                        const issues = getHandoffIssues(editedPipelines[workflow._id]
                          ? { ...workflow, pipeline: editedPipelines[workflow._id] }
                          : workflow
                        );
                        if (issues.length === 0) return null;
                        return (
                          <div className="p-2 rounded border bg-muted/30">
                            <div className="text-sm font-medium mb-2">Recommended fixes</div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => addApprovalAtEnd(workflow)}>Add Approval</Button>
                              <Button size="sm" variant="outline" onClick={() => addDelayAtEnd(workflow, 60)}>Add SLA Delay (60m)</Button>
                              {!workflow.description || !String(workflow.description).trim() ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    try {
                                      await upsetsWorkflow({
                                        id: workflow._id,
                                        businessId: workflow.businessId,
                                        name: workflow.name,
                                        description: "Standardized startup workflow with approval and SLA buffer.",
                                        trigger: workflow.trigger,
                                        approval: workflow.approval,
                                        pipeline: editedPipelines[workflow._id] ?? workflow.pipeline,
                                        template: !!workflow.template,
                                        tags: workflow.tags || [],
                                      } as any);
                                      toast.success("Added default description");
                                    } catch (e: any) {
                                      toast.error(e?.message || "Failed to set description");
                                    }
                                  }}
                                >
                                  Add Default Description
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })()}

                      {(() => {
                        const tier = (businesses?.[0]?.tier as string | undefined);
                        if (tier !== "sme" && tier !== "enterprise") return null;
                        const working = editedPipelines[workflow._id]
                          ? { ...workflow, pipeline: editedPipelines[workflow._id] }
                          : workflow;

                        const issues = getGovernanceIssues(working, tier);
                        if (issues.length === 0) return null;

                        // Count approvals to decide whether to show second approval quick-add for Enterprise
                        const approvalsCount = (working.pipeline || []).filter((s: any) => (s?.kind || s?.type) === "approval").length;
                        const needSecondApproval = tier === "enterprise" && approvalsCount < 2;

                        const minDelay = tier === "enterprise" ? 60 : 30;

                        return (
                          <div className="p-2 rounded border bg-muted/30">
                            <div className="text-sm font-medium mb-2">Recommended fixes</div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => addApprovalAtEnd(workflow)}>Add Approval</Button>
                              {needSecondApproval && (
                                <Button size="sm" variant="outline" onClick={() => addSecondApprovalAtEnd(workflow)}>Add Second Approval</Button>
                              )}
                              <Button size="sm" variant="outline" onClick={() => addDelayAtEnd(workflow, minDelay)}>
                                Add SLA Delay ({minDelay}m)
                              </Button>
                              {!workflow.description || !String(workflow.description).trim() ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    try {
                                      await upsertWorkflow({
                                        id: workflow._id,
                                        businessId: workflow.businessId,
                                        name: workflow.name,
                                        description: tier === "enterprise"
                                          ? "Enterprise governed workflow with dual approval and SLA."
                                          : "SME governed workflow with approval and SLA.",
                                        trigger: workflow.trigger,
                                        approval: workflow.approval,
                                        pipeline: editedPipelines[workflow._id] ?? workflow.pipeline,
                                        template: !!workflow.template,
                                        tags: workflow.tags || [],
                                      } as any);
                                      toast.success("Added default description");
                                    } catch (e: any) {
                                      toast.error(e?.message || "Failed to set description");
                                    }
                                  }}
                                >
                                  Add Default Description
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })()}

                      {(editedPipelines[workflow._id] ?? workflow.pipeline).map((step: any, idx: number) => {
                        return (
                          <div key={idx} className="flex items-center justify-between p-2 border rounded">
                            <div className="text-sm">
                              <div className="font-medium capitalize">{getStepKind(step)}</div>
                              {getStepKind(step) === "branch" && (
                                <div className="text-xs text-muted-foreground">
                                  IF {step?.condition?.metric} {step?.condition?.op} {String(step?.condition?.value)} THEN → {step?.onTrueNext} ELSE → {step?.onFalseNext}
                                </div>
                              )}
                              {getStepKind(step) === "approval" && (
                                <div className="text-xs text-muted-foreground">Approver: {step?.approverRole || step?.config?.approverRole || "manager"}</div>
                              )}
                              {getStepKind(step) === "delay" && (
                                <div className="text-xs text-muted-foreground">Delay: {step?.delayMinutes || step?.config?.delayMinutes || 0} min</div>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <Input
                                className="h-8 w-64"
                                placeholder="Step title (optional)"
                                value={step?.title || ""}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setStepField(workflow, idx, { title: e.target.value })}
                              />
                              {getStepKind(step) === "approval" && (
                                <Input
                                  className="h-8 w-56"
                                  placeholder="Approver role"
                                  value={step?.approverRole || step?.config?.approverRole || ""}
                                  onChange={(e: ChangeEvent<HTMLInputElement>) => setStepField(workflow, idx, { approverRole: e.target.value })}
                                />
                              )}
                              {getStepKind(step) === "delay" && (
                                <Input
                                  type="number"
                                  className="h-8 w-40"
                                  placeholder="Delay minutes"
                                  value={String(step?.delayMinutes ?? step?.config?.delayMinutes ?? 0)}
                                  onChange={(e: ChangeEvent<HTMLInputElement>) => setStepField(workflow, idx, { delayMinutes: parseInt(e.target.value) || 0 })}
                                />
                              )}
                            </div>
                            {getStepKind(step) === "agent" && (
                              <div className="flex items-center gap-2">
                                <Switch checked={!!step?.mmrRequired} onCheckedChange={(v: boolean) => toggleMMR(workflow, idx, !!v)} id={`mmr-${workflow._id}-${idx}`} />
                                <Label htmlFor={`mmr-${workflow._id}-${idx}`}>Require human review</Label>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="outline" onClick={() => addStep(workflow, idx, "agent")}>+Agent</Button>
                              <Button size="sm" variant="outline" onClick={() => addStep(workflow, idx, "approval")}>+Approval</Button>
                              <Button size="sm" variant="outline" onClick={() => addStep(workflow, idx, "delay")}>+Delay</Button>
                              <Button size="sm" variant="outline" onClick={() => addStep(workflow, idx, "branch")}>+Branch</Button>
                              <Button size="sm" variant="outline" onClick={() => moveStep(workflow, idx, -1)}>Up</Button>
                              <Button size="sm" variant="outline" onClick={() => moveStep(workflow, idx, 1)}>Down</Button>
                              <Button size="sm" variant="destructive" onClick={() => removeStep(workflow, idx)}>Remove</Button>
                            </div>
                          </div>
                        );
                      })}
                      {/* Top-level quick-add toolbar */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button size="sm" variant="outline" onClick={() => addApprovalAtEnd(workflow)}>Add Approval</Button>
                        {(() => {
                          const tier = (businesses?.[0]?.tier as string | undefined);
                          if (tier === "enterprise") {
                            return (
                              <Button size="sm" variant="outline" onClick={() => addSecondApprovalAtEnd(workflow)}>
                                Add Second Approval
                              </Button>
                            );
                          }
                          return null;
                        })()}
                        <Button size="sm" variant="outline" onClick={() => {
                          const tier = (businesses?.[0]?.tier as string | undefined);
                          const minDelay = tier === "enterprise" ? 60 : 30;
                          addDelayAtEnd(workflow, minDelay);
                        }}>
                          Add SLA Delay
                        </Button>
                        <Button size="sm" onClick={() => savePipeline(workflow)}>Save pipeline</Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
            
            {/* Load more button */}
            {!workflows.isDone && (
              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  onClick={() => setWorkflowsCursor(workflows.continueCursor)}
                >
                  Load More Workflows
                </Button>
              </div>
            )}
          </>
        )}
      </Suspense>

      {(() => {
        const tier = (businesses?.[0]?.tier as string | undefined);
        if (tier !== "startup") return null;
        const list = Array.isArray(workflows) ? workflows : [];
        const hasApproval = list.some((wf: any) => {
          const steps = wf?.pipeline || [];
          return steps.some((s: any) => (s?.kind || s?.type) === "approval");
        });
        const rolesDefined = list.some((wf: any) => {
          const steps = wf?.pipeline || [];
          return steps.some((s: any) => {
            const k = s?.kind || s?.type;
            const role = s?.approverRole || s?.config?.approverRole;
            return k === "approval" && !!role;
          });
        });
        const hasSlaDelay = list.some((wf: any) => {
          const steps = wf?.pipeline || [];
          return steps.some((s: any) => (s?.kind || s?.type) === "delay" && ((s?.delayMinutes ?? s?.config?.delayMinutes ?? 0) > 0));
        });
        const hasDescriptions = list.every((wf: any) => !!(wf?.description && String(wf.description).trim().length > 0));

        const items = [
          { label: "At least one approval step", pass: hasApproval },
          { label: "Approver roles filled", pass: rolesDefined },
          { label: "SLA buffer (delay) present", pass: hasSlaDelay },
          { label: "Workflow descriptions added", pass: hasDescriptions },
        ];

        return (
          <div className="border rounded-md p-3 bg-muted/20">
            <div className="text-sm font-medium mb-2">Consistency & Alignment</div>
            <div className="grid gap-1">
              {items.map((it, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>{it.label}</span>
                  <Badge variant={it.pass ? "default" : "destructive"} className="text-[10px]">
                    {it.pass ? "OK" : "Missing"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {(() => {
        const tier = (businesses?.[0]?.tier as string | undefined);
        if (tier !== "sme" && tier !== "enterprise") return null;
        const list: any[] = Array.isArray(workflows) ? workflows : [];

        const allHaveApproval = list.length > 0 && list.every((wf) => {
          const steps = wf?.pipeline || [];
          return steps.some((s: any) => (s?.kind || s?.type) === "approval");
        });

        const allRolesDefined = list.length > 0 && list.every((wf) => {
          const steps = wf?.pipeline || [];
          return steps.every((s: any) => {
            const k = s?.kind || s?.type;
            if (k !== "approval") return true;
            const role = s?.approverRole || s?.config?.approverRole;
            return !!role;
          });
        });

        const minDelay = tier === "enterprise" ? 60 : 30;
        const allHaveSla = list.length > 0 && list.every((wf) => {
          const steps = wf?.pipeline || [];
          return steps.some((s: any) => {
            const k = s?.kind || s?.type;
            const delay = s?.delayMinutes ?? s?.config?.delayMinutes ?? 0;
            return k === "delay" && delay >= minDelay;
          });
        });

        const allDescribed = list.length > 0 && list.every((wf) => !!(wf?.description && String(wf.description).trim().length > 0));

        const enterpriseApprovalsOk = tier !== "enterprise" || (list.length > 0 && list.every((wf) => {
          const threshold = wf?.approval?.threshold ?? 0;
          const approvals = (wf?.pipeline || []).filter((s: any) => (s?.kind || s?.type) === "approval").length;
          return threshold >= 2 || approvals >= 2;
        }));

        const items = [
          { label: "Approval steps present", pass: allHaveApproval },
          { label: "Approver roles filled", pass: allRolesDefined },
          { label: `SLA delay present (≥ ${minDelay}m)`, pass: allHaveSla },
          { label: "Descriptions added", pass: allDescribed },
          ...(tier === "enterprise" ? [{ label: "Multi-approver (≥ 2)", pass: enterpriseApprovalsOk }] : []),
        ];

        return (
          <div className="border rounded-md p-3 bg-muted/20">
            <div className="text-sm font-medium mb-2">Governance Policy</div>
            <div className="grid gap-1">
              {items.map((it, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>{it.label}</span>
                  <Badge variant={it.pass ? "default" : "destructive"} className="text-[10px]">
                    {it.pass ? "OK" : "Missing"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Workflows</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Add: Role filter control */}
          {(() => {
            const list: any[] = Array.isArray(workflows) ? workflows : [];
            const roleSet = new Set<string>();
            for (const wf of list) {
              for (const r of extractApproverRoles(wf)) roleSet.add(r);
            }
            const roles = Array.from(roleSet).sort((a, b) => a.localeCompare(b));
            return (
              <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground">Filter by approver role:</div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Approver role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    {roles.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {roleFilter !== "all" && (
                  <Button size="sm" variant="outline" onClick={() => setRoleFilter("all")}>
                    Clear role filter
                  </Button>
                )}
              </div>
            );
          })()}

          <div className="grid gap-4">
            {(() => {
              const list: any[] = Array.isArray(workflows) ? workflows : [];
              const filtered = roleFilter === "all"
                ? list
                : list.filter((wf: any) => extractApproverRoles(wf).includes(roleFilter));
              return filtered.map((workflow: any) => (
                <Card key={workflow._id} className="p-4">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTriggerIcon(workflow.trigger.type)}
                        <CardTitle className="text-lg">{workflow.name}</CardTitle>
                        {workflow.template && <Badge variant="secondary">Template</Badge>}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleSimulate(workflow)}>
                          Simulate
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleComplianceCheck(workflow)}>
                          Check Compliance
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEstimateRoi(workflow)}>
                          Estimate ROI
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setSelectedWorkflow(workflow._id)}>
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Executions
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => toggleExpand(workflow)}>
                          {expanded[workflow._id] ? "Hide" : "Pipeline"}
                        </Button>
                      </div>
                    </div>
                    {workflow.description && (
                      <CardDescription>{workflow.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Steps: {workflow.pipeline?.length ?? 0}</span>
                      <span>Trigger: {workflow.trigger.type}</span>
                      {workflow.trigger.cron && <span>Schedule: {workflow.trigger.cron}</span>}
                      {workflow.trigger.eventKey && <span>Event: {workflow.trigger.eventKey}</span>}
                      {workflow.approval.required && <span>Approval Required</span>}
                    </div>
                    {/* ROI badge */}
                    <div className="mt-2">
                      {(() => {
                        const roi = estimateRoiBadge(workflow);
                        return <Badge variant={roi.variant}>{roi.label}</Badge>;
                      })()}
                    </div>
                    {/* Add: Handoff Health indicator */}
                    {(() => {
                      const issues = getHandoffIssues(workflow);
                      const tier = (businesses?.[0]?.tier as string | undefined);
                      const label = (tier === "sme" || tier === "enterprise") ? "Governance Health" : "Handoff Health";
                      if (issues.length === 0) {
                        return (
                          <div className="mt-2">
                            <Badge variant="secondary" className="text-xs">{label}: Good</Badge>
                          </div>
                        );
                      }
                      return (
                        <div className="mt-2 flex flex-wrap gap-1">
                          <Badge variant="destructive" className="text-xs">{label}: Needs Attention</Badge>
                          {issues.map((it, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{it}</Badge>
                          ))}
                        </div>
                      );
                    })()}
                    {workflow.tags?.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {(workflow.tags ?? []).map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    )}
                    {/* Roles as clickable chips */}
                    {(() => {
                      const roles = extractApproverRoles(workflow);
                      if (!roles.length) return null;
                      return (
                        <div className="mt-2 flex flex-wrap items-center gap-1">
                          {roles.map((r) => (
                            <Button
                              key={r}
                              size="sm"
                              variant={roleFilter === r ? "default" : "outline"}
                              className="h-7"
                              onClick={() => setRoleFilter(r)}
                            >
                              {r}
                            </Button>
                          ))}
                        </div>
                      );
                    })()}
                  </CardContent>

                  {expanded[workflow._id] && (
                    <div className="border-t pt-3 space-y-2">
                      {/* Add: Inline prompt + Quick-add for startup */}
                      {(() => {
                        const tier = (businesses?.[0]?.tier as string | undefined);
                        if (tier !== "startup") return null;
                        const issues = getHandoffIssues(editedPipelines[workflow._id]
                          ? { ...workflow, pipeline: editedPipelines[workflow._id] }
                          : workflow
                        );
                        if (issues.length === 0) return null;
                        return (
                          <div className="p-2 rounded border bg-muted/30">
                            <div className="text-sm font-medium mb-2">Recommended fixes</div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => addApprovalAtEnd(workflow)}>Add Approval</Button>
                              <Button size="sm" variant="outline" onClick={() => addDelayAtEnd(workflow, 60)}>Add SLA Delay (60m)</Button>
                              {!workflow.description || !String(workflow.description).trim() ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    try {
                                      await upsertWorkflow({
                                        id: workflow._id,
                                        businessId: workflow.businessId,
                                        name: workflow.name,
                                        description: "Standardized startup workflow with approval and SLA buffer.",
                                        trigger: workflow.trigger,
                                        approval: workflow.approval,
                                        pipeline: editedPipelines[workflow._id] ?? workflow.pipeline,
                                        template: !!workflow.template,
                                        tags: workflow.tags || [],
                                      } as any);
                                      toast.success("Added default description");
                                    } catch (e: any) {
                                      toast.error(e?.message || "Failed to set description");
                                    }
                                  }}
                                >
                                  Add Default Description
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })()}

                      {(() => {
                        const tier = (businesses?.[0]?.tier as string | undefined);
                        if (tier !== "sme" && tier !== "enterprise") return null;
                        const working = editedPipelines[workflow._id]
                          ? { ...workflow, pipeline: editedPipelines[workflow._id] }
                          : workflow;

                        const issues = getGovernanceIssues(working, tier);
                        if (issues.length === 0) return null;

                        // Count approvals to decide whether to show second approval quick-add for Enterprise
                        const approvalsCount = (working.pipeline || []).filter((s: any) => (s?.kind || s?.type) === "approval").length;
                        const needSecondApproval = tier === "enterprise" && approvalsCount < 2;

                        const minDelay = tier === "enterprise" ? 60 : 30;

                        return (
                          <div className="p-2 rounded border bg-muted/30">
                            <div className="text-sm font-medium mb-2">Recommended fixes</div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => addApprovalAtEnd(workflow)}>Add Approval</Button>
                              {needSecondApproval && (
                                <Button size="sm" variant="outline" onClick={() => addSecondApprovalAtEnd(workflow)}>Add Second Approval</Button>
                              )}
                              <Button size="sm" variant="outline" onClick={() => addDelayAtEnd(workflow, minDelay)}>
                                Add SLA Delay ({minDelay}m)
                              </Button>
                              {!workflow.description || !String(workflow.description).trim() ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    try {
                                      await upsertWorkflow({
                                        id: workflow._id,
                                        businessId: workflow.businessId,
                                        name: workflow.name,
                                        description: tier === "enterprise"
                                          ? "Enterprise governed workflow with dual approval and SLA."
                                          : "SME governed workflow with approval and SLA.",
                                        trigger: workflow.trigger,
                                        approval: workflow.approval,
                                        pipeline: editedPipelines[workflow._id] ?? workflow.pipeline,
                                        template: !!workflow.template,
                                        tags: workflow.tags || [],
                                      } as any);
                                      toast.success("Added default description");
                                    } catch (e: any) {
                                      toast.error(e?.message || "Failed to set description");
                                    }
                                  }}
                                >
                                  Add Default Description
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })()}

                      {(editedPipelines[workflow._id] ?? workflow.pipeline).map((step: any, idx: number) => {
                        return (
                          <div key={idx} className="flex items-center justify-between p-2 border rounded">
                            <div className="text-sm">
                              <div className="font-medium capitalize">{getStepKind(step)}</div>
                              {getStepKind(step) === "branch" && (
                                <div className="text-xs text-muted-foreground">
                                  IF {step?.condition?.metric} {step?.condition?.op} {String(step?.condition?.value)} THEN → {step?.onTrueNext} ELSE → {step?.onFalseNext}
                                </div>
                              )}
                              {getStepKind(step) === "approval" && (
                                <div className="text-xs text-muted-foreground">Approver: {step?.approverRole || step?.config?.approverRole || "manager"}</div>
                              )}
                              {getStepKind(step) === "delay" && (
                                <div className="text-xs text-muted-foreground">Delay: {step?.delayMinutes || step?.config?.delayMinutes || 0} min</div>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <Input
                                className="h-8 w-64"
                                placeholder="Step title (optional)"
                                value={step?.title || ""}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setStepField(workflow, idx, { title: e.target.value })}
                              />
                              {getStepKind(step) === "approval" && (
                                <Input
                                  className="h-8 w-56"
                                  placeholder="Approver role"
                                  value={step?.approverRole || step?.config?.approverRole || ""}
                                  onChange={(e: ChangeEvent<HTMLInputElement>) => setStepField(workflow, idx, { approverRole: e.target.value })}
                                />
                              )}
                              {getStepKind(step) === "delay" && (
                                <Input
                                  type="number"
                                  className="h-8 w-40"
                                  placeholder="Delay minutes"
                                  value={String(step?.delayMinutes ?? step?.config?.delayMinutes ?? 0)}
                                  onChange={(e: ChangeEvent<HTMLInputElement>) => setStepField(workflow, idx, { delayMinutes: parseInt(e.target.value) || 0 })}
                                />
                              )}
                            </div>
                            {getStepKind(step) === "agent" && (
                              <div className="flex items-center gap-2">
                                <Switch checked={!!step?.mmrRequired} onCheckedChange={(v: boolean) => toggleMMR(workflow, idx, !!v)} id={`mmr-${workflow._id}-${idx}`} />
                                <Label htmlFor={`mmr-${workflow._id}-${idx}`}>Require human review</Label>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="outline" onClick={() => addStep(workflow, idx, "agent")}>+Agent</Button>
                              <Button size="sm" variant="outline" onClick={() => addStep(workflow, idx, "approval")}>+Approval</Button>
                              <Button size="sm" variant="outline" onClick={() => addStep(workflow, idx, "delay")}>+Delay</Button>
                              <Button size="sm" variant="outline" onClick={() => addStep(workflow, idx, "branch")}>+Branch</Button>
                              <Button size="sm" variant="outline" onClick={() => moveStep(workflow, idx, -1)}>Up</Button>
                              <Button size="sm" variant="outline" onClick={() => moveStep(workflow, idx, 1)}>Down</Button>
                              <Button size="sm" variant="destructive" onClick={() => removeStep(workflow, idx)}>Remove</Button>
                            </div>
                          </div>
                        );
                      })}
                      {/* Top-level quick-add toolbar */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button size="sm" variant="outline" onClick={() => addApprovalAtEnd(workflow)}>Add Approval</Button>
                        {(() => {
                          const tier = (businesses?.[0]?.tier as string | undefined);
                          if (tier === "enterprise") {
                            return (
                              <Button size="sm" variant="outline" onClick={() => addSecondApprovalAtEnd(workflow)}>
                                Add Second Approval
                              </Button>
                            );
                          }
                          return null;
                        })()}
                        <Button size="sm" variant="outline" onClick={() => {
                          const tier = (businesses?.[0]?.tier as string | undefined);
                          const minDelay = tier === "enterprise" ? 60 : 30;
                          addDelayAtEnd(workflow, minDelay);
                        }}>
                          Add SLA Delay
                        </Button>
                        <Button size="sm" onClick={() => savePipeline(workflow)}>Save pipeline</Button>
                      </div>
                    </div>
                  )}
                </Card>
              ));
            })()}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {selectedWorkflow && executions && (
            <Card>
              <CardHeader>
                <CardTitle>Execution History</CardTitle>
                <CardDescription>Recent workflow executions and metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Add: Analytics (lite) summary */}
                {(() => {
                  const page: any[] = executions.page || [];
                  const total = page.length;
                  const succeeded = page.filter((e: any) => e.status === "succeeded").length;
                  const successRate = total > 0 ? Math.round((succeeded / total) * 100) : 0;
                  const roiVals = page.map((e: any) => (typeof e?.metrics?.roi === "number" ? e.metrics.roi : null)).filter((v) => v !== null) as number[];
                  const avgRoi = roiVals.length ? (roiVals.reduce((a, b) => a + b, 0) / roiVals.length) : null;
                  const last = page[0];

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                      <div className="p-3 border rounded">
                        <div className="text-xs text-muted-foreground">Total Runs</div>
                        <div className="text-xl font-semibold">{total}</div>
                      </div>
                      <div className="p-3 border rounded">
                        <div className="text-xs text-muted-foreground">Success Rate</div>
                        <div className="text-xl font-semibold">{successRate}%</div>
                      </div>
                      <div className="p-3 border rounded">
                        <div className="text-xs text-muted-foreground">Avg ROI</div>
                        <div className="text-xl font-semibold">{avgRoi !== null ? avgRoi.toFixed(2) : "n/a"}</div>
                      </div>
                      {last && (
                        <div className="sm:col-span-3 p-3 border rounded">
                          <div className="text-xs text-muted-foreground">Last Run</div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm">
                              {new Date(last._creationTime).toLocaleString()} • {last.mode} mode
                            </div>
                            <Badge variant={last.status === "succeeded" ? "default" : "destructive"}>{last.status}</Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Existing history list */}
                <div className="space-y-4">
                  {executions.page.map((execution: any) => (
                    <div key={execution._id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{execution.summary}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(execution._creationTime).toLocaleString()} • {execution.mode} mode
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={execution.status === "succeeded" ? "default" : "destructive"}>
                          {execution.status}
                        </Badge>
                        <div className="text-sm text-muted-foreground mt-1">
                          ROI: {typeof execution?.metrics?.roi === "number" ? `${execution.metrics.roi.toFixed(2)}` : "n/a"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!selectedWorkflow && (
            <Card>
              <CardHeader>
                <CardTitle>Select a Workflow</CardTitle>
                <CardDescription>Choose a workflow from the "All Workflows" tab to view analytics</CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}