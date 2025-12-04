import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Id } from "@/convex/_generated/dataModel";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface RetentionCurvesProps {
  businessId: Id<"businesses">;
}

export function RetentionCurves({ businessId }: RetentionCurvesProps) {
  const now = Date.now();
  const threeMonthsAgo = now - 90 * 24 * 60 * 60 * 1000;
  
  const retentionData = useQuery(api.analytics.retention.getRetentionMetrics, {
    businessId,
    startDate: threeMonthsAgo,
    endDate: now,
    interval: "monthly",
  });

  const segmentRetention = useQuery(api.analytics.retention.getRetentionBySegment, {
    businessId,
    segmentField: "source",
  });

  const lifecycleStages = useQuery(api.analytics.retention.getUserLifecycleStages, {
    businessId,
  });

  if (!retentionData || !segmentRetention || !lifecycleStages) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Retention Analysis</CardTitle>
          <CardDescription>Loading retention data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = retentionData.map((period: any, idx: number) => ({
    name: `Period ${idx + 1}`,
    retention: period.retentionRates[0] || 0,
    newUsers: period.newUsers,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Retention Analysis</CardTitle>
        <CardDescription>User retention metrics and lifecycle stages</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="curves">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="curves">Retention Curves</TabsTrigger>
            <TabsTrigger value="segments">By Segment</TabsTrigger>
            <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
          </TabsList>

          <TabsContent value="curves" className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="retention"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="Retention Rate (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="segments" className="space-y-4">
            <div className="space-y-2">
              {segmentRetention.map((segment: any) => (
                <div key={segment.segment} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{segment.segment}</h4>
                    <span className="text-sm text-muted-foreground">
                      {segment.totalUsers} users
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">30 Day</div>
                      <div className="text-lg font-semibold">{segment.day30}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">60 Day</div>
                      <div className="text-lg font-semibold">{segment.day60}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">90 Day</div>
                      <div className="text-lg font-semibold">{segment.day90}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="lifecycle" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">New Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{lifecycleStages.stages.new}</div>
                  <p className="text-xs text-muted-foreground">
                    {lifecycleStages.percentages.new}% of total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {lifecycleStages.stages.active}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {lifecycleStages.percentages.active}% of total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">At Risk</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {lifecycleStages.stages.atRisk}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {lifecycleStages.percentages.atRisk}% of total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Churned</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {lifecycleStages.stages.churned}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {lifecycleStages.percentages.churned}% of total
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
