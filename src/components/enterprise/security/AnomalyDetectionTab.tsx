import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

interface AnomalyDetectionTabProps {
  anomalyDetection: any;
  getSeverityColor: (severity: string) => string;
}

export default function AnomalyDetectionTab({ anomalyDetection, getSeverityColor }: AnomalyDetectionTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Anomaly Detection</CardTitle>
        <CardDescription>Real-time behavioral analysis and anomaly alerts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Anomaly Score</div>
              <div className="text-2xl font-bold">{anomalyDetection?.anomalyScore || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Baseline (Avg Daily)</div>
              <div className="text-2xl font-bold">{anomalyDetection?.baselineMetrics.avgDailyAlerts || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Today's Alerts</div>
              <div className="text-2xl font-bold">{anomalyDetection?.baselineMetrics.todayAlerts || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium mb-2">Detected Anomalies</h4>
          {anomalyDetection?.anomalies.map((anomaly: any) => (
            <div key={anomaly._id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">{anomaly.description}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(anomaly.timestamp).toLocaleString()} • Score: {Math.round(anomaly.score)}
                </div>
              </div>
              <Badge variant="outline" className={getSeverityColor(anomaly.severity)}>
                {anomaly.severity}
              </Badge>
            </div>
          ))}
          {(!anomalyDetection?.anomalies || anomalyDetection.anomalies.length === 0) && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No anomalies detected
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
