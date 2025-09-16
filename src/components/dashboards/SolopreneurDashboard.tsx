import React, { useState } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface SolopreneurDashboardProps {
  business: any;
  demoData: any;
  isGuest: boolean;
  tier: string;
  onUpgrade: () => void;
}

export function SolopreneurDashboard({ 
  business, 
  demoData, 
  isGuest, 
  tier, 
  onUpgrade 
}: SolopreneurDashboardProps) {
  // Add local BrainDumpSection component
  function BrainDumpSection({ businessId }: { businessId: string }) {
    // Get or create an initiative for the business (we'll read the first one)
    const initiatives = useQuery(api.initiatives.getByBusiness as any, businessId ? { businessId } : "skip");
    const initiativeId = initiatives && initiatives.length > 0 ? initiatives[0]._id : null;

    const dumps = useQuery(
      api.initiatives.listBrainDumpsByInitiative as any,
      initiativeId ? { initiativeId, limit: 10 } : "skip"
    );

    const addDump = useMutation(api.initiatives.addBrainDump as any);

    const [text, setText] = React.useState("");
    const [saving, setSaving] = React.useState(false);

    const handleSave = async () => {
      if (!initiativeId) {
        toast("No initiative found. Run Phase 0 setup first.");
        return;
      }
      const content = text.trim();
      if (!content) {
        toast("Please enter your idea first.");
        return;
      }
      try {
        setSaving(true);
        await addDump({ initiativeId, content });
        setText("");
        toast("Saved to Brain Dump");
      } catch (e: any) {
        toast(e?.message || "Failed to save brain dump");
      } finally {
        setSaving(false);
      }
    };

    return (
      <Card className="p-4 mt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Brain Dump</h3>
          <span className="text-xs text-muted-foreground">Capture rough ideas quickly</span>
        </div>
        <Separator className="my-3" />
        <div className="space-y-3">
          <Textarea
            placeholder="Write freely here... (e.g., campaign idea, positioning, offer notes)"
            value={text}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
            className="min-h-24"
          />
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving || !initiativeId}>
              {saving ? "Saving..." : "Save Idea"}
            </Button>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="space-y-2">
          <div className="text-sm font-medium">Recent ideas</div>
          <div className="space-y-2">
            {Array.isArray(dumps) && dumps.length > 0 ? (
              dumps.map((d: any) => (
                <div key={String(d._id)} className="rounded-md border p-3 text-sm">
                  <div className="text-muted-foreground text-xs mb-1">
                    {new Date(d.createdAt).toLocaleString()}
                  </div>
                  <div className="whitespace-pre-wrap">{d.content}</div>
                  <Button size="xs" variant="secondary" onClick={() => handleCreateWorkflowFromIdea(d.content)}>
                    Create workflow
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-muted-foreground text-sm">No entries yet.</div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Add helper: local usage and streaks
  function useTemplateOrderingAndStreak() {
    const [streak, setStreak] = React.useState<number>(0);
    const [timeSavedTotal, setTimeSavedTotal] = React.useState<number>(0);
    // New: local wins history
    const [history, setHistory] = React.useState<Array<{ at: string; type: string; minutes: number; meta?: Record<string, any> }>>([]);

    React.useEffect(() => {
      const rawDates = localStorage.getItem("pikar.winDates");
      const dates: string[] = rawDates ? JSON.parse(rawDates) : [];
      const today = new Date(); today.setHours(0,0,0,0);
      let s = 0;
      for (;;) {
        const d = new Date(today);
        d.setDate(today.getDate() - s);
        const key = d.toISOString().slice(0,10);
        if (dates.includes(key)) s += 1; else break;
      }
      setStreak(s);

      const ts = Number(localStorage.getItem("pikar.timeSavedTotal") || "0");
      setTimeSavedTotal(ts);

      const rawHist = localStorage.getItem("pikar.winHistory");
      const hist: Array<{ at: string; type: string; minutes: number; meta?: Record<string, any> }> = rawHist ? JSON.parse(rawHist) : [];
      setHistory(hist);
    }, []);

    const recordLocalWin = (minutes: number, type: string = "generic", meta?: Record<string, any>) => {
      const nowIso = new Date().toISOString();
      const todayKey = nowIso.slice(0,10);
      const rawDates = localStorage.getItem("pikar.winDates");
      const dates: string[] = rawDates ? JSON.parse(rawDates) : [];
      if (!dates.includes(todayKey)) dates.push(todayKey);
      localStorage.setItem("pikar.winDates", JSON.stringify(dates));
      const ts = Number(localStorage.getItem("pikar.timeSavedTotal") || "0") + minutes;
      localStorage.setItem("pikar.timeSavedTotal", String(ts));
      setTimeSavedTotal(ts);

      const rawHist = localStorage.getItem("pikar.winHistory");
      const hist: Array<{ at: string; type: string; minutes: number; meta?: Record<string, any> }> = rawHist ? JSON.parse(rawHist) : [];
      hist.unshift({ at: nowIso, type, minutes, meta });
      localStorage.setItem("pikar.winHistory", JSON.stringify(hist.slice(0, 100)));
      setHistory(hist.slice(0, 100));
    };

    const clearLocalWins = () => {
      localStorage.removeItem("pikar.winDates");
      localStorage.removeItem("pikar.timeSavedTotal");
      localStorage.removeItem("pikar.winHistory");
      setStreak(0);
      setTimeSavedTotal(0);
      setHistory([]);
    };

    const bumpTemplateUsage = (key: string) => {
      const raw = localStorage.getItem("pikar.templateUsageCounts");
      const map: Record<string, number> = raw ? JSON.parse(raw) : {};
      map[key] = (map[key] || 0) + 1;
      localStorage.setItem("pikar.templateUsageCounts", JSON.stringify(map));
    };

    const orderTemplates = <T extends { key: string }>(list: T[]): T[] => {
      const raw = localStorage.getItem("pikar.templateUsageCounts");
      const map: Record<string, number> = raw ? JSON.parse(raw) : {};
      return [...list].sort((a, b) => (map[b.key] || 0) - (map[a.key] || 0));
    };

    return { streak, timeSavedTotal, history, recordLocalWin, clearLocalWins, bumpTemplateUsage, orderTemplates };
  }

  // Use Convex KPI snapshot when authenticated; fallback to demo data for guests
  const kpiDoc = !isGuest && business?._id
    ? useQuery(api.kpis.getSnapshot, { businessId: business._id })
    : undefined;

  // Use demo data when in guest mode
  const agents = isGuest ? demoData?.agents || [] : [];
  const workflows = isGuest ? demoData?.workflows || [] : [];
  const kpis = isGuest ? (demoData?.kpis || {}) : (kpiDoc || {});
  const tasks = isGuest ? (demoData?.tasks || []) : [];
  const notifications = isGuest ? (demoData?.notifications || []) : [];
  // removed duplicate kpis declaration; using kpiDoc fallback above

  // Limit "Today's Focus" to max 3 tasks
  const focusTasks = Array.isArray(tasks) ? tasks.slice(0, 3) : [];

  // Simple helper for fallback values
  const fmtNum = (n: any, digits = 0) => {
    const v = typeof n === "number" ? n : 0;
    return v.toLocaleString(undefined, { maximumFractionDigits: digits });
  };

  // Derived KPI percents for simple snapshot bars
  const snapshot = {
    visitors: { value: kpis.visitors ?? 1250, delta: kpis.visitorsDelta ?? 5 },
    subscribers: { value: kpis.subscribers ?? 320, delta: kpis.subscribersDelta ?? 3 },
    engagement: { value: kpis.engagement ?? 62, delta: kpis.engagementDelta ?? 2 }, // %
    revenue: { value: kpis.revenue ?? (kpis.totalRevenue ?? 12500), delta: kpis.revenueDelta ?? 4 }, // $
    taskCompletion: { value: kpis.taskCompletion ?? 89, delta: 0 }, // %
    activeCustomers: { value: kpis.activeCustomers ?? 45, delta: 0 },
    conversionRate: { value: kpis.conversionRate ?? 3.2, delta: 0 }, // %
  };

  // Add mutations for One-Click Setup
  const initAgent = useMutation(api.solopreneur.initSolopreneurAgent);
  const seedTemplates = useMutation(api.solopreneur.seedOneClickTemplates);

  // Add quick analytics (skip for guests)
  const quickAnalytics = !isGuest && business?._id
    ? useQuery(api.solopreneur.runQuickAnalytics, { businessId: business._id })
    : undefined;

  // Add: Top-level initiative + brain dump data for Today's Focus suggestions
  const initiativesTop = !isGuest && business?._id
    ? (useQuery as any)(api.initiatives.getByBusiness, { businessId: business._id })
    : undefined;
  const currentInitiative = Array.isArray(initiativesTop) && initiativesTop.length > 0 ? initiativesTop[0] : undefined;
  const brainDumps = currentInitiative?._id
    ? (useQuery as any)(api.initiatives.listBrainDumpsByInitiative, { initiativeId: currentInitiative._id, limit: 10 })
    : [];

  // Add: actions/mutations and local state for Support Triage + Privacy controls
  const suggest = useAction(api.solopreneur.supportTriageSuggest);
  const forgetUploads = useMutation(api.solopreneur.forgetUploads);
  const [emailBody, setEmailBody] = useState<string>("");
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageSuggestions, setTriageSuggestions] = useState<
    Array<{ label: string; reply: string; priority: "low" | "medium" | "high" }>
  >([]);

  // Local loading state
  const [settingUp, setSettingUp] = useState(false);

  // Add navigate for "Use" action
  const navigate = useNavigate();

  // Templates strip (client-side, mirrors the seeded presets)
  const myTemplates: Array<{ key: string; name: string; description: string; tag: string }> = [
    {
      name: "Solopreneur — Launch Post",
      description: "Announce a new offering with a friendly, concise tone.",
      tag: "social",
      key: "solopreneur_launch_post",
    },
    {
      name: "Solopreneur — Weekly Newsletter",
      description: "Lightweight weekly update to nurture your audience.",
      tag: "email",
      key: "solopreneur_weekly_newsletter",
    },
    {
      name: "Solopreneur — Product Highlight",
      description: "Quick product spotlight with clear CTA.",
      tag: "cta",
      key: "solopreneur_product_highlight",
    },
  ];

  const handleUseTemplate = (t: { name: string }) => {
    if (isGuest) {
      toast("Sign in to use templates.");
      onUpgrade?.();
      return;
    }
    // Navigate to Workflows where templates can be copied/used
    toast.success(`Opening Workflows — "${t.name}" is ready to use.`);
    navigate("/workflows");
  };

  // Handler for One-Click Setup
  const handleOneClickSetup = async () => {
    if (isGuest) {
      toast("Please sign in to run setup.");
      onUpgrade?.();
      return;
    }
    try {
      setSettingUp(true);
      toast("Initializing your solopreneur agent...");

      const initRes = await initAgent({
        businessId: business?._id,
      } as any);

      const resolvedBusinessId =
        (initRes && (initRes as any).businessId) || business?._id;

      toast("Seeding one-click templates...");
      const seedRes = await seedTemplates({
        businessId: resolvedBusinessId,
      } as any);

      const created = (seedRes as any)?.created ?? 0;
      toast.success(`Setup complete! ${created} templates ready to use.`);
    } catch (e: any) {
      toast.error(e?.message || "Setup failed. Please try again.");
    } finally {
      setSettingUp(false);
    }
  };

  // Quick actions (guest -> prompt sign-in, authed -> future: navigate)
  const handleQuickAction = (action: string) => {
    if (isGuest) {
      alert("Sign in to use this action");
      onUpgrade?.();
      return;
    }
    // Future: route to real features
    alert(`${action} coming soon`);
  };

  const handleSuggestReplies = async () => {
    if (!emailBody.trim()) {
      toast("Paste an email to get suggestions.");
      return;
    }
    try {
      setTriageLoading(true);
      const res = await suggest({ body: emailBody });
      const items = (res as any)?.suggestions ?? [];
      setTriageSuggestions(items);
      toast.success(`Generated ${items.length} suggestion${items.length === 1 ? "" : "s"}.`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to generate suggestions.");
    } finally {
      setTriageLoading(false);
    }
  };

  const handleForgetUploads = async () => {
    if (isGuest) {
      toast("Sign in to manage your uploads.");
      onUpgrade?.();
      return;
    }
    try {
      const res = await forgetUploads({});
      const count = (res as any)?.deleted ?? 0;
      toast.success(`Cleared ${count} upload${count === 1 ? "" : "s"} and reset agent doc refs.`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to clear uploads.");
    }
  };

  // Add helper: local usage and streaks
  const createFromIdea = useMutation(api.workflows.createQuickFromIdea);
  const logWin = useMutation(api.audit.logWin);

  // Example state you likely already have: businessId, initiativeId, brain dumps, myTemplates, navigate, etc.
  // We'll add new handlers:

  // Create workflow from a brain dump item
  const handleCreateWorkflowFromIdea = async (ideaText: string) => {
    try {
      if (!business?._id) {
        toast("Please select or create a business first.");
        return;
      }
      const id = await createFromIdea({
        businessId: business._id,
        idea: ideaText,
        initiativeId: currentInitiative?._id,
      });
      // Log a win: estimate 20 minutes saved for skipping setup
      await logWin({
        businessId: business._id,
        winType: "workflow_created_from_idea",
        timeSavedMinutes: 20,
        details: { workflowId: String(id) },
      });
      utils.recordLocalWin(20, "workflow_created_from_idea", { source: "brain_dump" });
      toast("Workflow created from idea!");
      navigate("/workflows");
    } catch (e: any) {
      toast(e.message || "Failed to create workflow.");
    }
  };

  // Smart ordering for "My Templates" and local streak/time saved view
  const utils = useTemplateOrderingAndStreak();
  // If you already have myTemplates defined, wrap it:
  const orderedTemplates = React.useMemo(() => utils.orderTemplates(myTemplates), [myTemplates]);

  // Add: top-level addBrainDump for quick-add + gallery and help coach state
  const addDumpTop = useMutation(api.initiatives.addBrainDump as any);
  const [quickIdea, setQuickIdea] = useState<string>("");
  const [savingQuickIdea, setSavingQuickIdea] = useState(false);

  // Template Gallery modal state
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryQuery, setGalleryQuery] = useState("");

  // Help Coach tips (dismissable)
  const coachTips: Array<{ id: string; text: string }> = [
    { id: "tip_focus", text: "Pick one high‑impact task to ship today — momentum compounds." },
    { id: "tip_templates", text: "Use templates to publish faster — tweak, don't start from scratch." },
    { id: "tip_ideas", text: "Turn a Brain Dump idea into a workflow when it's actionable." },
  ];
  const [dismissedTips, setDismissedTips] = useState<Record<string, boolean>>({});
  const visibleTips = coachTips.filter(t => !dismissedTips[t.id]);

  // Next Best Action: pick a single dynamic CTA
  const nextBest = React.useMemo(() => {
    // Prefer turning most recent idea into workflow
    if (brainDumps && brainDumps.length > 0) {
      const topIdea = brainDumps[0];
      return {
        label: `Turn idea into workflow: ${topIdea.title || topIdea.content.slice(0, 40)}`,
        onClick: () => handleCreateWorkflowFromIdea(topIdea.content),
        reason: "Recent idea detected",
      };
    }
    // If churn risk flagged, nudge newsletter
    if (quickAnalytics?.churnAlert) {
      return {
        label: "Draft a retention newsletter",
        onClick: () => navigate("/workflows"),
        reason: "Churn risk detected",
      };
    }
    // Otherwise, most-used template
    if (orderedTemplates.length > 0) {
      const t = orderedTemplates[0];
      return {
        label: `Use template: ${t.name}`,
        onClick: () => handleUseTemplateEnhanced(t),
        reason: "Based on your usage",
      };
    }
    // Default
    return {
      label: "Create a simple workflow",
      onClick: () => navigate("/workflows"),
      reason: "Kickstart momentum",
    };
  }, [brainDumps, orderedTemplates, quickAnalytics]);

  // Quick‑add Brain Dump handler
  const handleQuickAddIdea = async () => {
    if (isGuest) {
      toast("Sign in to save ideas.");
      onUpgrade?.();
      return;
    }
    if (!currentInitiative?._id) {
      toast("No initiative found. Run setup first.");
      return;
    }
    const content = quickIdea.trim();
    if (!content) {
      toast("Type an idea first.");
      return;
    }
    try {
      setSavingQuickIdea(true);
      await addDumpTop({ initiativeId: currentInitiative._id, content });
      setQuickIdea("");
      toast.success("Saved idea.");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save idea.");
    } finally {
      setSavingQuickIdea(false);
    }
  };

  // Enhance existing "Use Template" click:
  const handleUseTemplateEnhanced = async (tpl: { key: string; name: string }) => {
    try {
      utils.bumpTemplateUsage(tpl.key);
      // Count a quick win locally (5 minutes)
      utils.recordLocalWin(5, "template_used", { templateKey: tpl.key });
      if (business?._id) {
        await logWin({
          businessId: business._id,
          winType: "template_used",
          timeSavedMinutes: 5,
          details: { templateKey: tpl.key },
        });
      }
    } catch {}
    handleUseTemplate({ name: tpl.name });
  };

  // "Today's Focus (3)" suggestions (light heuristic)
  const todaysFocus = React.useMemo(() => {
    const suggestions: { title: string; action: () => void }[] = [];
    // 1) Recent idea
    if (brainDumps && brainDumps.length > 0) {
      const topIdea = brainDumps[0];
      suggestions.push({
        title: `Turn idea into workflow: ${topIdea.title || topIdea.content.slice(0, 40)}`,
        action: () => handleCreateWorkflowFromIdea(topIdea.content),
      });
    }
    // 2) Most-used template
    if (orderedTemplates.length > 0) {
      const t = orderedTemplates[0];
      suggestions.push({
        title: `Use template: ${t.name}`,
        action: () => handleUseTemplateEnhanced(t),
      });
    }
    // 3) Quick email draft as a default nudge (if you have a composer route, otherwise leave as placeholder)
    suggestions.push({
      title: "Draft this week's newsletter",
      action: () => navigate("/workflows"),
    });

    return suggestions.slice(0, 3);
  }, [brainDumps, orderedTemplates]);

  // Add: derive filtered templates for gallery
  const filteredTemplates = React.useMemo(() => {
    const q = galleryQuery.toLowerCase().trim();
    const base = orderedTemplates;
    if (!q) return base;
    return base.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tag.toLowerCase().includes(q)
    );
  }, [galleryQuery, orderedTemplates]);

  return (
    <div className="space-y-6">
      {/* Header / Nudge */}
      <div className="rounded-md border p-3 bg-emerald-50 flex items-center gap-3">
        <Badge variant="outline" className="border-emerald-300 text-emerald-700">Solopreneur</Badge>
        <div className="text-sm">
          Supercharge your solo biz with focused tasks, quick actions, and clear KPIs.
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* New One-Click Setup button */}
          <Button
            size="sm"
            onClick={handleOneClickSetup}
            disabled={settingUp}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {settingUp ? "Setting up..." : "One‑Click Setup"}
          </Button>
          <Button size="sm" variant="outline" onClick={onUpgrade}>
            Upgrade to Startup
          </Button>
        </div>
      </div>

      {/* Next Best Action bar */}
      <div className="rounded-md border p-3 bg-emerald-50/60 flex items-center gap-3">
        <span className="text-sm font-medium">Next best action:</span>
        <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={nextBest.onClick}>
          {nextBest.label}
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">Reason: {nextBest.reason}</span>
      </div>

      {/* My Templates strip */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">My Templates</h2>
          <Button size="sm" variant="outline" onClick={() => setGalleryOpen(true)}>Open Gallery</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {orderedTemplates.map((t) => (
            <Card key={t.key} className="...">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{t.name}</h3>
                  <Badge variant="outline" className="capitalize">{t.tag}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{t.description}</p>
                <div className="pt-1">
              <Button
                size="sm"
                onClick={() => handleUseTemplateEnhanced(t)}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                    Use
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Template Gallery Modal */}
        <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Template Gallery</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Search templates by name, tag, or description..."
                value={galleryQuery}
                onChange={(e) => setGalleryQuery(e.target.value)}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-auto pr-1">
                {filteredTemplates.map((t) => (
                  <Card key={`gallery_${t.key}`}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{t.name}</h3>
                        <Badge variant="outline" className="capitalize">{t.tag}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{t.description}</p>
                      <div className="pt-1">
                        <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => { handleUseTemplateEnhanced(t); setGalleryOpen(false); }}>
                          Use
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredTemplates.length === 0 && (
                  <div className="text-sm text-muted-foreground p-2">No templates match your search.</div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGalleryOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>

      {/* Today's Focus (max 3) */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Today&apos;s Focus</h2>
        <Card className="mt-4">
          <CardHeader className="flex items-center justify-between gap-2 sm:flex-row">
            <CardTitle className="text-base sm:text-lg">Today's Focus</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Streak: {utils.streak}d</Badge>
              <Badge variant="outline">Time saved: {utils.timeSavedTotal}m</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {todaysFocus.map((s, i) => (
              <div key={i} className="flex items-center justify-between rounded-md border p-3">
                <div className="text-sm">{s.title}</div>
                <Button size="sm" onClick={s.action}>Do it</Button>
              </div>
            ))}
          </CardContent>
        </Card>
        {focusTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {focusTasks.map((t: any) => (
              <Card key={String(t.id ?? t.title)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium">{String(t.title ?? "Task")}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Priority: {String(t.priority ?? "medium")}{t?.dueDate ? ` • Due: ${t.dueDate}` : ""}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => alert("Nice! Task completed")}>
                      Done
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-6 text-sm text-muted-foreground">
              No focus tasks yet. Add up to three high-impact tasks to stay on track.
            </CardContent>
          </Card>
        )}
        {/* Inline quick‑add Brain Dump */}
        {!isGuest && (
          <div className="mb-3 flex items-center gap-2">
            <Input
              placeholder="Quick add idea to Brain Dump..."
              value={quickIdea}
              onChange={(e) => setQuickIdea(e.target.value)}
            />
            <Button size="sm" onClick={handleQuickAddIdea} disabled={savingQuickIdea}>
              {savingQuickIdea ? "Saving..." : "Add"}
            </Button>
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Create Post</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Draft and publish content to engage your audience.
              </p>
              <Button size="sm" onClick={() => handleQuickAction("Create Post")}>Start</Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Send Newsletter</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Reach subscribers with your latest update in minutes.
              </p>
              <Button size="sm" onClick={() => handleQuickAction("Send Newsletter")}>Compose</Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">View Analytics</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Check what&apos;s working and what to optimize next.
              </p>
              <Button size="sm" variant="outline" onClick={() => handleQuickAction("View Analytics")}>
                Open
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Support Triage (beta) */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Support Triage (beta)</h2>
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Paste an inbound email and get suggested replies. No external APIs, safe to try in guest mode.
            </p>
            <Textarea
              placeholder="Paste an email thread or message to triage..."
              value={emailBody}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEmailBody(e.target.value)}
              className="min-h-28"
            />
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSuggestReplies} disabled={triageLoading}>
                {triageLoading ? "Generating..." : "Suggest Replies"}
              </Button>
              {!isGuest && (
                <span className="text-xs text-muted-foreground">
                  Suggestions are also lightly logged to audit when signed in.
                </span>
              )}
            </div>

            {triageSuggestions.length > 0 && (
              <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                {triageSuggestions.map((s: any, idx: number) => (
                  <Card key={`${s.label}-${idx}`}>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{s.label}</span>
                        <Badge variant={s.priority === "high" ? "destructive" : "outline"} className="capitalize">
                          {s.priority}
                        </Badge>
                      </div>
                      <div className="text-sm whitespace-pre-wrap">{s.reply}</div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(s.reply).then(
                              () => toast("Copied reply"),
                              () => toast.error("Copy failed")
                            );
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Privacy Controls */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Privacy Controls</h2>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Clear uploaded files and reset your agent's document references.
            </div>
            <Button size="sm" variant="outline" onClick={handleForgetUploads} disabled={isGuest}>
              Forget uploads
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* KPI Snapshot */}
      <section>
        <h2 className="text-xl font-semibold mb-4">KPI Snapshot</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Revenue</h3>
              <p className="text-2xl font-bold">${fmtNum(snapshot.revenue.value)}</p>
              <p className="text-xs text-emerald-700 mt-1">+{fmtNum(snapshot.revenue.delta)}% WoW</p>
              <Progress value={Math.min(100, (snapshot.revenue.value / 20000) * 100)} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Subscribers</h3>
              <p className="text-2xl font-bold">{fmtNum(snapshot.subscribers.value)}</p>
              <p className="text-xs text-emerald-700 mt-1">+{fmtNum(snapshot.subscribers.delta)}% WoW</p>
              <Progress value={Math.min(100, (snapshot.subscribers.value / 1000) * 100)} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Engagement</h3>
              <p className="text-2xl font-bold">{fmtNum(snapshot.engagement.value)}%</p>
              <p className="text-xs text-emerald-700 mt-1">+{fmtNum(snapshot.engagement.delta)}% WoW</p>
              <Progress value={Math.min(100, snapshot.engagement.value)} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Task Completion</h3>
              <p className="text-2xl font-bold">{fmtNum(snapshot.taskCompletion.value)}%</p>
              <p className="text-xs text-muted-foreground mt-1">Across current workflows</p>
              <Progress value={Math.min(100, snapshot.taskCompletion.value)} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Micro-Analytics */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Micro‑Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">90‑Day Revenue</h3>
              <p className="text-2xl font-bold">
                ${fmtNum(quickAnalytics?.revenue90d ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Rolling window</p>
              {/* Tip */}
              <p className="text-xs text-emerald-700 mt-1">Tip: Track weekly revenue cadence — consistency beats spikes.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Churn Alert</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={quickAnalytics?.churnAlert ? "destructive" : "outline"}>
                  {quickAnalytics?.churnAlert ? "At Risk" : "Healthy"}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {quickAnalytics?.churnAlert ? "Review retention plays" : "No immediate risk"}
                </p>
              </div>
              {/* Tip */}
              {quickAnalytics?.churnAlert && (
                <p className="text-xs text-amber-700 mt-1">Suggestion: Send a win‑back email with an exclusive offer.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Top Products by Margin</h3>
              <ul className="mt-2 space-y-1">
                {(quickAnalytics?.topProducts ?? []).slice(0, 3).map((p: any) => (
                  <li key={String(p.name)} className="text-sm flex justify-between">
                    <span className="truncate">{String(p.name)}</span>
                    <span className="text-muted-foreground">{Math.round((p.margin ?? 0) * 100)}%</span>
                  </li>
                ))}
                {(!quickAnalytics || (quickAnalytics.topProducts ?? []).length === 0) && (
                  <li className="text-sm text-muted-foreground">No data yet</li>
                )}
              </ul>
              <p className="text-xs text-muted-foreground mt-1">Tip: Feature top‑margin products in your next post.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        {Array.isArray(notifications) && notifications.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notifications.slice(0, 6).map((n: any) => {
              const type = String(n.type ?? "info");
              const variant =
                type === "success" ? "border-emerald-200" :
                type === "warning" || type === "urgent" ? "border-amber-200" :
                "border-gray-200";
              return (
                <Card key={String(n.id ?? n.message)} className={variant}>
                  <CardContent className="p-4">
                    <p className="text-sm">{String(n.message ?? "Update")}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">{type}</Badge>
                      {!isGuest && (
                        <Button size="sm" variant="outline" onClick={() => alert("Opening details...")}>
                          View
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-6 text-sm text-muted-foreground">
              No recent activity yet. As you take actions, updates will appear here.
            </CardContent>
          </Card>
        )}
      </section>

      {/* Brain Dump */}
      {!isGuest && business ? <BrainDumpSection businessId={String(business._id)} /> : null}

      {/* Help Coach */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Help Coach</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {visibleTips.map((t) => (
            <Card key={t.id} className="border-emerald-200">
              <CardContent className="p-3 flex items-start justify-between gap-2">
                <span className="text-sm">{t.text}</span>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-6 w-6 text-xs"
                  onClick={() => setDismissedTips((d) => ({ ...d, [t.id]: true }))}
                  aria-label="Dismiss tip"
                >
                  ×
                </Button>
              </CardContent>
            </Card>
          ))}
          {visibleTips.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-3 text-sm text-muted-foreground">All tips dismissed. They'll refresh later.</CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Wins History */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">Wins History</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Streak: {utils.streak}d</Badge>
            <Badge variant="outline">Time saved: {utils.timeSavedTotal}m</Badge>
            <Button size="sm" variant="outline" onClick={utils.clearLocalWins}>Clear</Button>
          </div>
        </div>
        <Card>
          <CardContent className="p-3">
            {utils.history.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-auto pr-1">
                {utils.history.slice(0, 20).map((w, idx) => (
                  <div key={`${w.at}-${idx}`} className="flex items-center justify-between text-sm border rounded-md p-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">{w.type.replace(/_/g, " ")}</Badge>
                      <span className="text-muted-foreground">{new Date(w.at).toLocaleString()}</span>
                    </div>
                    <div className="font-medium">{w.minutes}m</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No wins recorded yet. Using a template or creating from an idea will log one.</div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}