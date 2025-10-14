import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface PlaybookExecutionTrackerProps {
  executionId: Id<"playbookExecutions">;
  onRetry?: (newExecutionId: Id<"playbookExecutions">) => void;
}

export default function PlaybookExecutionTracker({
  executionId,
  onRetry,
}: PlaybookExecutionTrackerProps) {
  const [expanded, setExpanded] = useState(true);
  const execution = useQuery(api.playbookExecutions.getExecution, { executionId });
  const retryExecution = useMutation(api.playbookExecutions.retryExecution);

  if (!execution) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading execution details...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "running":
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case "pending":
        return <Clock className="h-5 w-5 text-gray-400" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      failed: "destructive",
      running: "secondary",
      pending: "outline",
      cancelled: "outline",
    };

    return (
      <Badge variant={variants[status] || "outline"} className="capitalize">
        {status}
      </Badge>
    );
  };

  const calculateProgress = () => {
    if (execution.status === "completed") return 100;
    if (execution.status === "failed" || execution.status === "cancelled") return 0;
    if (!execution.steps || execution.steps.length === 0) return 10;

    const completedSteps = execution.steps.filter((s) => s.status === "completed").length;
    return Math.min(95, (completedSteps / execution.steps.length) * 100);
  };

  const handleRetry = async () => {
    try {
      const result = await retryExecution({ executionId });
      toast.success("Playbook execution retried");
      if (onRetry && result.executionId) {
        onRetry(result.executionId as Id<"playbookExecutions">);
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to retry execution");
    }
  };

  const duration = execution.completedAt
    ? Math.round((execution.completedAt - execution.startedAt) / 1000)
    : Math.round((Date.now() - execution.startedAt) / 1000);

  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(execution.status)}
            <div>
              <CardTitle className="text-lg">
                {execution.playbookKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Started {new Date(execution.startedAt).toLocaleString()} • {duration}s
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(execution.status)}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          {execution.status === "running" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(calculateProgress())}%</span>
              </div>
              <Progress value={calculateProgress()} className="h-2" />
            </div>
          )}

          {/* Error Alert */}
          {execution.status === "failed" && execution.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Execution Failed</p>
                  <p className="text-sm">{execution.error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    className="mt-2"
                  >
                    <RotateCcw className="h-3 w-3 mr-2" />
                    Retry Execution
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Execution Steps */}
          {execution.steps && execution.steps.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Execution Steps</h4>
              <div className="space-y-2">
                {execution.steps.map((step, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-md border bg-muted/30"
                  >
                    <div className="mt-0.5">
                      {step.status === "completed" && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                      {step.status === "failed" && (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      {step.status === "running" && (
                        <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                      )}
                      {step.status === "pending" && (
                        <Clock className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{step.name}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(step.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {step.error && (
                        <p className="text-xs text-red-600">{step.error}</p>
                      )}
                      {step.result && (
                        <p className="text-xs text-muted-foreground">
                          {typeof step.result === "string"
                            ? step.result
                            : JSON.stringify(step.result).slice(0, 100)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Result Visualization */}
          {execution.status === "completed" && execution.result && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Execution Result</h4>
              <div className="p-3 rounded-md border bg-green-50 dark:bg-green-950/20">
                <pre className="text-xs whitespace-pre-wrap">
                  {typeof execution.result === "string"
                    ? execution.result
                    : JSON.stringify(execution.result, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
