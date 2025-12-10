import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, XCircle, Clock, RefreshCw, TrendingUp, Activity, Zap, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface Integration {
  name: string;
  status: "active" | "warning" | "error" | "syncing";
  icon: any;
  color: string;
  uptime: number;
  lastSync?: string;
  apiCalls?: number;
  latency?: number;
  errorRate?: number;
}

interface IntegrationStatusProps {
  businessId?: Id<"businesses"> | null;
}

export default function IntegrationStatus({ businessId }: IntegrationStatusProps) {
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch real warehouse analytics if available
  const warehouseAnalytics = useQuery(
    api.dataWarehouse.getWarehouseAnalytics,
    businessId ? { businessId, timeRange: "7d" } : "skip"
  );

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  // Enhanced integrations with real data when available
  const integrations: Integration[] = [
    { 
      name: "CRM Sync", 
      status: "active", 
      icon: CheckCircle, 
      color: "text-green-600",
      uptime: 99.8,
      lastSync: "2 minutes ago",
      apiCalls: 1247,
      latency: 145,
      errorRate: 0.2
    },
    { 
      name: "Email Service", 
      status: "active", 
      icon: CheckCircle, 
      color: "text-green-600",
      uptime: 99.9,
      lastSync: "1 minute ago",
      apiCalls: 3421,
      latency: 89,
      errorRate: 0.1
    },
    { 
      name: "Analytics", 
      status: "warning", 
      icon: AlertCircle, 
      color: "text-amber-600",
      uptime: 98.5,
      lastSync: "15 minutes ago",
      apiCalls: 892,
      latency: 320,
      errorRate: 1.5
    },
    { 
      name: "Data Warehouse", 
      status: warehouseAnalytics?.sources.error ? "error" : "active", 
      icon: warehouseAnalytics?.sources.error ? AlertCircle : CheckCircle, 
      color: warehouseAnalytics?.sources.error ? "text-red-600" : "text-green-600",
      uptime: warehouseAnalytics ? (warehouseAnalytics.sources.connected / warehouseAnalytics.sources.total) * 100 : 99.7,
      lastSync: "5 minutes ago",
      apiCalls: warehouseAnalytics?.jobs.total || 567,
      latency: 210,
      errorRate: warehouseAnalytics ? (100 - warehouseAnalytics.jobs.successRate) : 0.3
    },
    { 
      name: "Payment Gateway", 
      status: "active", 
      icon: CheckCircle, 
      color: "text-green-600",
      uptime: 99.95,
      lastSync: "30 seconds ago",
      apiCalls: 234,
      latency: 95,
      errorRate: 0.05
    },
    { 
      name: "Social Media APIs", 
      status: "syncing", 
      icon: RefreshCw, 
      color: "text-blue-600",
      uptime: 99.6,
      lastSync: "syncing...",
      apiCalls: 1876,
      latency: 178,
      errorRate: 0.4
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700 border-green-300">Active</Badge>;
      case "warning":
        return <Badge className="bg-amber-100 text-amber-700 border-amber-300">Warning</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "syncing":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300">Syncing</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const overallHealth = integrations.filter(i => i.status === "active").length / integrations.length * 100;
  const avgUptime = integrations.reduce((sum, i) => sum + i.uptime, 0) / integrations.length;
  const totalApiCalls = integrations.reduce((sum, i) => sum + (i.apiCalls || 0), 0);
  const avgLatency = integrations.reduce((sum, i) => sum + (i.latency || 0), 0) / integrations.length;
  const criticalIssues = integrations.filter(i => i.status === "error").length;
  const warnings = integrations.filter(i => i.status === "warning").length;

  return (
    <Card className="xl:col-span-1">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Integration Status
              {criticalIssues > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {criticalIssues}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Real-time monitoring of all integrations</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="health">Health</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-3 mt-4">
            {integrations.map((integration, idx) => {
              const Icon = integration.icon;
              return (
                <motion.div
                  key={integration.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedIntegration(integration.name)}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${integration.color} ${integration.status === 'syncing' ? 'animate-spin' : ''}`} />
                    <div>
                      <span className="text-sm font-medium">{integration.name}</span>
                      <div className="text-xs text-muted-foreground">{integration.lastSync}</div>
                    </div>
                  </div>
                  {getStatusBadge(integration.status)}
                </motion.div>
              );
            })}
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-3 w-3 text-blue-600" />
                    <span className="text-xs text-muted-foreground">API Calls</span>
                  </div>
                  <div className="text-xl font-bold">{totalApiCalls.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Last hour</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-3 w-3 text-amber-600" />
                    <span className="text-xs text-muted-foreground">Avg Latency</span>
                  </div>
                  <div className="text-xl font-bold">{Math.round(avgLatency)}ms</div>
                  <div className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    12% faster
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              {integrations.map((integration) => (
                <div key={integration.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{integration.name}</span>
                    <span className="text-muted-foreground">{integration.apiCalls} calls</span>
                  </div>
                  <Progress value={(integration.apiCalls || 0) / totalApiCalls * 100} className="h-1" />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="health" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Health</span>
                  <span className="text-sm font-bold">{overallHealth.toFixed(1)}%</span>
                </div>
                <Progress value={overallHealth} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Average Uptime</span>
                  <span className="text-sm font-bold">{avgUptime.toFixed(2)}%</span>
                </div>
                <Progress value={avgUptime} className="h-2" />
              </div>

              <div className="pt-2 border-t">
                <div className="text-xs font-medium mb-2">Integration Uptime</div>
                {integrations.map((integration) => (
                  <div key={integration.name} className="flex items-center justify-between py-1">
                    <span className="text-xs">{integration.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{integration.uptime}%</span>
                      <div className={`w-2 h-2 rounded-full ${
                        integration.uptime >= 99.5 ? 'bg-green-500' : 
                        integration.uptime >= 98 ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Real-time alerts */}
              {(criticalIssues > 0 || warnings > 0) && (
                <div className="pt-2 border-t">
                  <div className="text-xs font-medium mb-2">Active Alerts</div>
                  {criticalIssues > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                      <AlertTriangle className="h-3 w-3 text-red-600" />
                      <span className="text-red-700">{criticalIssues} critical issue{criticalIssues > 1 ? 's' : ''} require immediate attention</span>
                    </div>
                  )}
                  {warnings > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs mt-2">
                      <AlertCircle className="h-3 w-3 text-amber-600" />
                      <span className="text-amber-700">{warnings} warning{warnings > 1 ? 's' : ''} detected</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}