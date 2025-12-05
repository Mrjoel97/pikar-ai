import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Id } from "@/convex/_generated/dataModel";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface LocationComplianceProps {
  businessId: Id<"businesses">;
}

export function LocationCompliance({ businessId }: LocationComplianceProps) {
  const complianceData = useQuery(api.locations.compliance.getLocationCompliance, {
    businessId,
  });

  if (!complianceData) {
    return <div>Loading compliance data...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Location Compliance</h2>
        <p className="text-muted-foreground">Compliance status across all locations</p>
      </div>

      <div className="grid gap-4">
        {complianceData.map((location) => (
          <Card key={location.locationId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{location.locationName}</CardTitle>
                  <CardDescription>{location.locationCode}</CardDescription>
                </div>
                <Badge
                  variant={
                    location.status === "critical"
                      ? "destructive"
                      : location.status === "warning"
                      ? "secondary"
                      : "default"
                  }
                >
                  {location.status === "critical" && <XCircle className="h-3 w-3 mr-1" />}
                  {location.status === "warning" && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {location.status === "healthy" && <CheckCircle className="h-3 w-3 mr-1" />}
                  {location.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Compliance Score</span>
                    <span className="text-sm font-bold">{location.complianceScore}%</span>
                  </div>
                  <Progress value={location.complianceScore} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Total Workflows</div>
                    <div className="text-lg font-semibold">{location.totalWorkflows}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Compliant</div>
                    <div className="text-lg font-semibold text-green-600">
                      {location.compliantWorkflows}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Open Violations</div>
                    <div className="text-lg font-semibold text-yellow-600">
                      {location.openViolations}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Critical Issues</div>
                    <div className="text-lg font-semibold text-red-600">
                      {location.criticalViolations}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {complianceData.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No compliance data available</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
