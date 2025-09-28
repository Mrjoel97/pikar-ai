import React, { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from "@/components/ui/drawer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Pencil, Power, PowerOff, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DatasetCreator from "./DatasetCreator";

type Agent = {
  _id: string;
  agent_key: string;
  display_name: string;
  short_desc: string;
  long_desc: string;
  capabilities: string[];
  default_model: string;
  model_routing: string;
  prompt_template_version: string;
  prompt_templates: string;
  input_schema: string;
  output_schema: string;
  tier_restrictions: string[];
  confidence_hint: number;
  active: boolean;
  createdAt: number;
  updatedAt?: number;
};

type Playbook = {
  _id: string;
  playbook_key: string;
  display_name: string;
  version: string;
  triggers: any;
  input_schema: any;
  output_schema: any;
  steps: any;
  metadata: any;
  active: boolean;
};

// Expand built-in defaults to 10 agents
const DEFAULT_AGENTS: Agent[] = [
  {
    _id: "virtual-content",
    agent_key: "content_creator",
    display_name: "Content Creator",
    short_desc: "Generates blogs, emails, and posts from briefs.",
    long_desc: "Built-in agent for content drafting across channels.",
    capabilities: ["drafting", "rewrite", "summarize"],
    default_model: "gpt-4o-mini",
    model_routing: "default",
    prompt_template_version: "v1",
    prompt_templates: "",
    input_schema: "{}",
    output_schema: "{}",
    tier_restrictions: [],
    confidence_hint: 0.85,
    active: true,
    createdAt: Date.now(),
  },
  {
    _id: "virtual-sales",
    agent_key: "sales_intelligence",
    display_name: "Sales Intelligence",
    short_desc: "Prospects, enriches leads, and drafts outreach.",
    long_desc: "Finds leads, enriches with context, and drafts outreach.",
    capabilities: ["prospect", "enrich", "outreach"],
    default_model: "gpt-4o-mini",
    model_routing: "default",
    prompt_template_version: "v1",
    prompt_templates: "",
    input_schema: "{}",
    output_schema: "{}",
    tier_restrictions: ["startup", "sme", "enterprise"],
    confidence_hint: 0.8,
    active: true,
    createdAt: Date.now(),
  },
  {
    _id: "virtual-support",
    agent_key: "customer_support",
    display_name: "Customer Support",
    short_desc: "Triage and reply suggestions for inbound emails.",
    long_desc: "Assists with quick triage and reply drafting.",
    capabilities: ["triage", "reply_suggest"],
    default_model: "gpt-4o-mini",
    model_routing: "default",
    prompt_template_version: "v1",
    prompt_templates: "",
    input_schema: "{}",
    output_schema: "{}",
    tier_restrictions: ["solopreneur", "startup"],
    confidence_hint: 0.78,
    active: true,
    createdAt: Date.now(),
  },
  {
    _id: "virtual-analytics",
    agent_key: "analytics_insights",
    display_name: "Analytics Insights",
    short_desc: "Generates concise KPI insights and deltas.",
    long_desc: "Summarizes KPIs and highlights anomalies with suggested actions.",
    capabilities: ["summarize", "insight", "alert"],
    default_model: "gpt-4o-mini",
    model_routing: "default",
    prompt_template_version: "v1",
    prompt_templates: "",
    input_schema: "{}",
    output_schema: "{}",
    tier_restrictions: ["startup", "sme", "enterprise"],
    confidence_hint: 0.82,
    active: true,
    createdAt: Date.now(),
  },
  {
    _id: "virtual-governance",
    agent_key: "governance_guard",
    display_name: "Governance Guard",
    short_desc: "Checks workflows for policy compliance.",
    long_desc: "Validates approval chains, SLA floors, and role diversity.",
    capabilities: ["validate", "recommend_fixes"],
    default_model: "gpt-4o-mini",
    model_routing: "default",
    prompt_template_version: "v1",
    prompt_templates: "",
    input_schema: "{}",
    output_schema: "{}",
    tier_restrictions: ["sme", "enterprise"],
    confidence_hint: 0.84,
    active: true,
    createdAt: Date.now(),
  },
  {
    _id: "virtual-router",
    agent_key: "agent_router",
    display_name: "Agent Router",
    short_desc: "Routes prompts to best-suited agents.",
    long_desc: "Classifies intent and dispatches to specialized agents.",
    capabilities: ["route", "classify"],
    default_model: "gpt-4o-mini",
    model_routing: "default",
    prompt_template_version: "v1",
    prompt_templates: "",
    input_schema: "{}",
    output_schema: "{}",
    tier_restrictions: [],
    confidence_hint: 0.83,
    active: true,
    createdAt: Date.now(),
  },
  {
    _id: "virtual-campaigns",
    agent_key: "campaign_planner",
    display_name: "Campaign Planner",
    short_desc: "Plans multi-step content campaigns.",
    long_desc: "Generates calendars, themes, and CTAs across channels.",
    capabilities: ["plan", "calendar", "cta"],
    default_model: "gpt-4o-mini",
    model_routing: "default",
    prompt_template_version: "v1",
    prompt_templates: "",
    input_schema: "{}",
    output_schema: "{}",
    tier_restrictions: ["solopreneur", "startup", "sme"],
    confidence_hint: 0.79,
    active: true,
    createdAt: Date.now(),
  },
  {
    _id: "virtual-research",
    agent_key: "market_researcher",
    display_name: "Market Researcher",
    short_desc: "Synthesizes market trends and competitor notes.",
    long_desc: "Pulls structured insights and highlights positioning gaps.",
    capabilities: ["summarize", "compare", "position"],
    default_model: "gpt-4o-mini",
    model_routing: "default",
    prompt_template_version: "v1",
    prompt_templates: "",
    input_schema: "{}",
    output_schema: "{}",
    tier_restrictions: ["startup", "sme", "enterprise"],
    confidence_hint: 0.8,
    active: true,
    createdAt: Date.now(),
  },
  {
    _id: "virtual-ops",
    agent_key: "ops_optimizer",
    display_name: "Ops Optimizer",
    short_desc: "Suggests process improvements and SOP drafts.",
    long_desc: "Analyzes handoffs, SLAs, and proposes risk-reducing tweaks.",
    capabilities: ["optimize", "document"],
    default_model: "gpt-4o-mini",
    model_routing: "default",
    prompt_template_version: "v1",
    prompt_templates: "",
    input_schema: "{}",
    output_schema: "{}",
    tier_restrictions: ["sme", "enterprise"],
    confidence_hint: 0.81,
    active: true,
    createdAt: Date.now(),
  },
  {
    _id: "virtual-finance",
    agent_key: "finance_advisor",
    display_name: "Finance Advisor",
    short_desc: "Creates lightweight forecasts and cashflow summaries.",
    long_desc: "Turns KPIs into high-level forecasts and guardrails.",
    capabilities: ["forecast", "summarize"],
    default_model: "gpt-4o-mini",
    model_routing: "default",
    prompt_template_version: "v1",
    prompt_templates: "",
    input_schema: "{}",
    output_schema: "{}",
    tier_restrictions: ["sme", "enterprise"],
    confidence_hint: 0.77,
    active: true,
    createdAt: Date.now(),
  },
  {
    _id: "virtual-retention",
    agent_key: "retention_coach",
    display_name: "Retention Coach",
    short_desc: "Suggests offers and content to reduce churn.",
    long_desc: "Analyzes signals and proposes targeted outreach.",
    capabilities: ["analyze", "recommend"],
    default_model: "gpt-4o-mini",
    model_routing: "default",
    prompt_template_version: "v1",
    prompt_templates: "",
    input_schema: "{}",
    output_schema: "{}",
    tier_restrictions: ["solopreneur", "startup"],
    confidence_hint: 0.8,
    active: true,
    createdAt: Date.now(),
  },
  {
    _id: "virtual-strategy",
    agent_key: "strategic_planner",
    display_name: "Strategic Planner",
    short_desc: "Creates strategic plans and alignment roadmaps.",
    long_desc: "Generates multi-horizon strategies with milestones and alignment guidance.",
    capabilities: ["plan", "roadmap", "align"],
    default_model: "gpt-4o-mini",
    model_routing: "default",
    prompt_template_version: "v1",
    prompt_templates: "",
    input_schema: "{}",
    output_schema: "{}",
    tier_restrictions: ["startup", "sme", "enterprise"],
    confidence_hint: 0.81,
    active: true,
    createdAt: Date.now(),
  },
  // Added: Data Analysis Agent
  {
    _id: "virtual-data-analysis",
    agent_key: "data_analysis",
    display_name: "Data Analysis Agent",
    short_desc: "ETL, anomaly detection, forecasting, NL reports, and embedding-backed search.",
    long_desc: "Performs ETL/unification, anomaly detection, demand forecasting, automated natural-language reports/dashboards, and vector-backed search for insights.",
    capabilities: ["etl", "anomaly_detect", "forecast", "nl_reports", "vector_search"],
    default_model: "gpt-4o-mini",
    model_routing: "default",
    prompt_template_version: "v1",
    prompt_templates: "",
    input_schema: "{}",
    output_schema: "{}",
    tier_restrictions: ["startup", "sme", "enterprise"],
    confidence_hint: 0.83,
    active: true,
    createdAt: Date.now(),
  },
  // Added: Marketing Automation Agent
  {
    _id: "virtual-marketing-automation",
    agent_key: "marketing_automation",
    display_name: "Marketing Automation Agent",
    short_desc: "Attribution, optimization, personalization, lifecycle automation, and budget allocation.",
    long_desc: "Handles multi-touch attribution, campaign optimization, personalization engine, lifecycle automation, and budget allocation suggestions.",
    capabilities: ["attribution", "optimize", "personalize", "lifecycle", "budget"],
    default_model: "gpt-4o-mini",
    model_routing: "default",
    prompt_template_version: "v1",
    prompt_templates: "",
    input_schema: "{}",
    output_schema: "{}",
    tier_restrictions: ["solopreneur", "startup", "sme"],
    confidence_hint: 0.81,
    active: true,
    createdAt: Date.now(),
  },
  // Added: Financial Analysis Agent
  {
    _id: "virtual-financial-analysis",
    agent_key: "financial_analysis",
    display_name: "Financial Analysis Agent",
    short_desc: "Cash flow & revenue forecasting, pricing, Monte Carlo scenarios, profitability analysis.",
    long_desc: "Generates cash-flow and revenue forecasts, recommends pricing, runs Monte Carlo scenario modeling, and analyzes project profitability.",
    capabilities: ["cashflow_forecast", "pricing", "monte_carlo", "profitability"],
    default_model: "gpt-4o-mini",
    model_routing: "default",
    prompt_template_version: "v1",
    prompt_templates: "",
    input_schema: "{}",
    output_schema: "{}",
    tier_restrictions: ["sme", "enterprise"],
    confidence_hint: 0.8,
    active: true,
    createdAt: Date.now(),
  },
  // Added: Compliance & Risk Agent
  {
    _id: "virtual-compliance-risk",
    agent_key: "compliance_risk",
    display_name: "Compliance & Risk Agent",
    short_desc: "Regulatory monitoring, policy enforcement, risk scoring, reports, audit trails.",
    long_desc: "Monitors regulations, enforces policies, calculates risk scores, generates regulatory reports, and maintains audit trails.",
    capabilities: ["reg_monitor", "policy_enforce", "risk_score", "reports", "audit_trail"],
    default_model: "gpt-4o-mini",
    model_routing: "default",
    prompt_template_version: "v1",
    prompt_templates: "",
    input_schema: "{}",
    output_schema: "{}",
    tier_restrictions: ["sme", "enterprise"],
    confidence_hint: 0.82,
    active: true,
    createdAt: Date.now(),
  },
  // Added: HR & Recruitment Agent
  {
    _id: "virtual-hr-recruitment",
    agent_key: "hr_recruitment",
    display_name: "HR & Recruitment Agent",
    short_desc: "Candidate screening, role-fit scoring, pipeline optimization, retention risk, training plans.",
    long_desc: "Screens candidates, scores role fit, optimizes hiring pipelines, predicts retention risks, and suggests onboarding/training plans.",
    capabilities: ["screen", "fit_score", "pipeline", "retention_risk", "training_plan"],
    default_model: "gpt-4o-mini",
    model_routing: "default",
    prompt_template_version: "v1",
    prompt_templates: "",
    input_schema: "{}",
    output_schema: "{}",
    tier_restrictions: ["startup", "sme", "enterprise"],
    confidence_hint: 0.79,
    active: true,
    createdAt: Date.now(),
  },
];

const DEFAULT_PLAYBOOKS: Playbook[] = [
  {
    _id: "virtual-playbook-1",
    playbook_key: "weekly_newsletter",
    display_name: "Weekly Newsletter",
    version: "v1",
    triggers: [{ type: "cron", schedule: "weekly" }],
    input_schema: {},
    output_schema: {},
    steps: [{ type: "agent", agent_key: "content_creator", action: "draft_email" }],
    metadata: { category: "marketing" },
    active: true,
  },
  {
    _id: "virtual-playbook-2",
    playbook_key: "lead_followup",
    display_name: "Lead Follow-Up",
    version: "v1",
    triggers: [{ type: "event", event: "new_lead" }],
    input_schema: {},
    output_schema: {},
    steps: [{ type: "agent", agent_key: "sales_intelligence", action: "draft_sequence" }],
    metadata: { category: "sales" },
    active: true,
  },
];

export function SystemAgentsHub() {
  const [activeTab, setActiveTab] = useState("catalog");
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [editingPlaybook, setEditingPlaybook] = useState<Playbook | null>(null);
  const [selectedAgentKey, setSelectedAgentKey] = useState<string>("");
  const [trainForm, setTrainForm] = useState<Partial<Agent> | null>(null);
  const [testPrompt, setTestPrompt] = useState<string>("");
  const [expectedContains, setExpectedContains] = useState<string>("");
  const [createdSetId, setCreatedSetId] = useState<string | null>(null);
  const [viewRunsSetId, setViewRunsSetId] = useState<string | null>(null);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [playbookVersionsOpen, setPlaybookVersionsOpen] = useState(false);
  const [selectedPlaybookKey, setSelectedPlaybookKey] = useState<string>("");

  // Bootstrap removed; defaults are shown without backend persistence

  // Queries
  const agents = useQuery(api.aiAgents.adminListAgents, {
    activeOnly: activeFilter === "active" ? true : activeFilter === "inactive" ? false : undefined,
    tier: tierFilter === "all" ? undefined : tierFilter,
  });

  const playbooks = useQuery(api.playbooks.adminListPlaybooks, {
    activeOnly: activeFilter === "active" ? true : activeFilter === "inactive" ? false : undefined,
  });

  const agentVersions = useQuery(
    api.aiAgents.adminListAgentVersions,
    selectedAgentKey ? { agent_key: selectedAgentKey, limit: 25 } as any : undefined
  );

  const datasets = useQuery(api.agentDatasets.adminListDatasets, {});

  // Playbook versions query
  const playbookVersions = useQuery(
    api.playbooks.adminListPlaybookVersions,
    selectedPlaybookKey ? ({ playbook_key: selectedPlaybookKey, limit: 25 } as any) : undefined
  );

  // Evaluations data
  const evalSets = useQuery(api.evals.listSets, {});
  const evalSummary = useQuery(api.evals.latestSummary, {});
  const evalRuns = useQuery(
    api.evals.listRunsBySet,
    viewRunsSetId ? { setId: viewRunsSetId } as any : undefined
  );

  // Mutations
  const upsertAgent = useMutation(api.aiAgents.adminUpsertAgent);
  const toggleAgent = useMutation(api.aiAgents.adminToggleAgent);
  const upsertPlaybook = useMutation(api.playbooks.adminUpsertPlaybook);
  const togglePlaybook = useMutation(api.playbooks.adminTogglePlaybook);
  const publishAgent = useMutation(api.aiAgents.adminPublishAgent);
  const rollbackAgent = useMutation(api.aiAgents.adminRollbackAgent);
  const publishPlaybook = useMutation(api.playbooks.adminPublishPlaybook);
  const rollbackPlaybook = useMutation(api.playbooks.adminRollbackPlaybook);
  // removed seeding actions

  // Evaluation actions
  const createEvalSet = useMutation(api.evals.createSet);
  const runEvalSet = useAction(api.evals.runSet);

  // Vector & config operations (remove nonexistent KGraph ingestion)
  const ingestVectors = useMutation(api.vectors.adminIngestChunks);
  // Removed: const ingestKgraph = useMutation(api.kgraph.adminIngestFromDataset);
  // Removed unused duplicate: const updateAgentConfig = useMutation(api.aiAgents.adminUpdateAgentConfig);

  // FIX: Use correct module names for dataset mutations
  const createDataset = useMutation(api.agentDatasets.adminCreateDataset);
  const linkDataset = useMutation(api.agentDatasets.adminLinkDataset);
  const unlinkDataset = useMutation(api.agentDatasets.adminUnlinkDataset);

  // Playbook version restore mutation
  const restorePlaybookVersion = useMutation(api.playbooks.adminRestorePlaybookVersion);

  // FIX: Use correct function for agent version restoration
  const restoreAgentVersion = useMutation(api.aiAgents.adminRestoreAgentVersion);

  // Helper: determine if an agent is virtual (not yet persisted)
  const isVirtualAgent = (a: Agent | undefined | null) =>
    !!a && typeof a._id === "string" && a._id.startsWith("virtual");

  // Helper: upsert a virtual/default agent before performing actions
  const ensurePersistedAgent = async (agent_key: string) => {
    const a = (uiAgents || []).find((x: Agent) => x.agent_key === agent_key);
    if (!a) return;
    if (!isVirtualAgent(a) && !isDefaultAgents) return;

    // Upsert full agent definition to backend so actions can proceed
    await upsertAgent({
      agent_key: a.agent_key,
      display_name: a.display_name,
      short_desc: a.short_desc,
      long_desc: (a as any).long_desc ?? "",
      capabilities: a.capabilities ?? [],
      default_model: a.default_model ?? "",
      model_routing: (a as any).model_routing ?? "default",
      prompt_template_version: (a as any).prompt_template_version ?? "v1",
      prompt_templates: (a as any).prompt_templates ?? "",
      input_schema: (a as any).input_schema ?? "{}",
      output_schema: (a as any).output_schema ?? "{}",
      tier_restrictions: a.tier_restrictions ?? [],
      confidence_hint: Number(a.confidence_hint ?? 0.8),
      active: typeof a.active === "boolean" ? a.active : true,
    } as any);
  };

  // Bootstrap auto-persist removed — defaults are shown immediately without mutating the backend

  // Admin check not required for showing defaults

  // Filter agents
  const filteredAgents =
    agents?.filter((agent: Agent) =>
      agent.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.agent_key.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const filteredPlaybooks =
    playbooks?.filter((playbook: Playbook) =>
      playbook.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      playbook.playbook_key.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  // Compute whether we're showing defaults (no backend data)
  const isDefaultAgents = !agents || (Array.isArray(agents) && agents.length === 0);
  const isDefaultPlaybooks = !playbooks || (Array.isArray(playbooks) && playbooks.length === 0);

  // Apply existing filters to defaults to keep UX consistent
  const defaultAgentsFiltered =
    DEFAULT_AGENTS.filter((agent) => {
      const matchesSearch =
        agent.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.agent_key.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTier =
        tierFilter === "all" ||
        agent.tier_restrictions.length === 0 ||
        agent.tier_restrictions.includes(tierFilter);
      const matchesActive =
        activeFilter === "all" ||
        (activeFilter === "active" ? agent.active : !agent.active);
      return matchesSearch && matchesTier && matchesActive;
    }) || [];

  const defaultPlaybooksFiltered =
    DEFAULT_PLAYBOOKS.filter((pb) => {
      const matchesSearch =
        pb.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pb.playbook_key.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesActive =
        activeFilter === "all" ||
        (activeFilter === "active" ? pb.active : !pb.active);
      return matchesSearch && matchesActive;
    }) || [];

  // Choose UI data source
  const uiAgents = isDefaultAgents ? defaultAgentsFiltered : (filteredAgents || []);
  const uiPlaybooks = isDefaultPlaybooks ? defaultPlaybooksFiltered : (filteredPlaybooks || []);

  // Training helpers
  const selectedAgent: Agent | undefined = uiAgents.find((a: Agent) => a.agent_key === selectedAgentKey);

  // Initialize training form when agent changes
  React.useEffect(() => {
    if (selectedAgent) {
      setTrainForm({
        ...selectedAgent,
      });
    } else {
      setTrainForm(null);
    }
  }, [selectedAgentKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Add computed gate status from eval summary
  const gatePassing = (evalSummary as any)?.allPassing === true;

  const handleToggleAgent = async (agent_key: string, active: boolean) => {
    try {
      await ensurePersistedAgent(agent_key);
      await toggleAgent({ agent_key, active });
      toast.success(`Agent ${active ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      toast.error(`Failed to ${active ? 'enable' : 'disable'} agent`);
    }
  };

  const handleTogglePlaybook = async (playbook_key: string, version: string, active: boolean) => {
    try {
      await togglePlaybook({ playbook_key, version, active });
      toast.success(`Playbook ${active ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      toast.error(`Failed to ${active ? 'enable' : 'disable'} playbook`);
    }
  };

  const handleSaveAgent = async (agentData: Partial<Agent>) => {
    try {
      await upsertAgent(agentData as any);
      toast.success("Agent saved successfully");
      setEditingAgent(null);
    } catch (error) {
      toast.error("Failed to save agent");
    }
  };

  const handleSavePlaybook = async (playbookData: Partial<Playbook>) => {
    try {
      await upsertPlaybook(playbookData as any);
      toast.success("Playbook saved successfully");
      setEditingPlaybook(null);
    } catch (error) {
      toast.error("Failed to save playbook");
    }
  };

  // removed seeding handlers

  const handleTrainingSave = async () => {
    if (!trainForm) return;
    try {
      // adminUpsertAgent requires all fields — pull from form or selected agent as fallback
      const base = selectedAgent!;
      await upsertAgent({
        agent_key: base.agent_key,
        display_name: trainForm.display_name ?? base.display_name,
        short_desc: trainForm.short_desc ?? base.short_desc,
        long_desc: (trainForm as any).long_desc ?? (base as any).long_desc ?? "",
        capabilities: trainForm.capabilities ?? base.capabilities ?? [],
        default_model: trainForm.default_model ?? base.default_model ?? "",
        model_routing: (trainForm as any).model_routing ?? (base as any).model_routing ?? "",
        prompt_template_version:
          (trainForm as any).prompt_template_version ?? (base as any).prompt_template_version ?? "v1",
        prompt_templates: (trainForm as any).prompt_templates ?? (base as any).prompt_templates ?? "",
        input_schema: (trainForm as any).input_schema ?? (base as any).input_schema ?? "",
        output_schema: (trainForm as any).output_schema ?? (base as any).output_schema ?? "",
        tier_restrictions: trainForm.tier_restrictions ?? base.tier_restrictions ?? [],
        confidence_hint: Number(trainForm.confidence_hint ?? base.confidence_hint ?? 0.8),
        active: typeof trainForm.active === "boolean" ? trainForm.active : base.active,
      } as any);
      toast.success("Agent training content saved (published)");
    } catch (e) {
      toast.error("Failed to save agent training");
    }
  };

  const handleTrainingRevert = () => {
    if (!selectedAgent) return;
    setTrainForm({ ...selectedAgent });
    toast("Reverted unsaved changes");
  };

  const handleCreateEval = async () => {
    if (!selectedAgent || !testPrompt || !expectedContains) {
      toast.error("Provide test prompt and expected text");
      return;
    }
    try {
      const name = `Agent ${selectedAgent.agent_key} – ${new Date().toLocaleString()}`;
      const res = await createEvalSet({
        name,
        description: `Quick test for ${selectedAgent.display_name}`,
        tests: [
          {
            tool: "agents",
            input: testPrompt,
            expectedContains,
          } as any,
        ],
      } as any);
      const newId = (res as any)?._id || (res as any)?.id || null;
      setCreatedSetId(newId);
      setViewRunsSetId(newId);
      toast.success("Evaluation set created");
    } catch (e) {
      toast.error("Failed to create evaluation set");
    }
  };

  const handleRunEval = async (setId?: string | null) => {
    const sid = setId ?? createdSetId;
    if (!sid) {
      toast.error("No evaluation set selected");
      return;
    }
    try {
      await runEvalSet({ setId: sid } as any);
      toast.success("Evaluation started");
    } catch (e) {
      toast.error("Failed to run evaluation");
    }
  };

  const handlePublishAgent = async () => {
    if (!selectedAgent) {
      toast.error("Select an agent first");
      return;
    }
    try {
      await ensurePersistedAgent(selectedAgent.agent_key);
      await publishAgent({ agent_key: selectedAgent.agent_key } as any);
      toast.success("Agent published");
    } catch (e: any) {
      toast.error(e?.message || "Failed to publish agent");
    }
  };

  const handleRollbackAgent = async () => {
    if (!selectedAgent) {
      toast.error("Select an agent first");
      return;
    }
    try {
      await rollbackAgent({ agent_key: selectedAgent.agent_key } as any);
      toast.success("Agent rolled back (disabled)");
    } catch {
      toast.error("Failed to rollback agent");
    }
  };

  const handlePublishPlaybook = async (playbook: Playbook) => {
    try {
      await publishPlaybook({ playbook_key: playbook.playbook_key, version: playbook.version } as any);
      toast.success("Playbook published");
    } catch (e: any) {
      toast.error(e?.message || "Failed to publish playbook");
    }
  };

  const handleRollbackPlaybook = async (playbook: Playbook) => {
    try {
      await rollbackPlaybook({ playbook_key: playbook.playbook_key, version: playbook.version } as any);
      toast.success("Playbook rolled back (disabled)");
    } catch {
      toast.error("Failed to rollback playbook");
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!selectedAgentKey) return;
    try {
      await restoreAgentVersion({ agent_key: selectedAgentKey, versionId } as any);
      toast.success("Restored agent to selected version");
      setVersionsOpen(false);
    } catch (e) {
      toast.error("Failed to restore version");
    }
  };

  const handleRestorePlaybookVersion = async (versionId: string) => {
    if (!selectedPlaybookKey) return;
    try {
      await restorePlaybookVersion({ playbook_key: selectedPlaybookKey, versionId } as any);
      toast.success("Restored playbook to selected version");
      setPlaybookVersionsOpen(false);
    } catch {
      toast.error("Failed to restore playbook version");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">System Agents Hub</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="catalog">Agent Catalog</TabsTrigger>
          <TabsTrigger value="playbooks">Orchestrations</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="datasets">Datasets</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <Input
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="solopreneur">Solopreneur</SelectItem>
                <SelectItem value="startup">Startup</SelectItem>
                <SelectItem value="sme">SME</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Agents Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent Key</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Tiers</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Show helpful empty state when no agents are visible (often admin-gating or filters) */}
                {uiAgents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="text-sm text-muted-foreground">
                        No agents found. Clear filters above. If you just seeded, refresh in a few seconds.
                        You must be an admin to view agents — use /admin-auth or add your email to ADMIN_EMAILS.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  uiAgents.map((agent: Agent) => (
                    <TableRow key={agent._id}>
                      <TableCell className="font-mono text-sm">{agent.agent_key}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{agent.display_name}</div>
                          <div className="text-sm text-muted-foreground">{agent.short_desc}</div>
                        </div>
                      </TableCell>
                      <TableCell>{agent.default_model}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {agent.tier_restrictions.length === 0 ? (
                            <Badge variant="secondary">All</Badge>
                          ) : (
                            agent.tier_restrictions.map((tier: string) => (
                              <Badge key={tier} variant="outline">{tier}</Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={agent.active ? "default" : "secondary"}>
                          {agent.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingAgent(agent)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleAgent(agent.agent_key, !agent.active)}
                          >
                            {agent.active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                await ensurePersistedAgent(agent.agent_key);
                                await publishAgent({ agent_key: agent.agent_key } as any);
                                toast.success("Agent published");
                              } catch (e:any) {
                                toast.error(e?.message || "Publish failed");
                              }
                            }}
                          >
                            Publish
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              rollbackAgent({ agent_key: agent.agent_key } as any)
                                .then(()=>toast.success("Agent rolled back"))
                                .catch(()=>toast.error("Rollback failed"))
                            }
                          >
                            Rollback
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="playbooks" className="space-y-4">
          {/* Playbooks Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Playbook Key</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uiPlaybooks.map((playbook: Playbook) => (
                  <TableRow key={playbook._id}>
                    <TableCell className="font-mono text-sm">{playbook.playbook_key}</TableCell>
                    <TableCell>{playbook.display_name}</TableCell>
                    <TableCell>{playbook.version}</TableCell>
                    <TableCell>
                      <Badge variant={playbook.active ? "default" : "secondary"}>
                        {playbook.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingPlaybook(playbook)}
                          disabled={isDefaultPlaybooks}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTogglePlaybook(playbook.playbook_key, playbook.version, !playbook.active)}
                          disabled={isDefaultPlaybooks}
                        >
                          {playbook.active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePublishPlaybook(playbook)}
                          disabled={isDefaultPlaybooks}
                        >
                          Publish
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRollbackPlaybook(playbook)}
                          disabled={isDefaultPlaybooks}
                        >
                          Rollback
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPlaybookKey(playbook.playbook_key);
                            setPlaybookVersionsOpen(true);
                          }}
                          disabled={isDefaultPlaybooks}
                        >
                          Versions
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Train & Publish</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Publish Gate banner */}
              <div className="flex items-center justify-between rounded-md border p-3 bg-muted/40">
                <div className="text-sm">
                  Publish Gate:{" "}
                  <Badge variant={gatePassing ? "default" : "secondary"}>
                    {gatePassing ? "All Passing" : "Has Failures"}
                  </Badge>
                </div>
                {!gatePassing && (
                  <div className="text-xs text-muted-foreground">
                    Fix failing evaluation tests before publishing.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="text-sm font-medium">Pick Agent</label>
                  <Select
                    value={selectedAgentKey}
                    onValueChange={(v) => setSelectedAgentKey(v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {(uiAgents || []).map((a: Agent) => (
                        <SelectItem key={a.agent_key} value={a.agent_key}>
                          {a.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-1">
                  <label className="text-sm font-medium">Display Name</label>
                  <Input
                    value={trainForm?.display_name ?? ""}
                    onChange={(e) =>
                      setTrainForm((prev) => ({ ...(prev || {}), display_name: e.target.value }))
                    }
                    disabled={!trainForm}
                  />
                </div>

                <div className="col-span-1">
                  <label className="text-sm font-medium">Default Model</label>
                  <Input
                    value={trainForm?.default_model ?? ""}
                    onChange={(e) =>
                      setTrainForm((prev) => ({ ...(prev || {}), default_model: e.target.value }))
                    }
                    disabled={!trainForm}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Training Notes / Long Description</label>
                <Textarea
                  rows={4}
                  value={(trainForm as any)?.long_desc ?? ""}
                  onChange={(e) =>
                    setTrainForm((prev) => ({ ...(prev || {}), long_desc: e.target.value as any }))
                  }
                  disabled={!trainForm}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Prompt Templates</label>
                <Textarea
                  rows={6}
                  value={(trainForm as any)?.prompt_templates ?? ""}
                  onChange={(e) =>
                    setTrainForm((prev) => ({ ...(prev || {}), prompt_templates: e.target.value as any }))
                  }
                  disabled={!trainForm}
                />
              </div>

              {/* RAG and Knowledge Graph toggles */}
              {selectedAgent && (
                <AgentConfigSection 
                  agentKey={selectedAgent.agent_key}
                  onConfigChange={() => {
                    // Refresh agent config when changed
                  }}
                />
              )}

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleTrainingRevert} disabled={!trainForm}>
                  Revert Unsaved
                </Button>
                <Button type="button" onClick={handleTrainingSave} disabled={!trainForm}>
                  Save & Publish
                </Button>
                <Button type="button" variant="outline" onClick={handlePublishAgent} disabled={!selectedAgent}>
                  Publish Gate
                </Button>
                <Button type="button" variant="outline" onClick={handleRollbackAgent} disabled={!selectedAgent}>
                  Rollback
                </Button>
                <Button type="button" variant="outline" onClick={() => setVersionsOpen(true)} disabled={!selectedAgent}>
                  Versions
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Test Prompt</label>
                  <Textarea
                    rows={4}
                    value={testPrompt}
                    onChange={(e) => setTestPrompt(e.target.value)}
                    placeholder="Ask the agent something it should handle..."
                    disabled={!selectedAgent}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Expected Contains</label>
                  <Textarea
                    rows={4}
                    value={expectedContains}
                    onChange={(e) => setExpectedContains(e.target.value)}
                    placeholder="Provide a short expected text fragment that should appear in the answer"
                    disabled={!selectedAgent}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleCreateEval} disabled={!selectedAgent}>
                  Create Eval Set
                </Button>
                <Button type="button" onClick={() => handleRunEval()} disabled={!createdSetId}>
                  Run Eval
                </Button>
              </div>
              {createdSetId && (
                <div className="text-sm text-muted-foreground">
                  Created set: <span className="font-mono">{createdSetId}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evaluation Sets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                Latest Summary:{" "}
                <Badge variant={(evalSummary as any)?.allPassing ? "default" : "secondary"}>
                  {(evalSummary as any)?.allPassing ? "All Passing" : "Has Failures"}
                </Badge>
                <span className="ml-2 text-muted-foreground">
                  {typeof (evalSummary as any)?.passCount === "number" &&
                    typeof (evalSummary as any)?.failCount === "number" && (
                      <>Pass: {(evalSummary as any).passCount} · Fail: {(evalSummary as any).failCount}</>
                    )}
                </span>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(evalSets || []).map((s: any) => (
                      <TableRow key={String(s._id)}>
                        <TableCell>{s.name}</TableCell>
                        <TableCell>{new Date(s._creationTime || Date.now()).toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleRunEval(String(s._id))}>
                              Run
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewRunsSetId(String(s._id))}
                            >
                              Runs
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {viewRunsSetId && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Recent Runs for Set {viewRunsSetId}</div>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Started</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Pass</TableHead>
                          <TableHead>Fail</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(evalRuns || []).map((r: any) => (
                          <TableRow key={String(r._id)}>
                            <TableCell>{new Date(r.startedAt || r._creationTime || Date.now()).toLocaleString()}</TableCell>
                            <TableCell>{r.status || "unknown"}</TableCell>
                            <TableCell>{r.passCount ?? 0}</TableCell>
                            <TableCell>{r.failCount ?? 0}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <div className="text-center py-8 text-muted-foreground">
            Activity logs coming in Phase 6
          </div>
        </TabsContent>

        <TabsContent value="datasets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Datasets (lightweight)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DatasetCreator
                onCreate={async (payload) => {
                  try {
                    await createDataset(payload as any);
                    toast.success("Dataset created");
                  } catch {
                    toast.error("Failed to create dataset");
                  }
                }}
              />
              <div className="text-sm text-muted-foreground">
                Link datasets to a selected agent to indicate training context. This is metadata-only for now.
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Linked Agents</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(datasets || []).map((d: any) => (
                      <TableRow key={String(d._id)}>
                        <TableCell>{d.title}</TableCell>
                        <TableCell><Badge variant="secondary">{d.sourceType}</Badge></TableCell>
                        <TableCell className="text-xs">
                          {(d.linkedAgentKeys || []).join(", ") || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  await ingestVectors({ datasetId: d._id } as any);
                                  toast.success("Vectors ingested");
                                } catch {
                                  toast.error("Failed to ingest vectors");
                                }
                              }}
                            >
                              Ingest Vectors
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!selectedAgentKey}
                              onClick={async () => {
                                if (!selectedAgentKey) return;
                                try {
                                  await linkDataset({ datasetId: d._id, agent_key: selectedAgentKey } as any);
                                  toast.success("Linked dataset");
                                } catch {
                                  toast.error("Failed to link");
                                }
                              }}
                            >
                              Link to {selectedAgentKey || "agent"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!selectedAgentKey}
                              onClick={async () => {
                                if (!selectedAgentKey) return;
                                try {
                                  await unlinkDataset({ datasetId: d._id, agent_key: selectedAgentKey } as any);
                                  toast.success("Unlinked dataset");
                                } catch {
                                  toast.error("Failed to unlink");
                                }
                              }}
                            >
                              Unlink
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Agent Edit Dialog */}
      {editingAgent && (
        <AgentEditDialog
          agent={editingAgent}
          onSave={handleSaveAgent}
          onClose={() => setEditingAgent(null)}
        />
      )}

      {/* Playbook Edit Dialog */}
      {editingPlaybook && (
        <PlaybookEditDialog
          playbook={editingPlaybook}
          onSave={handleSavePlaybook}
          onClose={() => setEditingPlaybook(null)}
        />
      )}

      <Drawer open={versionsOpen} onOpenChange={setVersionsOpen}>
        <DrawerContent className="p-4">
          <DrawerHeader>
            <DrawerTitle>Agent Versions {selectedAgentKey && `— ${selectedAgentKey}`}</DrawerTitle>
          </DrawerHeader>
          <div className="max-h-[50vh] overflow-y-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(agentVersions || []).map((v: any) => (
                  <TableRow key={String(v._id)}>
                    <TableCell className="font-mono text-sm">{v.version}</TableCell>
                    <TableCell>{new Date(v.createdAt || v._creationTime || Date.now()).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => handleRestoreVersion(String(v._id))}>
                        Restore
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end mt-3">
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Playbook Versions Drawer */}
      <Drawer open={playbookVersionsOpen} onOpenChange={setPlaybookVersionsOpen}>
        <DrawerContent className="p-4">
          <DrawerHeader>
            <DrawerTitle>Playbook Versions {selectedPlaybookKey && `— ${selectedPlaybookKey}`}</DrawerTitle>
          </DrawerHeader>
          <div className="max-h-[50vh] overflow-y-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(playbookVersions || []).map((v: any) => (
                  <TableRow key={String(v._id)}>
                    <TableCell className="font-mono text-sm">{v.version}</TableCell>
                    <TableCell>{new Date(v.createdAt || v._creationTime || Date.now()).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestorePlaybookVersion(String(v._id))}
                      >
                        Restore
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end mt-3">
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

// Agent Edit Dialog Component
function AgentEditDialog({ 
  agent, 
  onSave, 
  onClose 
}: { 
  agent: Agent; 
  onSave: (data: Partial<Agent>) => void; 
  onClose: () => void; 
}) {
  const [formData, setFormData] = useState(agent);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Agent: {agent.display_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Agent Key</label>
              <Input
                value={formData.agent_key}
                onChange={(e) => setFormData({ ...formData, agent_key: e.target.value })}
                disabled
              />
            </div>
            <div>
              <label className="text-sm font-medium">Display Name</label>
              <Input
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Short Description</label>
            <Input
              value={formData.short_desc}
              onChange={(e) => setFormData({ ...formData, short_desc: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Long Description</label>
            <Textarea
              value={formData.long_desc}
              onChange={(e) => setFormData({ ...formData, long_desc: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Default Model</label>
              <Input
                value={formData.default_model}
                onChange={(e) => setFormData({ ...formData, default_model: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Confidence Hint</label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={formData.confidence_hint}
                onChange={(e) => setFormData({ ...formData, confidence_hint: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.active}
              onCheckedChange={(active) => setFormData({ ...formData, active })}
            />
            <label className="text-sm font-medium">Active</label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Playbook Edit Dialog Component
function PlaybookEditDialog({ 
  playbook, 
  onSave, 
  onClose 
}: { 
  playbook: Playbook; 
  onSave: (data: Partial<Playbook>) => void; 
  onClose: () => void; 
}) {
  const [formData, setFormData] = useState(playbook);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Playbook: {playbook.display_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Playbook Key</label>
              <Input
                value={formData.playbook_key}
                onChange={(e) => setFormData({ ...formData, playbook_key: e.target.value })}
                disabled
              />
            </div>
            <div>
              <label className="text-sm font-medium">Display Name</label>
              <Input
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Version</label>
            <Input
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.active}
              onCheckedChange={(active) => setFormData({ ...formData, active })}
            />
            <label className="text-sm font-medium">Active</label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Agent Configuration Section Component
function AgentConfigSection({ 
  agentKey, 
  onConfigChange 
}: { 
  agentKey: string; 
  onConfigChange: () => void; 
}) {
  const [useRag, setUseRag] = useState(false);
  const [useKgraph, setUseKgraph] = useState(false);
  
  const agentConfig = useQuery(api.aiAgents.getAgentConfig, { agent_key: agentKey });
  const updateConfig = useMutation(api.aiAgents.adminUpdateAgentConfig);

  React.useEffect(() => {
    if (agentConfig) {
      setUseRag(agentConfig.useRag || false);
      setUseKgraph(agentConfig.useKgraph || false);
    }
  }, [agentConfig]);

  const handleConfigUpdate = async (field: 'useRag' | 'useKgraph', value: boolean) => {
    try {
      await updateConfig({
        agent_key: agentKey,
        [field]: value,
      });
      
      if (field === 'useRag') setUseRag(value);
      if (field === 'useKgraph') setUseKgraph(value);
      
      toast.success(`${field === 'useRag' ? 'RAG' : 'Knowledge Graph'} ${value ? 'enabled' : 'disabled'}`);
      onConfigChange();
    } catch (error) {
      toast.error(`Failed to update ${field === 'useRag' ? 'RAG' : 'Knowledge Graph'} setting`);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Agent Capabilities</div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={useRag}
            onCheckedChange={(checked) => handleConfigUpdate('useRag', checked)}
          />
          <label className="text-sm">Enable RAG (Vectors)</label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={useKgraph}
            onCheckedChange={(checked) => handleConfigUpdate('useKgraph', checked)}
          />
          <label className="text-sm">Enable Knowledge Graph</label>
        </div>
      </div>
      {(useRag || useKgraph) && (
        <div className="text-xs text-muted-foreground">
          Note: Publishing with these features enabled requires corresponding data to be ingested and evaluations to pass.
        </div>
      )}
    </div>
  );
}