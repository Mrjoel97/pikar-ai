import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Clock, AlertTriangle } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface CrossDepartmentMetricsProps {
  businessId?: Id<"businesses">;
  days?: number;
}

export function CrossDepartmentMetrics({ businessId, days = 30 }: CrossDepartmentMetricsProps) {
  const metrics = useQuery(
    api.workflowHandoffs.getCrossDepartmentMetrics,
    businessId ? { businessId, days } : "skip"
  );

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cross-Department Metrics</CardTitle>
          <CardDescription>Loading metrics...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { totalHandoffs, avgHandoffTime, failureRate, departmentStats, flowData } = metrics;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Handoffs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHandoffs}</div>
            <p className="text-xs text-muted-foreground">Last {days} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Handoff Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold">{avgHandoffTime}h</span>
            </div>
            <p className="text-xs text-muted-foreground">Time to acceptance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Failure Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {failureRate > 10 ? (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-green-500" />
              )}
              <span className="text-2xl font-bold">{failureRate}%</span>
            </div>
            <p className="text-xs text-muted-foreground">Rejected handoffs</p>
          </CardContent>
        </Card>
      </div>

      {/* Department Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Department Activity</CardTitle>
          <CardDescription>Handoffs sent and received by department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {departmentStats.map((dept: { department: string; sent: number; received: number; avgTime: number }) => (
              <div key={dept.department} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{dept.department}</span>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {dept.sent} sent
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <TrendingDown className="w-3 h-3 mr-1" />
                      {dept.received} received
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Flow Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Handoff Flow</CardTitle>
          <CardDescription>Most common department transitions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {flowData
              .sort((a: { from: string; to: string; count: number }, b: { from: string; to: string; count: number }) => b.count - a.count)
              .slice(0, 10)
              .map((flow: { from: string; to: string; count: number }, idx: number) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-sm font-medium">{flow.from}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-sm font-medium">{flow.to}</span>
                  </div>
                  <Badge variant="secondary">{flow.count} handoffs</Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}