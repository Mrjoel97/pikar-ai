import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Id } from "@/convex/_generated/dataModel";

interface HandoffAnalyticsProps {
  businessId: Id<"businesses">;
}

export function HandoffAnalytics({ businessId }: HandoffAnalyticsProps) {
  const analytics = useQuery(api.workflows.crossDepartment.getHandoffAnalytics, { businessId });
  const bottlenecks = useQuery(api.workflows.crossDepartment.getBottleneckAnalysis, { businessId });
  const durations = useQuery(api.workflows.crossDepartment.getHandoffDuration, { businessId });

  if (!analytics || !bottlenecks || !durations) {
    return <div>Loading analytics...</div>;
  }

  const durationTrends = durations
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((d, i) => ({
      index: i + 1,
      duration: Math.round(d.duration / (1000 * 60 * 60)), // Convert to hours
      route: `${d.from} → ${d.to}`,
    }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Handoffs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalHandoffs}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.completionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.completedHandoffs} / {analytics.totalHandoffs}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(analytics.avgDuration / (1000 * 60 * 60))}h
            </div>
            <p className="text-xs text-muted-foreground">Per handoff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{analytics.pendingHandoffs}</div>
            <p className="text-xs text-muted-foreground">Awaiting action</p>
          </CardContent>
        </Card>
      </div>

      {/* Duration Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Handoff Duration Trends</CardTitle>
          <CardDescription>Time taken for cross-department handoffs over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={durationTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="index" label={{ value: "Handoff #", position: "insideBottom", offset: -5 }} />
              <YAxis label={{ value: "Hours", angle: -90, position: "insideLeft" }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border rounded-lg p-2 shadow-lg">
                        <p className="font-semibold">{payload[0].payload.route}</p>
                        <p className="text-sm">{payload[0].value} hours</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line type="monotone" dataKey="duration" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Department Flow */}
      <Card>
        <CardHeader>
          <CardTitle>Department-to-Department Flow</CardTitle>
          <CardDescription>Most common handoff routes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.flows.slice(0, 10).map((flow: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{flow.from}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{flow.to}</span>
                </div>
                <Badge variant="secondary">{flow.count} handoffs</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bottleneck Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Bottleneck Analysis
          </CardTitle>
          <CardDescription>Routes with longest average duration</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bottlenecks.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="from"
                tick={{ fontSize: 12 }}
                label={{ value: "From Department", position: "insideBottom", offset: -5 }}
              />
              <YAxis label={{ value: "Avg Hours", angle: -90, position: "insideLeft" }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold">
                          {data.from} → {data.to}
                        </p>
                        <p className="text-sm">
                          Avg: {Math.round(data.avgDuration / (1000 * 60 * 60))} hours
                        </p>
                        <p className="text-sm text-muted-foreground">{data.count} handoffs</p>
                        <Badge
                          variant={
                            data.severity === "high"
                              ? "destructive"
                              : data.severity === "medium"
                              ? "default"
                              : "secondary"
                          }
                          className="mt-1"
                        >
                          {data.severity} severity
                        </Badge>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey={(d: any) => Math.round(d.avgDuration / (1000 * 60 * 60))}
                fill="#ef4444"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
