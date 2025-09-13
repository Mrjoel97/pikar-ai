import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { StatCard } from "@/components/dashboard/StatCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerTrigger, DrawerClose } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "convex/react";
import { toast } from "sonner";
import React from "react";
import { useMutation } from "convex/react";
import { useNavigate } from "react-router";
import { useState } from "react"

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
  const recentActivity = !isGuest && business?._id && activityGetRecent
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

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/60 rounded-xl p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm">Create Content</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create content draft</DialogTitle>
                <DialogDescription>Compose a quick newsletter or announcement.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateContentSubmit} className="space-y-3">
                <div>
                  <label className="text-sm mb-1 block">Title</label>
                  <Input name="title" placeholder="Weekly update" />
                </div>
                <div>
                  <label className="text-sm mb-1 block">Content</label>
                  <Textarea name="content" placeholder="Write your content..." className="min-h-28" />
                </div>
                <Card className="border-dashed">
                  <CardContent className="pt-4 space-y-2">
                    <div className="text-xs text-muted-foreground">Optional CTA</div>
                    <Input name="cta" placeholder="https://example.com/learn-more" />
                  </CardContent>
                </Card>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button type="submit">Save Draft</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">Schedule Posts</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule a post</DialogTitle>
                <DialogDescription>Pick a time and channel.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleScheduleSubmit} className="space-y-3">
                <div>
                  <label className="text-sm mb-1 block">Post content</label>
                  <Textarea name="post" placeholder="What's new?" className="min-h-24" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm mb-1 block">When</label>
                    <Input name="when" type="datetime-local" />
                  </div>
                  <div>
                    <label className="text-sm mb-1 block">Channel</label>
                    <Input name="channel" placeholder="twitter | linkedin | email" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setScheduleOpen(false)}>Cancel</Button>
                  <Button type="submit">Schedule</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* View Analytics: use existing navigate if available; otherwise simple link */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              try {
                if (typeof navigate === "function") navigate("/analytics")
                else window.location.href = "/analytics"
              } catch {
                window.location.href = "/analytics"
              }
            }}
          >
            View Analytics
          </Button>

          <Drawer open={helpOpen} onOpenChange={setHelpOpen}>
            <DrawerTrigger asChild>
              <Button variant="ghost" size="sm">Get Help</Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Need help?</DrawerTitle>
                <DrawerDescription>Quick tips and links for Solopreneurs.</DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pb-4 space-y-3">
                <ul className="text-sm list-disc pl-5 space-y-2">
                  <li>Start with top tasks prioritized on your dashboard.</li>
                  <li>Use "Create Content" for newsletters or announcements.</li>
                  <li>Schedule posts to maintain consistent engagement.</li>
                  <li>Check Analytics for performance trends.</li>
                </ul>
                <div className="text-xs text-muted-foreground">
                  For more assistance, reach out via the support channel in the app header.
                </div>
              </div>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="default">Close</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      {/* Today's Focus */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Today's Focus</h2>

        {/* Add: Seed button when authenticated and no tasks yet */}
        {!isGuest && business?._id && (Array.isArray(tasksToShow) && tasksToShow.length === 0) && (
          <div className="mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await seedTasks({ businessId: business._id, count: 3 } as any);
                  toast.success("Sample tasks generated.");
                } catch (e: any) {
                  toast.error(e?.message || "Failed to generate tasks");
                }
              }}
            >
              Generate sample tasks
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tasksToShow.slice(0, 3).map((task: any) => {
            const key = task._id || task.id;
            const due =
              typeof task.dueDate === "number"
                ? new Date(task.dueDate).toLocaleDateString()
                : (task.dueDate || "—");
            const priority = task.priority || "low";
            return (
              <Card key={key}>
                <CardContent className="p-4">
                  <h3 className="font-medium">{task.title}</h3>
                  <p className="text-sm text-muted-foreground">Due: {due}</p>
                  <Badge variant={priority === "high" ? "destructive" : "secondary"}>
                    {priority}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Performance Snapshot */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Performance Snapshot</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Revenue"
            value={typeof revenueVal === "number" ? revenueVal.toLocaleString() : revenueVal}
            prefix="$"
            delta={revenueDelta}
          />
          <StatCard
            title="Customers"
            value={customersVal}
            delta={subscribersDelta}
          />
          <StatCard
            title="Conversion"
            value={typeof conversionVal === "number" ? conversionVal : 0}
            suffix="%"
            delta={engagementDelta}
          />
          <StatCard
            title="Visitors"
            value={visitorsVal}
            delta={visitorsDelta}
          />
        </div>
      </section>

      {/* KPI Trends */}
      <section>
        <h2 className="text-xl font-semibold mb-4">KPI Trends</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Revenue Trend</h3>
                <span className="text-xs text-emerald-700">+Uptrend</span>
              </div>
              <Sparkline values={revenueTrend} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Task Completion</h3>
                <span className="text-xs text-emerald-700">
                  {(kpis?.taskCompletion ?? 0)}%
                </span>
              </div>
              <Sparkline values={efficiencyTrend} color="bg-emerald-500" />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Send Newsletter</h3>
              <Button 
                className="w-full"
                onClick={() => {
                  if (isGuest) {
                    toast("Please sign in to send a test email.");
                  } else {
                    setOpenNewsletter(true);
                  }
                }}
              >
                Send Now
              </Button>
            </CardContent>
          </Card>

          {/* Add: Schedule Email Campaign quick action card (authenticated only) */}
          {!isGuest && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">Schedule Email Campaign</h3>
                <Button
                  className="w-full"
                  onClick={() => {
                    setOpenScheduleCampaign(true);
                    // initialize recipients view from existing bulk state
                    if (!bulkMode) setBulkMode(true);
                  }}
                >
                  Open Scheduler
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Add: View Analytics quick action */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">View Analytics</h3>
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => navigate("/analytics")}
              >
                Open Analytics
              </Button>
            </CardContent>
          </Card>

          {/* Manage Contacts (auth only) */}
          {!isGuest && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">Manage Contacts</h3>
                <Button className="w-full" variant="outline" onClick={() => setManageContactsOpen(true)}>
                  Open
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Hide upgrade prompts for guests to allow full access */}
          {!isGuest && <UpgradeCTA feature="Team Collaboration" />}
          {!isGuest && <UpgradeCTA feature="Advanced Analytics" />}
        </div>

        {/* Newsletter Dialog */}
        {!isGuest && (
          <Dialog open={openNewsletter} onOpenChange={setOpenNewsletter}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Test Newsletter</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                {/* Bulk mode toggle */}
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">Bulk send</div>
                  <button
                    className={`px-2 py-1 rounded border text-xs ${bulkMode ? "bg-emerald-50 border-emerald-300 text-emerald-700" : ""}`}
                    onClick={() => setBulkMode((b) => !b)}
                  >
                    {bulkMode ? "On" : "Off"}
                  </button>
                </div>

                <Input
                  placeholder="From (must be a verified sender in Resend)"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                />
                {/* Verified sender hint and format feedback */}
                <div className="text-xs text-muted-foreground">
                  Use a verified sender from your Resend account (Settings → Domains). Example: news@yourdomain.com
                </div>
                {fromEmail.length > 0 && !emailFmtOk(fromEmail) && (
                  <div className="text-xs text-red-500">
                    Enter a valid email format for the From address.
                  </div>
                )}

                {/* Recipients input - single vs bulk */}
                {!bulkMode ? (
                  <Input
                    placeholder="To (recipient email)"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                  />
                ) : (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Paste emails (comma, semicolon, or new line separated)"
                      value={recipientsRaw}
                      onChange={(e) => handleRecipientsChange(e.target.value)}
                      rows={5}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept=".csv,.txt"
                        onChange={(e) => handleRecipientsFile(e.target.files?.[0] || null)}
                        className="text-sm"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {recipientsList.length} valid • {invalidList.length} invalid
                      {invalidList.length > 0 && (
                        <> — invalids ignored</>
                      )}
                    </div>
                  </div>
                )}

                <Input
                  placeholder="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
                <Textarea
                  placeholder="Message"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    className="px-3 py-2 border rounded-md"
                    onClick={() => setOpenNewsletter(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-3 py-2 rounded-md bg-emerald-600 text-white disabled:opacity-50"
                    onClick={handleSendNewsletter}
                    // Disable until valid
                    disabled={
                      !emailFmtOk(fromEmail) ||
                      subject.trim().length === 0 ||
                      body.trim().length === 0 ||
                      (!bulkMode
                        ? !emailFmtOk(toEmail)
                        : recipientsList.length === 0)
                    }
                  >
                    Send
                  </button>
                </div>
                <div className="text-xs text-muted-foreground">
                  Note: Email delivery requires RESEND_API_KEY to be configured and a verified sender address.
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Manage Contacts dialog (auth only) */}
        {!isGuest && (
          <Dialog open={manageContactsOpen} onOpenChange={setManageContactsOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Contacts & Lists</DialogTitle>
                <DialogDescription>Create lists and import CSV to build your audience.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Create list */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="sm:col-span-2">
                    <label className="text-sm mb-1 block">New list name</label>
                    <Input
                      placeholder="Newsletter Audience"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Button
                      className="w-full"
                      onClick={async () => {
                        try {
                          if (!newListName.trim()) {
                            toast.error("Enter a list name.");
                            return;
                          }
                          if (!business?._id || !currentUser?._id) {
                            toast.error("Business or user is not ready yet.");
                            return;
                          }
                          const id = await createListMutation({
                            businessId: business._id,
                            name: newListName.trim(),
                            createdBy: currentUser._id,
                          } as any);
                          setNewListName("");
                          toast.success("List created");
                          if (id) setSelectedListId(String(id));
                        } catch (e: any) {
                          toast.error(e?.message || "Failed to create list");
                        }
                      }}
                    >
                      Create List
                    </Button>
                  </div>
                </div>

                {/* Select list */}
                <div>
                  <label className="text-sm mb-1 block">Select list</label>
                  <select
                    className="w-full border rounded-md px-3 py-2 bg-white text-sm"
                    value={selectedListId}
                    onChange={(e) => setSelectedListId(e.target.value)}
                  >
                    {(lists || []).map((l: any) => (
                      <option key={String(l._id)} value={String(l._id)}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                  <div className="text-xs text-muted-foreground mt-1">
                    {(lists || []).length} lists
                  </div>
                </div>

                {/* Import CSV */}
                <div>
                  <label className="text-sm mb-1 block">Import CSV (email,name)</label>
                  <Textarea
                    placeholder="email,name\njane@example.com,Jane\njohn@example.com,John"
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    rows={6}
                  />
                  {/* Added: CSV file upload */}
                  <div className="flex items-center justify-between mt-2">
                    <input
                      ref={uploadCsvInputRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const text = await file.text();
                          setCsvText(text);
                          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
                          const rows = lines.length > 0 && lines[0].includes(",") ? Math.max(0, lines.length - 1) : lines.length;
                          toast.success(`CSV loaded (${rows} row${rows === 1 ? "" : "s"})`);

                          // Directly import to selected list
                          if (!selectedListId) {
                            toast.error("Select a list.");
                            return;
                          }
                          if (!business?._id || !currentUser?._id) {
                            toast.error("Business or user is not ready yet.");
                            return;
                          }
                          const res = await importCsvToList({
                            businessId: business._id,
                            createdBy: currentUser._id,
                            listId: selectedListId as any,
                            csvText: text,
                          } as any);
                          toast.success(`Imported ${res?.added ?? 0} contacts`);
                        } catch (err: any) {
                          toast.error(err?.message || "Failed to read CSV");
                        } finally {
                          if (uploadCsvInputRef.current) uploadCsvInputRef.current.value = "";
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => uploadCsvInputRef.current?.click()}
                    >
                      Upload CSV file
                    </Button>
                    <div className="text-xs text-muted-foreground">
                      You can paste or upload a .csv (email,name)
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <Button
                      variant="ghost"
                      onClick={() => setCsvText("")}
                    >
                      Clear
                    </Button>
                    <Button
                      onClick={async () => {
                        try {
                          if (!selectedListId) {
                            toast.error("Select a list.");
                            return;
                          }
                          if (!csvText.trim()) {
                            toast.error("Paste CSV content.");
                            return;
                          }
                          if (!business?._id || !currentUser?._id) {
                            toast.error("Business or user is not ready yet.");
                            return;
                          }
                          const res = await importCsvToList({
                            businessId: business._id,
                            createdBy: currentUser._id,
                            listId: selectedListId as any,
                            csvText,
                          } as any);
                          toast.success(`Imported ${res?.added ?? 0} contacts`);
                        } catch (e: any) {
                          toast.error(e?.message || "Failed to import");
                        }
                      }}
                    >
                      Import to List
                    </Button>
                  </div>
                </div>

                {/* Seed sample contacts */}
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="text-sm text-muted-foreground">
                    Generate a sample contact list to try campaigns quickly.
                  </div>
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      try {
                        if (!business?._id || !currentUser?._id) {
                          toast.error("Business or user is not ready yet.");
                          return;
                        }
                        const r = await seedContactsAction({
                          businessId: business._id,
                          createdBy: currentUser._id,
                          count: 10,
                        } as any);
                        toast.success("Sample contacts created");
                      } catch (e: any) {
                        toast.error(e?.message || "Failed to seed contacts");
                      }
                    }}
                  >
                    Generate Samples
                  </Button>
                </div>

                {/* Scheduler audience mode helper */}
                <div className="rounded-md border p-3">
                  <div className="text-sm font-medium mb-2">Campaign Audience</div>
                  <div className="flex items-center gap-3 text-sm">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="audienceMode"
                        checked={scheduleMode === "direct"}
                        onChange={() => setScheduleMode("direct")}
                      />
                      Direct (paste recipients)
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="audienceMode"
                        checked={scheduleMode === "list"}
                        onChange={() => setScheduleMode("list")}
                      />
                      Contact List (selected above)
                    </label>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    The selected audience applies when you use "Schedule Email Campaign".
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="default" onClick={() => setManageContactsOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              {(isGuest
                ? (demoData?.notifications || [])
                : (recentActivity || [])
              ).slice(0, 8).map((item: any, idx: number) => {
                // Normalize fields between demo notifications and unified activity items
                const key = item._id || item.id || idx;
                const type = item.type || item.kind || "info";
                const message = item.message || item.title || "Activity";
                const ts = item.time || item.createdAt || item._creationTime || null;

                const color =
                  type === "success" || type === "workflow_completion"
                    ? "bg-green-500"
                    : type === "warning" || type === "sla_warning"
                    ? "bg-yellow-500"
                    : type === "urgent" || type === "system_alert" || type === "integration_error" || item.priority === "high"
                    ? "bg-red-500"
                    : "bg-blue-500";

                return (
                  <div key={key} className="flex items-center justify-between gap-3 p-2 rounded border">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${color}`} />
                      <span className="text-sm">{message}</span>
                    </div>
                    {ts ? (
                      <span className="text-xs text-muted-foreground">
                        {new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Add: Campaigns section (authenticated only) */}
      {!isGuest && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Email Campaigns</h2>
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(campaigns || []).map((c: any) => {
                  const when =
                    typeof c.scheduledAt === "number"
                      ? new Date(c.scheduledAt).toLocaleString()
                      : "—";
                  const count = Array.isArray(c.recipients) ? c.recipients.length : 0;
                  const sent = Array.isArray(c.sendIds) ? c.sendIds.length : 0;
                  return (
                    <div key={String(c._id)} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium truncate" title={c.subject}>{c.subject}</div>
                        <Badge variant={c.status === "scheduled" ? "secondary" : (c.status === "sent" ? "default" : "outline")}>
                          {c.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>When: {when}</div>
                        <div>Recipients: {count}</div>
                        <div>Sent IDs: {sent}</div>
                      </div>
                    </div>
                  );
                })}
                {(campaigns && campaigns.length === 0) && (
                  <div className="text-sm text-muted-foreground">
                    No campaigns yet. Schedule your first campaign above.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}