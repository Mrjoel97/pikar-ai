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
        <div className="space-y-4">
          {incidents?.map((incident: any) => (
            <div key={incident._id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{incident.title}</h4>
                  <Badge variant={
                    incident.severity === "critical" ? "destructive" :
                    incident.severity === "high" ? "default" :
                    "secondary"
                  }>
                    {incident.severity}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {incident.description}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Detected: {new Date(incident.detectedAt).toLocaleString()}</span>
                  <span>Status: {incident.status}</span>
                </div>
              </div>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}