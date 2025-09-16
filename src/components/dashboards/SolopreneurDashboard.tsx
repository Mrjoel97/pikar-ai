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
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

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

      {/* Today's Focus (max 3) */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Today&apos;s Focus</h2>
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
              onChange={(e) => setEmailBody(e.target.value)}
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
                {triageSuggestions.map((s, idx) => (
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
    </div>
  );
}