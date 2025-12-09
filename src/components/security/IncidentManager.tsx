import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

export function IncidentManager({ businessId }: { businessId: Id<"businesses"> }) {
  const incidents = useQuery(api.security.incidents.getIncidents, { businessId, limit: 10 });
  const updateStatus = useMutation(api.security.incidents.updateIncidentStatus);

  const handleStatusChange = async (incidentId: Id<"securityIncidents">, status: string) => {
    try {
      await updateStatus({ incidentId, status: status as any });
      toast.success("Incident status updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-700 border-red-300";
      case "high": return "bg-orange-100 text-orange-700 border-orange-300";
      case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-300";
      default: return "bg-blue-100 text-blue-700 border-blue-300";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Security Incidents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {incidents?.map((incident) => (
            <div key={incident._id} className="p-3 border rounded-lg space-y-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{incident.title}</span>
                    <Badge className={getSeverityColor(incident.severity)}>
                      {incident.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{incident.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={incident.status}
                  onValueChange={(value) => handleStatusChange(incident._id, value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
          {incidents?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No security incidents
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
