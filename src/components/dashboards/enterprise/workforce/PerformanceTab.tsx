import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Award } from "lucide-react";

interface PerformanceTabProps {
  performanceForecasting: any;
}

export function PerformanceTab({ performanceForecasting }: PerformanceTabProps) {
  if (!performanceForecasting) {
    return <div className="text-sm text-muted-foreground">Loading performance forecasting...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceForecasting.avgPerformanceScore || 0}%</div>
            <p className="text-xs text-green-600">+3% from last quarter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Performers</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceForecasting.highPerformers || 0}</div>
            <p className="text-xs text-muted-foreground">Score &gt; 85%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Improvement Needed</CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceForecasting.needsImprovement || 0}</div>
            <p className="text-xs text-orange-600">Score &lt; 60%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>Quarterly performance forecasts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {performanceForecasting.quarterlyForecasts?.map((forecast: any) => (
              <div key={forecast.quarter} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{forecast.quarter}</span>
                    <Badge variant="outline">{forecast.avgScore}% avg</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Projected productivity: {forecast.productivity}%
                  </div>
                </div>
                <Badge
                  variant={
                    forecast.trend === "up"
                      ? "outline"
                      : "default"
                  }
                  className={forecast.trend === "up" ? "border-green-300 text-green-700" : ""}
                >
                  {forecast.trend === "up" ? "↑" : "→"} {forecast.change}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
          <CardDescription>Employees exceeding performance targets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {performanceForecasting.topPerformers?.map((emp: any) => (
              <div key={emp.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{emp.name}</span>
                    <Badge variant="outline">{emp.department}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {emp.achievements?.join(" • ")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">{emp.score}%</div>
                  <div className="text-xs text-muted-foreground">performance</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}