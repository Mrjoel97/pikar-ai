import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery as useConvexQuery, useMutation as useConvexMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

type Props = {
  disabled?: boolean; // hide/disable for guest
};

export function NotificationsCenter({ disabled }: Props) {
  const [open, setOpen] = React.useState(false);
  // Add: local filters
  const [unreadOnlyLocal, setUnreadOnlyLocal] = React.useState(false);
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [query, setQuery] = React.useState<string>("");

  const count = useConvexQuery(api.notifications.getMyNotificationCount, disabled ? "skip" : {});
  const notifications = useConvexQuery(
  api.notifications.getMyNotifications,
  disabled ? "skip" : { limit: 50, unreadOnly: unreadOnlyLocal },
);
  const markOne = useConvexMutation(api.notifications.markMyNotificationRead);
  const markAll = useConvexMutation(api.notifications.markAllMyNotificationsRead);

  const businesses = useConvexQuery(api.businesses.getUserBusinesses, disabled ? "skip" : {});
  const businessId = Array.isArray(businesses) && businesses[0]?._id ? businesses[0]._id : null;

  const myPrefs = useConvexQuery(
    api.notifications.getMyNotificationPreferences,
    disabled || !businessId ? "skip" : { businessId }
  );

  const updatePrefs = useConvexMutation(api.notifications.updateMyNotificationPreferences);
  const snoozeOne = useConvexMutation(api.notifications.snoozeMyNotification);

  const [prefsDraft, setPrefsDraft] = React.useState<any | null>(null);
  React.useEffect(() => {
    if (myPrefs && !prefsDraft) setPrefsDraft(myPrefs);
  }, [myPrefs, prefsDraft]);

  const handleSavePrefs = async () => {
    if (!businessId || !prefsDraft) return;
    try {
      await updatePrefs({
        businessId,
        emailEnabled: prefsDraft.emailEnabled,
        pushEnabled: prefsDraft.pushEnabled,
        smsEnabled: prefsDraft.smsEnabled,
        preferences: prefsDraft.preferences,
        rateLimits: prefsDraft.rateLimits,
      });
      toast.success("Preferences saved");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save preferences");
    }
  };

  const handleSnooze = async (id: string, minutes: number) => {
    try {
      await snoozeOne({ notificationId: id as any, minutes });
      toast.success(`Snoozed for ${minutes}m`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to snooze");
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAll({});
      toast.success("All notifications marked as read");
    } catch (e: any) {
      toast.error(e?.message || "Failed to mark all as read");
    }
  };

  const handleMarkOne = async (id: any) => {
    try {
      await markOne({ notificationId: id });
      toast.success("Marked as read");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update notification");
    }
  };

  if (disabled) {
    return null;
  }

  // Add: compute filtered list client-side for type + search
  const filtered = React.useMemo(() => {
    if (!notifications) return notifications;
    const q = query.trim().toLowerCase();
    return notifications.filter((n: any) => {
      const matchType = typeFilter === "all" ? true : n.type === typeFilter;
      const matchQuery =
        q.length === 0
          ? true
          : (n.title?.toLowerCase?.().includes(q) ||
             n.message?.toLowerCase?.().includes(q) ||
             n.type?.toLowerCase?.().includes(q));
      return matchType && matchQuery;
    });
  }, [notifications, typeFilter, query]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          Notifications
          {typeof count === "number" && count > 0 && (
            <Badge variant="outline" className="ml-2 border-emerald-300 text-emerald-700">
              {count}
            </Badge>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="flex items-center justify-between">
          <DrawerTitle>Notifications</DrawerTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-slate-300 text-slate-700">
              {typeof count === "number" ? `${count} unread` : "…"}
            </Badge>
            <Button size="sm" variant="outline" onClick={handleMarkAll} disabled={!notifications || (notifications?.length ?? 0) === 0}>
              Mark all read
            </Button>
          </div>
        </DrawerHeader>

        {/* Add: Filters row */}
        <div className="px-4 pb-3 flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={unreadOnlyLocal ? "default" : "outline"}
              onClick={() => setUnreadOnlyLocal((s) => !s)}
            >
              {unreadOnlyLocal ? "Showing Unread" : "Show Unread"}
            </Button>
            {/* Simple select using shadcn Select from ui/select */}
            {/* We avoid importing here; create a minimal inline menu with buttons to keep dependencies stable */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Type:</span>
              <div className="flex rounded-md border overflow-hidden">
                {["all", "assignment", "approval", "sla_warning", "integration_error", "workflow_completion", "system_alert"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypeFilter(t)}
                    className={`px-2 py-1 text-xs ${
                      typeFilter === t ? "bg-emerald-600 text-white" : "bg-background text-foreground"
                    }`}
                  >
                    {t === "all" ? "All" : t.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1 flex md:justify-end">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notifications…"
              className="w-full md:w-72 px-3 py-2 border rounded-md text-sm"
            />
          </div>
        </div>

        <div className="px-4 pb-4 space-y-3 overflow-y-auto">
          {!filtered ? (
            <div className="text-sm text-muted-foreground p-4">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4">No notifications.</div>
          ) : (
            filtered.map((n: any) => (
              <Card key={n._id} className={n.isRead ? "" : "border-emerald-200"}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={
                            n.type === "sla_warning"
                              ? "border-amber-300 text-amber-700"
                              : n.type === "integration_error"
                              ? "border-red-300 text-red-700"
                              : "border-slate-300 text-slate-700"
                          }
                        >
                          {n.type?.replace?.("_", " ") || "info"}
                        </Badge>
                        {!n.isRead && <Badge className="bg-emerald-600">New</Badge>}
                      </div>
                      <div className="text-sm font-medium">{n.title}</div>
                      <div className="text-xs text-muted-foreground">{n.message}</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {/* Actions */}
                      <div className="flex flex-col gap-2 items-end">
                        {n.link && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              try {
                                window.location.href = n.link;
                              } catch {
                                // no-op
                              }
                            }}
                          >
                            Open
                          </Button>
                        )}
                        {/* Snooze menu */}
                        {!n.isRead && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleSnooze(n._id, 15)}>
                              Snooze 15m
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleSnooze(n._id, 60)}>
                              1h
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleSnooze(n._id, 60 * 24)}>
                              1d
                            </Button>
                          </div>
                        )}
                        {!n.isRead && (
                          <Button size="sm" variant="outline" onClick={() => handleMarkOne(n._id)}>
                            Mark read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="px-4 pb-6">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">Notification Preferences</div>
                <Button size="sm" variant="outline" onClick={handleSavePrefs} disabled={!prefsDraft || !businessId}>
                  Save
                </Button>
              </div>
              {!prefsDraft ? (
                <div className="text-sm text-muted-foreground">Loading preferences…</div>
              ) : (
                <>
                  <div className="flex gap-3 flex-wrap">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!prefsDraft.emailEnabled}
                        onChange={(e) => setPrefsDraft((p: any) => ({ ...p, emailEnabled: e.target.checked }))}
                      />
                      Email
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!prefsDraft.pushEnabled}
                        onChange={(e) => setPrefsDraft((p: any) => ({ ...p, pushEnabled: e.target.checked }))}
                      />
                      Push
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!prefsDraft.smsEnabled}
                        onChange={(e) => setPrefsDraft((p: any) => ({ ...p, smsEnabled: e.target.checked }))}
                      />
                      SMS
                    </label>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      ["assignments", "Assignments"],
                      ["approvals", "Approvals"],
                      ["slaWarnings", "SLA Warnings"],
                      ["integrationErrors", "Integration Errors"],
                      ["workflowCompletions", "Workflow Completions"],
                      ["systemAlerts", "System Alerts"],
                    ].map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 text-sm border rounded-md p-2">
                        <input
                          type="checkbox"
                          checked={!!prefsDraft.preferences?.[key as keyof typeof prefsDraft.preferences]}
                          onChange={(e) =>
                            setPrefsDraft((p: any) => ({
                              ...p,
                              preferences: { ...p.preferences, [key]: e.target.checked },
                            }))
                          }
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </DrawerContent>
    </Drawer>
  );
}