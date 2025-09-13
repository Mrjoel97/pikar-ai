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

  // Add: simple email format validator
  const emailFmtOk = (val: string) => /^\S+@\S+\.\S+$/.test(val);

  const navigate = useNavigate();

  const [createOpen, setCreateOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  const handleCreateContentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const title = String(form.get("title") || "").trim()
    const content = String(form.get("content") || "").trim()
    const cta = String(form.get("cta") || "").trim()

    if (!title || !content) {
      toast.error("Please provide a title and content.")
      return
    }
    // Simulate successful creation (can be wired to backend later)
    toast.success("Content draft created")
    setCreateOpen(false)
  }

  const handleScheduleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const post = String(form.get("post") || "").trim()
    const when = String(form.get("when") || "").trim()
    const channel = String(form.get("channel") || "").trim()

    if (!post || !when || !channel) {
      toast.error("Please fill all fields.")
      return
    }
    // Simulate successful schedule
    toast.success("Post scheduled")
    setScheduleOpen(false)
  }

  const handleSendNewsletter = async () => {
    try {
      if (isGuest) {
        toast("Please sign in to send a test email.");
        return;
      }
      if (!business?._id) {
        toast.error("Business is not ready yet. Please complete onboarding.");
        return;
      }
      if (!toEmail || !fromEmail || !subject || !body) {
        toast.error("Please fill out all fields.");
        return;
      }
      // Add: stronger email validation and verified sender hint
      if (!emailFmtOk(fromEmail)) {
        toast.error("From must be a valid email address and a verified sender in Resend.");
        return;
      }
      if (!emailFmtOk(toEmail)) {
        toast.error("Recipient email is invalid.");
        return;
      }
      await sendTestEmail({
        from: fromEmail,
        to: toEmail,
        subject,
        previewText: "Quick update",
        businessId: business._id,
        blocks: [
          { type: "text", content: body },
          { type: "footer", includeUnsubscribe: true },
        ],
      } as any);
      toast.success("Test email sent!");
      setOpenNewsletter(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to send email");
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
                <Input
                  placeholder="To (recipient email)"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                />
                <Input
                  placeholder="From (must be a verified sender in Resend)"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                />
                {/* Add: verified sender hint and inline format feedback */}
                <div className="text-xs text-muted-foreground">
                  Use a verified sender from your Resend account (Settings → Domains). Example: news@yourdomain.com
                </div>
                {fromEmail.length > 0 && !emailFmtOk(fromEmail) && (
                  <div className="text-xs text-red-500">
                    Enter a valid email format for the From address.
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
                    // Add: disable until valid
                    disabled={
                      !emailFmtOk(fromEmail) ||
                      !emailFmtOk(toEmail) ||
                      subject.trim().length === 0 ||
                      body.trim().length === 0
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
    </div>
  );
}