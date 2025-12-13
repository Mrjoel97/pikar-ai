import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  CheckCircle2,
  DollarSign,
  Zap,
  Target,
  Brain
} from "lucide-react";

interface ExecutiveAgentInsightsProps {
  businessId: Id<"businesses"> | undefined;
}

export function ExecutiveAgentInsights({ businessId }: ExecutiveAgentInsightsProps) {
  const predictiveInsights = useQuery(
    api.agentPerformance.getPredictiveAgentInsights,
    businessId ? { businessId } : "skip"
  );

  const costOptimization = useQuery(
    api.agentPerformance.getAgentCostOptimization,
    businessId ? { businessId } : "skip"
  );

  const getTrendIcon = (trend: string) => {
    if (trend === "improving") return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === "declining") return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case "high":
        return <Badge variant="destructive">High Risk</Badge>;
      case "medium":
        return <Badge className="bg-amber-100 text-amber-700 border-amber-300">Medium Risk</Badge>;
      case "low":
        return <Badge className="bg-green-100 text-green-700 border-green-300">Low Risk</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (!businessId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Executive Agent Insights</CardTitle>
          <CardDescription>Sign in to view agent performance analytics</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Executive Agent Insights
          </h2>
          <p className="text-muted-foreground">
            AI-powered performance predictions and cost optimization
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {predictiveInsights?.summary.totalAgents || 0}
            </div>
            <p className="text-xs text-muted-foreground">Active AI agents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {predictiveInsights?.summary.avgPerformance.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">Success rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${costOptimization?.totalCurrentCost.toFixed(2) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Current spend</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${costOptimization?.totalPotentialSavings.toFixed(2) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Optimization opportunity</p>
          </CardContent>
        </Card>
      </div>

      {/* High Risk Agents Alert */}
      {predictiveInsights && predictiveInsights.summary.highRiskAgents > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900">
                  {predictiveInsights.summary.highRiskAgents} agent{predictiveInsights.summary.highRiskAgents > 1 ? 's' : ''} require immediate attention
                </p>
                <p className="text-sm text-amber-700">
                  Review performance metrics and implement recommended actions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance Predictions</TabsTrigger>
          <TabsTrigger value="cost">Cost Optimization</TabsTrigger>
          <TabsTrigger value="predictive">Predictive Analytics</TabsTrigger>
          <TabsTrigger value="forecasting">Cost Forecasting</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance Predictions</CardTitle>
              <CardDescription>
                AI-powered forecasts based on historical execution data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictiveInsights?.predictions.map((prediction: any) => (
                  <div
                    key={prediction.agentId}
                    className="flex flex-col gap-3 p-4 border rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{prediction.agentName}</h4>
                          {getRiskBadge(prediction.riskLevel)}
                          {getTrendIcon(prediction.trend)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {prediction.executionCount} executions analyzed
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Current Performance
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={prediction.currentPerformance} className="flex-1" />
                          <span className="text-sm font-medium">
                            {prediction.currentPerformance.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Predicted Performance
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={prediction.predictedPerformance} className="flex-1" />
                          <span className="text-sm font-medium">
                            {prediction.predictedPerformance.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {prediction.recommendedActions.length > 0 && (
                      <div className="pt-3 border-t">
                        <div className="text-xs font-medium mb-2 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Recommended Actions
                        </div>
                        <ul className="space-y-1">
                          {prediction.recommendedActions.map((action: string, idx: number) => (
                            <li key={idx} className="text-xs text-muted-foreground pl-4">
                              • {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cost" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Optimization Opportunities</CardTitle>
              <CardDescription>
                Identify and reduce unnecessary agent execution costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {costOptimization?.recommendations.map((rec: any) => (
                  <div
                    key={rec.agentId}
                    className="flex flex-col gap-3 p-4 border rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{rec.agentName}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Current: ${rec.currentCost.toFixed(2)}/mo</span>
                          {rec.estimatedSavings > 0 && (
                            <span className="text-green-600 font-medium">
                              Save ${rec.estimatedSavings.toFixed(2)}/mo
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant={
                          rec.optimizationPotential === "high"
                            ? "destructive"
                            : rec.optimizationPotential === "medium"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {rec.optimizationPotential} potential
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Avg Execution Time:</span>
                        <span className="ml-2 font-medium">
                          {(rec.avgExecutionTime / 1000).toFixed(2)}s
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Optimization:</span>
                        <span className="ml-2 font-medium">
                          {((rec.estimatedSavings / rec.currentCost) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {rec.recommendations.length > 0 && (
                      <div className="pt-3 border-t">
                        <div className="text-xs font-medium mb-2 flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Cost Reduction Strategies
                        </div>
                        <ul className="space-y-1">
                          {rec.recommendations.map((action: string, idx: number) => (
                            <li key={idx} className="text-xs text-muted-foreground pl-4">
                              • {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ML-Based Predictive Performance</CardTitle>
              <CardDescription>
                Advanced machine learning predictions for agent performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Loading predictive analytics...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Forecasting & ROI</CardTitle>
              <CardDescription>
                30/60/90 day cost forecasts and ROI projections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Loading cost forecasting...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}