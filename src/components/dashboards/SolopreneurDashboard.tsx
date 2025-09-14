import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Zap, Pencil, Calendar, BarChart3, HelpCircle } from "lucide-react";

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
  // Use Convex KPI snapshot when authenticated; fallback to demo data for guests
  const kpiDoc = !isGuest && business?._id
    ? useQuery(api.kpis.getSnapshot, { businessId: business._id })
    : undefined;

  // Use demo data when in guest mode
  const agents = isGuest ? demoData?.agents || [] : [];
  const workflows = isGuest ? demoData?.workflows || [] : [];
  const kpis = isGuest ? (demoData?.kpis || {}) : (kpiDoc || {});
  const tasks = isGuest ? demoData?.tasks || [] : [];

  // Add: current user (for createCampaign.createdBy)
  const currentUser = !isGuest ? useQuery((api as any).users?.currentUser || ({} as any), {}) : undefined;

  // Add: list campaigns for this business
  const campaigns = !isGuest && business?._id
    ? useQuery(api.emails.listCampaignsByBusiness, { businessId: business._id })
    : undefined;

  // Add: simple sparkline renderer for trends
  const Sparkline = ({ values, color = "bg-emerald-600" }: { values: number[]; color?: string }) => (
    <div className="flex items-end gap-1 h-12">
      {values.map((v, i) => (
        <div
          key={i}
          className={`${color} w-2 rounded-sm`}
          style={{ height: `${Math.max(6, Math.min(100, v))}%` }}
          aria-hidden
        />
      ))}
    </div>
  );

  // Add: query top 3 prioritized tasks for authenticated users
  const topTasks = !isGuest && business?._id
    ? useQuery(api.tasks.topThreeForBusiness, { businessId: business._id })
    : undefined;

  // Add: mutation to seed demo tasks into authenticated account if empty
  const seedTasks = useMutation(api.tasks.seedDemoTasksForBusiness);

  // Add: query unified recent activity for authenticated users (safe ref)
  const activityGetRecent = (api as any).activityFeed?.getRecent;
  const activityFeed = !isGuest && business?._id && activityGetRecent
    ? useQuery(activityGetRecent, { businessId: business._id, limit: 8 } as any)
    : undefined;

  // Compute tasks to show (guest uses demo; auth uses Convex)
  const tasksToShow = isGuest ? tasks : (topTasks ?? []);

  // Generate trend arrays (guest: demo based, auth: small jitter from snapshot)
  const mkTrend = (base?: number): number[] => {
    const b = typeof base === "number" && !Number.isNaN(base) ? base : 50;
    const arr: number[] = [];
    for (let i = 0; i < 8; i++) {
      const jitter = ((i % 2 === 0 ? 1 : -1) * (5 + (i % 3))) / 2;
      arr.push(Math.max(5, Math.min(100, b + jitter)));
    }
    return arr;
  };

  const revenueVal =
    typeof (kpis?.revenue) === "number"
      ? kpis.revenue
      : typeof (kpis?.totalRevenue) === "number"
      ? kpis.totalRevenue
      : 0;

  const customersVal =
    typeof (kpis?.activeCustomers) === "number"
      ? kpis.activeCustomers
      : typeof (kpis?.subscribers) === "number"
      ? kpis.subscribers
      : 0;

  const conversionVal =
    typeof (kpis?.conversionRate) === "number"
      ? kpis.conversionRate
      : typeof (kpis?.engagement) === "number"
      ? kpis.engagement
      : undefined;

  const tasksDoneVal =
    typeof (kpis?.taskCompletion) === "number"
      ? kpis.taskCompletion
      : typeof (kpis?.engagement) === "number"
      ? kpis.engagement
      : 0;

  const revenueDelta =
    typeof (kpis?.revenueDelta) === "number"
      ? kpis.revenueDelta
      : undefined;
  const subscribersDelta =
    typeof (kpis?.subscribersDelta) === "number"
      ? kpis.subscribersDelta
      : undefined;
  const engagementDelta =
    typeof (kpis?.engagementDelta) === "number"
      ? kpis.engagementDelta
      : undefined;

  const visitorsVal =
    typeof (kpis?.visitors) === "number"
      ? kpis.visitors
      : 0;

  const visitorsDelta =
    typeof (kpis?.visitorsDelta) === "number"
      ? kpis.visitorsDelta
      : undefined;

  const revenueTrend = mkTrend((kpis?.totalRevenue ? Math.min(100, (kpis.totalRevenue / 1000) % 100) : 60));
  const efficiencyTrend = mkTrend(kpis?.taskCompletion ?? 65);

  const UpgradeCTA = ({ feature }: { feature: string }) => (
    <Card className="border-dashed border-2 border-gray-300">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <h3 className="font-semibold mb-2">Upgrade for Team Features</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Get advanced {feature} with the Startup plan
        </p>
        <Button onClick={onUpgrade} size="sm">
          Upgrade to Startup
        </Button>
      </CardContent>
    </Card>
  );

  // Newsletter dialog state (auth users only; guest will get a toast)
  const [openNewsletter, setOpenNewsletter] = React.useState(false);
  const [toEmail, setToEmail] = React.useState("");
  const [fromEmail, setFromEmail] = React.useState("");
  const [subject, setSubject] = React.useState("Your monthly update");
  const [body, setBody] = React.useState("Hello!\n\nHere's a quick update from our studio.");
  const sendTestEmail = useAction(api.emailsActions.sendTestEmail);

  // Add: bulk sending state & helpers
  const [bulkMode, setBulkMode] = React.useState(false);
  const [recipientsRaw, setRecipientsRaw] = React.useState("");
  const [recipientsList, setRecipientsList] = React.useState<string[]>([]);
  const [invalidList, setInvalidList] = React.useState<string[]>([]);
  // Add: hidden file input ref for one-click upload & import
  const uploadCsvInputRef = React.useRef<HTMLInputElement | null>(null);

  // Add: parse recipients utility
  const parseRecipients = React.useCallback((raw: string) => {
    const parts = raw
      .split(/[\n,;]+/g)
      .map((s) => s.trim())
      .filter(Boolean);
    const unique = Array.from(new Set(parts));
    const valid: string[] = [];
    const invalid: string[] = [];
    unique.forEach((e) => {
      if (emailFmtOk(e)) valid.push(e);
      else invalid.push(e);
    });
    return { valid, invalid };
  }, []);

  // Add: handle recipients textarea change
  const handleRecipientsChange = (val: string) => {
    setRecipientsRaw(val);
    const { valid, invalid } = parseRecipients(val);
    setRecipientsList(valid);
    setInvalidList(invalid);
  };

  // Add: CSV/TXT file upload parsing
  const handleRecipientsFile = async (file?: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      // Basic CSV extraction: look for "email" column or any emails in text
      // Extract emails via regex to be robust
      const emails = Array.from(
        new Set(
          (text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || []).map((e) => e.trim())
        )
      );
      const combinedRaw = [recipientsRaw, emails.join("\n")].filter(Boolean).join("\n");
      handleRecipientsChange(combinedRaw);
      toast.success(`Imported ${emails.length} emails`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to read file");
    }
  };

  const emailFmtOk = (val: string) => /^\S+@\S+\.\S+$/.test(val);

  const navigate = useNavigate();

  const [createOpen, setCreateOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  const [openScheduleCampaign, setOpenScheduleCampaign] = React.useState(false);
  const [campSubject, setCampSubject] = React.useState("Monthly update");
  const [campFrom, setCampFrom] = React.useState("");
  const [campBody, setCampBody] = React.useState("Hello,\n\nHere's what's new this month...");
  const [campPreview, setCampPreview] = React.useState("This month's highlights");
  const [campWhen, setCampWhen] = React.useState<string>("");
  const defaultTz = React.useMemo(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { return "UTC"; }
  }, []);
  const [campTz, setCampTz] = React.useState<string>(defaultTz);

  const createCampaign = useMutation(api.emails.createCampaign);

  // Add: helper to convert datetime-local string into UTC ms
  const datetimeLocalToMs = (val: string): number | null => {
    if (!val) return null;
    // val like "2025-09-13T12:30"
    const d = new Date(val);
    const ms = d.getTime();
    return Number.isFinite(ms) ? ms : null;
  };

  // Add: contact lists + schedule mode state
  const lists = !isGuest && business?._id
    ? useQuery((api as any).contacts?.listLists || ({} as any), { businessId: business._id } as any)
    : undefined;
  const [manageContactsOpen, setManageContactsOpen] = React.useState(false);
  const [selectedListId, setSelectedListId] = React.useState<string>("");
  const [newListName, setNewListName] = React.useState("");
  const [csvText, setCsvText] = React.useState("");

  React.useEffect(() => {
    if (!selectedListId && Array.isArray(lists) && lists.length > 0) {
      setSelectedListId(String(lists[0]._id));
    }
  }, [lists, selectedListId]);

  // Mutations/actions for contacts
  const createListMutation = useMutation((api as any).contacts?.createList || ({} as any));
  const importCsvToList = useAction((api as any).contacts?.importCsvToList || ({} as any));
  const seedContactsAction = useAction((api as any).contacts?.seedContacts || ({} as any));

  // Add: schedule mode (direct vs list)
  const [scheduleMode, setScheduleMode] = React.useState<"direct" | "list">("direct");

  // Add: handle schedule campaign submit
  const handleScheduleCampaign = async () => {
    try {
      if (isGuest) {
        toast("Please sign in to schedule a campaign.");
        return;
      }
      if (!business?._id || !currentUser?._id) {
        toast.error("Business or user is not ready yet.");
        return;
      }
      if (!campSubject.trim() || !campFrom.trim() || !campBody.trim()) {
        toast.error("Fill subject, from, and body.");
        return;
      }
      if (!emailFmtOk(campFrom)) {
        toast.error("From must be a valid email address (verified in Resend).");
        return;
      }
      const scheduledAt = datetimeLocalToMs(campWhen);
      if (!scheduledAt || scheduledAt < Date.now()) {
        toast.error("Pick a future date/time.");
        return;
      }

      // Audience handling
      let audienceType: "direct" | "list" = scheduleMode;
      let audienceListId: string | undefined;
      let directRecipients: string[] = [];

      if (scheduleMode === "list") {
        if (!selectedListId) {
          toast.error("Select a contact list.");
          return;
        }
        audienceListId = selectedListId;
      } else {
        if (recipientsList.length === 0) {
          toast.error("Provide at least one recipient (or switch to List).");
          return;
        }
        directRecipients = recipientsList;
      }

      await createCampaign({
        businessId: business._id,
        createdBy: currentUser._id,
        subject: campSubject,
        from: campFrom,
        previewText: campPreview || undefined,
        blocks: [
          { type: "text", content: campBody },
          { type: "footer", includeUnsubscribe: true },
        ] as any,
        recipients: directRecipients,
        timezone: campTz || "UTC",
        scheduledAt,
        audienceType,
        audienceListId: audienceListId as any,
      } as any);

      toast.success("Campaign scheduled");
      setOpenScheduleCampaign(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to schedule campaign");
    }
  };

  // Add: handle Create Content submit
  const handleCreateContentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const form = e.currentTarget;
      const data = new FormData(form);
      const title = String(data.get("title") || "").trim();
      const content = String(data.get("content") || "").trim();
      // optional
      const cta = String(data.get("cta") || "").trim();

      if (!title || !content) {
        toast.error("Please fill out title and content.");
        return;
      }

      // For now, simulate a save
      toast.success("Draft saved");
      setCreateOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save draft");
    }
  };

  // Add: handle Schedule Post submit
  const handleScheduleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const form = e.currentTarget;
      const data = new FormData(form);
      const post = String(data.get("post") || "").trim();
      const when = String(data.get("when") || "");
      const channel = String(data.get("channel") || "").trim();

      if (!post || !when || !channel) {
        toast.error("Please fill out post, when, and channel.");
        return;
      }

      // For now, simulate scheduling
      toast.success("Post scheduled");
      setScheduleOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to schedule post");
    }
  };

  // Add: handle Send Newsletter (single or bulk)
  const handleSendNewsletter = async () => {
    try {
      if (isGuest) {
        toast("Please sign in to send a test email.");
        return;
      }
      if (!business?._id) {
        toast.error("Business is not ready yet.");
        return;
      }
      if (!emailFmtOk(fromEmail)) {
        toast.error("From must be a valid email address (verified in Resend).");
        return;
      }

      const recipients = bulkMode
        ? recipientsList
        : (emailFmtOk(toEmail) ? [toEmail] : []);

      if (recipients.length === 0) {
        toast.error("Provide at least one valid recipient.");
        return;
      }
      if (!subject.trim() || !body.trim()) {
        toast.error("Subject and message are required.");
        return;
      }

      const blocks = [
        { type: "text", content: body },
        { type: "footer", includeUnsubscribe: true },
      ] as any;

      const results = await Promise.allSettled(
        recipients.map((to) =>
          sendTestEmail({
            from: fromEmail,
            to,
            subject,
            previewText: undefined,
            businessId: business._id,
            blocks,
          })
        )
      );

      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.length - succeeded;

      if (succeeded > 0) {
        toast.success(`Sent to ${succeeded}${failed ? ` • Failed: ${failed}` : ""}`);
        setOpenNewsletter(false);
      } else {
        toast.error("All sends failed. Check From address and try again.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to send");
    }
  };

  const snapshot = (
    !isGuest && business?._id
      ? useQuery(api.kpis.getSnapshot, { businessId: business._id })
      : null
  ) ?? {
    visitors: 0,
    subscribers: 0,
    engagement: 0,
    revenue: 0,
    visitorsDelta: 0,
    subscribersDelta: 0,
    engagementDelta: 0,
    revenueDelta: 0,
  };

  const builtIns = useQuery(api.workflows.getBuiltInTemplates, { tier: "solopreneur", search: null } as any) ?? [];

  const copyBuiltIn = useMutation(api.workflows.copyBuiltInTemplate);

  type FocusTask = { id: string; title: string; snap: "S" | "N" | "A" | "P"; done: boolean };
  const [focusInput, setFocusInput] = useState("");
  const [focusTasks, setFocusTasks] = useState<FocusTask[]>([]);

  // Map server task -> SNAP badge for UI consistency
  const toSnapLetter = (urgent?: boolean, priority?: "low" | "medium" | "high"): "S" | "N" | "A" | "P" => {
    if (urgent) return "S";
    if (priority === "high") return "N";
    if (priority === "medium") return "A";
    return "P";
  };

  // Compute display list for Today's Focus
  const displayFocus = isGuest
    ? (() => {
        // local top3 using existing logic
        const snapWeight: Record<"S" | "N" | "A" | "P", number> = { S: 4, N: 3, A: 2, P: 1 };
        return [...focusTasks]
          .sort((a, b) => snapWeight[b.snap] - snapWeight[a.snap])
          .slice(0, 3);
      })()
    : (tasksToShow ?? []).map((t: any) => ({
        id: String(t._id),
        title: t.title as string,
        snap: toSnapLetter(Boolean(t.urgent), t.priority as any),
        done: t.status === "done",
        _raw: t,
      }));

  const createTask = useMutation(api.tasks.create);
  const updateTaskStatus = useMutation(api.tasks.updateStatus);

  function addFocusTask(title: string) {
    if (isGuest || !business?._id) {
      // Guest mode: keep the existing local behavior
      const snapLetters: Array<"S" | "N" | "A" | "P"> = ["S", "N", "A", "P"];
      const snap = snapLetters[(title.length + focusTasks.length) % 4]!;
      const task = {
        id: crypto.randomUUID(),
        title: title.trim(),
        snap,
        done: false,
      };
      setFocusTasks((prev) => [task as any, ...prev].slice(0, 10));
      toast.success("Task added");
      return;
    }

    // Auth: persist via Convex
    const clean = title.trim();
    if (!clean) return;

    // Derive SNAP for UI and map to server fields
    const snapLetters: Array<"S" | "N" | "A" | "P"> = ["S", "N", "A", "P"];
    const snap = snapLetters[(title.length + (tasksToShow?.length ?? 0)) % 4]!;
    const urgent = snap === "S";
    const priority = snap === "S" || snap === "N" ? "high" : snap === "A" ? "medium" : "low";

    createTask({
      businessId: business._id,
      title: clean,
      description: undefined,
      priority: priority as any,
      urgent,
      dueDate: undefined,
      initiativeId: undefined as any,
    })
      .then(() => {
        toast.success("Task added");
      })
      .catch((e: any) => {
        toast.error(e?.message ?? "Failed to add task");
      });
  }

  function toggleTask(id: string) {
    if (isGuest) {
      setFocusTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
      return;
    }

    // Auth: find the task and toggle status via Convex
    const t = (tasksToShow ?? []).find((row: any) => String(row._id) === id);
    if (!t) return;
    const nextStatus = t.status === "done" ? "todo" : "done";
    updateTaskStatus({ taskId: t._id, status: nextStatus })
      .then(() => {
        // toast for feedback; UI auto-updates via subscription
        toast.success(nextStatus === "done" ? "Marked done" : "Marked todo");
      })
      .catch((e: any) => {
        toast.error(e?.message ?? "Failed to update task");
      });
  }

  const snapWeight: Record<FocusTask["snap"], number> = { S: 4, N: 3, A: 2, P: 1 };
  const top3 = [...focusTasks]
    .sort((a, b) => snapWeight[b.snap] - snapWeight[a.snap])
    .slice(0, 3);

  // Build recent activity items: feed data if available, else fallback to template metadata
  const fallbackActivity = (builtIns as any[]).slice(0, 5).map((t) => ({
    id: t._id,
    title: t.name,
    meta: `Trigger: ${t.trigger?.type ?? "manual"}`,
  }));
  const recentActivityItems = Array.isArray(activityFeed) && (activityFeed as any[]).length > 0
    ? (activityFeed as any[]).map((a: any) => ({
        id: String(a._id ?? a.id ?? Math.random()),
        title: String(a.title ?? a.event ?? a.type ?? "Activity"),
        meta: String(a.meta ?? a.message ?? a.description ?? a.details ?? ""),
      }))
    : fallbackActivity;

  return (
    <div className="space-y-6">
      {/* A1: Today's Focus (SNAP Top 3) */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Focus</CardTitle>
          <CardDescription>Top priorities using SNAP ordering</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Add a focus task..."
              value={focusInput}
              onChange={(e) => setFocusInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && focusInput.trim()) {
                  addFocusTask(focusInput);
                  setFocusInput("");
                }
              }}
            />
            <Button
              onClick={() => {
                if (!focusInput.trim()) return;
                addFocusTask(focusInput);
                setFocusInput("");
              }}
            >
              Add
            </Button>
          </div>
          <div className="grid sm:grid-cols-3 gap-2">
            {displayFocus.map((t: any) => (
              <div
                key={t.id}
                className={`flex items-center justify-between rounded-md border px-3 py-2 ${t.done ? "opacity-60" : ""}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="outline">{t.snap}</Badge>
                  <span className="truncate">{t.title}</span>
                </div>
                <Button size="sm" variant={t.done ? "secondary" : "default"} onClick={() => toggleTask(t.id)}>
                  {t.done ? "Undo" : "Done"}
                </Button>
              </div>
            ))}
            {displayFocus.length === 0 && <div className="text-sm text-muted-foreground">Add tasks to see your top 3 priorities.</div>}
          </div>
        </CardContent>
      </Card>

      {/* A2: Performance Snapshot + Recent Activity */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Performance Snapshot</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Visitors</div>
              <div className="text-xl font-semibold">{snapshot.visitors ?? 0}</div>
              <div className={`text-xs ${((snapshot.visitorsDelta ?? 0) >= 0) ? "text-emerald-600" : "text-red-600"}`}>
                {((snapshot.visitorsDelta ?? 0) >= 0) ? "▲" : "▼"} {Math.abs(snapshot.visitorsDelta ?? 0)}%
              </div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Subscribers</div>
              <div className="text-xl font-semibold">{snapshot.subscribers ?? 0}</div>
              <div className={`text-xs ${((snapshot.subscribersDelta ?? 0) >= 0) ? "text-emerald-600" : "text-red-600"}`}>
                {((snapshot.subscribersDelta ?? 0) >= 0) ? "▲" : "▼"} {Math.abs(snapshot.subscribersDelta ?? 0)}%
              </div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Engagement</div>
              <div className="text-xl font-semibold">{snapshot.engagement ?? 0}%</div>
              <div className={`text-xs ${((snapshot.engagementDelta ?? 0) >= 0) ? "text-emerald-600" : "text-red-600"}`}>
                {((snapshot.engagementDelta ?? 0) >= 0) ? "▲" : "▼"} {Math.abs(snapshot.engagementDelta ?? 0)}%
              </div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Revenue</div>
              <div className="text-xl font-semibold">${snapshot.revenue ?? 0}</div>
              <div className={`text-xs ${((snapshot.revenueDelta ?? 0) >= 0) ? "text-emerald-600" : "text-red-600"}`}>
                {((snapshot.revenueDelta ?? 0) >= 0) ? "▲" : "▼"} {Math.abs(snapshot.revenueDelta ?? 0)}%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Last 5 items</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentActivityItems.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{a.title}</div>
                  <div className="text-xs text-muted-foreground">{a.meta}</div>
                </div>
                <Badge variant="outline">Log</Badge>
              </div>
            ))}
            {recentActivityItems.length === 0 && (
              <div className="text-sm text-muted-foreground">No recent activity yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* A3: Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Jump into common workflows</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-4 gap-3">
          <Button className="w-full" onClick={() => toast("Open content creator")}><Pencil className="mr-2 h-4 w-4" />Create Content</Button>
          <Button className="w-full" variant="outline" onClick={() => navigate("/workflows")}><Zap className="mr-2 h-4 w-4" />Schedule Posts</Button>
          <Button className="w-full" variant="outline" onClick={() => navigate("/analytics")}><BarChart3 className="mr-2 h-4 w-4" />View Analytics</Button>
          <Button className="w-full" variant="secondary" onClick={() => setHelpOpen(true)}><HelpCircle className="mr-2 h-4 w-4" />Get Help</Button>
        </CardContent>
      </Card>

      {/* A4: Pre-built Templates entry */}
      <Card>
        <CardHeader>
          <CardTitle>Jumpstart with Templates</CardTitle>
          <CardDescription>Use a proven recipe in one click</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3">
          {(builtIns as any[]).slice(0, 2).map((t) => (
            <div key={t._id} className="rounded-md border p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-medium">{t.name}</div>
                  {t.description && <div className="text-xs text-muted-foreground truncate">{t.description}</div>}
                </div>
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      // Reuse existing copy path; relies on server using user's first business internally if applicable
                      await copyBuiltIn({ businessId: undefined as any, key: t._id });
                      toast.success("Template copied to your workflows");
                      navigate("/workflows");
                    } catch (e: any) {
                      toast.error(e?.message ?? "Failed to use template");
                    }
                  }}
                >
                  Use Template
                </Button>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span>Steps: {t.pipeline?.length ?? 0}</span>
                <span>Trigger: {t.trigger?.type ?? "manual"}</span>
              </div>
              {Array.isArray(t.tags) && t.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {t.tags.slice(0, 4).map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
          {(builtIns as any[]).length === 0 && (
            <div className="text-sm text-muted-foreground">No templates available.</div>
          )}
        </CardContent>
      </Card>

      {/* Help drawer stub */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center md:justify-center">
          <div className="w-full md:w-[480px] bg-background border-t md:border rounded-t-xl md:rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">Need help?</div>
              <Button variant="ghost" onClick={() => setHelpOpen(false)}>Close</Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Browse docs, or contact us via the support link in the footer. Starter tips:
              - Use templates to get value fast
              - Check Analytics for performance snapshot
              - Add 3 tasks to Today's Focus to stay on track
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/workflows")}><Zap className="mr-2 h-4 w-4" />Open Templates</Button>
              <Button variant="outline" onClick={() => navigate("/analytics")}><BarChart3 className="mr-2 h-4 w-4" />Open Analytics</Button>
              <Button onClick={() => setHelpOpen(false)}><Calendar className="mr-2 h-4 w-4" />Book Onboarding</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}