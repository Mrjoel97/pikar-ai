import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell,
} from "recharts";
import { DollarSign, Users, Target, TrendingUp } from "lucide-react";

interface GrowthMetricsData {
  summary: {
    totalRevenue: number;
    activeCustomers: number;
    conversionRate: number;
    avgCAC: number;
    avgLTV: number;
    ltvcacRatio: number;
  };
  conversionFunnel: Array<{ stage: string; count: number; rate: number }>;
  trends: Array<{ date: string; revenue: number; cac: number; customers: number }>;
  cacByChannel: Array<{ channel: string; cac: number; customers: number }>;
}

interface GrowthMetricsProps {
  metrics: GrowthMetricsData | null;
  kpis: {
    totalRevenue: number;
    activeCustomers: number;
    conversionRate: number;
  };
}

export function GrowthMetrics({ metrics, kpis }: GrowthMetricsProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Growth Metrics Dashboard</h2>
          <p className="text-sm text-muted-foreground">Track funnel performance, CAC, and customer acquisition</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics?.summary.totalRevenue?.toLocaleString() || kpis.totalRevenue?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Total revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.summary.activeCustomers || kpis.activeCustomers || 0}</div>
            <p className="text-xs text-muted-foreground">Active customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.summary.conversionRate || kpis.conversionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Visitor to customer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg CAC</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics?.summary.avgCAC || 0}</div>
            <p className="text-xs text-muted-foreground">Customer acquisition</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg LTV</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics?.summary.avgLTV || 0}</div>
            <p className="text-xs text-muted-foreground">Lifetime value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">LTV:CAC</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.summary.ltvcacRatio || 0}x</div>
            <p className="text-xs text-muted-foreground">Ratio</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>Customer journey from visitor to conversion</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics?.conversionFunnel || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981">
                  {(metrics?.conversionFunnel || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b"][index % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* CAC by Channel */}
        <Card>
          <CardHeader>
            <CardTitle>CAC by Channel</CardTitle>
            <CardDescription>Customer acquisition cost across channels</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics?.cacByChannel || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="channel" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="cac" fill="#ef4444" name="CAC ($)" />
                <Bar yAxisId="right" dataKey="customers" fill="#10b981" name="Customers" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Growth Trends</CardTitle>
          <CardDescription>Revenue, CAC, and customer trends over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics?.trends || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue ($)" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="cac" stroke="#ef4444" name="CAC ($)" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="customers" stroke="#3b82f6" name="Customers" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </section>
  );
}
