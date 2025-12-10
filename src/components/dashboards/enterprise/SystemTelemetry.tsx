import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SystemOverview } from "./telemetry/SystemOverview";
import { AgentsTab } from "./telemetry/AgentsTab";
import { PerformanceTab } from "./telemetry/PerformanceTab";
import { AlertsTab } from "./telemetry/AlertsTab";

interface SystemTelemetryProps {
  agents: Array<any>;
  demoData: any;
  businessId?: Id<"businesses"> | null;
}

export default function SystemTelemetry({ agents, demoData, businessId }: SystemTelemetryProps) {
  const upgradeNudges = useQuery(
    api.telemetry.getUpgradeNudges,
    businessId ? { businessId } : "skip"
  );

  const teamPerformance = useQuery(
    api.telemetry.getTeamPerformanceMetrics,
    businessId ? { businessId, days: 7 } : "skip"
  );

  const predictiveAlerts = useQuery(
    api.telemetry.getPredictiveAlerts,
    businessId ? { businessId } : "skip"
  );

  const advancedHealth = useQuery(
    api.telemetry.getAdvancedHealthMetrics,
    businessId ? { businessId } : "skip"
  );

  const performanceData = Array.from({ length: 12 }, (_, i) => ({
    time: `${i * 2}h`,
    cpu: 45 + Math.random() * 20,
    memory: 60 + Math.random() * 15,
    requests: 1000 + Math.random() * 500,
    responseTime: 100 + Math.random() * 100,
  }));

  const systemMetrics = {
    cpu: 62,
    memory: 71,
    storage: 45,
    network: 89,
    activeProcesses: upgradeNudges?.snapshot?.workflowsCount || 247,
    queuedJobs: 12,
    avgResponseTime: 145,
    throughput: 1247,
  };

  const criticalAlerts = (demoData?.notifications || [])
    .filter((n: any) => n.type === 'urgent' || n.type === 'warning')
    .slice(0, 5);

  const healthScore = Math.round(
    ((100 - systemMetrics.cpu) * 0.3 +
    (100 - systemMetrics.memory) * 0.3 +
    (100 - systemMetrics.storage) * 0.2 +
    (systemMetrics.network) * 0.2)
  );

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            System Telemetry
            <Badge variant="outline" className={`gap-1 ${getHealthColor(healthScore)}`}>
              Health: {healthScore}%
            </Badge>
          </h2>
          <p className="text-sm text-muted-foreground">Real-time system performance monitoring</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Activity className="h-3 w-3 animate-pulse" />
          Live
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">AI Agents</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {advancedHealth && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Advanced Health Metrics</CardTitle>
              </CardHeader>
              <div className="px-6 pb-4">
                <div className="space-y-3">
                  {advancedHealth.metrics.map((metric: any) => (
                    <div key={metric.name} className="flex items-center justify-between">
                      <span className="text-sm">{metric.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{metric.value}%</span>
                        <Badge variant={metric.status === "healthy" ? "default" : "destructive"}>
                          {metric.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                {advancedHealth.recommendations.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-xs font-semibold mb-2">Recommendations:</div>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {advancedHealth.recommendations.map((rec: string, idx: number) => (
                        <li key={idx}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          )}

          <SystemOverview systemMetrics={systemMetrics} teamPerformance={teamPerformance} />
        </TabsContent>

        <TabsContent value="agents" className="space-y-3">
          <AgentsTab agents={agents} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <PerformanceTab performanceData={performanceData} />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-3">
          <AlertsTab 
            predictiveAlerts={predictiveAlerts}
            upgradeNudges={upgradeNudges}
            criticalAlerts={criticalAlerts}
          />
        </TabsContent>
      </Tabs>
    </section>
  );
}