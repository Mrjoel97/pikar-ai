import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ComplianceMonitoringTabProps {
  complianceMonitoring: any;
}

export function ComplianceMonitoringTab({ complianceMonitoring }: ComplianceMonitoringTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Monitoring</CardTitle>
        <CardDescription>
          Overall compliance: {complianceMonitoring?.overallCompliance || 0}%
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-3">Compliance Frameworks</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {complianceMonitoring?.frameworks.map((framework: any) => (
                <div key={framework._id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{framework.name}</span>
                    <Badge variant="outline" className={
                      framework.status === "active" ? "bg-green-100 text-green-700" :
                      "bg-yellow-100 text-yellow-700"
                    }>
                      {framework.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Expires: {new Date(framework.expiryDate).toLocaleDateString()}</div>
                    <div>Days remaining: {framework.daysUntilExpiry}</div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${framework.complianceLevel}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {complianceMonitoring?.upcomingAudits && complianceMonitoring.upcomingAudits.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Upcoming Audits</h4>
              <div className="space-y-2">
                {complianceMonitoring.upcomingAudits.map((audit: any) => (
                  <div key={audit._id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{audit.auditType}</div>
                      <div className="text-xs text-muted-foreground">Auditor: {audit.auditor}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(audit.scheduledDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
