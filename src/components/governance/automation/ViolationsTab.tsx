import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, XCircle, CheckCircle } from "lucide-react";

interface ViolationsTabProps {
  openViolations: any[];
  onDismissViolation: (violationId: Id<"governanceViolations">) => void;
}

export function ViolationsTab({ openViolations, onDismissViolation }: ViolationsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Active Violations
        </CardTitle>
        <CardDescription>
          {openViolations.length} open violations requiring attention
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {openViolations.map((violation) => (
          <div key={violation._id} className="p-4 border rounded-lg space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{violation.ruleName}</h4>
                  <Badge variant={violation.severity === "critical" ? "destructive" : "secondary"}>
                    {violation.severity}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{violation.reason}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Detected: {new Date(violation.detectedAt).toLocaleString()}</span>
                  <span>Type: {violation.ruleType}</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDismissViolation(violation._id)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Dismiss
              </Button>
            </div>
          </div>
        ))}
        {openViolations.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p>No open violations</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
