import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, AlertTriangle, Target, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { Id } from "@/convex/_generated/dataModel";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface KpiDashboardProps {
  businessId: Id<"businesses">;
  department: string;
}

export function KpiDashboard({ businessId, department }: KpiDashboardProps) {
  const currentKpis = useQuery(api.departmentKpis.tracking.getCurrentKpis, {
    businessId,
    department,
  });

  const alerts = useQuery(api.departmentKpis.alerts.getAlerts, {
    businessId,
    department,
    status: "active",
  });

  const kpiTrends = useQuery(api.departmentKpis.tracking.getKpiTrends, {
    businessId,
    department,
    days: 30,
  });

  if (currentKpis === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{department} KPIs</h2>
          <p className="text-sm text-muted-foreground">
            Real-time performance metrics and targets
          </p>
        </div>
        {alerts && alerts.length > 0 && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {alerts.length} Active Alerts
          </Badge>
        )}
      </div>

      <Tabs defaultValue="current" className="w-full">
        <TabsList>
          <TabsTrigger value="current">Current Metrics</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currentKpis?.map((kpi: any, index: number) => (
              <motion.div
                key={kpi._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{kpi.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {new Date(kpi.timestamp).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline justify-between">
                      <div className="text-2xl font-bold">
                        {kpi.value.toLocaleString()} {kpi.unit}
                      </div>
                      <div
                        className={`flex items-center gap-1 text-sm ${
                          kpi.trend >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {kpi.trend >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {Math.abs(kpi.trend).toFixed(1)}%
                      </div>
                    </div>
                    {kpi.target && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Target className="h-3 w-3" />
                        Target: {kpi.target} {kpi.unit}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {currentKpis?.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  No KPIs tracked yet for this department
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {kpiTrends && kpiTrends.length > 0 ? (
            <div className="grid gap-4">
              {Object.entries(
                kpiTrends.reduce((acc: any, item: any) => {
                  if (!acc[item.name]) acc[item.name] = [];
                  acc[item.name].push(item);
                  return acc;
                }, {})
              ).map(([name, data]: [string, any]) => (
                <Card key={name}>
                  <CardHeader>
                    <CardTitle className="text-base">{name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="timestamp"
                            tickFormatter={(value) => {
                              const date = new Date(value);
                              return `${date.getMonth() + 1}/${date.getDate()}`;
                            }}
                          />
                          <YAxis />
                          <Tooltip
                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                          />
                          <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  No trend data available yet
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {alerts && alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert: any) => (
                <Card key={alert._id} className="border-red-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          {alert.kpiName}
                        </CardTitle>
                        <CardDescription>{alert.message}</CardDescription>
                      </div>
                      <Badge variant="destructive">{alert.severity}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Current:</span>
                        <span className="font-medium">{alert.currentValue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Threshold:</span>
                        <span className="font-medium">{alert.threshold}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Triggered:</span>
                        <span className="font-medium">
                          {new Date(alert.triggeredAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-green-600 mb-4" />
                <p className="text-sm text-muted-foreground">
                  All KPIs within target range
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}