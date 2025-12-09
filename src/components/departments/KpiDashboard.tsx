import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle, Target } from "lucide-react";
import { motion } from "framer-motion";
import { Id } from "@/convex/_generated/dataModel";

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
    </div>
  );
}