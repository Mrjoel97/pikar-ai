import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface IncidentResponseTabProps {
  incidentWorkflow: any;
  getSeverityColor: (severity: string) => string;
}

export function IncidentResponseTab({ incidentWorkflow, getSeverityColor }: IncidentResponseTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Incident Response Workflow</CardTitle>
        <CardDescription>
          Average response time: {incidentWorkflow?.avgResponseTime || 0} hours
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-3">Active Workflows</h4>
            <div className="space-y-3">
              {incidentWorkflow?.activeWorkflows.map((workflow: any) => (
                <div key={workflow._id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium">{workflow.title}</div>
                      <div className="text-xs text-muted-foreground">
                        Started: {new Date(workflow.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <Badge variant="outline" className={getSeverityColor(workflow.severity)}>
                      {workflow.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {workflow.steps.map((step: any, idx: number) => (
                      <div key={idx} className="flex-1">
                        <div className={`p-2 rounded text-xs text-center ${
                          step.status === "completed" ? "bg-green-100 text-green-700" :
                          step.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-500"
                        }`}>
                          {step.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {(!incidentWorkflow?.activeWorkflows || incidentWorkflow.activeWorkflows.length === 0) && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No active incident workflows
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Recently Completed</h4>
            <div className="space-y-2">
              {incidentWorkflow?.completedWorkflows.slice(0, 5).map((workflow: any) => (
                <div key={workflow._id} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">{workflow.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {Math.round(workflow.responseTime / (1000 * 60 * 60))}h
                    </span>
                    <Badge variant="outline" className={getSeverityColor(workflow.severity)}>
                      {workflow.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
