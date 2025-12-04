import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Target, Activity } from "lucide-react";

interface ForecastDashboardProps {
  businessId: Id<"businesses">;
}

export function ForecastDashboard({ businessId }: ForecastDashboardProps) {
  const forecast = useQuery(api.sales.forecasting.getSalesForecast, { businessId, months: 3 });
  const accuracy = useQuery(api.sales.forecasting.getForecastAccuracy, { businessId });
  const trends = useQuery(api.sales.forecasting.getRevenueTrends, { businessId, months: 6 });

  if (!forecast || !accuracy || !trends) {
    return <div>Loading forecast...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Sales Forecast</h2>
        <p className="text-muted-foreground">Revenue projections and trends</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Most Likely</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(forecast.summary.totalMostLikely / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground">Next 3 months</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Best Case</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${(forecast.summary.totalBestCase / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground">If all deals close</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Forecast Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accuracy.accuracy.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold flex items-center gap-1 ${trends.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trends.growthRate >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              {Math.abs(trends.growthRate).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Month over month</p>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle>3-Month Revenue Forecast</CardTitle>
          <CardDescription>Best case, worst case, and most likely scenarios</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={forecast.forecast}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `$${(value / 1000).toFixed(0)}K`} />
              <Legend />
              <Bar dataKey="bestCase" fill="#10b981" name="Best Case" />
              <Bar dataKey="mostLikely" fill="#3b82f6" name="Most Likely" />
              <Bar dataKey="worstCase" fill="#f59e0b" name="Worst Case" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
          <CardDescription>Historical revenue and deal volume</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends.trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                name="Revenue ($)" 
                strokeWidth={2} 
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="dealCount" 
                stroke="#3b82f6" 
                name="Deals Closed" 
                strokeWidth={2} 
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Historical Performance */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Historical Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Last 3 Months Revenue</span>
              <span className="font-semibold">${(forecast.historical.last3MonthsRevenue / 1000).toFixed(0)}K</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Avg Monthly Revenue</span>
              <span className="font-semibold">${(forecast.historical.avgMonthlyRevenue / 1000).toFixed(0)}K</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Deals Won</span>
              <span className="font-semibold">{forecast.historical.dealsWon}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Forecast Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Forecasted Revenue</span>
              <span className="font-semibold">${(accuracy.forecastedRevenue / 1000).toFixed(0)}K</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Actual Revenue</span>
              <span className="font-semibold">${(accuracy.actualRevenue / 1000).toFixed(0)}K</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Variance</span>
              <span className={`font-semibold ${accuracy.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {accuracy.variance >= 0 ? '+' : ''}{(accuracy.variance / 1000).toFixed(0)}K ({accuracy.variancePercent.toFixed(1)}%)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
