import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

interface ResponseCenterProps {
  businessId: Id<"businesses">;
}

export function ResponseCenter({ businessId }: ResponseCenterProps) {
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [resolution, setResolution] = useState("");

  const activeAlerts = useQuery(api.crisisManagement.getActiveAlerts, { businessId });
  const playbooks = useQuery(api.crisisManagement.getCrisisPlaybooks, { businessId });
  const updateAlert = useMutation(api.crisisManagement.updateCrisisAlert);

  const handleResolve = async () => {
    if (!selectedAlert) return;
    try {
      await updateAlert({
        alertId: selectedAlert.id,
        status: "resolved",
        resolution,
      });
      toast.success("Crisis alert resolved");
      setSelectedAlert(null);
      setResolution("");
    } catch (error: any) {
      toast.error(error.message || "Failed to resolve alert");
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {activeAlerts?.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 border rounded-lg cursor-pointer hover:bg-accent ${
                  selectedAlert?.id === alert.id ? "bg-accent" : ""
                }`}
                onClick={() => setSelectedAlert(alert)}
              >
                <div className="flex items-center justify-between mb-1">
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
                  <span className="text-xs text-muted-foreground">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm font-medium">{alert.type}</p>
                <p className="text-xs text-muted-foreground">{alert.message}</p>
              </div>
            ))}
            {(!activeAlerts || activeAlerts.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">No active alerts</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Response Actions</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedAlert ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Alert Details</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Type:</span> {selectedAlert.type}</p>
                  <p><span className="font-medium">Severity:</span> {selectedAlert.severity}</p>
                  <p><span className="font-medium">Status:</span> {selectedAlert.status}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Response Playbook</h4>
                {playbooks?.filter((p: any) => p.crisisType === selectedAlert.type).map((playbook: any) => (
                  <div key={playbook.id} className="text-sm space-y-2">
                    <p className="font-medium">{playbook.name}</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {playbook.steps.map((step: string, idx: number) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-sm font-medium">Resolution Notes</label>
                <Textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Describe the resolution actions taken..."
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleResolve} className="flex-1">
                  Mark as Resolved
                </Button>
                <Button variant="outline" onClick={() => setSelectedAlert(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Select an alert to view response actions
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
