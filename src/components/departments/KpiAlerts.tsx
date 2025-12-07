import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Bell } from "lucide-react";
import { toast } from "sonner";

export function KpiAlerts({ businessId, department, userId }: { businessId: string; department: string; userId: string }) {
  const alerts = useQuery(api.departmentKpis.alerts.getDepartmentAlerts, {
    businessId: businessId as any,
    department,
  });

  const summary = useQuery(api.departmentKpis.alerts.getAlertSummary, {
    businessId: businessId as any,
  });

  const acknowledgeAlert = useMutation(api.departmentKpis.alerts.acknowledgeAlert);

  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledgeAlert({
        alertId: alertId as any,
        userId: userId as any,
      });
      toast.success("Alert acknowledged");
    } catch (error) {
      toast.error("Failed to acknowledge alert");
    }
  };

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalAlerts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{summary.unreadAlerts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.highPriorityAlerts}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Active Alerts for {department}</CardTitle>
          <CardDescription>KPI performance notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts && alerts.length > 0 ? (
              alerts.map((alert: any) => (
                <div
                  key={alert._id}
                  className={`p-4 border rounded-lg ${alert.isRead ? "opacity-60" : "bg-muted/50"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle
                          className={`h-4 w-4 ${
                            alert.priority === "high" ? "text-red-600" : "text-orange-600"
                          }`}
                        />
                        <h4 className="font-medium">{alert.title}</h4>
                        <Badge variant={alert.priority === "high" ? "destructive" : "secondary"}>
                          {alert.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                      {alert.data && (
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Target: {alert.data.target}</span>
                          <span>Actual: {alert.data.value}</span>
                          <span
                            className={alert.data.variance > 0 ? "text-green-600" : "text-red-600"}
                          >
                            Variance: {alert.data.variance.toFixed(1)}%
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(alert.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!alert.isRead && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAcknowledge(alert._id)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No active alerts</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
