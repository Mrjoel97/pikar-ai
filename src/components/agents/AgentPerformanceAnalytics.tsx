import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Activity, TrendingUp, AlertTriangle } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

export function AgentPerformanceAnalytics({ agentId }: { agentId: Id<"aiAgents"> }) {
  const metrics = useQuery(api.agentMemory.getAgentPerformanceMetrics, {
    agentId,
    timeRange: 7 * 24 * 60 * 60 * 1000, // Last 7 days
  });

  if (!metrics) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Executions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <p className="text-2xl font-bold">{metrics.totalExecutions}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-2xl font-bold">
                {(metrics.successRate * 100).toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart className="h-4 w-4 text-purple-500" />
              <p className="text-2xl font-bold">{metrics.avgResponseTime.toFixed(0)}ms</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Error Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-2xl font-bold">
                {(metrics.errorRate * 100).toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Executions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metrics.recentExecutions.map((execution, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <Badge variant={execution.status === "success" ? "default" : "destructive"}>
                    {execution.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(execution.timestamp).toLocaleString()}
                  </span>
                </div>
                {execution.responseTime && (
                  <span className="text-sm">{execution.responseTime}ms</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
