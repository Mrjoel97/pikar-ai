import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, AlertCircle, CheckCircle, BarChart3 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface ABTestingWidgetProps {
  businessId: Id<"businesses">;
}

export function ABTestingWidget({ businessId }: ABTestingWidgetProps) {
  const experiments = useQuery(api.experiments.listExperiments, {
    businessId,
    status: "running",
  });

  const runningExperiment = experiments?.[0];

  const results = useQuery(
    api.experiments.getABTestResults,
    runningExperiment ? { experimentId: runningExperiment._id } : "skip"
  );

  const analysis = useQuery(
    api.experiments.analyzeExperiment,
    runningExperiment ? { experimentId: runningExperiment._id } : "skip"
  );

  const significance = useQuery(
    api.experiments.calculateStatisticalSignificance,
    runningExperiment ? { experimentId: runningExperiment._id } : "skip"
  );

  if (!runningExperiment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            A/B Testing
          </CardTitle>
          <CardDescription>No active experiments</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Create an experiment to start testing variations
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          A/B Testing: {runningExperiment.name}
        </CardTitle>
        <CardDescription>
          {results?.totalSent || 0} emails sent • Winner: {results?.winner || "TBD"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Variant Performance */}
        <div className="space-y-3">
          {results?.results?.map((variant: any) => (
            <div key={variant.variantKey} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Variant {variant.variantKey}</span>
                  {variant.variantKey === results.winner && (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Winner
                    </Badge>
                  )}
                </div>
                <span className="text-sm font-semibold">{variant.conversionRate}%</span>
              </div>
              <Progress value={variant.conversionRate} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{variant.sent} sent</span>
                <span>{variant.converted} converted</span>
              </div>
            </div>
          ))}
        </div>

        {/* Statistical Significance */}
        {significance && (
          <div className="pt-3 border-t space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Statistical Significance</span>
              {significance.overallSignificance ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Significant
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Not Yet
                </Badge>
              )}
            </div>
            {significance.comparisons?.map((comp: any) => (
              <div key={comp.variantKey} className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Variant {comp.variantKey} vs Control</span>
                  <span className={comp.isSignificant ? "text-green-600 font-medium" : ""}>
                    p-value: {comp.pValue.toFixed(4)}
                  </span>
                </div>
                {comp.isSignificant && (
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="h-3 w-3" />
                    <span>{comp.relativeImprovement.toFixed(1)}% improvement</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Analysis Recommendation */}
        {analysis && (
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground">{analysis.recommendation}</p>
          </div>
        )}

        <Button variant="outline" size="sm" className="w-full">
          View Full Analysis
        </Button>
      </CardContent>
    </Card>
  );
}