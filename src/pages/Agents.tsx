import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Bot,
  Plus,
  Star,
  Play,
  Settings,
  History,
  Share,
  Download,
  Eye,
  Trash2,
  RotateCcw,
  TrendingUp,
  Users,
  Tag,
  Filter,
  Search,
  Sparkles,
  Zap,
  Target,
  BarChart3,
  Copy,
} from "lucide-react";
import { useLocation } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

// Add imports for extracted subcomponents
import MyAgentsTab from "@/components/agents/MyAgentsTab";
import TemplatesTab from "@/components/agents/TemplatesTab";
import MarketplaceTab from "@/components/agents/MarketplaceTab";
import BuilderTab from "@/components/agents/BuilderTab";
import MonitoringTab from "@/components/agents/MonitoringTab";
import OnboardingAssistantDialog from "@/components/agents/OnboardingAssistantDialog";
import ExecutiveTab from "@/components/agents/ExecutiveTab";
import { ExecutiveSettings } from "@/components/agents/ExecutiveSettings";
import { AskMyAgentCard } from "@/components/agents/AskMyAgentCard";
import { AgentHistoryDrawer, AskHistoryEntry } from "@/components/agents/AgentHistoryDrawer";

interface AgentBuilderNode {
  id: string;
  type: "input" | "hook" | "output";
  title: string;
  config: any;
}

class AgentsErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any) {
    // no-op; could emit telemetry here later
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-3xl mx-auto mt-8">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Something went wrong on Agents</h2>
            <p className="text-sm text-gray-600 mb-4">
              Please refresh the page. If this continues, contact support.
            </p>
            <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">{String(this.state.error)}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AgentsPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isDirectory = location.pathname === "/ai-agents";
  // Default to Templates tab in directory view
  const [activeTab, setActiveTab] = useState(isDirectory ? "templates" : "my-agents");
  // Default to enterprise in the directory view so enterprise templates show immediately
  const [selectedTier, setSelectedTier] = useState<string>(isDirectory ? "enterprise" : "solopreneur");
  
  // Seed data on mount
  const seedAction = useAction(api.aiAgents.seedAgentFramework);
  const seedEnterprise = useAction(api.aiAgents.seedEnterpriseTemplates);
  const routeAction = useAction(api.agentRouter.route);
  const [ask, setAsk] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  // Phase 5: Dry run + rate limit
  const [dryRun, setDryRun] = useState<boolean>(false);
  const [lastAskAt, setLastAskAt] = useState<number>(0);
  const ASK_RATE_LIMIT_MS = 8000;

  // Phase 4: Ask history (local, persistent transcript)
  const [askHistoryOpen, setAskHistoryOpen] = useState(false);
  const [askHistory, setAskHistory] = useState<Array<{ q: string; a: string; at: number }>>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("agentAskHistory");
      if (raw) {
        const parsed = JSON.parse(raw) as Array<{ q: string; a: string; at: number }>;
        if (Array.isArray(parsed)) setAskHistory(parsed.slice(0, 200)); // cap to 200 entries
      }
    } catch {
      // ignore
    }
  }, []);
  const persistHistory = (entries: Array<{ q: string; a: string; at: number }>) => {
    setAskHistory(entries);
    try {
      localStorage.setItem("agentAskHistory", JSON.stringify(entries));
    } catch {
      // ignore quota errors
    }
  };

  useEffect(() => {
    const initSeed = async () => {
      try {
        await seedAction({});
      } catch (error) {
        // Ignore if already seeded
      }
      try {
        await seedEnterprise({});
      } catch (error) {
        // Ignore if already seeded
      }
    };
    initSeed();
  }, [seedAction, seedEnterprise]);

  // Get tier from localStorage or URL params (reuse dashboard logic)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tierFromUrl = urlParams.get("tier");
    const tierFromStorage = localStorage.getItem("tierOverride");
    
    if (tierFromUrl) {
      setSelectedTier(tierFromUrl);
    } else if (tierFromStorage) {
      setSelectedTier(tierFromStorage);
    }
  }, []);

  const initExec = useMutation(api.aiAgents.initSolopreneurAgent);
  const createQuickWF = useMutation(api.workflows.createQuickFromIdea as any);
  const addSlot = useMutation(api.schedule.addSlot);

  const currentBiz = useQuery(api.businesses?.currentUserBusiness as any, undefined);
  const businessId = (currentBiz?._id as any) || undefined;

  // Executive Settings local state
  const [execGoals, setExecGoals] = useState<string>("");
  const [execTone, setExecTone] = useState<string>("practical, concise, friendly");
  const [execCadence, setExecCadence] = useState<string>("weekly");
  const [execSaving, setExecSaving] = useState<boolean>(false);
  const [execLastSavedAt, setExecLastSavedAt] = useState<number | null>(null);

  // Add lightweight evaluation summary badge (global) with guest-safe guard
  const evalSummary = useQuery(api.evals?.latestSummary as any, undefined);
  const publishGateOk =
    !!evalSummary && typeof (evalSummary as any).passCount === "number" && typeof (evalSummary as any).failCount === "number"
      ? (evalSummary as any).failCount === 0
      : undefined;

  const handleAsk = async () => {
    if (!ask.trim()) {
      toast("Type a question for your agent.");
      return;
    }
    // Lightweight rate limiting
    const now = Date.now();
    const since = now - lastAskAt;
    if (since < ASK_RATE_LIMIT_MS) {
      const remaining = Math.ceil((ASK_RATE_LIMIT_MS - since) / 1000);
      toast(`Please wait ${remaining}s before asking again.`);
      return;
    }
    setLastAskAt(now);

    try {
      setAsking(true);
      setReply(null);

      if (dryRun) {
        // Client-side simulation; do not call backend
        const summary = `Dry run: would route message -> "${ask.trim()}"`;
        setReply(summary);
        const newEntry = { q: ask.trim(), a: summary, at: Date.now() };
        persistHistory([newEntry, ...askHistory].slice(0, 200));
        toast("Dry run completed.");
        return;
      }

      // Call exec agent with business context so RAG can enrich answers
      const res = await routeAction({
        message: ask.trim(),
        businessId: businessId as any,
        agentKey: "exec_assistant",
      } as any);

      // Agent Router returns { response, sources? }
      const summary =
        (res as any)?.response ||
        (res as any)?.text ||
        "No summary returned.";
      setReply(summary);
      const newEntry = { q: ask.trim(), a: summary, at: Date.now() };
      persistHistory([newEntry, ...askHistory].slice(0, 200));
      toast("Agent responded.");
    } catch (e: any) {
      toast(`Agent failed: ${e?.message ?? "Unknown error"}`);
    } finally {
      setAsking(false);
    }
  };

  const handleSaveExecutiveSettings = async () => {
    if (!businessId) {
      toast("No workspace found. Please create or select a business first.");
      return;
    }
    setExecSaving(true);
    try {
      await initExec({
        businessId,
        businessSummary: execGoals || undefined,
        brandVoice: execTone || undefined,
        timezone: undefined,
        automations: {
          invoicing: false,
          emailDrafts: true,
          socialPosts: true,
        },
        cadence: execCadence,
      } as any);
      setExecLastSavedAt(Date.now());
      toast.success("Executive profile saved.");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save executive profile");
    } finally {
      setExecSaving(false);
    }
  };

  const handleUseAsWorkflow = async () => {
    if (!businessId) {
      toast("Sign in and connect a workspace to create workflows.");
      return;
    }
    if (!reply && !ask.trim()) {
      toast("Nothing to convert. Ask a question first.");
      return;
    }
    try {
      const ideaText = reply ? `${ask.trim()}\n\n${reply}` : ask.trim();
      await createQuickWF({
        businessId,
        ideaText,
        title: (ask || "Executive Suggestion").slice(0, 80),
      } as any);
      toast.success("Workflow created from answer.");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create workflow");
    }
  };

  const handleScheduleNow = async () => {
    if (!businessId) {
      toast("Sign in and connect a workspace to schedule.");
      return;
    }
    try {
      const when = Date.now() + 15 * 60 * 1000; // +15 minutes
      await addSlot({
        businessId,
        label: "Exec: Quick Slot",
        channel: "email",
        scheduledAt: when,
      } as any);
      toast.success("Scheduled a quick slot in ~15 minutes.");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to add schedule slot");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2">
              {isDirectory ? "Agent Directory" : "Custom Agent Framework"}
            </h1>
            <p className="text-gray-600">
              {isDirectory
                ? "Browse, use, and manage AI agents across templates and marketplace"
                : "Build, deploy, and manage intelligent automation agents"}
            </p>
          </div>

          {/* Tier Switcher + Publish Gate badge */}
          <div className="flex items-center gap-3">
            {publishGateOk !== undefined && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  publishGateOk ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}
                title="Evaluation summary across sets"
              >
                {publishGateOk ? "Publish Gate: Passing" : "Publish Gate: Failing"}
              </span>
            )}
            <div className="flex items-center gap-2">
              <Label>Tier:</Label>
              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solopreneur">Solopreneur</SelectItem>
                  <SelectItem value="startup">Startup</SelectItem>
                  <SelectItem value="sme">SME</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Executive Settings - extracted component */}
        <ExecutiveSettings
          execGoals={execGoals}
          setExecGoals={setExecGoals}
          execTone={execTone}
          setExecTone={setExecTone}
          execCadence={execCadence}
          setExecCadence={setExecCadence}
          execSaving={execSaving}
          execLastSavedAt={execLastSavedAt}
          onSave={handleSaveExecutiveSettings}
          onReset={() => {
            setExecGoals("");
            setExecTone("practical, concise, friendly");
            setExecCadence("weekly");
          }}
        />

        {/* Ask My Agent - extracted component */}
        <AskMyAgentCard
          ask={ask}
          setAsk={setAsk}
          reply={reply}
          asking={asking}
          dryRun={dryRun}
          setDryRun={setDryRun}
          lastAskAt={lastAskAt}
          rateLimitMs={ASK_RATE_LIMIT_MS}
          onAsk={handleAsk}
          onOpenHistory={() => setAskHistoryOpen(true)}
          onUseAsWorkflow={handleUseAsWorkflow}
          onScheduleNow={handleScheduleNow}
          onCopyAnswer={() => {
            if (reply) {
              navigator.clipboard.writeText(reply).then(
                () => toast.success("Answer copied."),
                () => toast.error("Failed to copy.")
              );
            }
          }}
        />

        {/* History Drawer */}
        <AgentHistoryDrawer
          open={askHistoryOpen}
          onOpenChange={setAskHistoryOpen}
          entries={askHistory as AskHistoryEntry[]}
          onExport={() => {
            try {
              const jsonl = askHistory.map((h) => JSON.stringify(h)).join("\n");
              const blob = new Blob([jsonl], { type: "application/jsonl;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `agent_history_${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
              toast.success("Transcript exported.");
            } catch {
              toast.error("Failed to export transcript.");
            }
          }}
          onClear={() => {
            persistHistory([]);
            toast.success("History cleared.");
          }}
          onClose={() => setAskHistoryOpen(false)}
        />

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="my-agents">My Agents</TabsTrigger>
            <TabsTrigger value="executive">Ask My Executive</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="builder">Builder</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="my-agents" className="space-y-6">
            <MyAgentsTab selectedTier="solopreneur" />
          </TabsContent>

          <TabsContent value="executive" className="space-y-6">
            <ExecutiveTab />
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <TemplatesTab selectedTier="solopreneur" />
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-6">
            <MarketplaceTab />
          </TabsContent>

          <TabsContent value="builder" className="space-y-6">
            <BuilderTab selectedTier="solopreneur" />
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <MonitoringTab />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

function MyAgentsTabLocal({
  userId,
}: {
  userId?: Id<"users">;
  selectedTier: string;
}) {
  // Remove entire inline component; replaced by import
  return null as any;
}

function TemplatesTabLocal({
  userId,
  selectedTier,
}: {
  userId?: Id<"users">;
  selectedTier: string;
}) {
  // Remove entire inline component; replaced by import
  return null as any;
}

function MarketplaceTabLocal({ userId }: { userId?: Id<"users"> }) {
  // Remove entire inline component; replaced by import
  return null as any;
}

function BuilderTabLocal({}: { userId?: Id<"users">; selectedTier: string }) {
  // Remove entire inline component; replaced by import
  return null as any;
}

function MonitoringTabLocal({}: { userId?: Id<"users"> }) {
  // Remove entire inline component; replaced by import
  return null as any;
}

function OnboardingAssistantDialogLocal() {
  // Remove entire inline component; replaced by import
  return null as any;
}

const AgentsRoute: React.FC = () => {
  // Lightweight top-level skeleton while tabs mount
  return (
    <AgentsErrorBoundary>
      <React.Suspense
        fallback={
          <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-4">
            <Skeleton className="h-10 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        }
      >
        <AgentsPage />
      </React.Suspense>
    </AgentsErrorBoundary>
  );
};

export default function AgentsPageWrapper() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">AI Agents</h1>
        <OnboardingAssistantDialog />
      </div>
      <AgentsPage />
    </div>
  );
}