import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery as useConvexQuery, useMutation as useConvexMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { useAuth } from "@/hooks/use-auth";
import { isGuestModeActive } from "@/lib/guestUtils";

type Props = {
  disabled?: boolean; // hide/disable for guest
};

export function NotificationsCenter({ disabled }: Props) {
  const [open, setOpen] = React.useState(false);
  // Add: preferences modal state
  const [prefsOpen, setPrefsOpen] = React.useState(false);
  // Add: local filters
  const [unreadOnlyLocal, setUnreadOnlyLocal] = React.useState(false);
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [query, setQuery] = React.useState<string>("");

  const [notificationsCursor, setNotificationsCursor] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const count = useConvexQuery(api.notifications.getMyNotificationCount, disabled ? "skip" : {});
  const notifications = useQuery(
    api.notifications.getMyNotifications,
    disabled ? "skip" : { 
      paginationOpts: { numItems: 50, cursor: notificationsCursor },
      filter: debouncedSearch || undefined,
    }
  );
  const markOne = useConvexMutation(api.notifications.markMyNotificationRead);
  const markAll = useConvexMutation(api.notifications.markAllMyNotificationsRead);

  const businesses = useConvexQuery(api.businesses.getUserBusinesses, disabled ? "skip" : {});
  const businessId = Array.isArray(businesses) && businesses[0]?._id ? businesses[0]._id : null;

  // Add: guest-like detection for redundant guard
  const isGuestLike =
    !!disabled ||
    businesses === "skip" ||
    (Array.isArray(businesses) && businesses.length === 0);

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

  // Add: SLA-only quick filter state
  const [slaOnlyLocal, setSlaOnlyLocal] = React.useState(false);

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

  const { user } = useAuth();
  if (!user || isGuestModeActive()) {
    return null;
  }

  // Redundant guard: hide entirely for guests
  if (disabled || isGuestLike) {
    return null;
  }

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchFilter]);

  // Replace previous 'filtered' memo with a correct 'visible' list derived from notifications.page
  const visible = React.useMemo(() => {
    if (!notifications) return undefined;
    const items = notifications.page ?? [];
    const q = query.trim().toLowerCase();
    return items.filter((n: any) => {
      const matchType = typeFilter === "all" ? true : n.type === typeFilter;
      const matchQuery =
        q.length === 0
          ? true
          : (String(n.title ?? "").toLowerCase().includes(q) ||
             String(n.message ?? "").toLowerCase().includes(q) ||
             String(n.type ?? "").toLowerCase().includes(q));
      const matchUnread = unreadOnlyLocal ? !n.isRead : true;
      // Add: SLA-only filter (handles 'sla_warning' and 'sla_overdue')
      const matchSlaOnly =
        !slaOnlyLocal ||
        n.type === "sla_warning" ||
        n.type === "sla_overdue";

      return matchType && matchQuery && matchUnread && matchSlaOnly;
    });
  }, [notifications, typeFilter, query, unreadOnlyLocal, slaOnlyLocal]);

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
            {/* Add: Quick access Preferences modal */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPrefsOpen(true)}
              disabled={!businessId}
            >
              Preferences
            </Button>
            {/* Fix: correct disable condition based on notifications.page length */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkAll}
              disabled={!notifications || ((notifications.page?.length ?? 0) === 0)}
            >
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
            {/* Add: SLA-only quick filter */}
            <Button
              size="sm"
              variant={slaOnlyLocal ? "default" : "outline"}
              onClick={() => setSlaOnlyLocal((s) => !s)}
            >
              {slaOnlyLocal ? "SLA-only On" : "SLA-only"}
            </Button>
            {/* Simple inline type filter */}
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

        <Dialog open={prefsOpen} onOpenChange={setPrefsOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Notification Preferences</DialogTitle>
            </DialogHeader>
            {!prefsDraft ? (
              <div className="text-sm text-muted-foreground">Loading preferences…</div>
            ) : (
              <div className="space-y-4">
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
                <div className="grid grid-cols-2 gap-2">
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-sm">
                    <div className="text-xs text-muted-foreground mb-1">Max per hour</div>
                    <input
                      type="number"
                      min={0}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      value={prefsDraft.rateLimits?.maxPerHour ?? 10}
                      onChange={(e) =>
                        setPrefsDraft((p: any) => ({
                          ...p,
                          rateLimits: { ...(p.rateLimits ?? {}), maxPerHour: Number(e.target.value) },
                        }))
                      }
                    />
                  </div>
                  <div className="text-sm">
                    <div className="text-xs text-muted-foreground mb-1">Max per day</div>
                    <input
                      type="number"
                      min={0}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      value={prefsDraft.rateLimits?.maxPerDay ?? 50}
                      onChange={(e) =>
                        setPrefsDraft((p: any) => ({
                          ...p,
                          rateLimits: { ...(p.rateLimits ?? {}), maxPerDay: Number(e.target.value) },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setPrefsOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  await handleSavePrefs();
                  setPrefsOpen(false);
                }}
                disabled={!prefsDraft || !businessId}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="px-4 pb-4 space-y-3 overflow-y-auto">
          {/* Add search input */}
          <div className="p-3 border-b">
            <Input
              placeholder="Search notifications..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Notifications list with skeleton loading */}
          <div className="max-h-96 overflow-y-auto">
            {!notifications ? (
              // Skeleton loader
              <div className="p-3 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (visible && visible.length === 0) ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                {debouncedSearch || query || unreadOnlyLocal || typeFilter !== "all"
                  ? "No matching notifications"
                  : "No notifications"}
              </div>
            ) : (
              <>
                {(visible || []).map((notification: any) => (
                  <Card key={notification._id} className={notification.isRead ? "" : "border-emerald-200"}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant="outline"
                              className={
                                notification.type === "sla_warning"
                                  ? "border-amber-300 text-amber-700"
                                  : notification.type === "integration_error"
                                  ? "border-red-300 text-red-700"
                                  : "border-slate-300 text-slate-700"
                              }
                            >
                              {notification.type?.replace?.("_", " ") || "info"}
                            </Badge>
                            {!notification.isRead && <Badge className="bg-emerald-600">New</Badge>}
                          </div>
                          <div className="text-sm font-medium">{notification.title}</div>
                          <div className="text-xs text-muted-foreground">{notification.message}</div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {new Date(notification.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          {/* Actions */}
                          <div className="flex flex-col gap-2 items-end">
                            {notification.link && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  try {
                                    window.location.href = notification.link;
                                  } catch {
                                    // no-op
                                  }
                                }}
                              >
                                Open
                              </Button>
                            )}
                            {/* Snooze menu */}
                            {!notification.isRead && (
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" onClick={() => handleSnooze(notification._id, 15)}>
                                  Snooze 15m
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleSnooze(notification._id, 60)}>
                                  1h
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleSnooze(notification._id, 60 * 24)}>
                                  1d
                                </Button>
                              </div>
                            )}
                            {!notification.isRead && (
                              <Button size="sm" variant="outline" onClick={() => handleMarkOne(notification._id)}>
                                Mark read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Load more button */}
                {!notifications.isDone && (
                  <div className="p-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNotificationsCursor(notifications.continueCursor)}
                      className="w-full"
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </>
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
        </div>
      </DrawerContent>
    </Drawer>
  );
}