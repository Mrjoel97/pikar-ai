import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { 
  Target, 
  TrendingUp, 
  Activity, 
  Zap, 
  Users, 
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface StrategicCommandCenterProps {
  businessId: Id<"businesses"> | undefined;
}

export function StrategicCommandCenter({ businessId }: StrategicCommandCenterProps) {
  const initiatives = useQuery(
    api.strategicInitiatives.listStrategicInitiatives,
    businessId ? { businessId } : undefined
  );

  const resourceAllocation = useQuery(
    api.strategicInitiatives.getResourceAllocation,
    businessId ? { businessId } : undefined
  );

  const strategicKpis = useQuery(
    api.strategicInitiatives.getStrategicKpis,
    businessId ? { businessId, timeRange: "30d" as const } : undefined
  );

  const crossInsights = useQuery(
    api.strategicInitiatives.getCrossInitiativeInsights,
    businessId ? { businessId } : undefined
  );

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    if (trend === "down") return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "paused": return "bg-yellow-500";
      case "completed": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  if (!businessId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Strategic Command Center</CardTitle>
          <CardDescription>Sign in to view strategic initiatives</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Strategic Command Center</h2>
          <p className="text-muted-foreground">
            Global initiatives, resource allocation, and strategic planning
          </p>
        </div>
        <Button>
          <Target className="mr-2 h-4 w-4" />
          New Initiative
        </Button>
      </div>

      {/* Strategic KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${strategicKpis?.revenue.total.toLocaleString() || 0}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(strategicKpis?.revenue.trend || "stable")}
              <span className="ml-1">
                ${strategicKpis?.revenue.average.toFixed(0) || 0}/day avg
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automation Success</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {strategicKpis?.automation.successRate.toFixed(1) || 0}%
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(strategicKpis?.automation.trend || "stable")}
              <span className="ml-1">
                {strategicKpis?.automation.totalRuns || 0} runs
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {strategicKpis?.activity.total || 0}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(strategicKpis?.activity.trend || "stable")}
              <span className="ml-1">
                {strategicKpis?.activity.average.toFixed(0) || 0}/day avg
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Allocation */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Allocation</CardTitle>
          <CardDescription>Current utilization across all initiatives</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Workflows</span>
              <span className="text-muted-foreground">
                {resourceAllocation?.workflows.active || 0} / {resourceAllocation?.workflows.total || 0} active
              </span>
            </div>
            <Progress value={resourceAllocation?.workflows.utilization || 0} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">AI Agents</span>
              <span className="text-muted-foreground">
                {resourceAllocation?.agents.active || 0} / {resourceAllocation?.agents.total || 0} active
              </span>
            </div>
            <Progress value={resourceAllocation?.agents.utilization || 0} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Tasks</span>
              <span className="text-muted-foreground">
                {resourceAllocation?.tasks.completed || 0} completed, {resourceAllocation?.tasks.active || 0} active
              </span>
            </div>
            <Progress value={resourceAllocation?.tasks.completionRate || 0} />
          </div>
        </CardContent>
      </Card>

      {/* Active Initiatives */}
      <Card>
        <CardHeader>
          <CardTitle>Active Initiatives</CardTitle>
          <CardDescription>
            {crossInsights?.summary.active || 0} of {crossInsights?.summary.totalInitiatives || 0} initiatives
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {initiatives && initiatives.length > 0 ? (
              initiatives.map((initiative: any) => (
                <div
                  key={initiative._id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${getStatusColor(initiative.status)}`} />
                      <h4 className="font-medium">{initiative.name || "Untitled Initiative"}</h4>
                      <Badge variant="outline">Phase {initiative.currentPhase || 0}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {initiative.resources?.activeWorkflows || 0} workflows
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {initiative.resources?.activeAgents || 0} agents
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {initiative.resources?.activeTasks || 0} tasks
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    View Details
                  </Button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No active initiatives. Create one to get started.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cross-Initiative Insights */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Initiative Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Completion Rate</span>
                <span className="font-medium">
                  {crossInsights?.summary.completionRate.toFixed(1) || 0}%
                </span>
              </div>
              <Progress value={crossInsights?.summary.completionRate || 0} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{crossInsights?.summary.completed || 0} completed</span>
                <span>{crossInsights?.summary.active || 0} active</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workflow Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Success Rate</span>
                <span className="font-medium">
                  {resourceAllocation?.workflowRuns.successRate.toFixed(1) || 0}%
                </span>
              </div>
              <Progress value={resourceAllocation?.workflowRuns.successRate || 0} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{resourceAllocation?.workflowRuns.succeeded || 0} succeeded</span>
                <span>{resourceAllocation?.workflowRuns.failed || 0} failed</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
