import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, BarChart3 } from "lucide-react";
import { useState } from "react";

export function AgentPerformanceMonitor() {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d" | "all">("7d");
  const allMetrics = useQuery(api.agentPerformance.getAllAgentsMetrics, { timeRange });

  if (!allMetrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agent Performance Monitor</CardTitle>
          <CardDescription>Loading performance data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const totalExecutions = allMetrics.reduce((sum, m) => sum + m.totalExecutions, 0);
  const avgSuccessRate = allMetrics.length > 0
    ? allMetrics.reduce((sum, m) => sum + m.successRate, 0) / allMetrics.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExecutions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all {allMetrics.length} agents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSuccessRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              System-wide performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allMetrics.filter(m => m.active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of {allMetrics.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Range</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Performance Details</CardTitle>
          <CardDescription>
            Detailed metrics for each agent in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allMetrics.map((metric) => (
              <AgentMetricRow key={metric.agentKey} metric={metric} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AgentMetricRow({ metric }: { metric: any }) {
  const [expanded, setExpanded] = useState(false);
  const executionHistory = useQuery(
    api.agentPerformance.getExecutionHistory,
    expanded ? { agentKey: metric.agentKey, limit: 20 } : "skip"
  );

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <div>
            <h4 className="font-semibold">{metric.displayName}</h4>
            <p className="text-sm text-muted-foreground">{metric.agentKey}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Badge variant={metric.active ? "default" : "secondary"}>
            {metric.active ? "Active" : "Inactive"}
          </Badge>
          
          <div className="text-right">
            <div className="text-sm font-medium">
              {metric.totalExecutions} executions
            </div>
            <div className="text-xs text-muted-foreground">
              {metric.successRate.toFixed(1)}% success
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">{metric.successCount}</span>
            </div>
            <div className="flex items-center gap-1 text-red-600">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">{metric.failureCount}</span>
            </div>
          </div>

          {metric.avgResponseTime > 0 && (
            <div className="text-sm text-muted-foreground">
              <Clock className="h-4 w-4 inline mr-1" />
              {metric.avgResponseTime}ms avg
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t space-y-2">
          <h5 className="font-medium text-sm">Recent Executions</h5>
          {executionHistory && executionHistory.length > 0 ? (
            <div className="space-y-1">
              {executionHistory.map((exec: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-sm py-1 px-2 bg-muted/50 rounded">
                  <span className="text-muted-foreground">
                    {new Date(exec.timestamp).toLocaleString()}
                  </span>
                  <div className="flex items-center gap-2">
                    {exec.responseTime && (
                      <span className="text-muted-foreground">{exec.responseTime}ms</span>
                    )}
                    <Badge variant={exec.status === "success" ? "default" : "destructive"}>
                      {exec.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No execution history available</p>
          )}
        </div>
      )}
    </div>
  );
}
