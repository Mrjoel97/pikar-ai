import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, Activity, Users, Zap, AlertCircle } from "lucide-react";

interface SystemAgentAnalyticsProps {
  selectedTenantId?: string;
}

export function SystemAgentAnalytics({ selectedTenantId }: SystemAgentAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  const analytics = useQuery(
    api.agentPerformance.getSystemAgentAnalytics,
    selectedTenantId ? { businessId: selectedTenantId, days: timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90 } : "skip"
  );

  const predictions = useQuery(
    api.agentPerformance.getPredictiveAgentInsights,
    selectedTenantId ? { businessId: selectedTenantId } : "skip"
  );

  const costOptimization = useQuery(
    api.agentPerformance.getAgentCostOptimization,
    selectedTenantId ? { businessId: selectedTenantId } : "skip"
  );

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

  if (!selectedTenantId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Select a Tenant</h3>
          <p className="text-sm text-muted-foreground">
            Choose a tenant from the filter above to view agent analytics
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">System Agent Analytics</h2>
        <div className="flex gap-2">
          {(["7d", "30d", "90d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-md text-sm ${
                timeRange === range
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Executions</p>
                <p className="text-2xl font-bold">{analytics?.totalExecutions || 0}</p>
              </div>
              <Activity className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-center text-xs">
              <TrendingUp className="h-3 w-3 text-emerald-600 mr-1" />
              <span className="text-emerald-600">+12% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{analytics?.successRate || 0}%</p>
              </div>
              <Zap className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2 flex items-center text-xs">
              <TrendingUp className="h-3 w-3 text-emerald-600 mr-1" />
              <span className="text-emerald-600">+3% improvement</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{analytics?.activeUsers || 0}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2 flex items-center text-xs">
              <TrendingUp className="h-3 w-3 text-emerald-600 mr-1" />
              <span className="text-emerald-600">+8 new users</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">{analytics?.avgResponseTime || 0}ms</p>
              </div>
              <AlertCircle className="h-8 w-8 text-amber-600" />
            </div>
            <div className="mt-2 flex items-center text-xs">
              <TrendingDown className="h-3 w-3 text-emerald-600 mr-1" />
              <span className="text-emerald-600">-50ms faster</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Different Analytics Views */}
      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage">Usage Trends</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="costs">Cost Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Usage Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.usageTimeline || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="executions" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Agents by Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.topAgents || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="executions" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Success Rate by Agent</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.agentPerformance || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="successRate" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response Time Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics?.responseTimeDistribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(analytics?.responseTimeDistribution || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Predictive Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictions?.predictions?.map((pred: any) => (
                  <div key={pred.agentId} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{pred.agentName}</h4>
                      <Badge variant={pred.riskLevel === "high" ? "destructive" : pred.riskLevel === "medium" ? "default" : "secondary"}>
                        {pred.riskLevel} risk
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-muted-foreground">Current</p>
                        <p className="font-semibold">{pred.currentPerformance.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Predicted</p>
                        <p className="font-semibold">{pred.predictedPerformance.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Trend</p>
                        <Badge variant="outline">{pred.trend}</Badge>
                      </div>
                    </div>
                    {pred.recommendedActions.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-1">Recommendations:</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {pred.recommendedActions.map((action: string, idx: number) => (
                            <li key={idx}>• {action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Optimization Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Monthly Cost</p>
                    <p className="text-2xl font-bold">${costOptimization?.totalCurrentCost?.toFixed(2) || "0.00"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Potential Savings</p>
                    <p className="text-2xl font-bold text-emerald-600">${costOptimization?.totalPotentialSavings?.toFixed(2) || "0.00"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {costOptimization?.recommendations?.map((rec: any) => (
                  <div key={rec.agentId} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{rec.agentName}</h4>
                      <Badge variant={rec.optimizationPotential === "high" ? "destructive" : rec.optimizationPotential === "medium" ? "default" : "secondary"}>
                        {rec.optimizationPotential} potential
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-muted-foreground">Current Cost</p>
                        <p className="font-semibold">${rec.currentCost.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Potential Savings</p>
                        <p className="font-semibold text-emerald-600">${rec.estimatedSavings.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg Exec Time</p>
                        <p className="font-semibold">{rec.avgExecutionTime}ms</p>
                      </div>
                    </div>
                    {rec.recommendations.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-1">Optimization Steps:</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {rec.recommendations.map((action: string, idx: number) => (
                            <li key={idx}>• {action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
