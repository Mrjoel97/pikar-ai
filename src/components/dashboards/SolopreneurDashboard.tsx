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
import { useAuth } from "@/hooks/use-auth";
import CampaignComposer from "@/components/email/CampaignComposer";

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
  // Provide a relaxed-typing alias for the composer so extra props don't cause TS errors
  const CampaignComposerAny = CampaignComposer as any;
  // Use auth status early to guard queries when not authenticated
  const { isAuthenticated: isAuthed } = useAuth();
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
    const addVoiceDump = useMutation(api.initiatives.addVoiceBrainDump as any);
    const deleteDump = useMutation(api.initiatives.deleteBrainDump as any);

    const [text, setText] = React.useState("");
    const [saving, setSaving] = React.useState(false);
    // Add filter state for tag chips
    const [activeTagFilter, setActiveTagFilter] = React.useState<"" | "content" | "offer" | "ops">("");

    // Add: inline save handler for typed idea
    const handleSave = async () => {
      if (!initiativeId) {
        toast("No initiative found. Run Phase 0 setup first.");
        return;
      }
      const content = (text || summary || transcript).trim();
      if (!content) {
        toast("Type an idea first.");
        return;
      }
      try {
        setSaving(true);
        const tags = tagIdea(content);
        if (addVoiceDump) {
          await addVoiceDump({
            initiativeId,
            content,
            transcript: transcript || undefined,
            summary: summary || undefined,
            tags,
          });
        } else {
          await addDump({ initiativeId, content });
        }
        setText("");
        toast.success("Saved idea.");
      } catch (e: any) {
        toast.error(e?.message || "Failed to save idea.");
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
          <div className="flex items-center gap-2 mb-2">
            <Button size="sm" variant={isRecording ? "default" : "outline"} className={isRecording ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""} onClick={isRecording ? stopVoice : startVoice}>
              {isRecording ? "Stop Recording" : "Record Voice Note"}
            </Button>
            {transcript && <Badge variant="outline">Transcript ready</Badge>}
            {detectedTags.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Tags:</span>
                {detectedTags.map((t) => (
                  <Badge key={`detected_${t}`} variant="secondary" className="capitalize">{t}</Badge>
                ))}
              </div>
            )}
          </div>
          {transcript && (
            <div className="text-xs text-muted-foreground mb-2">
              <span className="font-medium">Heard:</span> {transcript}
            </div>
          )}
          {summary && (
            <div className="text-xs text-muted-foreground mb-2">
              <span className="font-medium">Summary:</span> {summary}
            </div>
          )}
          <Textarea
            placeholder="Write freely here... (e.g., campaign idea, positioning, offer notes)"
            value={text}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
            className="min-h-24"
          />
          <div className="flex justify-end gap-2">
            {summary && (
              <Button variant="outline" onClick={handleSave} disabled={saving || !initiativeId}>
                {saving ? "Saving..." : "Save Voice Idea"}
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving || !initiativeId}>
              {saving ? "Saving..." : "Save Idea"}
            </Button>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="space-y-2">
          <div className="text-sm font-medium">Recent ideas</div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground">Filter:</span>
              {(["", "content", "offer", "ops"] as const).map((tag) => (
                <Button
                  key={`tag_${tag || "all"}`}
                  size="sm"
                  variant={activeTagFilter === tag ? "default" : "outline"}
                  className={activeTagFilter === tag ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""}
                  onClick={() => setActiveTagFilter(tag as any)}
                >
                  {tag || "All"}
                </Button>
              ))}
          </div>
          {Array.isArray(dumps) && dumps.length > 0 ? (
            dumps
              .filter((d: any) => {
                if (!activeTagFilter) return true;
                const inferred = tagIdea(String(d.content || ""));
                return inferred.includes(activeTagFilter as any);
              })
              .map((d: any) => (
                <div key={String(d._id)} className="rounded-md border p-3 text-sm">
                  <div className="text-muted-foreground text-xs mb-1">
                    {new Date(d.createdAt).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    {tagIdea(String(d.content || "")).map((t) => (
                      <Badge key={`${String(d._id)}_${t}`} variant="outline" className="capitalize">{t}</Badge>
                    ))}
                  </div>
                  <div className="whitespace-pre-wrap">{d.content}</div>
                  <Button size="sm" variant="secondary" onClick={() => handleCreateWorkflowFromIdea(d.content)}>
                    Create workflow
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-2"
                    onClick={async () => {
                      try {
                        await deleteDump({ brainDumpId: d._id } as any);
                        toast("Deleted");
                      } catch (e: any) {
                        toast.error(e?.message ?? "Failed to delete");
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              ))
          ) : (
            <div className="text-muted-foreground text-sm">No entries yet.</div>
          )}
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

  // Add: Quick Analytics (Convex) with safe fallback for guests/no business
  const quickAnalytics =
    !isGuest && business?._id
      ? (useQuery as any)(api.solopreneur.runQuickAnalytics, { businessId: business._id })
      : { revenue90d: 0, churnAlert: false, topProducts: [] as Array<{ name: string }> };

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

  // Add missing state and mutation for Quick‑add Brain Dump
  const [quickIdea, setQuickIdea] = useState<string>("");
  const [savingQuickIdea, setSavingQuickIdea] = useState<boolean>(false);
  const addDumpTop = useMutation(api.initiatives.addBrainDump as any);

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

  // Add: load Agent Profile v2 to wire tone/persona/cadence into composer
  const agentProfile = useQuery(api.agentProfile.getMyAgentProfile, business ? { businessId: business._id } : "skip" as any);
  const upsertAgent = useMutation(api.agentProfile.upsertMyAgentProfile as any);
  const saveAgentProfile = async (partial: { tone?: "concise" | "friendly" | "premium"; persona?: "maker" | "coach" | "executive"; cadence?: "light" | "standard" | "aggressive" }) => {
    if (!business?._id) {
      toast("Create a business first.");
      return;
    }
    try {
      await upsertAgent({ businessId: business._id, ...partial });
      toast.success("Agent profile updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save agent profile");
    }
  };

  // Add: Schedule a simple "Post" quick action using schedule.addSlot
  const addSlot = useMutation(api.schedule.addSlot);
  const handleQuickPost = async () => {
    try {
      const when = Date.now() + 15 * 60 * 1000; // 15 minutes from now
      await addSlot({
        businessId: business?._id,
        label: "Quick Post",
        channel: "post",
        scheduledAt: when,
      });
      toast.success(`Post scheduled for ${new Date(when).toLocaleString()}`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to schedule post");
    }
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

  // NEW: Template pinning persistence
  const pinnedList = useQuery(
    api.templatePins.listPinned as any,
    isGuest || !isAuthed ? ("skip" as any) : {}
  ) as any[] | undefined;
  const togglePin = useMutation(api.templatePins.togglePin as any);
  const pinnedSet = React.useMemo(() => {
    const ids = new Set<string>();
    if (Array.isArray(pinnedList)) {
      for (const p of pinnedList) {
        const id = String((p as any)?.templateId || "");
        if (id) ids.add(id);
      }
    }
    return ids;
  }, [pinnedList]);

  const handlePinTemplate = async (tplKey: string, nextPin: boolean) => {
    try {
      await togglePin({ templateId: tplKey, pin: nextPin } as any);
      toast(nextPin ? "Pinned template" : "Unpinned template");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update pin");
    }
  };

  // Sort pinned first, then by usage ordering
  const orderedTemplatesWithPins = React.useMemo(() => {
    const list = [...orderedTemplates];
    list.sort((a, b) => {
      const ap = pinnedSet.has(a.key) ? 1 : 0;
      const bp = pinnedSet.has(b.key) ? 1 : 0;
      // pinned first
      if (ap !== bp) return bp - ap;
      return 0;
    });
    return list;
  }, [orderedTemplates, pinnedSet]);

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

  // Add state for Schedule Assistant (Week 4)
  const [scheduleOpen, setScheduleOpen] = useState(false);

  // Compute suggested schedule slots (simple best-time defaults for this week)
  const suggestedSlots: Array<{ label: string; when: string; channel: "Post" | "Email" }> = React.useMemo(() => {
    // Simple heuristic: Tue/Thu 10:00 for Posts; Wed 14:00 for Email
    const base = new Date();
    const toDateString = (d: Date) =>
      d.toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" });
    const nextDow = (targetDow: number, hour: number) => {
      const d = new Date(base);
      const diff = (targetDow + 7 - d.getDay()) % 7 || 7; // always future
      d.setDate(d.getDate() + diff);
      d.setHours(hour, 0, 0, 0);
      return d;
    };
    return [
      { label: "Weekly Post", when: toDateString(nextDow(2, 10)), channel: "Post" },  // Tue 10:00
      { label: "Newsletter", when: toDateString(nextDow(3, 14)), channel: "Email" },  // Wed 14:00
      { label: "Follow-up Post", when: toDateString(nextDow(4, 10)), channel: "Post" }, // Thu 10:00
    ];
  }, []);

  // Schedule slots persistence
  const listSlots = !isGuest && business?._id
    ? (useQuery as any)(api.schedule.listSlots, { businessId: business._id })
    : [];
  const deleteSlot = useMutation(api.schedule.deleteSlot as any);

  // Handler to accept a suggested slot
  const handleAddSlot = async (slot: { label: string; channel: "Post" | "Email"; when: string }) => {
    try {
      // Log a small win locally (+3m) and server-side if signed in
      utils.recordLocalWin(3, "schedule_slot_added", { channel: slot.channel, when: slot.when });
      if (business?._id) {
        // Persist to backend
        const whenDate = new Date();
        // attempt to parse "when" string using current locale best-effort; fallback to now
        // Consumers will typically set absolute times in the server; this provides a client-side shim
        try {
          const parsed = new Date(slot.when);
          if (!isNaN(parsed.getTime())) {
            whenDate.setTime(parsed.getTime());
          }
        } catch {}
        await addSlot({
          businessId: business._id,
          label: slot.label,
          channel: (slot.channel === "Email" ? "email" : "post") as any,
          scheduledAt: whenDate.getTime(),
        } as any);
      }
      toast.success(`Added ${slot.channel} slot for ${slot.when}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to add slot");
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await deleteSlot({ slotId } as any);
      toast("Deleted slot");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete slot");
    }
  };

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
      utils.recordLocalWin(5, "template_used", { templateKey: tpl.key, tone: agentProfile?.tone, persona: agentProfile?.persona });
      if (business?._id) {
        await logWin({
          businessId: business._id,
          winType: "template_used",
          timeSavedMinutes: 5,
          details: { templateKey: tpl.key, tone: agentProfile?.tone, persona: agentProfile?.persona },
        });
      }
    } catch {}
    toast("Template adapted to your tone/persona");
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

  // Tag ideas by theme (simple keyword heuristic)
  const tagIdea = (text: string): Array<"content" | "offer" | "ops"> => {
    const t = text.toLowerCase();
    const out: Array<"content" | "offer" | "ops"> = [];
    if (/(post|tweet|blog|write|publish|newsletter|content)/.test(t)) out.push("content");
    if (/(discount|offer|promo|sale|bundle|pricing|cta)/.test(t)) out.push("offer");
    if (/(ops|process|system|template|automation|schedule|cadence|tooling)/.test(t)) out.push("ops");
    return Array.from(new Set(out));
  };

  // Adapt short copy to tone + persona
  const adaptCopy = (base: string) => {
    const { tone, persona } = agentProfile || { tone: "friendly", persona: "maker", cadence: "standard" };
    let prefix = "";
    if (tone === "concise") prefix += "";
    if (tone === "friendly") prefix += "Hey there! ";
    if (tone === "premium") prefix += "Introducing our refined update: ";

    let personaHint = "";
    if (persona === "maker") personaHint = " Built for momentum.";
    if (persona === "coach") personaHint = " Actionable and supportive.";
    if (persona === "executive") personaHint = " Clear ROI and next steps.";

    return `${prefix}${base}${personaHint}`;
  };

  // Content Capsule generator (1 weekly post + 1 email + 3 tweets)
  const genContentCapsule = () => {
    const rev = fmtNum(quickAnalytics?.revenue90d ?? 0);
    const churn = quickAnalytics?.churnAlert ? "Churn risk spotted — re‑engage now." : "Healthy retention — keep cadence.";
    const top = (quickAnalytics?.topProducts ?? [])[0]?.name || "your top offer";
    const cadenceCopy =
      agentProfile?.cadence === "light" ? "light weekly" : agentProfile?.cadence === "aggressive" ? "high‑tempo" : "steady weekly";

    const weeklyPost = adaptCopy(
      `Weekly update: momentum check, ${cadenceCopy} plan, and a quick spotlight on ${top}. ${churn}`
    );

    const emailSubject = adaptCopy(`This week's quick win: ${top}`);
    const emailBody = adaptCopy(
      `Here's your ${cadenceCopy} nudge. Highlight: ${top}. Rolling 90‑day revenue at $${rev}. ` +
        (quickAnalytics?.churnAlert ? "Let's re‑activate quiet subscribers with a friendly value note." : "Stay consistent and keep delivering value.")
    );

    const tweets: string[] = [
      adaptCopy(`Ship > perfect. This week: feature ${top} and keep your streak alive.`),
      adaptCopy(`Consistency compounds. One quick post today = momentum for the week.`),
      adaptCopy(`Tiny wins add up. Spotlight ${top} in under 90 words.`),
    ];

    return { weeklyPost, emailSubject, emailBody, tweets };
  };

  // UI state: Content Capsule
  const [capsuleOpen, setCapsuleOpen] = React.useState(false);
  const [capsule, setCapsule] = React.useState<{ weeklyPost: string; emailSubject: string; emailBody: string; tweets: string[] } | null>(null);
  const handleOpenCapsule = () => {
    const c = genContentCapsule();
    setCapsule(c);
    setCapsuleOpen(true);
  };
  const handleCopy = (txt: string, toastMsg = "Copied") => {
    navigator.clipboard.writeText(txt).then(
      () => toast.success(toastMsg),
      () => toast.error("Copy failed")
    );
  };
  const handleSaveCapsuleWins = async () => {
    utils.recordLocalWin(12, "content_capsule_generated", { cadence: agentProfile?.cadence });
    if (business?._id) {
      try {
        await logWin({
          businessId: business._id,
          winType: "content_capsule_generated",
          timeSavedMinutes: 12,
          details: { cadence: agentProfile?.cadence },
        });
      } catch {}
    }
    toast("Saved win");
  };

  // Add Voice Notes (beta): record → transcribe (Web Speech API if available) → summarize & tag → save
  const [isRecording, setIsRecording] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [detectedTags, setDetectedTags] = React.useState<Array<"content" | "offer" | "ops">>([]);
  const recognitionRef = React.useRef<any>(null);

  // Start voice capture via Web Speech API if available, else guide user
  const startVoice = async () => {
    try {
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition ||
        null;
      if (!SpeechRecognition) {
        toast("Voice recognition not supported in this browser");
        return;
      }
      const rec = new SpeechRecognition();
      rec.lang = "en-US";
      rec.continuous = false;
      rec.interimResults = true;
      rec.onresult = (e: any) => {
        let text = "";
        for (let i = 0; i < e.results.length; i++) {
          text += e.results[i][0].transcript;
        }
        setTranscript(text);
      };
      rec.onend = () => {
        setIsRecording(false);
        // Simple auto-summarize: take first sentence or 20 words
        const clean = transcript.trim();
        const s = clean.split(/[.!?]/)[0] || clean.split(" ").slice(0, 20).join(" ");
        setSummary(s);
        setDetectedTags(tagIdea(clean));
      };
      recognitionRef.current = rec;
      setTranscript("");
      setSummary("");
      setDetectedTags([]);
      setIsRecording(true);
      rec.start();
    } catch (e: any) {
      setIsRecording(false);
      toast.error(e?.message ?? "Failed to start recording");
    }
  };

  const stopVoice = () => {
    try {
      const rec = recognitionRef.current;
      if (rec) rec.stop();
    } catch {}
  };

  // Save from voice summary into Brain Dump (delegated to BrainDumpSection-local handler)
  const handleSaveVoiceIdea = async () => {
    toast("Open the Brain Dump to save the voice note.");
  };

  // Business context for composer and SLA
  const currentBusiness = useQuery(api.businesses.currentUserBusiness as any, isAuthed ? {} : "skip") as any;
  const businessId = currentBusiness?._id;

  // Env / system health
  const env = useQuery(api.health.envStatus, {}) as {
    hasRESEND: boolean;
    hasSALES_INBOX: boolean;
    hasPUBLIC_SALES_INBOX: boolean;
    hasBASE_URL: boolean;
    devSafeEmailsEnabled: boolean;
    emailQueueDepth: number;
    cronLastProcessed: number | null;
    overdueApprovalsCount: number;
  } | undefined;

  // SLA summary (skip if no business yet)
  const sla = useQuery(api.approvals.getSlaSummary as any, businessId ? { businessId } : "skip") as
    | { total: number; overdue: number; dueSoon: number }
    | undefined;

  // Seed demo data
  const seedForMe = useAction(api.seed.seedForCurrentUser);

  // Local UI
  const [composerOpen, setComposerOpen] = React.useState(false);

  // Inject default schedule time into existing CampaignComposer usage, if present
  const nextEmailSlot = useQuery(
    api.schedule.nextSlotByChannel,
    // Guarded usage: only query when businessId is available; otherwise, skip
    businessId
      ? { channel: "email", businessId, from: Date.now() }
      : ("skip" as any)
  );

  const winsSummary = useQuery(
    api.audit.winsSummary,
    businessId ? { businessId } : ("skip" as any)
  );

  const recentAudit = useQuery(
    api.audit.listForBusiness,
    businessId ? { businessId, limit: 3 } : ("skip" as any)
  );

  // Local fallback for wins when unauthenticated or no business
  function getLocalWinsFallback() {
    try {
      const raw = localStorage.getItem("pikar_local_wins_v1");
      if (!raw) return { wins: 0, totalTimeSavedMinutes: 0 };
      const arr = JSON.parse(raw) as Array<{ at: number; timeSavedMinutes?: number }>;
      let wins = 0;
      let totalTimeSavedMinutes = 0;
      const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
      for (const w of arr) {
        if (w.at >= since) {
          wins += 1;
          totalTimeSavedMinutes += Number(w.timeSavedMinutes || 0);
        }
      }
      return { wins, totalTimeSavedMinutes };
    } catch {
      return { wins: 0, totalTimeSavedMinutes: 0 };
    }
  }

  // Enhance existing "Send Newsletter" trigger to use handleOpenComposerPrefilled
  function handleOpenComposerPrefilled() {
    if (nextEmailSlot && nextEmailSlot.scheduledAt) {
      toast("Prefilling schedule with your next Email slot");
    }
    setComposerOpen(true);
  }

  // Optional: Add a small helper button for "Post" placeholder if you have a "Schedule Assistant" area
  function handlePostPlaceholder() {
    if (nextEmailSlot && nextEmailSlot.scheduledAt) {
      toast(`Post placeholder queued for ${new Date(nextEmailSlot.scheduledAt).toLocaleString()}`);
    } else {
      toast("No upcoming slot found; add one in Schedule Assistant");
    }
  }

  // 2) Expose a "Post" quick action using next scheduled Post slot
  // Fetch next Post slot similar to nextEmailSlot (guarded by businessId):
  const nextPostSlot = useQuery(
    api.schedule.nextSlotByChannel,
    businessId ? { channel: "post", businessId, from: Date.now() } : ("skip" as any)
  );

  return (
    <div className="space-y-4">
      {/* DEV Safe Mode banner */}
      {env?.devSafeEmailsEnabled && (
        <div className="rounded-md border border-amber-400/50 bg-amber-50 px-4 py-2 text-amber-800">
          DEV Safe Mode is ON — outbound emails are stubbed. Disable DEV_SAFE_EMAILS to send live.
        </div>
      )}

      {/* System Health strip */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={env?.hasRESEND ? "default" : "destructive"}>
              Email API: {env?.hasRESEND ? "Configured" : "Missing"}
            </Badge>
            <Badge variant={env?.hasBASE_URL ? "default" : "destructive"}>
              Base URL: {env?.hasBASE_URL ? "Set" : "Missing"}
            </Badge>
            <Badge variant={(env?.hasSALES_INBOX || env?.hasPUBLIC_SALES_INBOX) ? "default" : "destructive"}>
              Sales Inbox: {(env?.hasSALES_INBOX || env?.hasPUBLIC_SALES_INBOX) ? "Present" : "Missing"}
            </Badge>
            <Badge variant={env && env.emailQueueDepth > 0 ? "secondary" : "default"}>
              Email Queue: {env?.emailQueueDepth ?? 0}
            </Badge>
            <Badge variant={env?.devSafeEmailsEnabled ? "secondary" : "default"}>
              Send Mode: {env?.devSafeEmailsEnabled ? "DEV (stubbed)" : "LIVE"}
            </Badge>
<Badge variant="outline">
  Cron Freshness: {env?.cronLastProcessed ? `${Math.max(0, Math.round((Date.now() - env.cronLastProcessed) / 60000))}m ago` : "n/a"}
</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Approvals/SLA badge with link */}
      {businessId && (
        <div className="flex items-center justify-between rounded-md border p-3">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant={sla && sla.overdue > 0 ? "destructive" : "secondary"}>
              SLA: {sla ? `${sla.overdue} overdue • ${sla.dueSoon} due soon` : "Loading..."}
            </Badge>
            <span className="text-muted-foreground">
              {sla ? `${sla.total} pending total` : ""}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/workflows")}>
            View Workflows
          </Button>
        </div>
      )}

      {/* Quick actions: Send Newsletter */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="default" onClick={handleOpenComposerPrefilled} disabled={!businessId}>
          Send Newsletter
        </Button>
      </div>

      {/* Newsletter Composer Modal */}
      <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Quick Newsletter</DialogTitle>
          </DialogHeader>
          {businessId ? (
            <CampaignComposerAny
              businessId={businessId}
              agentTone={agentProfile?.tone}
              agentPersona={agentProfile?.persona}
              agentCadence={agentProfile?.cadence}
              onClose={() => setComposerOpen(false)}
              onCreated={() => toast.success("Newsletter scheduled")}
              defaultScheduledAt={nextEmailSlot ? nextEmailSlot.scheduledAt : undefined}
            />
          ) : (
            <div className="text-sm text-muted-foreground">Finish onboarding to create a business first.</div>
          )}
        </DialogContent>
      </Dialog>

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
        {/* Week 4: Schedule Assistant entry */}
        <Button size="sm" variant="outline" onClick={() => setScheduleOpen(true)}>
          Schedule Assistant
        </Button>
      </div>

      {/* Agent Profile v2 (local) */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Agent Profile</h2>
        <Card>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Brand Tone</div>
              <div className="flex gap-2 flex-wrap">
                {(["concise","friendly","premium"] as const).map((t) => (
                  <Button
                    key={t}
                    size="sm"
                    variant={agentProfile?.tone === t ? "default" : "outline"}
                    className={agentProfile?.tone === t ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""}
                    onClick={() => saveAgentProfile({ tone: t })}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Audience Persona</div>
              <div className="flex gap-2 flex-wrap">
                {(["maker","coach","executive"] as const).map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={agentProfile?.persona === p ? "default" : "outline"}
                    className={agentProfile?.persona === p ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""}
                    onClick={() => saveAgentProfile({ persona: p })}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Preferred Cadence</div>
              <div className="flex gap-2 flex-wrap">
                {(["light","standard","aggressive"] as const).map((c) => (
                  <Button
                    key={c}
                    size="sm"
                    variant={agentProfile?.cadence === c ? "default" : "outline"}
                    className={agentProfile?.cadence === c ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""}
                    onClick={() => saveAgentProfile({ cadence: c })}
                  >
                    {c}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Persistent Quick Bar */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setGalleryOpen(true)}>New Idea</Button>
          <Button size="sm" variant="outline" onClick={() => navigate("/workflows")}>Draft Email</Button>
          <Button size="sm" variant="outline" onClick={() => handleQuickAction("Create Post")}>Create Post</Button>
          <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleOpenCapsule}>
            Content Capsule
          </Button>
        </div>
      </section>

      {/* Content Capsule Dialog */}
      <Dialog open={capsuleOpen} onOpenChange={setCapsuleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Content Capsule</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              One weekly post, one email, and 3 tweet variants adapted to your tone/persona.
            </p>
            {capsule && (
              <div className="space-y-3">
                <Card>
                  <CardContent className="p-3 space-y-2">
                    <div className="text-xs text-muted-foreground">Weekly Post</div>
                    <div className="text-sm whitespace-pre-wrap">{capsule.weeklyPost}</div>
                    <Button size="sm" variant="outline" onClick={() => handleCopy(capsule.weeklyPost, "Copied weekly post")}>Copy</Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 space-y-2">
                    <div className="text-xs text-muted-foreground">Email</div>
                    <div className="text-sm font-medium">Subject: {capsule.emailSubject}</div>
                    <div className="text-sm whitespace-pre-wrap">{capsule.emailBody}</div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleCopy(capsule.emailSubject, "Copied subject")}>Copy Subject</Button>
                      <Button size="sm" variant="outline" onClick={() => handleCopy(capsule.emailBody, "Copied email body")}>Copy Body</Button>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 space-y-2">
                    <div className="text-xs text-muted-foreground">Tweet Variants</div>
                    <div className="space-y-2">
                      {capsule.tweets.map((t, i) => (
                        <div key={i} className="flex items-start justify-between gap-2 border rounded p-2">
                          <div className="text-sm whitespace-pre-wrap">{t}</div>
                          <Button size="sm" variant="outline" onClick={() => handleCopy(t, "Copied tweet")}>Copy</Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleSaveCapsuleWins}>Save Win</Button>
            <Button onClick={() => setCapsuleOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* My Templates strip */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">My Templates</h2>
          <Button size="sm" variant="outline" onClick={() => setGalleryOpen(true)}>Open Gallery</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {orderedTemplatesWithPins.map((t) => (
            <Card key={t.key} className="...">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{t.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{t.tag}</Badge>
                    <Button
                      size="icon"
                      variant={pinnedSet.has(t.key) ? "default" : "outline"}
                      className={pinnedSet.has(t.key) ? "bg-emerald-600 text-white hover:bg-emerald-700 h-8 w-8" : "h-8 w-8"}
                      onClick={() => handlePinTemplate(t.key, !pinnedSet.has(t.key))}
                      aria-label={pinnedSet.has(t.key) ? "Unpin template" : "Pin template"}
                      title={pinnedSet.has(t.key) ? "Unpin" : "Pin"}
                    >
                      {pinnedSet.has(t.key) ? "★" : "☆"}
                    </Button>
                  </div>
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
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">{t.tag}</Badge>
                          <Button
                            size="icon"
                            variant={pinnedSet.has(t.key) ? "default" : "outline"}
                            className={pinnedSet.has(t.key) ? "bg-emerald-600 text-white hover:bg-emerald-700 h-8 w-8" : "h-8 w-8"}
                            onClick={() => handlePinTemplate(t.key, !pinnedSet.has(t.key))}
                            aria-label={pinnedSet.has(t.key) ? "Unpin template" : "Pin template"}
                            title={pinnedSet.has(t.key) ? "Unpin" : "Pin"}
                          >
                            {pinnedSet.has(t.key) ? "★" : "☆"}
                          </Button>
                        </div>
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
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleQuickAction("Create Post")}>Start</Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (nextPostSlot && (nextPostSlot as any).scheduledAt) {
                      toast(`Post scheduled placeholder for ${new Date((nextPostSlot as any).scheduledAt).toLocaleString()}`);
                    } else {
                      toast("No upcoming Post slot; add one in Schedule Assistant");
                    }
                  }}
                  disabled={!businessId}
                >
                  Use Next Slot
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleQuickPost}
                  disabled={!businessId}
                >
                  Schedule in 15m
                </Button>
              </div>
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
              <p className="text-xs mt-1">
                <span className="text-muted-foreground">7d delta: </span>
                <span className={snapshot.revenue.delta >= 0 ? "text-emerald-700" : "text-amber-700"}>
                  {snapshot.revenue.delta >= 0 ? "+" : ""}
                  {fmtNum(snapshot.revenue.delta)}%
                </span>
              </p>
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
                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      utils.recordLocalWin(4, "nudge_send_to_top_50", { reason: quickAnalytics?.churnAlert ? "churn_risk" : "routine" });
                      toast("Open Workflows to draft a targeted message.");
                      navigate("/workflows");
                    }}
                  >
                    Send to your top 50
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Top Products by Margin</h3>
              <ul className="mt-2 space-y-1">
                {(quickAnalytics?.topProducts ?? [])[0]?.name || "No data yet"}
              </ul>
              <p className="text-xs text-muted-foreground mt-1">7d: Stable — consider highlighting top margin items.</p>
              <div className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    utils.recordLocalWin(3, "nudge_feature_top_product", {});
                    toast("Open Workflows to feature top product.");
                    navigate("/workflows");
                  }}
                >
                  Feature top product
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Schedule Assistant dialog (simple, suggest slots with 1‑click add) */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Assistant</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Suggested slots based on best‑time defaults and simple cadence. Add with one click.
            </p>
            <div className="space-y-2">
              {suggestedSlots.map((s, idx) => (
                <div key={`${s.label}-${idx}`} className="flex items-center justify-between rounded-md border p-2">
                  <div>
                    <div className="text-sm font-medium">{s.label} • {s.channel}</div>
                    <div className="text-xs text-muted-foreground">{s.when}</div>
                  </div>
                  <Button size="sm" onClick={() => handleAddSlot(s)} disabled={isGuest}>Add</Button>
                </div>
              ))}
            </div>
            {!isGuest && (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground mt-2">Your scheduled slots</div>
                {Array.isArray(listSlots) && listSlots.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-auto pr-1">
                    {listSlots.map((slot: any) => (
                      <div key={String(slot._id)} className="flex items-center justify-between rounded-md border p-2">
                        <div>
                          <div className="text-sm font-medium">{String(slot.label)} • {String(slot.channel)}</div>
                          <div className="text-xs text-muted-foreground">{new Date(Number(slot.scheduledAt || 0)).toLocaleString()}</div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteSlot(String(slot._id))}>
                          Delete
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No scheduled slots yet.</div>
                )}
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Tip: Keep a consistent weekly cadence — Tue/Thu mornings for posts, Wed afternoons for email.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Content Capsule launcher */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Content Capsule</h2>
        <Button size="sm" onClick={handleOpenCapsule}>Generate</Button>
      </div>

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

      {/* Wins Summary card */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Wins (30 days)</h3>
            <Button variant="outline" size="sm" onClick={() => navigate("/analytics")}>
              View Analytics
            </Button>
          </div>
          <div className="mt-3">
            {businessId && winsSummary ? (
              <div className="flex gap-6">
                <div>
                  <div className="text-3xl font-bold">{winsSummary.wins}</div>
                  <div className="text-sm text-muted-foreground">Total wins</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{winsSummary.totalTimeSavedMinutes}</div>
                  <div className="text-sm text-muted-foreground">Minutes saved</div>
                </div>
              </div>
            ) : (
              (() => {
                const local = getLocalWinsFallback();
                return (
                  <div className="flex gap-6">
                    <div>
                      <div className="text-3xl font-bold">{local.wins}</div>
                      <div className="text-sm text-muted-foreground">Total wins (local)</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold">{local.totalTimeSavedMinutes}</div>
                      <div className="text-sm text-muted-foreground">Minutes saved (local)</div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </Card>

        {/* Audit & Analytics CTA card */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Audit & Analytics</h3>
            <Button size="sm" onClick={() => navigate("/analytics")}>
              Open
            </Button>
          </div>
          <div className="mt-3 space-y-2">
            {businessId && recentAudit
              ? recentAudit.map((log: any) => (
                  <div key={log._id} className="text-sm">
                    <div className="font-medium">{log.action}</div>
                    <div className="text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              : <div className="text-sm text-muted-foreground">Sign in to view recent audit events.</div>
            }
          </div>
        </Card>
      </div>

      {isAuthed && (
        <div className="fixed bottom-6 right-6 z-40">
          <Button
            onClick={async () => {
              try {
                const res = await seedForMe({});
                toast.success("Demo data seeded");
                if ((res as any)?.businessId) {
                  // no-op; UI is reactive via Convex queries
                }
              } catch (e: any) {
                toast.error(e?.message ?? "Failed to seed demo data");
              }
            }}
          >
            Seed Demo Data
          </Button>
        </div>
      )}
    </div>
  );
}