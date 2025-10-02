import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, DollarSign, Target, Clock } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useState } from "react";

interface SalesDashboardProps {
  businessId?: Id<"businesses">;
  isGuest?: boolean;
}

export function SalesDashboard({ businessId, isGuest }: SalesDashboardProps) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  
  const kpis = useQuery(api.departmentKpis.getSalesKpis, {
    businessId,
    timeRange,
  });

  if (!kpis) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sales Dashboard</h2>
          <p className="text-muted-foreground">Track pipeline, win rates, and quota attainment</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Velocity</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.summary.pipelineVelocity} days</div>
            <p className="text-xs text-muted-foreground">Avg time to close</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.summary.winRate}%</div>
            <p className="text-xs text-muted-foreground">Closed won / total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(kpis.summary.avgDealSize / 1000).toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground">Per closed deal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quota Attainment</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.summary.quotaAttainment}%</div>
            <p className="text-xs text-muted-foreground">Team average</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pipeline by Stage */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline by Stage</CardTitle>
            <CardDescription>Deal count and value across sales stages</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={kpis.pipelineByStage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" angle={-45} textAnchor="end" height={80} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Deal Count" />
                <Bar yAxisId="right" dataKey="value" fill="#10b981" name="Value ($)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Deal Size Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Deal Size Distribution</CardTitle>
            <CardDescription>Breakdown of deals by value range</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={kpis.dealSizeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.range}: ${entry.count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {kpis.dealSizeDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Win Rate Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Win Rate Trend</CardTitle>
          <CardDescription>Monthly win rate and deal volume</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={kpis.winRateTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="winRate" stroke="#10b981" name="Win Rate (%)" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="deals" stroke="#3b82f6" name="Total Deals" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Reps Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Sales Reps by Quota Attainment</CardTitle>
          <CardDescription>Performance leaderboard</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Rep</th>
                  <th className="text-right py-2 px-4">Quota</th>
                  <th className="text-right py-2 px-4">Achieved</th>
                  <th className="text-right py-2 px-4">Attainment</th>
                  <th className="text-right py-2 px-4">Deals</th>
                </tr>
              </thead>
              <tbody>
                {kpis.topReps.map((rep: any, idx: number) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-4 font-medium">{rep.name}</td>
                    <td className="text-right py-2 px-4">${(rep.quota / 1000).toFixed(0)}K</td>
                    <td className="text-right py-2 px-4">${(rep.achieved / 1000).toFixed(0)}K</td>
                    <td className="text-right py-2 px-4">
                      <span className={`font-semibold ${rep.attainment >= 90 ? 'text-green-600' : rep.attainment >= 75 ? 'text-orange-600' : 'text-red-600'}`}>
                        {rep.attainment}%
                      </span>
                    </td>
                    <td className="text-right py-2 px-4">{rep.deals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
