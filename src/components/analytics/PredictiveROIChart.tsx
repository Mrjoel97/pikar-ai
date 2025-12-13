import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp, Activity } from "lucide-react";

interface PredictiveROIChartProps {
  historical: Array<{
    date: number;
    revenue: number;
    timeSaved: number;
    roi: number;
  }>;
  forecast: Array<{
    date: number;
    predictedRevenue: number;
    predictedTimeSaved: number;
    predictedROI: number;
    confidenceLower: number;
    confidenceUpper: number;
  }>;
  trends: {
    revenueGrowthRate: number;
    timeSavedGrowthRate: number;
    averageROI: number;
  };
}

export function PredictiveROIChart({ historical, forecast, trends }: PredictiveROIChartProps) {
  // Combine historical and forecast data
  const chartData = [
    ...historical.map((d) => ({
      date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      actualRevenue: d.revenue,
      predictedRevenue: null,
      confidenceLower: null,
      confidenceUpper: null,
      type: "historical",
    })),
    ...forecast.map((d) => ({
      date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      actualRevenue: null,
      predictedRevenue: d.predictedRevenue,
      confidenceLower: d.confidenceLower,
      confidenceUpper: d.confidenceUpper,
      type: "forecast",
    })),
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Predictive ROI Forecast
            </CardTitle>
            <CardDescription>Historical data with 90-day revenue prediction</CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Avg ROI: {Math.round(trends.averageROI * 100) / 100}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }} 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              
              {/* Confidence band */}
              <Area
                type="monotone"
                dataKey="confidenceUpper"
                stroke="none"
                fill="#3b82f6"
                fillOpacity={0.1}
                name="Confidence Upper"
              />
              <Area
                type="monotone"
                dataKey="confidenceLower"
                stroke="none"
                fill="#3b82f6"
                fillOpacity={0.1}
                name="Confidence Lower"
              />
              
              {/* Actual revenue */}
              <Line
                type="monotone"
                dataKey="actualRevenue"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Actual Revenue ($)"
              />
              
              {/* Predicted revenue */}
              <Line
                type="monotone"
                dataKey="predictedRevenue"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3 }}
                name="Predicted Revenue ($)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <div className="text-muted-foreground">Revenue Growth Rate</div>
            <div className="text-lg font-bold text-green-600">
              {trends.revenueGrowthRate > 0 ? "+" : ""}
              {Math.round(trends.revenueGrowthRate * 100) / 100}/day
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Time Saved Growth</div>
            <div className="text-lg font-bold text-blue-600">
              {trends.timeSavedGrowthRate > 0 ? "+" : ""}
              {Math.round(trends.timeSavedGrowthRate * 100) / 100} min/day
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Forecast Confidence</div>
            <div className="text-lg font-bold">95%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
