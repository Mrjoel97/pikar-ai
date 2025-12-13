import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { useState } from "react";

export function CrisisDetection({ businessId }: { businessId: string }) {
  const [responseText, setResponseText] = useState("");

  const crisisScore = 35;
  const alerts = [
    { id: 1, severity: "high", title: "Negative sentiment spike", status: "active", time: "10m ago" },
    { id: 2, severity: "medium", title: "Unusual mention volume", status: "monitoring", time: "1h ago" },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-700 border-red-300";
      case "high": return "bg-orange-100 text-orange-700 border-orange-300";
      case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-300";
      default: return "bg-blue-100 text-blue-700 border-blue-300";
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Crisis Detection Dashboard
          </CardTitle>
          <CardDescription>AI-powered crisis monitoring and response</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Crisis Score</span>
                <Badge variant={crisisScore > 70 ? "destructive" : "secondary"}>
                  {crisisScore}/100
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${crisisScore > 70 ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${crisisScore}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Active Alerts</div>
              {alerts.map((alert) => (
                <div key={alert.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">{alert.title}</span>
                    </div>
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{alert.time}</span>
                    <Badge variant="outline">{alert.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Crisis Response</CardTitle>
          <CardDescription>Create and manage crisis responses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Draft your crisis response..."
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button>Send Response</Button>
              <Button variant="outline">Save as Template</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
