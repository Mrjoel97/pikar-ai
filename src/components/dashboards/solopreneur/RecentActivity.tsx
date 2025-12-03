import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Notification {
  id?: string;
  message?: string;
  type?: string;
}

interface RecentActivityProps {
  notifications: Notification[];
  isGuest: boolean;
}

export function RecentActivity({ notifications, isGuest }: RecentActivityProps) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
      {Array.isArray(notifications) && notifications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notifications.slice(0, 6).map((n: Notification) => {
            const type = String(n.type ?? "info");
            const variant =
              type === "success"
                ? "border-emerald-200"
                : type === "warning" || type === "urgent"
                  ? "border-amber-200"
                  : "border-gray-200";
            return (
              <Card key={String(n.id ?? n.message)} className={variant}>
                <CardContent className="p-4">
                  <p className="text-sm">{String(n.message ?? "Update")}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {type}
                    </Badge>
                    {!isGuest && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => alert("Opening details...")}
                      >
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
            No recent activity yet. As you take actions, updates will appear
            here.
          </CardContent>
        </Card>
      )}
    </section>
  );
}
