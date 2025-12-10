import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Activity, Cpu, Database, HardDrive, Zap, TrendingUp, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface SystemTelemetryProps {
  agents: Array<any>;
  demoData: any;
}

export default function SystemTelemetry({ agents, demoData }: SystemTelemetryProps) {
  // Generate mock performance data
  const performanceData = Array.from({ length: 12 }, (_, i) => ({
    time: `${i * 2}h`,
    cpu: 45 + Math.random() * 20,
    memory: 60 + Math.random() * 15,
    requests: 1000 + Math.random() * 500,
  }));

  const systemMetrics = {
    cpu: 62,
    memory: 71,
    storage: 45,
    network: 89,
    activeProcesses: 247,
    queuedJobs: 12,
    avgResponseTime: 145,
    throughput: 1247,
  };

  const criticalAlerts = (demoData?.notifications || [])
    .filter((n: any) => n.type === 'urgent' || n.type === 'warning')
    .slice(0, 5);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">System Telemetry</h2>
          <p className="text-sm text-muted-foreground">Real-time system performance monitoring</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Activity className="h-3 w-3" />
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-muted-foreground">CPU Usage</span>
                </div>
                <div className="text-2xl font-bold">{systemMetrics.cpu}%</div>
                <Progress value={systemMetrics.cpu} className="h-1 mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-purple-600" />
                  <span className="text-xs text-muted-foreground">Memory</span>
                </div>
                <div className="text-2xl font-bold">{systemMetrics.memory}%</div>
                <Progress value={systemMetrics.memory} className="h-1 mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-muted-foreground">Storage</span>
                </div>
                <div className="text-2xl font-bold">{systemMetrics.storage}%</div>
                <Progress value={systemMetrics.storage} className="h-1 mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-amber-600" />
                  <span className="text-xs text-muted-foreground">Network</span>
                </div>
                <div className="text-2xl font-bold">{systemMetrics.network}%</div>
                <Progress value={systemMetrics.network} className="h-1 mt-2" />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">System Load</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Processes</span>
                  <span className="text-sm font-bold">{systemMetrics.activeProcesses}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Queued Jobs</span>
                  <span className="text-sm font-bold">{systemMetrics.queuedJobs}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Response Time</span>
                  <span className="text-sm font-bold">{systemMetrics.avgResponseTime}ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Throughput</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold">{systemMetrics.throughput}/min</span>
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Resource Allocation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "AI Agents", value: 35, color: "bg-blue-500" },
                  { name: "Workflows", value: 28, color: "bg-purple-500" },
                  { name: "Analytics", value: 22, color: "bg-green-500" },
                  { name: "Storage", value: 15, color: "bg-amber-500" },
                ].map((resource) => (
                  <div key={resource.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{resource.name}</span>
                      <span className="text-muted-foreground">{resource.value}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${resource.color}`}
                        style={{ width: `${resource.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Active AI Agents</CardTitle>
              <CardDescription>Real-time agent performance monitoring</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {agents.slice(0, 6).map((agent: any, idx: number) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      agent.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                    }`} />
                    <div>
                      <span className="text-sm font-medium">{agent.name}</span>
                      <div className="text-xs text-muted-foreground">
                        {agent.tasksCompleted || 0} tasks completed
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-bold">{agent.efficiency}%</div>
                      <div className="text-xs text-muted-foreground">efficiency</div>
                    </div>
                    <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                      {agent.status}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Performance Trends (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} name="CPU %" />
                    <Line type="monotone" dataKey="memory" stroke="#8b5cf6" strokeWidth={2} name="Memory %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Request Throughput</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="requests" stroke="#10b981" strokeWidth={2} name="Requests" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Critical Alerts</CardTitle>
              <CardDescription>System warnings and notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {criticalAlerts.length > 0 ? (
                criticalAlerts.map((notification: any) => (
                  <div key={notification.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-1 ${
                      notification.type === 'urgent' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{notification.message}</span>
                        <Badge variant={notification.type === 'urgent' ? 'destructive' : 'secondary'}>
                          {notification.type}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(notification.timestamp || Date.now()).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No critical alerts. All systems operational.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}