import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, Lightbulb, TrendingUp, AlertTriangle } from "lucide-react";

interface PredictiveInsightsTabProps {
  predictiveInsights: any;
  predictiveAnalytics?: any;
  riskPredictions?: any;
}

export default function PredictiveInsightsTab({ 
  predictiveInsights, 
  predictiveAnalytics,
  riskPredictions 
}: PredictiveInsightsTabProps) {
  return (
    <div className="space-y-4">
      {predictiveAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              ML-Based Predictive Analytics
            </CardTitle>
            <CardDescription>Machine learning powered performance predictions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Completion Rate</div>
                <div className="text-2xl font-bold">{predictiveAnalytics.predictions.completionRate}%</div>
                <Progress value={predictiveAnalytics.predictions.completionRate} className="mt-2" />
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Predicted Growth</div>
                <div className="text-2xl font-bold text-green-600">+{predictiveAnalytics.predictions.predictedGrowth}%</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Confidence: {predictiveAnalytics.predictions.confidenceScore}%
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Time to Completion</div>
                <div className="text-2xl font-bold">{predictiveAnalytics.predictions.timeToCompletion} days</div>
                <Badge variant="outline" className="mt-2">
                  {predictiveAnalytics.trends.momentum}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Initiative Completion Forecasts
          </CardTitle>
          <CardDescription>Predicted completion dates with confidence intervals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {predictiveInsights?.predictions.map((pred: any) => (
              <div key={pred.initiativeId} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{pred.initiativeName}</span>
                  <Badge variant="outline" className={
                    pred.status === "at_risk" ? "bg-red-100 text-red-700" :
                    pred.status === "on_track" ? "bg-green-100 text-green-700" :
                    "bg-blue-100 text-blue-700"
                  }>
                    {pred.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Est. Completion: {new Date(pred.estimatedCompletionDate).toLocaleDateString()} • 
                  Confidence: {Math.round(pred.confidence)}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {riskPredictions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Risk Predictions
            </CardTitle>
            <CardDescription>Forecasted risk trends and mitigation strategies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {riskPredictions.predictions.slice(0, 5).map((risk: any) => (
                <div key={risk.riskId} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{risk.riskType}</span>
                    <Badge variant={risk.trend === "increasing" ? "destructive" : "secondary"}>
                      {risk.trend}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Current: {risk.currentScore} → Predicted: {risk.predictedScore} ({risk.timeframe})
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Probability: {Math.round(risk.probability)}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI Optimization Recommendations
          </CardTitle>
          <CardDescription>Actionable insights to improve portfolio performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {predictiveInsights?.recommendations.map((rec: any, idx: number) => (
              <div key={idx} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{rec.type.replace(/_/g, " ")}</span>
                  <Badge variant="outline" className={
                    rec.priority === "high" ? "bg-red-100 text-red-700" :
                    rec.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                    "bg-blue-100 text-blue-700"
                  }>
                    {rec.priority}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mb-1">{rec.description}</div>
                <div className="text-xs font-medium text-green-600">Impact: {rec.impact}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
