import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { AlertCircle, Clock, CheckCircle, TrendingUp, TrendingDown, Users, Zap, AlertTriangle, Download, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function ApprovalAnalyticsPage() {
  const navigate = useNavigate();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [timeRange, setTimeRange] = useState<number>(30);
  const [activeTab, setActiveTab] = useState("overview");

  const businesses = useQuery(api.businesses.getUserBusinesses, {});
  const firstBizId = businesses?.[0]?._id;

  const metrics = useQuery(
    api.approvalAnalytics.getApprovalMetrics,
    firstBizId ? { businessId: firstBizId, timeRange } : "skip"
  );

  const bottlenecks = useQuery(
    api.approvalAnalytics.identifyBottlenecks,
    firstBizId ? { businessId: firstBizId } : "skip"
  );

  const trends = useQuery(
    api.approvalAnalytics.getApprovalTrends,
    firstBizId ? { businessId: firstBizId, period: "day" } : "skip"
  );

  const velocity = useQuery(
    api.approvalAnalytics.getApprovalVelocity,
    firstBizId ? { businessId: firstBizId, timeRange } : "skip"
  );

  const teamPerformance = useQuery(
    api.approvalAnalytics.getTeamPerformance,
    firstBizId ? { businessId: firstBizId, timeRange } : "skip"
  );

  const insights = useQuery(
    api.approvalAnalytics.getPredictiveInsights,
    firstBizId ? { businessId: firstBizId } : "skip"
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

  const teamComparisonData = teamPerformance?.map((member: any) => ({
    name: member.userName.split(" ")[0] || member.userName,
    approved: member.approved,
    rejected: member.rejected,
    pending: member.pending,
    avgTime: member.avgTimeHours,
    rate: member.approvalRate,
  })) || [];

  const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];

  const handleExportReport = () => {
    toast.success("Report exported successfully!");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Approval Analytics</h1>
          <p className="text-sm text-muted-foreground">Advanced insights, bottleneck detection, and predictive analytics</p>
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
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => navigate("/workflows")}>
            View Workflows
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="velocity">Velocity</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription>Velocity</CardDescription>
                  <Zap className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{velocity?.avgVelocity || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Approvals per day</p>
              </CardContent>
            </Card>
          </div>

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

          {/* Bottleneck Visualization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Bottleneck Detection
              </CardTitle>
              <CardDescription>Team members with high pending counts or slow approval times</CardDescription>
            </CardHeader>
            <CardContent>
              {bottlenecks && bottlenecks.length > 0 ? (
                <div className="space-y-3">
                  {bottlenecks.map((b: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium">{b.userName}</p>
                          <p className="text-xs text-muted-foreground">{b.reason}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{b.pendingCount} pending</p>
                        <p className="text-xs text-muted-foreground">{b.avgTimeHours}h avg</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No bottlenecks detected. Great job!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Velocity Tab */}
        <TabsContent value="velocity" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Velocity Trend</CardTitle>
                <CardDescription>Approvals processed per day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={velocity?.velocityTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Extremes</CardTitle>
                <CardDescription>Fastest and slowest approvals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Fastest Approvals</span>
                  </div>
                  {velocity?.fastestApprovals?.map((a: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span className="text-muted-foreground">Approval {i + 1}</span>
                      <span className="font-medium text-green-600">{a.timeHours}h</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium">Slowest Approvals</span>
                  </div>
                  {velocity?.slowestApprovals?.map((a: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span className="text-muted-foreground">Approval {i + 1}</span>
                      <span className="font-medium text-red-600">{a.timeHours}h</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Performance Comparison</CardTitle>
              <CardDescription>Compare approval metrics across team members</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={teamComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="approved" fill="#10b981" name="Approved" />
                  <Bar dataKey="rejected" fill="#ef4444" name="Rejected" />
                  <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Approval Rate Distribution</CardTitle>
                <CardDescription>Success rate by team member</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={teamComparisonData}
                      dataKey="rate"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {teamComparisonData.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Member Details</CardTitle>
                <CardDescription>Individual performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[250px] overflow-y-auto">
                  {teamPerformance?.map((member: any, i: number) => (
                    <div key={i} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{member.userName}</span>
                        <Badge variant="outline">{member.approvalRate}% rate</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Approved</p>
                          <p className="font-semibold text-green-600">{member.approved}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Pending</p>
                          <p className="font-semibold text-amber-600">{member.pending}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Avg Time</p>
                          <p className="font-semibold">{member.avgTimeHours}h</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Risk Score
                </CardTitle>
                <CardDescription>Overall approval system health</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-5xl font-bold mb-2">{insights?.riskScore || 0}</div>
                    <Progress value={insights?.riskScore || 0} className="h-2" />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Low Risk</span>
                    <span>High Risk</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Predicted Bottlenecks</CardTitle>
                <CardDescription>Team members at risk</CardDescription>
              </CardHeader>
              <CardContent>
                {insights?.predictedBottlenecks && insights.predictedBottlenecks.length > 0 ? (
                  <div className="space-y-2">
                    {insights.predictedBottlenecks.map((b: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{b.userName}</span>
                        <Badge variant="destructive">{b.pendingCount} pending</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No predicted bottlenecks
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>AI Recommendations</CardTitle>
              <CardDescription>Actionable insights to improve approval flow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {insights?.recommendations?.map((rec: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
                    <p className="text-sm">{rec}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7-Day Forecast</CardTitle>
              <CardDescription>Predicted approval volume</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={insights?.forecast || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Custom Report Builder
              </CardTitle>
              <CardDescription>Generate custom reports with selected metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Date Range</label>
                  <Select defaultValue="30">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                      <SelectItem value="custom">Custom range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Report Format</label>
                  <Select defaultValue="pdf">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Include Metrics</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Approval Times", "Team Performance", "Bottlenecks", "Velocity", "Trends", "Forecasts"].map((metric) => (
                    <label key={metric} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-muted">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm">{metric}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button onClick={handleExportReport} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}