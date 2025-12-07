import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Target, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Id } from "@/convex/_generated/dataModel";

interface KpiData {
  name: string;
  value: number;
  unit: string;
  trend: number;
}

interface DashboardData {
  totalKpis: number;
  lastUpdated: number;
  kpis: KpiData[];
}

interface TargetComparison {
  kpiName: string;
  targetValue: number;
  actualValue: number;
  unit: string;
  variance: number;
  status: "on-track" | "at-risk" | "off-track";
}

export function KpiDashboard({ businessId, department }: { businessId: string; department: string }) {
  const dashboard = useQuery(api.departmentKpis.tracking.getDepartmentDashboard, {
    businessId: businessId as Id<"businesses">,
    department,
  });

  const comparison = useQuery(api.departmentKpis.targets.getTargetComparison, {
    businessId: businessId as Id<"businesses">,
    department,
  });

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center py-12">
        <Activity className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{department} KPIs</h2>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date(dashboard.lastUpdated).toLocaleString()}
          </p>
        </div>
        <Badge variant="outline">{dashboard.totalKpis} KPIs tracked</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dashboard.kpis.map((kpi: KpiData) => {
          const trendIcon = kpi.trend > 0 ? TrendingUp : kpi.trend < 0 ? TrendingDown : Minus;
          const trendColor = kpi.trend > 0 ? "text-green-600" : kpi.trend < 0 ? "text-red-600" : "text-gray-600";
          const TrendIcon = trendIcon;

          return (
            <Card key={kpi.name}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">{kpi.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {kpi.value.toLocaleString()} {kpi.unit}
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
                      <TrendIcon className="h-4 w-4" />
                      <span>{Math.abs(kpi.trend).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {comparison && comparison.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Target vs Actual</CardTitle>
            <CardDescription>Performance against set targets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {comparison.map((item: TargetComparison) => (
                <div key={item.kpiName} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.kpiName}</span>
                    <Badge
                      variant={
                        item.status === "on-track"
                          ? "default"
                          : item.status === "at-risk"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Target: </span>
                      <span className="font-medium">
                        {item.targetValue.toLocaleString()} {item.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Actual: </span>
                      <span className="font-medium">
                        {item.actualValue.toLocaleString()} {item.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Variance: </span>
                      <span className={item.variance >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                        {item.variance > 0 ? "+" : ""}{item.variance.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}