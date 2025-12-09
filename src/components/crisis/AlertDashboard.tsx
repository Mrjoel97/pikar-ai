import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface AlertDashboardProps {
  businessId: Id<"businesses">;
}

export function AlertDashboard({ businessId }: AlertDashboardProps) {
  const dashboard = useQuery(api.crisisManagement.getCrisisDashboard, { businessId });
  const activeAlerts = useQuery(api.crisisManagement.getActiveAlerts, { businessId });

  if (!dashboard) {
    return <div className="text-sm text-muted-foreground">Loading crisis dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.avgResponseTime}</div>
            <p className="text-xs text-muted-foreground">Time to resolution</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.resolutionRate}%</div>
            <p className="text-xs text-muted-foreground">Successfully resolved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalAlerts}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Crisis Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeAlerts?.map((alert) => (
              <div key={alert.id} className="flex items-start justify-between border-b pb-3 last:border-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={
                        alert.severity === "critical"
                          ? "destructive"
                          : alert.severity === "high"
                          ? "default"
                          : "outline"
                      }
                    >
                      {alert.severity}
                    </Badge>
                    <span className="text-sm font-medium">{alert.type}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline">{alert.status}</Badge>
              </div>
            ))}
            {(!activeAlerts || activeAlerts.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                No active crisis alerts
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
