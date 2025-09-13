import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

type Props = {
  disabled?: boolean; // hide/disable for guest
};

export function NotificationsCenter({ disabled }: Props) {
  const [open, setOpen] = React.useState(false);
  const count = useQuery(api.notifications.getMyNotificationCount, disabled ? "skip" : {});
  const notifications = useQuery(
    api.notifications.getMyNotifications,
    disabled ? "skip" : { limit: 50, unreadOnly: false },
  );
  const markOne = useMutation(api.notifications.markMyNotificationRead);
  const markAll = useMutation(api.notifications.markAllMyNotificationsRead);

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
        <div className="px-4 pb-4 space-y-3 overflow-y-auto">
          {!notifications ? (
            <div className="text-sm text-muted-foreground p-4">Loading…</div>
          ) : notifications.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4">No notifications.</div>
          ) : (
            notifications.map((n: any) => (
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
                          {n.type.replace("_", " ")}
                        </Badge>
                        {!n.isRead && <Badge className="bg-emerald-600">New</Badge>}
                      </div>
                      <div className="text-sm font-medium">{n.title}</div>
                      <div className="text-xs text-muted-foreground">{n.message}</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {!n.isRead && (
                      <Button size="sm" variant="outline" onClick={() => handleMarkOne(n._id)}>
                        Mark read
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
