import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, AlertTriangle } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area } from 'recharts';

export function ThreatDashboard({ businessId }: { businessId: Id<"businesses"> }) {
  const threats = useQuery(api.security.threats.getThreats, { businessId, limit: 10 });
  const resolveThreat = useMutation(api.security.threats.resolveThreat);

  const handleResolve = async (threatId: Id<"securityThreats">) => {
    try {
      await resolveThreat({ threatId, resolution: "Manually resolved by admin" });
      toast.success("Threat resolved");
    } catch (error: any) {
      toast.error(error.message || "Failed to resolve threat");
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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Active Threats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {threats?.filter(t => t.status === "active").map((threat) => (
              <div key={threat._id} className="flex items-start justify-between p-3 border rounded-lg">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">{threat.type}</span>
                    <Badge className={getSeverityColor(threat.severity)}>
                      {threat.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{threat.description}</p>
                  {threat.ipAddress && (
                    <p className="text-xs text-muted-foreground">IP: {threat.ipAddress}</p>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={() => handleResolve(threat._id)}>
                  Resolve
                </Button>
              </div>
            ))}
            {threats?.filter(t => t.status === "active").length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No active threats detected
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Threats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeThreats?.map((threat: any) => (
              <div key={threat._id} className="flex items-center justify-between p-4 border rounded-lg bg-red-50/50">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="font-medium">{threat.type}</div>
                    <div className="text-sm text-muted-foreground">{threat.source}</div>
                  </div>
                </div>
                <Badge variant="destructive">{threat.severity}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}