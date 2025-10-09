import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Activity, TrendingUp, Clock, AlertCircle } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface IntegrationAnalyticsProps {
  businessId: Id<"businesses">;
  isGuest?: boolean;
}

export function IntegrationAnalytics({ businessId, isGuest = false }: IntegrationAnalyticsProps) {
  const customApis = useQuery(
    api.customApis.listCustomApis,
    isGuest ? undefined : { businessId }
  );

  // Mock data for demo
  const apiCallsData = [
    { name: "Mon", calls: 1200, success: 1180, failed: 20 },
    { name: "Tue", calls: 1400, success: 1370, failed: 30 },
    { name: "Wed", calls: 1100, success: 1090, failed: 10 },
    { name: "Thu", calls: 1600, success: 1550, failed: 50 },
    { name: "Fri", calls: 1800, success: 1770, failed: 30 },
    { name: "Sat", calls: 900, success: 890, failed: 10 },
    { name: "Sun", calls: 800, success: 795, failed: 5 },
  ];

  const syncStatusData = [
    { name: "Successful", value: 847, color: "#10b981" },
    { name: "Failed", value: 23, color: "#ef4444" },
    { name: "Pending", value: 12, color: "#f59e0b" },
  ];

  const responseTimeData = [
    { name: "00:00", time: 120 },
    { name: "04:00", time: 95 },
    { name: "08:00", time: 180 },
    { name: "12:00", time: 220 },
    { name: "16:00", time: 190 },
    { name: "20:00", time: 150 },
  ];

  const totalCalls = customApis?.reduce((sum: number, api: any) => sum + (api.totalCalls || 0), 0) || 0;
  const avgResponseTime = 145; // ms
  const successRate = 98.2; // %
  const activeEndpoints = customApis?.filter((api: any) => api.isActive).length || 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Total API Calls</div>
                <div className="text-2xl font-bold">{isGuest ? "12.4K" : totalCalls.toLocaleString()}</div>
                <div className="text-xs text-green-600 mt-1">+12% vs last week</div>
              </div>
              <Activity className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
                <div className="text-2xl font-bold">{successRate}%</div>
                <div className="text-xs text-green-600 mt-1">+0.3% vs last week</div>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Avg Response Time</div>
                <div className="text-2xl font-bold">{avgResponseTime}ms</div>
                <div className="text-xs text-green-600 mt-1">-15ms vs last week</div>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Active Endpoints</div>
                <div className="text-2xl font-bold">{activeEndpoints}</div>
                <div className="text-xs text-muted-foreground mt-1">Across all integrations</div>
              </div>
              <AlertCircle className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Calls Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>API Calls (Last 7 Days)</CardTitle>
            <CardDescription>Total requests and success/failure breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={apiCallsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="success" fill="#10b981" name="Success" />
                <Bar dataKey="failed" fill="#ef4444" name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sync Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Sync Status Distribution</CardTitle>
            <CardDescription>Integration sync results</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={syncStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {syncStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Response Time Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Response Time Trend (24h)</CardTitle>
            <CardDescription>Average API response time in milliseconds</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="time" stroke="#8b5cf6" strokeWidth={2} name="Response Time (ms)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Integrations</CardTitle>
          <CardDescription>Most active integrations by API calls</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(customApis?.slice(0, 5) || []).map((api: any, index: number) => (
              <div key={api._id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-lg font-bold text-muted-foreground">#{index + 1}</div>
                  <div>
                    <div className="font-medium">{api.name}</div>
                    <div className="text-xs text-muted-foreground">{api.method} {api.path}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">{api.totalCalls || 0} calls</div>
                    <div className="text-xs text-muted-foreground">Last 24h</div>
                  </div>
                  <Badge variant={api.isActive ? "default" : "secondary"}>
                    {api.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            ))}
            {(!customApis || customApis.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                No custom APIs configured yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
