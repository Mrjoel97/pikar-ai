import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FlaskConical, TrendingUp, AlertCircle, CheckCircle, Target, BarChart3, Zap } from "lucide-react";
import { useNavigate } from "react-router";

interface ABTestingWidgetProps {
  businessId: string;
}

export function ABTestingWidget({ businessId }: ABTestingWidgetProps) {
  const navigate = useNavigate();
  
  const experiments = useQuery(
    api.experiments.listExperiments,
    businessId ? { businessId: businessId as any } : "skip"
  );

  const activeExperiments = experiments?.filter((e: any) => e.status === "running") || [];
  const completedExperiments = experiments?.filter((e: any) => e.status === "completed") || [];

  // Get statistical significance for each active experiment
  const activeExperimentsWithStats = activeExperiments.map((exp: any) => {
    const significance = useQuery(
      api.experiments.calculateStatisticalSignificance,
      exp ? { experimentId: exp._id } : "skip"
    );
    const results = useQuery(
      api.experiments.calculateResults,
      exp ? { experimentId: exp._id } : "skip"
    );
    return { experiment: exp, significance, results };
  });

  if (!experiments) {
    return (
      <Card className="neu-raised">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            A/B Testing Platform
          </CardTitle>
          <CardDescription>Loading experiments...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Calculate win rate
  const decisiveResults = completedExperiments.filter((e: any) => e.winnerVariantId).length;
  const winRate = completedExperiments.length > 0 
    ? Math.round((decisiveResults / completedExperiments.length) * 100) 
    : 0;

  return (
    <Card className="neu-raised">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              A/B Testing Platform
            </CardTitle>
            <CardDescription>Advanced experiment tracking with statistical analysis</CardDescription>
          </div>
          <Button size="sm" onClick={() => navigate("/analytics")}>
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enhanced Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FlaskConical className="h-3 w-3" />
              Total Tests
            </div>
            <div className="text-xl font-bold">{experiments.length}</div>
            <Progress value={(completedExperiments.length / Math.max(experiments.length, 1)) * 100} className="h-1" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="h-3 w-3" />
              Active
            </div>
            <div className="text-xl font-bold text-blue-600">{activeExperiments.length}</div>
            <p className="text-xs text-muted-foreground">Running now</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3" />
              Completed
            </div>
            <div className="text-xl font-bold text-green-600">{completedExperiments.length}</div>
            <p className="text-xs text-muted-foreground">
              {experiments.length > 0 ? Math.round((completedExperiments.length / experiments.length) * 100) : 0}% rate
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              Win Rate
            </div>
            <div className="text-xl font-bold text-purple-600">{winRate}%</div>
            <p className="text-xs text-muted-foreground">{decisiveResults} decisive</p>
          </div>
        </div>

        {/* Active Experiments with Statistical Significance */}
        {activeExperimentsWithStats.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Active Experiments with Statistical Analysis
            </h4>
            {activeExperimentsWithStats.map(({ experiment, significance, results }: any) => (
              <div key={experiment._id} className="space-y-2 p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{experiment.name}</p>
                  <Badge variant="secondary" className="text-xs">
                    {experiment.goal}
                  </Badge>
                </div>
                
                {results && results.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {results.slice(0, 2).map((variant: any, idx: number) => (
                      <div key={variant.variantId} className="space-y-1 p-2 rounded bg-muted/50">
                        <div className="text-muted-foreground font-semibold">{variant.name}</div>
                        <div className="font-bold text-lg">
                          {Math.round(variant.conversionRate)}%
                        </div>
                        <div className="text-muted-foreground">
                          {variant.metrics.converted} / {variant.metrics.sent}
                        </div>
                        <Progress value={variant.conversionRate} className="h-1" />
                      </div>
                    ))}
                  </div>
                )}

                {significance && (
                  <div className="rounded-lg bg-muted/50 p-2 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Statistical Significance</span>
                      <Badge variant={significance.overallSignificance ? "default" : "outline"}>
                        {significance.overallSignificance ? "Significant" : "Collecting data"}
                      </Badge>
                    </div>
                    {significance.comparisons && significance.comparisons.length > 0 && (
                      <div className="space-y-1">
                        {significance.comparisons.map((comp: any) => (
                          <div key={comp.variantId} className="text-xs">
                            <div className="flex items-center justify-between">
                              <span>{comp.name} vs Control</span>
                              <span className={comp.isSignificant ? "text-green-600 font-semibold" : "text-muted-foreground"}>
                                {comp.isSignificant ? "✓" : "..."} p={comp.pValue.toFixed(4)}
                              </span>
                            </div>
                            {comp.isSignificant && (
                              <div className="text-green-600 font-semibold">
                                {comp.relativeImprovement > 0 ? "+" : ""}{comp.relativeImprovement.toFixed(1)}% improvement
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Sample size progress */}
                {experiment.configuration && (
                  <div className="text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-muted-foreground">Sample Size Progress</span>
                      <span className="font-semibold">
                        {results && results[0] ? results[0].metrics.sent : 0} / {experiment.configuration.minimumSampleSize}
                      </span>
                    </div>
                    <Progress 
                      value={results && results[0] ? (results[0].metrics.sent / experiment.configuration.minimumSampleSize) * 100 : 0} 
                      className="h-1" 
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Recent Completed Tests with Winners */}
        {completedExperiments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Recent Completed Tests</h4>
            {completedExperiments.slice(0, 3).map((exp: any) => (
              <div key={exp._id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{exp.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {exp.completedAt && new Date(exp.completedAt).toLocaleDateString()}
                  </p>
                </div>
                {exp.winnerVariantId ? (
                  <Badge variant="default" className="text-xs">
                    Winner Declared
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Inconclusive
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}

        {experiments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No experiments yet</p>
            <Button size="sm" className="mt-3" onClick={() => navigate("/analytics")}>
              Create Experiment
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}