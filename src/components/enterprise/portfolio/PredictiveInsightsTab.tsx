import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Lightbulb } from "lucide-react";

interface PredictiveInsightsTabProps {
  predictiveInsights: any;
}

export default function PredictiveInsightsTab({ predictiveInsights }: PredictiveInsightsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Predictive Insights & Recommendations</CardTitle>
        <CardDescription>AI-powered forecasts and optimization suggestions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Initiative Completion Forecasts
            </h4>
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
          </div>

          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Optimization Recommendations
            </h4>
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
