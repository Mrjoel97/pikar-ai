import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, DollarSign, TrendingDown, Clock, AlertCircle } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from "recharts";
import { useState } from "react";

interface FinanceDashboardProps {
  businessId?: Id<"businesses">;
  isGuest?: boolean;
}

export function FinanceDashboard({ businessId, isGuest }: FinanceDashboardProps) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  
  const kpis = useQuery(api.departmentKpis.getFinanceKpis, {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Finance Dashboard</h2>
          <p className="text-muted-foreground">Track cash flow, burn rate, and financial health</p>
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
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cash Flow</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(kpis.summary.cashFlow / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground">Monthly net</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Burn Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(kpis.summary.burnRate / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground">Per month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Runway</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.summary.runway} mo</div>
            <p className="text-xs text-muted-foreground">At current burn</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">AR Total</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(kpis.summary.arTotal / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground">Receivables</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">AP Total</CardTitle>
            <AlertCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(kpis.summary.apTotal / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground">Payables</p>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Waterfall */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Waterfall</CardTitle>
          <CardDescription>Monthly cash flow breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={kpis.cashFlowWaterfall}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3b82f6">
                {kpis.cashFlowWaterfall.map((entry: any, index: number) => (
                  <Bar
                    key={`bar-${index}`}
                    dataKey="value"
                    fill={
                      entry.type === 'start' || entry.type === 'end' ? '#6366f1' :
                      entry.type === 'positive' ? '#10b981' :
                      '#ef4444'
                    }
                  />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Burn Rate Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Burn Rate & Runway Trend</CardTitle>
          <CardDescription>Monthly burn rate with runway projection</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={kpis.burnRateTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="burnRate" stroke="#ef4444" name="Burn Rate ($)" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="runway" stroke="#10b981" name="Runway (months)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* AR/AP Aging */}
      <Card>
        <CardHeader>
          <CardTitle>AR/AP Aging Buckets</CardTitle>
          <CardDescription>Receivables and payables by age</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Aging Bucket</th>
                  <th className="text-right py-2 px-4">AR</th>
                  <th className="text-right py-2 px-4">AP</th>
                  <th className="text-right py-2 px-4">Net</th>
                </tr>
              </thead>
              <tbody>
                {kpis.arApAging.map((bucket: any, idx: number) => {
                  const net = bucket.ar - bucket.ap;
                  return (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-4 font-medium">{bucket.bucket}</td>
                      <td className="text-right py-2 px-4 text-green-600">${bucket.ar.toLocaleString()}</td>
                      <td className="text-right py-2 px-4 text-red-600">${bucket.ap.toLocaleString()}</td>
                      <td className="text-right py-2 px-4">
                        <span className={net >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          ${net.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Department Spending */}
      <Card>
        <CardHeader>
          <CardTitle>Department Spending vs Budget</CardTitle>
          <CardDescription>Budget variance by department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Department</th>
                  <th className="text-right py-2 px-4">Spend</th>
                  <th className="text-right py-2 px-4">Budget</th>
                  <th className="text-right py-2 px-4">Variance</th>
                </tr>
              </thead>
              <tbody>
                {kpis.departmentSpending.map((dept: any, idx: number) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-4 font-medium">{dept.department}</td>
                    <td className="text-right py-2 px-4">${dept.spend.toLocaleString()}</td>
                    <td className="text-right py-2 px-4">${dept.budget.toLocaleString()}</td>
                    <td className="text-right py-2 px-4">
                      <span className={`font-semibold ${dept.variance < 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {dept.variance}%
                      </span>
                    </td>
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
