import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, Play } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function WorkflowExecutionViewer({ runId }: { runId: string }) {
  const execution = useQuery(api.workflows.getWorkflowExecution, { runId: runId as any });

  if (!execution) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading execution details...
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "succeeded":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "running":
        return <Play className="h-5 w-5 text-blue-500 animate-pulse" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      succeeded: "default",
      failed: "destructive",
      running: "secondary",
      queued: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const duration = execution.completedAt
    ? execution.completedAt - execution.startedAt
    : Date.now() - execution.startedAt;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(execution.status)}
                {execution.workflowName}
              </CardTitle>
              <CardDescription>
                Started {formatDistanceToNow(execution.startedAt, { addSuffix: true })}
              </CardDescription>
            </div>
            {getStatusBadge(execution.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Duration</div>
              <div className="text-2xl font-bold">
                {(duration / 1000).toFixed(2)}s
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Steps</div>
              <div className="text-2xl font-bold">{execution.pipeline?.length || 0}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Mode</div>
              <div className="text-2xl font-bold capitalize">{execution.mode || "auto"}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {execution.errorMessage && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{execution.errorMessage}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Execution Timeline</CardTitle>
          <CardDescription>Step-by-step execution progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {execution.pipeline?.map((step: any, index: number) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{step.type || "Unknown Step"}</div>
                  <div className="text-sm text-muted-foreground">
                    {step.config ? JSON.stringify(step.config).slice(0, 100) : "No config"}
                  </div>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
