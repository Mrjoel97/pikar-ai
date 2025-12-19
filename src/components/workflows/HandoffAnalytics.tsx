import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, AlertTriangle, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { Id } from "@/convex/_generated/dataModel";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface HandoffAnalyticsProps {
  businessId: Id<"businesses">;
}

export function HandoffAnalytics({ businessId }: HandoffAnalyticsProps) {
  const handoffs = useQuery(api.workflows.crossDepartment.getHandoffAnalytics, { businessId });
  const bottlenecks = useQuery(api.workflows.crossDepartment.getBottleneckAnalysis, { businessId });
  const durations = useQuery(api.workflows.crossDepartment.getHandoffDuration, { businessId });

  if (!handoffs || !bottlenecks || !durations) {
    return <div>Loading analytics...</div>;
  }

  const durationTrends = handoffs.map((h: any, i: number) => ({
    index: i + 1,
    duration: h.duration ? h.duration / (1000 * 60 * 60) : 0,
    route: `${h.fromDepartment}->${h.toDepartment}`
  }));

  const getAverageDuration = () => {
    if (!handoffs?.length) return 0;
    const completed = handoffs.filter((h: any) => h.status === "completed" && h.duration);
    if (!completed.length) return 0;
    return Math.round(completed.reduce((a: any, b: any) => a + (b.duration || 0), 0) / completed.length / 60000); // in minutes
  };

  const getSuccessRate = () => {
    if (!handoffs?.length) return 0;
    const completed = handoffs.filter((h: any) => h.status === "completed").length;
    return Math.round((completed / handoffs.length) * 100);
  };

  const getDepartmentFlow = () => {
    if (!handoffs) return [];
    const flow: Record<string, number> = {};
    handoffs.forEach((h: any) => {
      const key = `${h.fromDepartment}->${h.toDepartment}`;
      flow[key] = (flow[key] || 0) + 1;
    });
    return Object.entries(flow).map(([name, value]) => ({ name, value }));
  };

  const getDailyVolume = () => {
    if (!handoffs) return [];
    const volume: Record<string, number> = {};
    handoffs.forEach((h: any) => {
      const date = new Date(h.createdAt).toLocaleDateString();
      volume[date] = (volume[date] || 0) + 1;
    });
    return Object.entries(volume)
      .map(([date, count]) => ({ date, count }))
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Handoff Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageDuration()} min</div>
            <p className="text-xs text-muted-foreground">
              Time from initiation to completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getSuccessRate()}%</div>
            <p className="text-xs text-muted-foreground">
              {handoffs?.filter((h: any) => h.status === "completed").length} / {handoffs?.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{handoffs?.filter((h: any) => h.status !== "completed").length}</div>
            <p className="text-xs text-muted-foreground">Awaiting action</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Department Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getDepartmentFlow()}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(d: any) => d.name}
                  >
                    {getDepartmentFlow().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Handoff Volume</CardTitle>
            <CardDescription>Volume of handoffs over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getDailyVolume()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
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