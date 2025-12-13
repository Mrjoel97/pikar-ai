import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, TrendingDown, CheckCircle } from "lucide-react";

interface FunnelStage {
  name: string;
  count: number;
  conversionRate?: number;
  dropoffRate?: number;
}

interface OptimizationSuggestion {
  stage: string;
  severity: "critical" | "high" | "medium" | "low";
  dropoffRate: number;
  suggestion: string;
  action: string;
}

interface FunnelChartProps {
  stages: FunnelStage[];
  optimizationSuggestions?: OptimizationSuggestion[];
}

export function FunnelChart({ stages, optimizationSuggestions }: FunnelChartProps) {
  if (!stages || stages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>No funnel data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const maxCount = stages[0]?.count || 1;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel Visualization</CardTitle>
          <CardDescription>Track user progression through conversion stages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stages.map((stage, idx) => {
            const percentage = (stage.count / maxCount) * 100;
            const conversionFromPrevious = idx > 0 
              ? ((stage.count / stages[idx - 1].count) * 100).toFixed(1)
              : "100.0";

            return (
              <div key={stage.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-semibold">{stage.name}</div>
                    {idx > 0 && (
                      <Badge variant={Number(conversionFromPrevious) >= 50 ? "default" : "destructive"}>
                        {conversionFromPrevious}% conversion
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{stage.count}</div>
                    <div className="text-xs text-muted-foreground">
                      {percentage.toFixed(1)}% of total
                    </div>
                  </div>
                </div>
                <Progress value={percentage} className="h-3" />
                {stage.dropoffRate && stage.dropoffRate > 0 && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <TrendingDown className="h-4 w-4" />
                    <span>{stage.dropoffRate}% drop-off to next stage</span>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {optimizationSuggestions && optimizationSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Optimization Suggestions
            </CardTitle>
            <CardDescription>AI-powered recommendations to improve conversion</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {optimizationSuggestions.map((suggestion, idx) => {
              const Icon = suggestion.severity === "critical" ? AlertTriangle : 
                          suggestion.severity === "high" ? TrendingDown : CheckCircle;
              const colorClass = suggestion.severity === "critical" ? "text-red-500" : 
                                suggestion.severity === "high" ? "text-orange-500" : "text-yellow-500";

              return (
                <div key={idx} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 mt-0.5 ${colorClass}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{suggestion.stage}</h4>
                        <Badge variant={suggestion.severity === "critical" ? "destructive" : "secondary"}>
                          {suggestion.dropoffRate}% drop-off
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{suggestion.suggestion}</p>
                      <div className="bg-blue-50 dark:bg-blue-950 rounded p-2">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          💡 Action: {suggestion.action}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
