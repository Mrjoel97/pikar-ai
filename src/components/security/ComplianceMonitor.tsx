import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

export function ComplianceMonitor({ businessId }: { businessId: Id<"businesses"> }) {
  const compliance = useQuery(api.security.compliance.getComplianceStatus, { businessId });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "non-compliant": return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {compliance && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Score</span>
                <span className="text-2xl font-bold">{compliance.overallScore}%</span>
              </div>
              <Progress value={compliance.overallScore} />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Controls</h4>
              {compliance.controls?.map((control) => (
                <div key={control.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(control.status)}
                    <span className="text-sm">{control.name}</span>
                  </div>
                  <Badge variant="outline">{control.score}%</Badge>
                </div>
              ))}
            </div>
          </>
        )}
        {!compliance && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No compliance data available
          </p>
        )}
      </CardContent>
    </Card>
  );
}
