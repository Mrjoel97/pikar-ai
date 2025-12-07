import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Bell } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

interface KpiAlert {
  _id: Id<"kpiAlerts">;
  businessId: Id<"businesses">;
  targetId: Id<"kpiTargets">;
  department: string;
  kpiName: string;
  alertType: "threshold_breach" | "trend_warning" | "target_missed";
  severity: "info" | "warning" | "critical";
  message: string;
  currentValue: number;
  targetValue: number;
  status: "active" | "acknowledged" | "resolved";
  acknowledgedBy?: Id<"users">;
  acknowledgedAt?: number;
  resolvedAt?: number;
  createdAt: number;
}

interface AlertSummary {
  totalAlerts: number;
  unreadAlerts: number;
  highPriorityAlerts: number;
}

export function KpiAlerts({ businessId, department, userId }: { businessId: string; department: string; userId: string }) {
  const alerts = useQuery(api.departmentKpis.alerts.getDepartmentAlerts, {
    businessId: businessId as Id<"businesses">,
    department,
  });

  const summary = useQuery(api.departmentKpis.alerts.getAlertSummary, {
    businessId: businessId as Id<"businesses">,
  });

  const acknowledgeAlert = useMutation(api.departmentKpis.alerts.acknowledgeAlert);

  const handleAcknowledge = async (alertId: Id<"kpiAlerts">) => {
    try {
      await acknowledgeAlert({
        alertId,
        userId: userId as Id<"users">,
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
              alerts.map((alert: KpiAlert) => (
                <div
                  key={alert._id}
                  className={`p-4 border rounded-lg ${alert.status === "acknowledged" ? "opacity-60" : "bg-muted/50"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle
                          className={`h-4 w-4 ${
                            alert.severity === "critical" ? "text-red-600" : alert.severity === "warning" ? "text-orange-600" : "text-blue-600"
                          }`}
                        />
                        <h4 className="font-medium">{alert.kpiName}</h4>
                        <Badge variant={alert.severity === "critical" ? "destructive" : "secondary"}>
                          {alert.severity}
                        </Badge>
                        <Badge variant="outline">{alert.alertType.replace(/_/g, " ")}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Target: {alert.targetValue}</span>
                        <span>Current: {alert.currentValue}</span>
                        <span
                          className={alert.currentValue >= alert.targetValue ? "text-green-600" : "text-red-600"}
                        >
                          {alert.currentValue >= alert.targetValue ? "Above" : "Below"} target
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(alert.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {alert.status === "active" && (
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