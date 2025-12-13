import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lightbulb, Zap, GitBranch, TrendingUp, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";

interface WorkflowOptimizerProps {
  businessId: Id<"businesses">;
}

export function WorkflowOptimizer({ businessId }: WorkflowOptimizerProps) {
  const suggestions = useQuery(api.workflows.crossDepartment.getOptimizationSuggestions, { businessId });
  const parallelization = useQuery(api.workflows.optimization.getParallelizationOpportunities, { businessId });
  const automation = useQuery(api.workflows.optimization.getAutomationCandidates, { businessId });
  const [selectedWorkflow, setSelectedWorkflow] = useState<Id<"workflows"> | null>(null);

  const simulateChange = useQuery(
    api.workflows.optimization.simulateWorkflowChange,
    selectedWorkflow
      ? {
          workflowId: selectedWorkflow,
          changes: { parallelizeSteps: [0, 1], addAutomation: true },
        }
      : "skip"
  );

  if (!suggestions || !parallelization || !automation) {
    return <div>Loading optimization suggestions...</div>;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "automation":
        return <Zap className="w-4 h-4" />;
      case "bottleneck":
        return <Clock className="w-4 h-4" />;
      case "parallelization":
        return <GitBranch className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            Workflow Optimization Suggestions
          </CardTitle>
          <CardDescription>AI-powered recommendations to improve workflow efficiency</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All ({suggestions.length})</TabsTrigger>
              <TabsTrigger value="high">
                High Priority ({suggestions.filter((s: any) => s.priority === "high").length})
              </TabsTrigger>
              <TabsTrigger value="automation">
                Automation ({suggestions.filter((s: any) => s.type === "automation").length})
              </TabsTrigger>
              <TabsTrigger value="bottleneck">
                Bottlenecks ({suggestions.filter((s: any) => s.type === "bottleneck").length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3 mt-4">
              {suggestions.map((suggestion: any, i: number) => (
                <div key={i} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">{getTypeIcon(suggestion.type)}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{suggestion.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{suggestion.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={getPriorityColor(suggestion.priority)}>{suggestion.priority}</Badge>
                          <Badge variant="outline" className="gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {suggestion.impact}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Apply
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="high" className="space-y-3 mt-4">
              {suggestions
                .filter((s: any) => s.priority === "high")
                .map((suggestion: any, i: number) => (
                  <div key={i} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">{getTypeIcon(suggestion.type)}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{suggestion.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{suggestion.description}</p>
                          <Badge variant="outline" className="gap-1 mt-2">
                            <TrendingUp className="w-3 h-3" />
                            {suggestion.impact}
                          </Badge>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Apply
                      </Button>
                    </div>
                  </div>
                ))}
            </TabsContent>

            <TabsContent value="automation" className="space-y-3 mt-4">
              {suggestions
                .filter((s: any) => s.type === "automation")
                .map((suggestion: any, i: number) => (
                  <div key={i} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Zap className="w-4 h-4 mt-1" />
                        <div className="flex-1">
                          <h4 className="font-semibold">{suggestion.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{suggestion.description}</p>
                          <Badge variant="outline" className="gap-1 mt-2">
                            <TrendingUp className="w-3 h-3" />
                            {suggestion.impact}
                          </Badge>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Apply
                      </Button>
                    </div>
                  </div>
                ))}
            </TabsContent>

            <TabsContent value="bottleneck" className="space-y-3 mt-4">
              {suggestions
                .filter((s: any) => s.type === "bottleneck")
                .map((suggestion: any, i: number) => (
                  <div key={i} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Clock className="w-4 h-4 mt-1" />
                        <div className="flex-1">
                          <h4 className="font-semibold">{suggestion.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{suggestion.description}</p>
                          <Badge variant="outline" className="gap-1 mt-2">
                            <TrendingUp className="w-3 h-3" />
                            {suggestion.impact}
                          </Badge>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Apply
                      </Button>
                    </div>
                  </div>
                ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Parallelization Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Parallelization Opportunities
          </CardTitle>
          <CardDescription>Workflows that can benefit from parallel execution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {parallelization.map((opp: any, i: number) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{opp.workflowName}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {opp.parallelizableSteps} steps can be parallelized
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={getPriorityColor(opp.priority)}>{opp.priority}</Badge>
                      <Badge variant="outline" className="gap-1">
                        <Clock className="w-3 h-3" />
                        Save ~{Math.round(opp.estimatedTimeReduction / 1000)}s
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedWorkflow(opp.workflowId)}
                  >
                    Simulate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Automation Candidates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Automation Candidates
          </CardTitle>
          <CardDescription>Workflows with high automation potential</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {automation.map((candidate: any, i: number) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold">{candidate.workflowName}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {candidate.manualSteps} of {candidate.totalSteps} steps are manual
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{Math.round(candidate.automationScore)}%</div>
                    <p className="text-xs text-muted-foreground">Automation Score</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={getPriorityColor(candidate.priority)}>{candidate.priority}</Badge>
                  <Badge variant="outline" className="gap-1">
                    <DollarSign className="w-3 h-3" />
                    Save ${candidate.estimatedSavings}/month
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Suggestions:</p>
                  {candidate.suggestions.map((suggestion: string, j: number) => (
                    <p key={j} className="text-xs text-muted-foreground pl-2">
                      • {suggestion}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Simulation Results */}
      {simulateChange && (
        <Card>
          <CardHeader>
            <CardTitle>Simulation Results</CardTitle>
            <CardDescription>Projected impact of optimization changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Current State</h4>
                <div className="space-y-1 text-sm">
                  <p>Duration: {Math.round(simulateChange.current.duration / 1000)}s</p>
                  <p>Cost: ${simulateChange.current.cost}</p>
                  <p>Steps: {simulateChange.current.steps}</p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Projected State</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-green-600">
                    Duration: {Math.round(simulateChange.projected.duration / 1000)}s
                  </p>
                  <p className="text-green-600">Cost: ${simulateChange.projected.cost}</p>
                  <p>Steps: {simulateChange.projected.steps}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                Improvement: {simulateChange.improvement.durationReduction.toFixed(1)}% faster,{" "}
                {simulateChange.improvement.costReduction.toFixed(1)}% cheaper
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
