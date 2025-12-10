import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Cpu, Database, HardDrive, Zap, TrendingUp, TrendingDown } from "lucide-react";

interface SystemOverviewProps {
  systemMetrics: {
    cpu: number;
    memory: number;
    storage: number;
    network: number;
    activeProcesses: number;
    queuedJobs: number;
    avgResponseTime: number;
    throughput: number;
  };
  teamPerformance?: any;
}

export function SystemOverview({ systemMetrics, teamPerformance }: SystemOverviewProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">CPU Usage</span>
            </div>
            <div className="text-2xl font-bold">{systemMetrics.cpu}%</div>
            <Progress value={systemMetrics.cpu} className="h-1 mt-2" />
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {systemMetrics.cpu > 70 ? (
                <><TrendingUp className="h-3 w-3 text-red-500" /> High load</>
              ) : (
                <><TrendingDown className="h-3 w-3 text-green-500" /> Normal</>
              )}
            </div>
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
            <div className="text-xs text-muted-foreground mt-1">
              {(systemMetrics.memory * 16 / 100).toFixed(1)} GB / 16 GB
            </div>
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
            <div className="text-xs text-muted-foreground mt-1">
              {(systemMetrics.storage * 500 / 100).toFixed(0)} GB / 500 GB
            </div>
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
            <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Optimal
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-base font-semibold mb-3">System Load</div>
            <div className="space-y-3">
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-base font-semibold mb-3">Resource Allocation</div>
            <div className="space-y-3">
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
            </div>
          </CardContent>
        </Card>
      </div>

      {teamPerformance && teamPerformance.teamMembers.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="text-base font-semibold mb-3">Team Activity (Last 7 Days)</div>
            <div className="space-y-2">
              {teamPerformance.teamMembers.slice(0, 5).map((member: any) => (
                <div key={member.userId} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm font-medium">{member.userName}</span>
                  <div className="flex items-center gap-4 text-xs">
                    <span>{member.contributions} contributions</span>
                    <span className="px-2 py-1 bg-muted rounded">{member.workflowRuns} runs</span>
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
