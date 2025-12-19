import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function GovernanceTab({ businessId }: { businessId: Id<"businesses"> }) {
  const governanceRules = useQuery(api.dataWarehouse.governance.getDataGovernanceRules, { businessId });
  const governanceViolations = useQuery(api.dataWarehouse.governance.getGovernanceViolations, { businessId });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Governance Rules</CardTitle>
          <CardDescription>Active data governance policies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {governanceRules?.map((rule: any) => (
              <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{rule.name}</h4>
                  <p className="text-sm text-muted-foreground">{rule.description}</p>
                </div>
                <Switch checked={rule.enabled} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Governance Violations</CardTitle>
          <CardDescription>Recent policy violations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {governanceViolations?.map((violation: any) => (
              <Alert key={violation.id} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Compliance Violation</AlertTitle>
                <AlertDescription>
                  {violation.description}
                  <div className="mt-2 text-xs opacity-80">
                    Detected: {new Date(violation.detectedAt).toLocaleString()}
                  </div>
                </AlertDescription>
              </Alert>
            ))}
            {(!governanceViolations || governanceViolations.length === 0) && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No violations detected
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
