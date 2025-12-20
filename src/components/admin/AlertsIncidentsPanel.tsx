import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface AlertsIncidentsPanelProps {
  selectedTenantId?: string;
}

export function AlertsIncidentsPanel({ selectedTenantId }: AlertsIncidentsPanelProps) {
  const [alertSeverity, setAlertSeverity] = useState<"low" | "medium" | "high">("low");
  const [alertTitle, setAlertTitle] = useState<string>("");
  const [alertDesc, setAlertDesc] = useState<string>("");

  const alerts = useQuery(
    api.admin.listAlerts as any,
    selectedTenantId ? { tenantId: selectedTenantId } : {}
  ) as Array<{ _id: string; title: string; severity: "low" | "medium" | "high"; status: "open" | "resolved"; createdAt: number }> | undefined;

  const createAlertMutation = useMutation(api.admin.createAlert as any);
  const resolveAlertMutation = useMutation(api.admin.resolveAlert as any);

  const handleCreateAlert = async () => {
    if (!alertTitle.trim()) {
      toast.error("Alert title is required");
      return;
    }

    try {
      await createAlertMutation({
        title: alertTitle,
        description: alertDesc,
        severity: alertSeverity,
        tenantId: selectedTenantId || undefined,
      });
      toast.success("Alert created");
      setAlertTitle("");
      setAlertDesc("");
      setAlertSeverity("low");
    } catch (e: any) {
      toast.error(e?.message || "Failed to create alert");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle id="section-alerts">Alerts & Incidents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Create and manage system alerts. Alerts can be scoped to a tenant or global.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            placeholder="Alert title"
            value={alertTitle}
            onChange={(e) => setAlertTitle(e.target.value)}
          />
          <Select value={alertSeverity} onValueChange={(v: any) => setAlertSeverity(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleCreateAlert}>Create Alert</Button>
        </div>

        <Textarea
          placeholder="Alert description (optional)"
          value={alertDesc}
          onChange={(e) => setAlertDesc(e.target.value)}
          rows={2}
        />

        <div className="rounded-md border overflow-hidden">
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2 p-3 bg-muted/40 text-xs font-medium">
            <div>Title</div>
            <div className="hidden md:block">Severity</div>
            <div>Status</div>
            <div className="hidden md:block">Created</div>
            <div className="hidden md:block">Tenant</div>
            <div className="text-right">Action</div>
          </div>
          <Separator />
          <div className="divide-y">
            {(alerts || []).map((a) => (
              <div key={a._id} className="grid grid-cols-4 md:grid-cols-6 gap-2 p-3 text-sm items-center">
                <div className="truncate">{a.title}</div>
                <div className="hidden md:block">
                  <Badge variant={a.severity === "high" ? "destructive" : "outline"}>
                    {a.severity}
                  </Badge>
                </div>
                <div>
                  <Badge variant={a.status === "open" ? "secondary" : "outline"}>
                    {a.status}
                  </Badge>
                </div>
                <div className="hidden md:block text-xs text-muted-foreground">
                  {new Date(a.createdAt).toLocaleString()}
                </div>
                <div className="hidden md:block text-xs text-muted-foreground">
                  {selectedTenantId || "Global"}
                </div>
                <div className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={a.status === "resolved"}
                    onClick={async () => {
                      try {
                        await resolveAlertMutation({ alertId: a._id });
                        toast.success("Alert resolved");
                      } catch (e: any) {
                        toast.error(e?.message || "Failed to resolve alert");
                      }
                    }}
                  >
                    Resolve
                  </Button>
                </div>
              </div>
            ))}
            {(!alerts || alerts.length === 0) && (
              <div className="p-3 text-sm text-muted-foreground">
                {selectedTenantId ? "No alerts for this tenant." : "No alerts found."}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
