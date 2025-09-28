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

      const res = await routeAction({ message: ask.trim(), dryRun: false } as any);
      const summary = (res as any)?.summaryText || "No summary returned.";
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
          
          {/* Tier Switcher */}
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

        {/* Ask My Agent (OpenAI-powered) with History */}
        <Card className="border-emerald-200">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-emerald-600" />
                  Ask My Agent
                </CardTitle>
                <CardDescription>
                  Get quick, actionable recommendations summarized by your agent using your context.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {/* Phase 5: Dry Run toggle */}
                <div className="hidden sm:flex items-center gap-2 border rounded-md px-3 py-1.5">
                  <span className="text-sm">Dry Run</span>
                  <Switch checked={dryRun} onCheckedChange={setDryRun} />
                </div>
                <Button variant="secondary" onClick={() => setAskHistoryOpen(true)}>
                  <History className="w-4 h-4 mr-2" />
                  History
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              <Input
                value={ask}
                onChange={(e) => setAsk(e.target.value)}
                placeholder="e.g., Draft a retention campaign idea for this week"
                className="flex-1"
                disabled={asking}
              />
              <Button
                onClick={handleAsk}
                disabled={asking || (Date.now() - lastAskAt < ASK_RATE_LIMIT_MS)}
                className="md:w-40"
              >
                {asking
                  ? "Thinking…"
                  : (Date.now() - lastAskAt < ASK_RATE_LIMIT_MS)
                  ? `Wait ${Math.ceil((ASK_RATE_LIMIT_MS - (Date.now() - lastAskAt)) / 1000)}s`
                  : "Ask"}
              </Button>
            </div>
            {/* Subtext with cooldown + mode */}
            <div className="text-xs text-gray-500">
              {dryRun ? "Dry Run is enabled — no backend calls will be made." : "Live mode — responses use your configured model."}
              {(Date.now() - lastAskAt < ASK_RATE_LIMIT_MS) && " • Cooldown active to prevent rapid asks."}
            </div>
            {reply && (
              <div className="rounded-md border bg-white p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-700">Answer</div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        if (reply) {
                          navigator.clipboard.writeText(reply).then(
                            () => toast.success("Answer copied."),
                            () => toast.error("Failed to copy.")
                          );
                        }
                      }}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
                <div className="text-sm leading-6 whitespace-pre-wrap">{reply}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* History Drawer */}
        <Sheet open={askHistoryOpen} onOpenChange={setAskHistoryOpen}>
          <SheetContent side="right" className="w-[420px] sm:w-[540px]">
            <SheetHeader>
              <SheetTitle>Conversation History</SheetTitle>
              <SheetDescription>Your recent questions and summarized answers.</SheetDescription>
            </SheetHeader>
            {/* Phase 5: Export control */}
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {askHistory.length} entr{askHistory.length === 1 ? "y" : "ies"}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  try {
                    const jsonl = askHistory
                      .map((h) => JSON.stringify(h))
                      .join("\n");
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
                disabled={askHistory.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {askHistory.length === 0 ? (
                <div className="text-sm text-gray-600">No history yet. Ask something to get started.</div>
              ) : (
                <div className="space-y-4">
                  {askHistory.map((h, idx) => (
                    <div key={idx} className="rounded-md border bg-white p-3">
                      <div className="text-xs text-gray-500 mb-1">
                        {new Date(h.at).toLocaleString()}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Q:</span> {h.q}
                      </div>
                      <div className="text-sm mt-1 whitespace-pre-wrap">
                        <span className="font-medium">A:</span> {h.a}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between gap-2">
              <Button variant="secondary" onClick={() => setAskHistoryOpen(false)}>Close</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  persistHistory([]);
                  toast.success("History cleared.");
                }}
                disabled={askHistory.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="my-agents" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              My Agents
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center gap-2">
              <Share className="w-4 h-4" />
              Marketplace
            </TabsTrigger>
            <TabsTrigger value="builder" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Builder
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Monitoring
            </TabsTrigger>
          </TabsList>

          {/* My Agents Tab */}
          <TabsContent value="my-agents">
            <MyAgentsTab userId={user?._id} selectedTier={selectedTier} />
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <TemplatesTab userId={user?._id} selectedTier={selectedTier} />
          </TabsContent>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace">
            <MarketplaceTab userId={user?._id} />
          </TabsContent>

          {/* Builder Tab */}
          <TabsContent value="builder">
            <BuilderTab userId={user?._id} selectedTier={selectedTier} />
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring">
            <MonitoringTab userId={user?._id} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

function MyAgentsTab({
  userId,
}: {
  userId?: Id<"users">;
  selectedTier: string;
}) {
  // Fetch current user to derive businessId
  const currentUser = useQuery(api.users.currentUser, {});
  const userBusinesses = useQuery(api.businesses.getUserBusinesses, {});
  const businessId = (userBusinesses && userBusinesses[0]?._id) as Id<"businesses"> | undefined;

  const agents = useQuery(
    api.aiAgents.listCustomAgents,
    userId ? { userId } : ({} as any),
  );

  // Fetch Pikar AI App Agents for the user's business
  const pikarAgents = useQuery(
    api.aiAgents.getByBusiness,
    businessId ? ({ businessId } as any) : undefined
  );

  const seedEnhanced = useMutation(api.aiAgents.seedEnhancedForBusiness);

  const createCustomAgent = useMutation(api.aiAgents.createCustomAgent);

  // Local state for "Create Custom Agent" dialog
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string>("");
  const [visibility, setVisibility] = useState<"private" | "team" | "market">("private");
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high">("low");

  // Add: guest mode
  const guestMode = !userId;

  const handleSeed = async () => {
    if (!businessId) {
      toast("No business linked to your account yet.");
      return;
    }
    try {
      await seedEnhanced({ businessId });
      toast("Pikar AI App Agents added to your workspace.");
    } catch (e: any) {
      toast(`Failed to add agents: ${e?.message ?? "Unknown error"}`);
    }
  };

  const handleCreateCustom = async () => {
    if (!userId || !businessId) {
      toast("You must be signed in with a business to create agents.");
      return;
    }
    if (!name.trim()) {
      toast("Please provide a name.");
      return;
    }
    try {
      await createCustomAgent({
        name: name.trim(),
        description: description.trim() || "Custom agent",
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        config: {}, // blank slate
        businessId,
        userId,
        visibility,
        riskLevel,
      } as any);
      toast("Custom agent created.");
      setOpen(false);
      setName("");
      setDescription("");
      setTags("");
      setVisibility("private");
      setRiskLevel("low");
    } catch (e: any) {
      toast(`Failed to create agent: ${e?.message ?? "Unknown error"}`);
    }
  };

  if (agents === undefined || (businessId && pikarAgents === undefined)) {
    return <div className="text-gray-600">Loading your agents...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold">My Agents</h3>
          <p className="text-sm text-gray-600">Your custom agents and built-in Pikar AI app agents.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Hide actions that require auth in guest mode */}
          {!guestMode && (
            <>
              <Button variant="secondary" onClick={handleSeed} disabled={!businessId}>
                Add Pikar AI App Agents
              </Button>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Custom Agent
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Custom Agent</DialogTitle>
                    <DialogDescription>Start from a blank slate without using a template.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Outreach Assistant" />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this agent do?" />
                    </div>
                    <div className="space-y-2">
                      <Label>Tags (comma separated)</Label>
                      <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="sales, outreach, email" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Visibility</Label>
                        <Select value={visibility} onValueChange={(v) => setVisibility(v as any)}>
                          <SelectTrigger><SelectValue placeholder="Select visibility" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="private">Private</SelectItem>
                            <SelectItem value="team">Team</SelectItem>
                            <SelectItem value="market">Market</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Risk Level</Label>
                        <Select value={riskLevel} onValueChange={(v) => setRiskLevel(v as any)}>
                          <SelectTrigger><SelectValue placeholder="Select risk level" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateCustom} disabled={!userId || !businessId}>
                      Create
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Pikar AI App Agents */}
      <div className="space-y-3">
        <h4 className="text-lg font-semibold">Pikar AI App Agents</h4>
        {!businessId ? (
          <Card>
            <CardHeader>
              <CardTitle>Connect to a Business</CardTitle>
              <CardDescription>Link your account to a business to view built-in app agents.</CardDescription>
            </CardHeader>
          </Card>
        ) : pikarAgents && pikarAgents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pikarAgents.map((a: any) => (
              <Card key={a._id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{a.name}</span>
                    <Badge variant="secondary">{a.isActive ? "Active" : "Inactive"}</Badge>
                  </CardTitle>
                  <CardDescription>{a.description || "Built-in agent"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {!!(a.capabilities?.length) && (
                    <div className="flex flex-wrap gap-2">
                      {a.capabilities.map((t: string) => (
                        <Badge key={t} variant="outline">{t}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="text-sm text-gray-500">
                    Tasks: {a.performance?.tasksCompleted ?? 0} • Success Rate: {(a.performance?.successRate ?? 0)}%
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No built-in agents found</CardTitle>
              <CardDescription>Click "Add Pikar AI App Agents" to populate your workspace.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>

      {/* Custom Agents */}
      <div className="space-y-3">
        <h4 className="text-lg font-semibold">Your Custom Agents</h4>
        {agents && agents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {agents.map((a: any) => (
              <Card key={a._id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{a.name}</span>
                    <Badge variant="secondary">{a.visibility}</Badge>
                  </CardTitle>
                  <CardDescription>{a.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {(a.tags || []).map((t: string) => (
                      <Badge key={t} variant="outline">{t}</Badge>
                    ))}
                  </div>
                  <div className="text-sm text-gray-500">
                    Runs: {a.stats?.runs ?? 0} • Successes: {a.stats?.successes ?? 0}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No custom agents yet</CardTitle>
              <CardDescription>Create agents from scratch with the button above, or from templates.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}

function TemplatesTab({
  userId,
  selectedTier,
}: {
  userId?: Id<"users">;
  selectedTier: string;
}) {
  const seedEnterprise = useAction(api.aiAgents.seedEnterpriseTemplates);
  const [attemptedSeed, setAttemptedSeed] = useState(false);

  const templates = useQuery(api.aiAgents.listTemplates, { tier: selectedTier });

  useEffect(() => {
    if (
      selectedTier === "enterprise" &&
      templates !== undefined &&
      templates.length === 0 &&
      !attemptedSeed
    ) {
      (async () => {
        try {
          await seedEnterprise({});
        } catch {
          // ignore errors (e.g., already seeded)
        } finally {
          setAttemptedSeed(true);
        }
      })();
    }
  }, [selectedTier, templates, attemptedSeed, seedEnterprise]);

  if (templates === undefined) {
    return <div className="text-gray-600">Loading templates...</div>;
  }

  if (!templates.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No templates found</CardTitle>
          <CardDescription>
            Try a different tier or refresh to load the latest templates.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {templates.map((t: any) => (
        <Card key={t._id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t.name}</span>
              <Badge variant="secondary">{t.tier ?? selectedTier}</Badge>
            </CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {(t.tags || []).map((tag: string) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MarketplaceTab({ userId }: { userId?: Id<"users"> }) {
  const items = useQuery(api.aiAgents.listMarketplaceAgents, {
    status: "approved",
  });

  if (items === undefined) {
    return <div className="text-gray-600">Loading marketplace...</div>;
  }

  if (!items.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No approved marketplace agents yet</CardTitle>
          <CardDescription>
            Check back soon for curated agents from the community.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((m: any) => (
        <Card key={m._id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{m.agent?.name ?? "Untitled Agent"}</span>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>{(m.avgRating ?? 0).toFixed(1)}</span>
                <span>({m.ratingsCount ?? 0})</span>
              </div>
            </CardTitle>
            <CardDescription>{m.agent?.description}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">
            Runs: {m.stats?.runs ?? 0} • Successes: {m.stats?.successes ?? 0}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function BuilderTab({}: { userId?: Id<"users">; selectedTier: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Builder</CardTitle>
        <CardDescription>
          Use templates as a starting point and customize configurations for
          your workflows.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-gray-600">
        Select a template from the Templates tab to begin.
      </CardContent>
    </Card>
  );
}

function MonitoringTab({}: { userId?: Id<"users"> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monitoring</CardTitle>
        <CardDescription>
          Track performance, usage, and success rates of your agents.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-gray-600">
        Connect agents to workflows to see real-time insights here.
      </CardContent>
    </Card>
  );
}

function OnboardingAssistantDialog() {
  const initExec = useMutation(api.aiAgents.initSolopreneurAgent);
  const addSlot = useMutation(api.schedule.addSlot);
  const deleteSlot = useMutation(api.schedule.deleteSlot);

  const [open, setOpen] = useState(false);
  const [businessId, setBusinessId] = useState<string>("");
  const [goals, setGoals] = useState("");
  const [tone, setTone] = useState("practical, concise, friendly");
  const [timezone, setTimezone] = useState("UTC");
  const [useEmail, setUseEmail] = useState(true);
  const [useSocial, setUseSocial] = useState(true);
  const [cadence, setCadence] = useState("weekly"); // weekly, biweekly
  const [saving, setSaving] = useState(false);
  // Add: create first capsule now
  const [createNow, setCreateNow] = useState<boolean>(true);

  // Optional: if you already have a current business query, wire it here to prefill
  const currentBiz = useQuery(api.businesses?.currentUserBusiness as any, undefined);
  React.useEffect(() => {
    if (currentBiz?._id) setBusinessId(currentBiz._id as unknown as string);
  }, [currentBiz?._id]);

  const suggestedSlots = React.useMemo(
    () => {
      const slots: Array<{ label: string; channel: string; scheduledAt: number }> = [];
      const base = Date.now();
      if (useEmail) {
        // Next Tuesday 10:00 UTC
        const d = new Date(base);
        const nextTue = ((2 - d.getUTCDay()) + 7) % 7 || 7;
        d.setUTCDate(d.getUTCDate() + nextTue);
        d.setUTCHours(10, 0, 0, 0);
        slots.push({ label: "Newsletter", channel: "email", scheduledAt: d.getTime() });
      }
      if (useSocial) {
        // Two micro-posts next week 09:00 and 14:00 UTC
        const d1 = new Date(base);
        d1.setUTCDate(d1.getUTCDate() + 2);
        d1.setUTCHours(9, 0, 0, 0);
        const d2 = new Date(base);
        d2.setUTCDate(d2.getUTCDate() + 4);
        d2.setUTCHours(14, 0, 0, 0);
        slots.push({ label: "Post A", channel: "social", scheduledAt: d1.getTime() });
        slots.push({ label: "Post B", channel: "social", scheduledAt: d2.getTime() });
      }
      return slots;
    },
    [useEmail, useSocial]
  );

  // New: trigger Weekly Momentum Capsule playbook after setup
  const runWeeklyMomentum = async (bizId: string) => {
    try {
      const res = await fetch(`/api/playbooks/weekly_momentum_capsule/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: bizId }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `Failed with status ${res.status}`);
      }
      toast.success("First capsule created and queued!");
    } catch (e: any) {
      toast.error(`Could not start first capsule: ${e?.message ?? "Unknown error"}`);
    }
  };

  const handleSave = async () => {
    if (!businessId) {
      toast.error("Select or create a workspace first (businessId missing)");
      return;
    }
    setSaving(true);
    try {
      await initExec({
        businessId: businessId as any,
        businessSummary: goals || undefined,
        brandVoice: tone || undefined,
        timezone: timezone || undefined,
        automations: {
          invoicing: false,
          emailDrafts: true,
          socialPosts: true,
        },
      } as any);

      // Seed suggested schedule slots and capture their ids for undo
      const addedSlotIds: Array<string> = [];
      for (const s of suggestedSlots) {
        try {
          const slotId = await addSlot({
            businessId: businessId as any,
            label: s.label,
            channel: s.channel,
            scheduledAt: s.scheduledAt,
          } as any);
          if (slotId) addedSlotIds.push(String(slotId));
        } catch (e: any) {
          // continue creating others; notify per-slot failure
          toast.error(`Failed to add slot "${s.label}": ${e?.message ?? "Unknown error"}`);
        }
      }

      // Offer undo for seeded slots
      if (addedSlotIds.length > 0) {
        toast.success("Schedule prepared. Undo?", {
          action: {
            label: "Undo",
            onClick: async () => {
              try {
                for (const id of addedSlotIds) {
                  await deleteSlot({ slotId: id as any });
                }
                toast.success("Seeded slots removed.");
              } catch (e: any) {
                toast.error(`Could not undo slots: ${e?.message ?? "Unknown error"}`);
              }
            },
          },
        });
      }

      // Optionally create first capsule now via playbook trigger
      if (createNow) {
        await runWeeklyMomentum(businessId);
      }

      toast.success("Executive Assistant initialized and schedule prepared");
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to initialize Executive Assistant");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700">Set up Executive Assistant</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Executive Assistant Setup</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Workspace (Business Id)</label>
            <Input
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
              placeholder="Enter your Business Id"
            />
            <div className="text-xs text-muted-foreground mt-1">
              Prefilled if you already have a workspace.
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Your Goals / Focus</label>
            <Textarea
              rows={3}
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="Describe what you want your assistant to prioritize"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Tone / Persona</label>
              <Input value={tone} onChange={(e) => setTone(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Timezone</label>
              <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Cadence</label>
              <Select value={cadence} onValueChange={setCadence}>
                <SelectTrigger><SelectValue placeholder="Select cadence" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between border rounded-md px-3 py-2">
              <div className="text-sm">Use Email</div>
              <Switch checked={useEmail} onCheckedChange={setUseEmail} />
            </div>
            <div className="flex items-center justify-between border rounded-md px-3 py-2">
              <div className="text-sm">Use Social</div>
              <Switch checked={useSocial} onCheckedChange={setUseSocial} />
            </div>
          </div>

          {suggestedSlots.length > 0 && (
            <div className="text-xs text-muted-foreground">
              We will add {suggestedSlots.length} initial schedule slot(s) for your capsule workflow.
            </div>
          )}

          {/* New: Create first capsule now option */}
          <div className="flex items-center gap-3">
            <Checkbox
              id="createNow"
              checked={createNow}
              onCheckedChange={(v: boolean) => setCreateNow(v)}
            />
            <label htmlFor="createNow" className="text-sm">
              Create my first capsule now (runs Weekly Momentum playbook)
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save & Initialize"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
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