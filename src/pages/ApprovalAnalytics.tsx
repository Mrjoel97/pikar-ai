import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertCircle, Clock, CheckCircle } from "lucide-react";

export default function ApprovalAnalyticsPage() {
  const navigate = useNavigate();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [timeRange, setTimeRange] = useState<number>(30);

  const businesses = useQuery(api.businesses.getUserBusinesses, {});
  const firstBizId = businesses?.[0]?._id;

  const metrics = useQuery(
    api.approvalAnalytics.getApprovalMetrics,
    firstBizId ? { businessId: firstBizId, timeRange } : undefined
  );

  const bottlenecks = useQuery(
    api.approvalAnalytics.identifyBottlenecks,
    firstBizId ? { businessId: firstBizId } : undefined
  );

  const trends = useQuery(
    api.approvalAnalytics.getApprovalTrends,
    firstBizId ? { businessId: firstBizId, period: "day" } : undefined
  );

  if (authLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse h-8 w-40 rounded bg-muted mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-28 rounded-lg bg-muted" />
          <div className="h-28 rounded-lg bg-muted" />
          <div className="h-28 rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Sign in to view approval analytics.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button onClick={() => navigate("/auth")}>Sign In</Button>
            <Button variant="outline" onClick={() => navigate("/")}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare chart data
  const userChartData = metrics?.approvalsByUser
    ? Object.entries(metrics.approvalsByUser).map(([userId, count]) => ({
        user: userId.slice(0, 8),
        count,
      }))
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Approval Analytics</h1>
          <p className="text-sm text-muted-foreground">Track approval performance and identify bottlenecks.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(timeRange)} onValueChange={(v) => setTimeRange(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => navigate("/workflows")}>
            View Workflows
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Avg Approval Time</CardDescription>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.avgTimeHours || 0}h</div>
            <p className="text-xs text-muted-foreground mt-1">Average time to approve</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Overdue Approvals</CardDescription>
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{metrics?.overdueCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Past SLA deadline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Total Approvals</CardDescription>
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalApprovals || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">In selected period</p>
          </CardContent>
        </Card>
      </div>

      {/* Approvals by User Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Approvals by User</CardTitle>
          <CardDescription>Distribution of approval requests across team members</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="user" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Approval Time Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Approval Trends Over Time</CardTitle>
          <CardDescription>Daily approval activity</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="approved" stroke="#10b981" name="Approved" />
              <Line type="monotone" dataKey="rejected" stroke="#ef4444" name="Rejected" />
              <Line type="monotone" dataKey="pending" stroke="#f59e0b" name="Pending" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bottleneck Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bottleneck Users</CardTitle>
          <CardDescription>Team members with high pending counts or slow approval times</CardDescription>
        </CardHeader>
        <CardContent>
          {bottlenecks && bottlenecks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">User</th>
                    <th className="text-left p-2">Pending</th>
                    <th className="text-left p-2">Avg Time</th>
                    <th className="text-left p-2">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {bottlenecks.map((b: any, i: number) => (
                    <tr key={i} className="border-b">
                      <td className="p-2">{b.userName}</td>
                      <td className="p-2">{b.pendingCount}</td>
                      <td className="p-2">{b.avgTimeHours}h</td>
                      <td className="p-2">
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                          {b.reason}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              No bottlenecks detected. Great job!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
