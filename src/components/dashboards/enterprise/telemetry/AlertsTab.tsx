import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from "lucide-react";

interface AlertsTabProps {
  predictiveAlerts?: {
    alerts: Array<{
      type: string;
      severity: string;
      title: string;
      message: string;
      recommendation: string;
    }>;
    riskScore: number;
  };
  upgradeNudges?: {
    nudges: Array<{
      id: string;
      title: string;
      reason: string;
      severity: string;
    }>;
  };
  criticalAlerts: Array<any>;
}

export function AlertsTab({ predictiveAlerts, upgradeNudges, criticalAlerts }: AlertsTabProps) {
  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Predictive Alerts</CardTitle>
          <CardDescription>AI-powered capacity planning and risk detection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {predictiveAlerts?.alerts && predictiveAlerts.alerts.length > 0 ? (
            <>
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-semibold mb-1">Risk Score: {predictiveAlerts.riskScore}/100</div>
                <Progress value={predictiveAlerts.riskScore} className="h-2" />
              </div>
              {predictiveAlerts.alerts.map((alert: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                  <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                    alert.severity === "warning" ? "text-amber-600" : "text-blue-600"
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{alert.title}</span>
                      <Badge variant={alert.severity === "warning" ? "destructive" : "secondary"}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{alert.message}</p>
                    <p className="text-xs text-blue-600">→ {alert.recommendation}</p>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No predictive alerts. System operating within normal parameters.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Critical Alerts</CardTitle>
          <CardDescription>System warnings and notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {upgradeNudges?.nudges && upgradeNudges.nudges.length > 0 && (
            <div className="space-y-2 mb-4">
              {upgradeNudges.nudges.map((nudge: any) => (
                <div key={nudge.id} className="flex items-start gap-3 p-3 border rounded-lg bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{nudge.title}</span>
                      <Badge variant={nudge.severity === 'warn' ? 'destructive' : 'secondary'}>
                        {nudge.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{nudge.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {criticalAlerts.length > 0 ? (
            criticalAlerts.map((notification: any) => (
              <div key={notification.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-1 ${
                  notification.type === 'urgent' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{notification.message}</span>
                    <Badge variant={notification.type === 'urgent' ? 'destructive' : 'secondary'}>
                      {notification.type}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(notification.timestamp || Date.now()).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          ) : !upgradeNudges?.nudges?.length ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No critical alerts. All systems operational.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
