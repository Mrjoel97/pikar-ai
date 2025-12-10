import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, TrendingUp, Brain, Target } from "lucide-react";
import { useState } from "react";

interface RiskHeatmapProps {
  businessId: Id<"businesses">;
}

export function RiskHeatmap({ businessId }: RiskHeatmapProps) {
  const [selectedView, setSelectedView] = useState<"matrix" | "trends" | "predictions" | "correlations">("matrix");
  
  const riskMatrix = useQuery(api.riskAnalytics.getRiskMatrix, { businessId });
  const riskTrend = useQuery(api.riskAnalytics.getRiskTrend, { businessId, days: 90 });
  const predictiveModel = useQuery(api.riskAnalytics.getPredictiveRiskModel, { businessId, forecastDays: 30 });
  const correlations = useQuery(api.riskAnalytics.getRiskCorrelations, { businessId });
  const recommendations = useQuery(api.riskAnalytics.getMitigationRecommendations, { businessId });

  if (!riskMatrix || !riskTrend || !predictiveModel || !correlations || !recommendations) {
    return <div>Loading risk analytics...</div>;
  }

  const getRiskColor = (probability: number, impact: number) => {
    const score = probability * impact;
    if (score >= 16) return "bg-red-600";
    if (score >= 9) return "bg-orange-500";
    if (score >= 4) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Advanced Risk Analytics
          </span>
          <div className="flex gap-2">
            <Badge variant="outline">{riskMatrix.totalRisks} Total Risks</Badge>
            <Badge variant="destructive">{riskMatrix.highRisks} Critical</Badge>
          </div>
        </CardTitle>
        <CardDescription>
          AI-powered risk analysis with predictive modeling and correlation detection
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="matrix">Risk Matrix</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="predictions">AI Predictions</TabsTrigger>
            <TabsTrigger value="correlations">Correlations</TabsTrigger>
          </TabsList>

          <TabsContent value="matrix" className="space-y-4">
            <div className="grid grid-cols-5 gap-2">
              {[5, 4, 3, 2, 1].map((prob) => (
                <div key={prob} className="contents">
                  {[1, 2, 3, 4, 5].map((impact) => {
                    const key = `${prob}_${impact}`;
                    const risks = riskMatrix.matrix[key] || [];
                    return (
                      <div
                        key={key}
                        className={`p-3 rounded-lg ${getRiskColor(prob, impact)} text-white min-h-[80px] flex flex-col justify-between`}
                      >
                        <div className="text-xs opacity-80">P:{prob} I:{impact}</div>
                        <div className="text-2xl font-bold">{risks.length}</div>
                        <div className="text-xs">risks</div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Low Impact →</span>
              <span>← High Impact</span>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">New Risks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{riskTrend.newRisks}</div>
                  <p className="text-xs text-muted-foreground">Last {riskTrend.period}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Mitigated</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{riskTrend.mitigatedRisks}</div>
                  <p className="text-xs text-muted-foreground">Last {riskTrend.period}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Avg Risk Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{riskTrend.avgRiskScore.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">Out of 25</p>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Risk by Category</h4>
              {Object.entries(riskTrend.byCategory).map(([category, score]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{category}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500"
                        style={{ width: `${Math.min(100, (score as number / 25) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{(score as number).toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="predictions" className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Brain className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="font-semibold text-sm text-blue-900">AI Forecast</p>
                <p className="text-xs text-blue-700">
                  Trend: <span className="font-medium capitalize">{predictiveModel.trendDirection}</span> | 
                  Confidence: {predictiveModel.confidence}% | 
                  Est. New Risks: {predictiveModel.estimatedNewRisks}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">30-Day Forecast</h4>
              <div className="grid grid-cols-7 gap-2">
                {predictiveModel.predictions.slice(0, 7).map((pred: any, idx: number) => (
                  <div key={idx} className="p-2 border rounded text-center">
                    <div className="text-xs text-muted-foreground">Day {idx + 1}</div>
                    <div className="text-lg font-bold">{pred.predictedScore.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">{pred.confidence}%</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                AI Recommendations
              </h4>
              {recommendations.priorityActions.map((action: any, idx: number) => (
                <div key={idx} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant={action.priority === "critical" ? "destructive" : "default"}>
                      {action.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {action.affectedRisks} risks affected
                    </span>
                  </div>
                  <p className="text-sm">{action.action}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="correlations" className="space-y-4">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-900">
                <strong>{correlations.strongCorrelations.length}</strong> strong correlations detected
              </p>
            </div>
            <div className="space-y-2">
              {correlations.correlations.slice(0, 10).map((corr: any, idx: number) => (
                <div key={idx} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{corr.category1}</span>
                      <span className="text-xs text-muted-foreground">↔</span>
                      <span className="text-sm font-medium">{corr.category2}</span>
                    </div>
                    <Badge variant={corr.strength === "strong" ? "destructive" : "secondary"}>
                      {corr.strength}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500"
                        style={{ width: `${corr.correlation * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">{(corr.correlation * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}