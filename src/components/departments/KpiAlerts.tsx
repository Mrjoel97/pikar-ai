import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Id } from "@/convex/_generated/dataModel";

interface KpiAlertsProps {
  businessId: Id<"businesses">;
  department?: string;
  userId: Id<"users">;
}

export function KpiAlerts({ businessId, department, userId }: KpiAlertsProps) {
  const alerts = useQuery(api.departmentKpis.alerts.getAlerts, {
    businessId,
    department,
  });

  const acknowledgeAlert = useMutation(api.departmentKpis.alerts.acknowledgeAlert);
  const resolveAlert = useMutation(api.departmentKpis.alerts.resolveAlert);

  const handleAcknowledge = async (alertId: Id<"kpiAlerts">) => {
    try {
      await acknowledgeAlert({ alertId, userId });
      toast.success("Alert acknowledged");
    } catch (error) {
      toast.error("Failed to acknowledge alert");
      console.error(error);
    }
  };

  const handleResolve = async (alertId: Id<"kpiAlerts">) => {
    try {
      await resolveAlert({ alertId });
      toast.success("Alert resolved");
    } catch (error) {
      toast.error("Failed to resolve alert");
      console.error(error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "warning":
        return "default";
      case "info":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "info":
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (alerts === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const activeAlerts = alerts.filter((a: any) => a.status === "active");
  const acknowledgedAlerts = alerts.filter((a: any) => a.status === "acknowledged");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">KPI Alerts</h3>
        <p className="text-sm text-muted-foreground">
          Monitor and respond to performance deviations
        </p>
      </div>

      {activeAlerts.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Active Alerts</h4>
          {activeAlerts.map((alert: any, index: number) => (
            <motion.div
              key={alert._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getSeverityIcon(alert.severity)}
                      </div>
                      <div>
                        <CardTitle className="text-base">{alert.kpiName}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {alert.department} • {alert.message}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={getSeverityColor(alert.severity) as any}>
                      {alert.severity}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Current: {alert.currentValue} • Target: {alert.targetValue}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAcknowledge(alert._id)}
                      >
                        Acknowledge
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleResolve(alert._id)}
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {acknowledgedAlerts.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Acknowledged Alerts</h4>
          {acknowledgedAlerts.map((alert: any) => (
            <Card key={alert._id} className="opacity-60">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-base">{alert.kpiName}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {alert.department} • {alert.message}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline">acknowledged</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Acknowledged {alert.acknowledgedAt ? new Date(alert.acknowledgedAt).toLocaleDateString() : ""}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResolve(alert._id)}
                  >
                    Resolve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {alerts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
            <p className="text-sm text-muted-foreground">
              All clear! No active alerts at this time.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}