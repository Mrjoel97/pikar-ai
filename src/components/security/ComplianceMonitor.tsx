import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, AlertTriangle } from "lucide-react";
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

            <div className="space-y-4">
              {compliance.controls?.map((control: any) => (
                <div key={control._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      control.status === "passed" ? "bg-green-100 text-green-600" :
                      control.status === "failed" ? "bg-red-100 text-red-600" :
                      "bg-yellow-100 text-yellow-600"
                    }`}>
                      {control.status === "passed" ? <CheckCircle className="h-5 w-5" /> :
                       control.status === "failed" ? <XCircle className="h-5 w-5" /> :
                       <AlertTriangle className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className="font-medium">{control.name}</h4>
                      <p className="text-sm text-muted-foreground">{control.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{control.score}%</div>
                    <div className="text-xs text-muted-foreground">Compliance Score</div>
                  </div>
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