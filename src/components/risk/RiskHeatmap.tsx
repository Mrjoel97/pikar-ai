import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Target } from "lucide-react";

interface RiskHeatmapProps {
  matrix: Record<string, Array<any>>;
  totalRisks: number;
  highRisks: number;
  businessId?: Id<"businesses">;
}

export function RiskHeatmap({ matrix, totalRisks, highRisks, businessId }: RiskHeatmapProps) {
  const [selectedCell, setSelectedCell] = React.useState<{ prob: number; impact: number } | null>(null);
  const [activeTab, setActiveTab] = React.useState("heatmap");

  // Fetch predictive and correlation data
  const predictiveModel = useQuery(api.riskAnalytics.getPredictiveRiskModel, 
    businessId ? { businessId, forecastDays: 30 } : "skip"
  );
  const correlations = useQuery(api.riskAnalytics.getRiskCorrelations,
    businessId ? { businessId } : "skip"
  );
  const mitigations = useQuery(api.riskAnalytics.getMitigationRecommendations,
    businessId ? { businessId } : "skip"
  );

  const getRiskLevel = (prob: number, impact: number): string => {
    const score = prob * impact;
    if (score >= 16) return "critical";
    if (score >= 12) return "high";
    if (score >= 6) return "medium";
    return "low";
  };

  const getCellColor = (prob: number, impact: number): string => {
    const level = getRiskLevel(prob, impact);
    switch (level) {
      case "critical": return "bg-red-600 hover:bg-red-700";
      case "high": return "bg-orange-500 hover:bg-orange-600";
      case "medium": return "bg-yellow-400 hover:bg-yellow-500";
      default: return "bg-green-400 hover:bg-green-500";
    }
  };

  const getCellRisks = (prob: number, impact: number) => {
    return matrix[`${prob}_${impact}`] || [];
  };

  const selectedRisks = selectedCell 
    ? getCellRisks(selectedCell.prob, selectedCell.impact)
    : [];

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case "increasing": return <TrendingUp className="h-4 w-4 text-red-500" />;
      case "decreasing": return <TrendingDown className="h-4 w-4 text-green-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Risk Analytics Dashboard</CardTitle>
          <CardDescription>
            {totalRisks} total risks • {highRisks} high-risk items
            {predictiveModel && (
              <span className="ml-2 inline-flex items-center gap-1">
                {getTrendIcon(predictiveModel.trendDirection)}
                <span className="text-xs">
                  {predictiveModel.trendDirection} trend
                </span>
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
              <TabsTrigger value="predictive">Predictive</TabsTrigger>
              <TabsTrigger value="correlations">Correlations</TabsTrigger>
              <TabsTrigger value="mitigations">Mitigations</TabsTrigger>
            </TabsList>

            {/* Heatmap Tab */}
            <TabsContent value="heatmap" className="space-y-4">
              <div className="space-y-2">
                {/* Y-axis label */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-xs font-medium text-muted-foreground w-16 text-right">Impact →</div>
                </div>
                
                {/* Grid (5x5) - reversed to show high impact at top */}
                {[5, 4, 3, 2, 1].map((impact) => (
                  <div key={impact} className="flex items-center gap-2">
                    <div className="text-xs font-medium text-muted-foreground w-16 text-right">
                      {impact === 5 ? "Very High" : impact === 4 ? "High" : impact === 3 ? "Medium" : impact === 2 ? "Low" : "Very Low"}
                    </div>
                    <div className="flex gap-2 flex-1">
                      {[1, 2, 3, 4, 5].map((prob) => {
                        const risks = getCellRisks(prob, impact);
                        const count = risks.length;
                        return (
                          <button
                            key={`${prob}_${impact}`}
                            onClick={() => setSelectedCell({ prob, impact })}
                            className={`flex-1 aspect-square rounded-md ${getCellColor(prob, impact)} text-white font-semibold text-sm flex items-center justify-center transition-colors cursor-pointer`}
                            title={`Probability: ${prob}, Impact: ${impact} - ${count} risk(s)`}
                          >
                            {count > 0 ? count : ""}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                {/* X-axis label */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-16" />
                  <div className="flex gap-2 flex-1 text-xs text-muted-foreground">
                    <div className="flex-1 text-center">Very Low</div>
                    <div className="flex-1 text-center">Low</div>
                    <div className="flex-1 text-center">Medium</div>
                    <div className="flex-1 text-center">High</div>
                    <div className="flex-1 text-center">Very High</div>
                  </div>
                </div>
                <div className="text-center text-xs font-medium text-muted-foreground mt-1">
                  ← Probability
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 justify-center flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-400" />
                  <span className="text-xs">Low</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-400" />
                  <span className="text-xs">Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-orange-500" />
                  <span className="text-xs">High</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-600" />
                  <span className="text-xs">Critical</span>
                </div>
              </div>
            </TabsContent>

            {/* Predictive Tab */}
            <TabsContent value="predictive" className="space-y-4">
              {predictiveModel ? (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold flex items-center justify-center gap-2">
                            {getTrendIcon(predictiveModel.trendDirection)}
                            {predictiveModel.trendDirection}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">Trend Direction</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{predictiveModel.confidence}%</div>
                          <div className="text-xs text-muted-foreground mt-1">Confidence Level</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{predictiveModel.estimatedNewRisks}</div>
                          <div className="text-xs text-muted-foreground mt-1">Est. New Risks (30d)</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-3">30-Day Forecast</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {predictiveModel.predictions.slice(0, 10).map((pred: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{new Date(pred.date).toLocaleDateString()}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">Score: {pred.predictedScore}</span>
                            <Badge variant={pred.confidence > 70 ? "default" : "secondary"}>
                              {pred.confidence}% confidence
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No predictive data available
                </div>
              )}
            </TabsContent>

            {/* Correlations Tab */}
            <TabsContent value="correlations" className="space-y-4">
              {correlations && correlations.correlations.length > 0 ? (
                <>
                  {correlations.strongCorrelations.length > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-900">
                          {correlations.strongCorrelations.length} Strong Correlation(s) Detected
                        </span>
                      </div>
                      <p className="text-xs text-amber-700">
                        These risk categories frequently occur together and may share root causes.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Risk Category Correlations</h4>
                    {correlations.correlations.map((corr: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {corr.category1} ↔ {corr.category2}
                          </div>
                          <Badge variant={
                            corr.strength === "strong" ? "destructive" :
                            corr.strength === "moderate" ? "default" : "secondary"
                          } className="mt-1">
                            {corr.strength}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{(corr.correlation * 100).toFixed(0)}%</div>
                          <div className="text-xs text-muted-foreground">correlation</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Insufficient data for correlation analysis
                </div>
              )}
            </TabsContent>

            {/* Mitigations Tab */}
            <TabsContent value="mitigations" className="space-y-4">
              {mitigations ? (
                <>
                  {mitigations.priorityActions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Priority Actions
                      </h4>
                      <div className="space-y-2">
                        {mitigations.priorityActions.map((action: any, idx: number) => (
                          <Card key={idx} className={
                            action.priority === "critical" ? "border-red-500" : "border-orange-500"
                          }>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <Badge variant={action.priority === "critical" ? "destructive" : "default"}>
                                    {action.priority}
                                  </Badge>
                                  <p className="text-sm mt-2">{action.action}</p>
                                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                    <span>{action.affectedRisks} risks affected</span>
                                    <span>Impact: {action.estimatedImpact}</span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {mitigations.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-3">Category Recommendations</h4>
                      <div className="space-y-2">
                        {mitigations.recommendations.map((rec: any, idx: number) => (
                          <div key={idx} className="p-3 border rounded">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="text-sm font-medium capitalize">{rec.category}</div>
                                <p className="text-sm text-muted-foreground mt-1">{rec.recommendation}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <span>{rec.riskCount} risks</span>
                                  <span>Avg score: {rec.avgRiskScore}</span>
                                  <span className="text-green-600">Est. reduction: -{rec.estimatedReduction}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground text-center pt-2">
                    Analyzed {mitigations.totalRisksAnalyzed} active risks
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No mitigation recommendations available
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Risk Details Dialog */}
      <Dialog open={!!selectedCell} onOpenChange={() => setSelectedCell(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              Risks: Probability {selectedCell?.prob} × Impact {selectedCell?.impact}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {selectedRisks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No risks in this cell.</p>
            ) : (
              selectedRisks.map((risk: any) => (
                <Card key={risk._id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-medium">{risk.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{risk.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={risk.status === "open" ? "destructive" : "secondary"}>
                            {risk.status}
                          </Badge>
                          {risk.category && (
                            <Badge variant="outline">{risk.category}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Risk Score</div>
                        <div className="text-2xl font-bold">{risk.probability * risk.impact}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}