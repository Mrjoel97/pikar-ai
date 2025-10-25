import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface AuditTabProps {
  violations: any[];
}

export function AuditTab({ violations }: AuditTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Governance Audit Trail
        </CardTitle>
        <CardDescription>
          Complete history of governance actions and decisions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {violations.slice(0, 20).map((violation) => (
            <div key={violation._id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className={`p-2 rounded ${
                violation.status === "remediated" ? "bg-green-500" :
                violation.status === "dismissed" ? "bg-gray-500" :
                "bg-orange-500"
              } text-white`}>
                {violation.status === "remediated" ? <CheckCircle className="h-4 w-4" /> :
                 violation.status === "dismissed" ? <XCircle className="h-4 w-4" /> :
                 <AlertTriangle className="h-4 w-4" />}
              </div>
              <div className="flex-1">
                <div className="font-medium">{violation.ruleName}</div>
                <div className="text-sm text-muted-foreground">{violation.reason}</div>
              </div>
              <div className="text-right">
                <Badge variant="outline">{violation.status}</Badge>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(violation.detectedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
