import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";

interface BudgetForecastProps {
  businessId: Id<"businesses">;
  department: string;
}

export function BudgetForecast({ businessId, department }: BudgetForecastProps) {
  const forecast3m = useQuery(api.departmentBudgets.forecasting.getForecast, {
    businessId,
    department,
    months: 3,
  });

  const forecast6m = useQuery(api.departmentBudgets.forecasting.getForecast, {
    businessId,
    department,
    months: 6,
  });

  const forecast12m = useQuery(api.departmentBudgets.forecasting.getForecast, {
    businessId,
    department,
    months: 12,
  });

  const seasonalPatterns = useQuery(api.departmentBudgets.forecasting.getSeasonalPatterns, {
    businessId,
    department,
  });

  if (!forecast3m || !forecast6m || !forecast12m) {
    return <div>Loading forecast...</div>;
  }

  const renderForecastChart = (forecast: any) => {
    if (!forecast || forecast.forecast.length === 0) {
      return <div className="text-muted-foreground text-sm">Insufficient data for forecasting</div>;
    }

    const chartData = [
      ...forecast.historical.map((d: any) => ({
        month: d.month,
        actual: d.spend,
        type: "historical",
      })),
      ...forecast.forecast.map((d: any) => ({
        month: d.month,
        predicted: d.predicted,
        lower: d.lower,
        upper: d.upper,
        type: "forecast",
      })),
    ];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={forecast.confidence === "high" ? "default" : forecast.confidence === "medium" ? "secondary" : "outline"}>
              {forecast.confidence} confidence
            </Badge>
            {forecast.trend === "increasing" && (
              <div className="flex items-center gap-1 text-red-600 text-sm">
                <TrendingUp className="h-4 w-4" />
                <span>+{forecast.monthlyGrowthRate}% monthly</span>
              </div>
            )}
            {forecast.trend === "decreasing" && (
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <TrendingDown className="h-4 w-4" />
                <span>{forecast.monthlyGrowthRate}% monthly</span>
              </div>
            )}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="actual"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              name="Historical"
            />
            <Area
              type="monotone"
              dataKey="predicted"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.3}
              name="Forecast"
            />
            <Area
              type="monotone"
              dataKey="upper"
              stroke="#9ca3af"
              fill="#9ca3af"
              fillOpacity={0.1}
              name="Upper Bound"
            />
            <Area
              type="monotone"
              dataKey="lower"
              stroke="#9ca3af"
              fill="#9ca3af"
              fillOpacity={0.1}
              name="Lower Bound"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Budget Forecast - {department}</CardTitle>
          <CardDescription>ML-powered spending predictions with confidence intervals</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="3m">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="3m">3 Months</TabsTrigger>
              <TabsTrigger value="6m">6 Months</TabsTrigger>
              <TabsTrigger value="12m">12 Months</TabsTrigger>
            </TabsList>

            <TabsContent value="3m" className="space-y-4">
              {renderForecastChart(forecast3m)}
            </TabsContent>

            <TabsContent value="6m" className="space-y-4">
              {renderForecastChart(forecast6m)}
            </TabsContent>

            <TabsContent value="12m" className="space-y-4">
              {renderForecastChart(forecast12m)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {seasonalPatterns && seasonalPatterns.hasSeasonality && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Seasonal Patterns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {seasonalPatterns.peakMonths.length > 0 && (
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Peak Spending Months</p>
                  <p className="text-sm text-muted-foreground">
                    {seasonalPatterns.peakMonths.join(", ")} - Plan for higher budgets
                  </p>
                </div>
              </div>
            )}
            {seasonalPatterns.lowMonths.length > 0 && (
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Low Spending Months</p>
                  <p className="text-sm text-muted-foreground">
                    {seasonalPatterns.lowMonths.join(", ")} - Opportunity for cost optimization
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
